import { hashSeed, makeRng } from './random'
import { clamp } from './money'
import { unitEconomics } from './detect'
import { DAY_MS } from './generate'
import type { Kpis, Leak, Sku, Store, WaterfallBar } from './types'

export { DAY_MS }

export const activeLeaks = (store: Store): Leak[] =>
  store.leaks.filter((l) => l.status === 'active')

export const findSku = (store: Store, skuId: string): Sku | undefined =>
  store.skus.find((k) => k.id === skuId)

/** Imported RL-* leaks are opportunities already present in the SKU economics. */
const isAdditionalModelledLeak = (leak: Leak): boolean => !leak.id.startsWith('RL-')

export const dayFraction = (store: Store, atMs = store.clockMs): number =>
  clamp((atMs - store.dayStartMs) / DAY_MS, 0, 1)

/** Per-SKU healthy daily economics, in integer cents. */
function skuDaily(sku: Sku) {
  const economics = unitEconomics(sku)
  const gross = sku.priceCents * sku.unitsPerDay
  const cogs = sku.costCents * sku.unitsPerDay
  const referral = economics.referral * sku.unitsPerDay
  const marketplace = economics.marketplaceFee * sku.unitsPerDay
  const fba = economics.fba * sku.unitsPerDay
  const shipping = economics.shipping * sku.unitsPerDay
  const discounts = economics.discount * sku.unitsPerDay
  const returns = economics.returnCost * sku.unitsPerDay
  const ppc = economics.ppc * sku.unitsPerDay
  const payment = economics.paymentFee * sku.unitsPerDay
  const vat = economics.vat * sku.unitsPerDay
  const other = economics.otherCost * sku.unitsPerDay
  const profit = economics.contribution * sku.unitsPerDay
  return { gross, cogs, referral, marketplace, fba, shipping, discounts, returns, ppc, payment, vat, other, profit }
}

export interface Derived {
  kpis: Kpis
  activeLeaks: Leak[]
}

export function recompute(store: Store): Derived {
  const active = store.leaks.filter((l) => l.status === 'active')
  const totalLeakRatePerDayCents = active.reduce((a, l) => a + l.ratePerDayCents, 0)

  const frac = dayFraction(store)
  let grossPerDay = 0
  let currentProfitPerDay = 0
  for (const sku of store.skus) {
    const d = skuDaily(sku)
    grossPerDay += d.gross
    currentProfitPerDay += d.profit
  }

  const revenueTodayCents = Math.round(grossPerDay * frac)
  const additionalModelledLeakRate = active
    .filter(isAdditionalModelledLeak)
    .reduce((sum, leak) => sum + leak.ratePerDayCents, 0)
  const actualProfitPerDay = currentProfitPerDay - additionalModelledLeakRate
  const netProfitTodayCents = Math.round(actualProfitPerDay * frac)
  const marginPct =
    revenueTodayCents > 0 ? (netProfitTodayCents / revenueTodayCents) * 100 : 0

  const kpis: Kpis = {
    revenueTodayCents,
    netProfitTodayCents,
    marginPct: Math.round(marginPct * 10) / 10,
    activeThreatCount: active.length,
    totalLeakRatePerDayCents,
    monthlyLeakProjectionCents: totalLeakRatePerDayCents * 30,
    savedThisWeekCents: store.savedThisWeekCents,
    reimbursementsPendingCents: store.reimbursementsPendingCents,
    skuCount: store.skuCount,
  }

  return { kpis, activeLeaks: active }
}

/** Money bled today so far — monotonic; a fix only stops further bleed. */
export const leakedSoFarTodayCents = (store: Store): number => store.accruedLeakTodayCents

/** Monthly P&L bridge for a SKU. start + Σ deltas === end (net profit). */
export function waterfallFor(store: Store, skuId: string): WaterfallBar[] {
  const sku = findSku(store, skuId)
  if (!sku) return []
  const d = skuDaily(sku)
  const m = (n: number) => n * 30 // monthly

  const bars: WaterfallBar[] = []
  let running = 0
  const push = (label: string, delta: number, kind: WaterfallBar['kind'], isLeak = false) => {
    running += delta
    bars.push({ label, deltaCents: kind === 'end' ? running : delta, cumulativeCents: running, kind, isLeak })
  }

  push('Revenue', m(d.gross), 'start')
  push('COGS', -m(d.cogs), 'decrease')
  if (d.referral) push('Referral fee', -m(d.referral), 'decrease')
  if (d.marketplace) push('Marketplace fees', -m(d.marketplace), 'decrease')
  if (d.fba) push('FBA fee', -m(d.fba), 'decrease')
  if (d.shipping) push('Shipping', -m(d.shipping), 'decrease')
  if (d.discounts) push('Discounts', -m(d.discounts), 'decrease')
  if (d.returns) push('Refunds', -m(d.returns), 'decrease')
  if (d.ppc) push('Advertising', -m(d.ppc), 'decrease')
  if (d.payment) push('Payment fees', -m(d.payment), 'decrease')
  if (d.vat) push('VAT', -m(d.vat), 'decrease')
  if (d.other) push('Other costs', -m(d.other), 'decrease')

  push('Net profit', 0, 'end')
  return bars
}

/**
 * Store-wide monthly margin-erosion bridge (the hero waterfall): revenue steps
 * DOWN through each cost group to net profit. Pure aggregation over every SKU's
 * supplied economics. Findings are not appended as another cost because their
 * underlying euros are already represented in the cost groups above.
 * start total + Σ deltas === end total === net profit.
 */
export function storeWaterfall(store: Store): WaterfallBar[] {
  const m = (n: number) => n * 30 // monthly
  let agg = {
    gross: 0, cogs: 0, referral: 0, marketplace: 0, fba: 0, shipping: 0,
    discounts: 0, returns: 0, ppc: 0, payment: 0, vat: 0, other: 0,
  }
  for (const sku of store.skus) {
    const d = skuDaily(sku)
    agg.gross += d.gross
    agg.cogs += d.cogs
    agg.referral += d.referral
    agg.marketplace += d.marketplace
    agg.fba += d.fba
    agg.shipping += d.shipping
    agg.discounts += d.discounts
    agg.returns += d.returns
    agg.ppc += d.ppc
    agg.payment += d.payment
    agg.vat += d.vat
    agg.other += d.other
  }
  const bars: WaterfallBar[] = []
  let running = 0
  const push = (label: string, delta: number, kind: WaterfallBar['kind'], isLeak = false) => {
    running += delta
    bars.push({ label, deltaCents: kind === 'end' ? running : delta, cumulativeCents: running, kind, isLeak })
  }
  push('Revenue', m(agg.gross), 'start')
  push('COGS', -m(agg.cogs), 'decrease')
  if (agg.referral) push('Referral fee', -m(agg.referral), 'decrease')
  if (agg.marketplace) push('Marketplace fees', -m(agg.marketplace), 'decrease')
  if (agg.fba) push('FBA fee', -m(agg.fba), 'decrease')
  if (agg.shipping) push('Shipping', -m(agg.shipping), 'decrease')
  if (agg.discounts) push('Discounts', -m(agg.discounts), 'decrease')
  if (agg.returns) push('Refunds', -m(agg.returns), 'decrease')
  if (agg.ppc) push('Advertising', -m(agg.ppc), 'decrease')
  if (agg.payment) push('Payment fees', -m(agg.payment), 'decrease')
  if (agg.vat) push('VAT', -m(agg.vat), 'decrease')
  if (agg.other) push('Other costs', -m(agg.other), 'decrease')
  push('Net profit', 0, 'end')
  return bars
}

/** Deterministic sparkline series in [0,1], keyed by string. */
export function sparkline(seed: number, key: string, points = 24): number[] {
  const rng = makeRng(hashSeed(key, seed))
  let v = rng.float(0.3, 0.7, 4)
  const out: number[] = []
  for (let i = 0; i < points; i++) {
    v = clamp(v + rng.float(-0.12, 0.12, 4), 0.05, 0.95)
    out.push(Math.round(v * 1000) / 1000)
  }
  return out
}

/** Project banked savings forward (ROI fast-forward). */
export const projectSavingsCents = (store: Store, days: number): number =>
  Math.round((store.savedThisWeekCents / 7) * days)
