// Real leak detection — pure, framework-free.
//
// Unlike generate.ts (which attaches fixed demo templates to seeded SKUs), this
// derives leaks from a SKU's ACTUAL economics. Feed it a real seller's catalogue
// (via the CSV importer) and it surfaces *their* profit leaks, with each bleed
// rate computed from real cost / price / fee / return / inventory numbers.
//
// Thresholds are heuristics (documented below) — the maths is real, the cut-offs
// are sensible defaults. Every emitted leak is resolvable by the existing reducers.

import { hashSeed } from './random'
import type { ActionType, Leak, LeakType, Severity, Sku } from './types'

// ── Tunable heuristics (named so the assumptions are explicit & auditable) ──────
/** Net margin below this % of price counts as a below-floor / thin-margin leak. */
export const FLOOR_MARGIN_PCT = 8
/** A "normal" baseline return rate; anything above HIGH_RETURN_PCT is a spike. */
export const NORMAL_RETURN_PCT = 5
export const HIGH_RETURN_PCT = 8
/** Combined referral+FBA above this fraction of price flags a fee-hike leak. */
export const FEE_RATIO_THRESHOLD = 0.42
export const FEE_RATIO_BASELINE = 0.4
/** Days of cover above which stock is "aged" and at risk of long-term storage fees. */
export const OVERSTOCK_DAYS = 180
/** Aged units (when nothing sells) above which storage risk is flagged. */
export const DEAD_STOCK_UNITS = 60
/** Estimated long-term storage cost per aged unit per month (cents). */
export const STORAGE_CENTS_PER_UNIT_MONTH = 50
/** Ignore sub-€1/day bleeds — immaterial noise that would clutter the feed (and show as "€0"). */
export const MIN_LEAK_CENTS_PER_DAY = 100

/** Per-unit economics in integer cents — consistent with recompute.skuDaily. */
export interface UnitEconomics {
  referral: number
  fba: number
  marketplaceFee: number
  shipping: number
  discount: number
  returnCost: number
  ppc: number
  paymentFee: number
  vat: number
  otherCost: number
  /** Contribution before advertising, used to calculate break-even ad spend. */
  preAdContribution: number
  /** Net per-unit profit after all of the above. */
  contribution: number
  /** Net margin as a % of price. */
  marginPct: number
  /** Combined referral+FBA as a fraction of price. */
  feeRatio: number
}

export function unitEconomics(sku: Sku): UnitEconomics {
  const referral = Math.round((sku.priceCents * sku.referralFeePct) / 100)
  const fba = sku.fbaFeeCents
  const marketplaceFee = sku.marketplaceFeeCents ?? 0
  const shipping = sku.shippingCents ?? 0
  const discount = sku.discountCents ?? 0
  const returnCost = sku.returnCostCents ?? 0
  const ppc = sku.adSpendCents ?? 0
  const paymentFee = sku.paymentFeeCents ?? 0
  const vat = sku.vatCents ?? 0
  const otherCost = sku.otherCostCents ?? 0
  const preAdContribution = sku.priceCents - sku.costCents - referral - fba - marketplaceFee
    - shipping - discount - returnCost - paymentFee - vat - otherCost
  const contribution = preAdContribution - ppc
  const marginPct = sku.priceCents > 0 ? (contribution / sku.priceCents) * 100 : 0
  const feeRatio = sku.priceCents > 0 ? (referral + marketplaceFee + fba) / sku.priceCents : 0
  return {
    referral, fba, marketplaceFee, shipping, discount, returnCost, ppc, paymentFee, vat,
    otherCost, preAdContribution, contribution, marginPct, feeRatio,
  }
}

interface Draft {
  type: LeakType
  severity: Severity
  ratePerDayCents: number
  title: string
  rootCause: string
  detail: string
  actions: ActionType[]
  claimCents?: number
}

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`

/** Deterministic "detected N minutes ago" offset from the SKU+type (no Date.now). */
function detectedOffsetMs(skuId: string, type: LeakType): number {
  const mins = 20 + (hashSeed(`${skuId}:${type}`) % 280)
  return mins * 60_000
}

/** Examine one SKU and emit zero or more leaks derived from its real numbers. */
function leaksForSku(sku: Sku): Draft[] {
  const e = unitEconomics(sku)
  const units = sku.unitsPerDay
  const out: Draft[] = []

  // Explicit ad cost above the contribution available before advertising.
  const adExcessPerUnit = sku.providedFields?.includes('advertising')
    ? Math.max(0, e.ppc - Math.max(0, e.preAdContribution))
    : 0
  if (units > 0 && adExcessPerUnit > 0) {
    out.push({
      type: 'PPC_BLEED',
      severity: adExcessPerUnit >= sku.priceCents * 0.2 ? 'high' : 'med',
      ratePerDayCents: Math.round(adExcessPerUnit * units),
      title: 'Ad spend above break-even',
      rootCause: `The actual ad cost is ${eur(e.ppc)} per unit, but only ${eur(Math.max(0, e.preAdContribution))} is available before the sale loses money.`,
      detail: 'Reduce or pause the losing campaign, then re-check profit using the next ad export.',
      actions: ['CAP_AD_SPEND'],
    })
  }

  let vatMismatchPerUnit = 0
  if (
    units > 0
    && sku.providedFields?.includes('vat')
    && sku.vatRatePct !== undefined
    && sku.expectedVatRatePct !== undefined
    && Math.abs(sku.vatRatePct - sku.expectedVatRatePct) >= 0.1
  ) {
    const expectedVat = Math.round(sku.priceCents * sku.expectedVatRatePct / (100 + sku.expectedVatRatePct))
    vatMismatchPerUnit = Math.abs(e.vat - expectedVat)
    if (vatMismatchPerUnit > 0) {
      out.push({
        type: 'VAT_MISMATCH',
        severity: Math.abs(sku.vatRatePct - sku.expectedVatRatePct) >= 10 ? 'high' : 'med',
        ratePerDayCents: Math.round(vatMismatchPerUnit * units),
        title: 'VAT rate mismatch',
        rootCause: `The supplied VAT rate is ${sku.vatRatePct.toFixed(1)}%, while the expected rate is ${sku.expectedVatRatePct.toFixed(1)}%.`,
        detail: 'Confirm the product tax category and country treatment with your accountant before changing the rate.',
        actions: ['FIX_VAT'],
      })
    }
  }

  // 1 ─ Below margin floor / thin margin (only if it actually moves units).
  if (units > 0 && e.marginPct < FLOOR_MARGIN_PCT) {
    const target = Math.round((sku.priceCents * FLOOR_MARGIN_PCT) / 100)
    // Ad/VAT findings are shown separately, so do not count the same euros twice.
    const upliftPerUnit = Math.max(0, target - e.contribution - adExcessPerUnit - vatMismatchPerUnit)
    const rate = Math.round(upliftPerUnit * units)
    if (rate > 0) {
      const underwater = e.contribution < 0
      out.push({
        type: 'BELOW_FLOOR',
        severity: underwater ? 'high' : 'med',
        ratePerDayCents: rate,
        title: underwater ? 'Selling below margin floor' : 'Thin margin after fees',
        rootCause: underwater
          ? `Net margin is ${e.marginPct.toFixed(1)}% — every unit loses ${eur(-e.contribution)} after the supplied costs.`
          : `Net margin is only ${e.marginPct.toFixed(1)}% — below an ${FLOOR_MARGIN_PCT}% floor after the supplied costs.`,
        detail: sku.repricerActive
          ? 'The repricer is active and can chase competitors under your true landed cost. Set a floor or pause it.'
          : 'Model a price or cost change, then verify the likely sales impact before applying it.',
        actions: sku.repricerActive ? ['SET_PRICE_FLOOR', 'PAUSE_REPRICER'] : ['SET_PRICE_FLOOR'],
      })
    }
  }

  // 2 ─ Return-rate spike above normal.
  if (units > 0 && sku.returnRatePct > HIGH_RETURN_PCT) {
    const excessShare = (sku.returnRatePct - NORMAL_RETURN_PCT) / sku.returnRatePct
    const rate = sku.providedFields?.includes('refunds')
      ? Math.round(excessShare * units * e.returnCost)
      : Math.round(((sku.returnRatePct - NORMAL_RETURN_PCT) / 100) * units * sku.priceCents * 0.35)
    if (rate > 0) {
      out.push({
        type: 'RETURN_SPIKE',
        severity: sku.returnRatePct > 12 ? 'high' : 'med',
        ratePerDayCents: rate,
        title: 'Return rate spike',
        rootCause: `Returns are running at ${sku.returnRatePct.toFixed(1)}% vs a ~${NORMAL_RETURN_PCT}% norm; the supplied refund cost shows the excess impact.`,
        detail: 'Tightening the listing (sizing, images, description) and faster reply templates cut the excess returns.',
        actions: ['RESOLVE_RETURNS'],
      })
    }
  }

  // 3 ─ Buy Box lost on a profitable mover (recoverable sales/margin).
  if (units > 0 && !sku.buyBoxWon && e.contribution > 0) {
    const rate = Math.round(e.contribution * units * 0.4)
    if (rate > 0) {
      out.push({
        type: 'BUYBOX_LOST',
        severity: units >= 8 ? 'high' : 'med',
        ratePerDayCents: rate,
        title: 'Buy Box lost',
        rootCause: 'A competitor holds the Buy Box on a SKU that still earns margin — you are paying for traffic that converts to them.',
        detail: 'Regain the Buy Box within your floor, or pause the repricer race that lost it.',
        actions: ['WIN_BUYBOX', 'PAUSE_REPRICER'],
      })
    }
  }

  // 4 ─ Aged / dead stock at risk of long-term storage fees.
  const daysCover = units > 0 ? sku.inventoryUnits / units : Infinity
  const aged = sku.inventoryUnits > 0 && (units > 0 ? daysCover > OVERSTOCK_DAYS : sku.inventoryUnits >= DEAD_STOCK_UNITS)
  if (aged) {
    const monthlyStorage = sku.inventoryUnits * STORAGE_CENTS_PER_UNIT_MONTH
    const rate = Math.round(monthlyStorage / 30)
    if (rate > 0) {
      out.push({
        type: 'STORAGE_FEE',
        severity: sku.inventoryUnits >= 240 ? 'med' : 'low',
        ratePerDayCents: rate,
        title: 'Long-term storage fee risk',
        rootCause: `${sku.inventoryUnits} units in stock with ${units > 0 ? `${Math.round(daysCover)} days of cover` : 'no recent sales'} — heading for long-term storage fees.`,
        detail: 'Liquidate, bundle or create a removal order before the 365-day threshold; dispute any fee already applied.',
        actions: ['DISPUTE_STORAGE', 'CREATE_RESTOCK_ALERT'],
        claimCents: monthlyStorage,
      })
    }
  }

  // 5 ─ Fees eating an abnormal share of price (FBA re-measurement disputes etc).
  if (units > 0 && e.feeRatio > FEE_RATIO_THRESHOLD) {
    const excessRatio = e.feeRatio - FEE_RATIO_BASELINE
    const rate = Math.round(excessRatio * sku.priceCents * units * 0.5)
    if (rate > 0) {
      out.push({
        type: 'FEE_HIKE',
        severity: e.feeRatio > 0.5 ? 'high' : 'med',
        ratePerDayCents: rate,
        title: 'Fees eating margin',
        rootCause: `Marketplace + fulfilment fees take ${(e.feeRatio * 100).toFixed(0)}% of price — above a healthy ${(FEE_RATIO_BASELINE * 100).toFixed(0)}%.`,
        detail: 'Re-measurement disputes are reimbursable when dimensions are wrong; lightweighting or tier optimisation cuts the rest.',
        actions: ['DISPUTE_FEE'],
        claimCents: Math.round(e.fba * units * 30 * 0.15),
      })
    }
  }

  return out
}

/**
 * Detect every leak across a SKU catalogue, derived from real economics.
 * Returns leaks sorted by bleed rate (worst first) with stable ids.
 */
export function detectLeaks(skus: Sku[], clockMs: number): Leak[] {
  const drafts: { sku: Sku; d: Draft }[] = []
  for (const sku of skus) {
    for (const d of leaksForSku(sku)) {
      if (d.ratePerDayCents >= MIN_LEAK_CENTS_PER_DAY) drafts.push({ sku, d })
    }
  }
  // Worst bleed first — the feed and counter lead with the biggest losses.
  drafts.sort((a, b) => b.d.ratePerDayCents - a.d.ratePerDayCents)

  return drafts.map(({ sku, d }, i) => ({
    id: `RL-${String(i + 1).padStart(3, '0')}`,
    type: d.type,
    skuId: sku.id,
    severity: d.severity,
    ratePerDayCents: d.ratePerDayCents,
    status: 'active' as const,
    detectedAtMs: clockMs - detectedOffsetMs(sku.id, d.type),
    title: d.title,
    rootCause: d.rootCause,
    detail: d.detail,
    actions: d.actions,
    claimCents: d.claimCents,
  }))
}
