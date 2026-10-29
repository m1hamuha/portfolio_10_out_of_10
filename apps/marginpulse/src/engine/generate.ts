import { makeRng, hashSeed } from './random'
import { detectLeaks } from './detect'
import type { ActionType, Leak, LeakType, Marketplace, Severity, Sku, Store } from './types'

export const DAY_MS = 86_400_000

const SKU_COUNT = 52

const MARKETPLACES: Marketplace[] = ['DE', 'FR', 'IT']

const CATEGORIES = [
  'Bed Linen',
  'Bath Towels',
  'Kitchen Textiles',
  'Cushions',
  'Throws & Blankets',
  'Curtains',
  'Rugs',
  'Table Linen',
]

const MATERIALS = ['Organic Cotton', 'Linen', 'Bamboo', 'Merino Wool', 'Waffle', 'Percale', 'Sateen']
const ITEMS = ['Duvet Cover', 'Towel Set', 'Cushion Cover', 'Fitted Sheet', 'Throw', 'Tea Towel Set', 'Bath Mat', 'Table Runner']
const SIZES = ['Single', 'Double', 'King', '50×70', '40×60', 'Set of 4', '140×200']

function asin(rng: ReturnType<typeof makeRng>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  let s = 'B0'
  for (let i = 0; i < 8; i++) s += rng.pick(chars.split(''))
  return s
}

function makeSku(rng: ReturnType<typeof makeRng>, i: number): Sku {
  const costCents = rng.int(300, 3500)
  const markup = rng.float(1.5, 2.8)
  const priceCents = Math.round(costCents * markup)
  return {
    id: `SKU-${String(i + 1).padStart(3, '0')}`,
    asin: asin(rng),
    title: `${rng.pick(MATERIALS)} ${rng.pick(ITEMS)} · ${rng.pick(SIZES)}`,
    marketplace: rng.pick(MARKETPLACES),
    category: rng.pick(CATEGORIES),
    costCents,
    priceCents,
    priceFloorCents: null,
    referralFeePct: 15,
    fbaFeeCents: rng.int(250, 550),
    unitsPerDay: rng.int(0, 4),
    returnRatePct: rng.float(1, 7),
    inventoryUnits: rng.int(0, 480),
    buyBoxWon: rng.bool(0.85),
    repricerActive: rng.bool(0.5),
  }
}

interface LeakTemplate {
  type: LeakType
  severity: Severity
  title: string
  rootCause: string
  detail: string
  actions: ActionType[]
  rate: [number, number] // €/day range
  claim?: [number, number] // € reimbursement range (FEE/STORAGE)
}

// Fixed, ordered templates → deterministic set of leaks attached to the first SKUs.
const LEAK_TEMPLATES: LeakTemplate[] = [
  {
    type: 'BELOW_FLOOR',
    severity: 'high',
    title: 'Selling below margin floor',
    rootCause: 'Your repricer matched a competitor and dropped the price under landed cost + fees.',
    detail: 'The automated repricer is winning the Buy Box at a price that loses money on every unit sold.',
    actions: ['SET_PRICE_FLOOR', 'PAUSE_REPRICER'],
    rate: [50, 85],
  },
  {
    type: 'FEE_HIKE',
    severity: 'high',
    title: 'FBA fulfilment fee increased',
    rootCause: 'Amazon re-measured the package and moved this ASIN into a higher size tier.',
    detail: 'The fee jumped after a re-measurement. Re-measurement disputes are reimbursable when the dimensions are wrong.',
    actions: ['DISPUTE_FEE'],
    rate: [34, 60],
    claim: [180, 640],
  },
  {
    type: 'RETURN_SPIKE',
    severity: 'med',
    title: 'Return rate spike',
    rootCause: '"Item not as described" returns tripled after a listing image change.',
    detail: 'Returns are running 3× normal on this ASIN. Tightening the listing + faster replies cuts the bleed.',
    actions: ['RESOLVE_RETURNS'],
    rate: [22, 44],
  },
  {
    type: 'BUYBOX_LOST',
    severity: 'high',
    title: 'Buy Box lost',
    rootCause: 'A competitor undercut by €0.30 and took the Buy Box — your sessions still cost you in ads.',
    detail: 'You are paying for traffic that converts to a competitor. Regain the Buy Box within your floor.',
    actions: ['WIN_BUYBOX', 'PAUSE_REPRICER'],
    rate: [42, 72],
  },
  {
    type: 'STORAGE_FEE',
    severity: 'med',
    title: 'Long-term storage fee imminent',
    rootCause: 'Aged stock crosses the 365-day threshold in 6 days — long-term storage fees apply.',
    detail: 'Slow-moving inventory is about to incur long-term storage fees. Remove, liquidate or create a removal order.',
    actions: ['DISPUTE_STORAGE', 'CREATE_RESTOCK_ALERT'],
    rate: [16, 34],
    claim: [90, 260],
  },
  {
    type: 'PPC_BLEED',
    severity: 'med',
    title: 'Ad spend exceeds margin (ACoS)',
    rootCause: 'A broad-match campaign is spending more per order than the unit margin.',
    detail: 'ACoS on this campaign is above break-even. Cap the bid / pause the losing keywords.',
    actions: ['CAP_AD_SPEND'],
    rate: [24, 48],
  },
  {
    type: 'VAT_MISMATCH',
    severity: 'low',
    title: 'Wrong VAT rate on Amazon.it',
    rootCause: 'Standard 22% applied where a 10% reduced rate is allowed for this category.',
    detail: 'A VAT mismatch is over-collecting and risking an OSS correction. Fix the rate mapping.',
    actions: ['FIX_VAT'],
    rate: [9, 19],
  },
  {
    type: 'BELOW_FLOOR',
    severity: 'med',
    title: 'Thin margin after fee changes',
    rootCause: 'Combined referral + FBA now eats 41% — this SKU is barely above water.',
    detail: 'After the latest fee schedule this ASIN sits below your target margin floor.',
    actions: ['SET_PRICE_FLOOR', 'PAUSE_REPRICER'],
    rate: [18, 34],
  },
]

export function generateStore(seed: number, clockMs: number): Store {
  const rng = makeRng(seed)
  const skus: Sku[] = []
  for (let i = 0; i < SKU_COUNT; i++) skus.push(makeSku(rng, i))

  const leaks: Leak[] = LEAK_TEMPLATES.map((t, i) => {
    const sku = skus[i] // attach each template to a distinct SKU
    // Leak SKUs are the high-volume hero products (where leaks hurt most) so the
    // per-SKU P&L bridge has revenue well above the leak — a believable slice.
    sku.unitsPerDay = rng.int(12, 26)
    // Make BELOW_FLOOR SKUs genuinely under water + repricer-driven.
    if (t.type === 'BELOW_FLOOR') {
      // near break-even: covers cost + FBA but the 15% referral isn't fully earned → mild loss
      sku.priceCents = Math.round(((sku.costCents + sku.fbaFeeCents) / 0.85) * rng.float(0.97, 1.03))
      sku.repricerActive = true
    }
    if (t.type === 'BUYBOX_LOST') sku.buyBoxWon = false
    const ratePerDayCents = rng.int(t.rate[0], t.rate[1]) * 100
    const detectedAtMs = clockMs - rng.int(20, 300) * 60_000
    const claimCents = t.claim ? rng.int(t.claim[0], t.claim[1]) * 100 : undefined
    return {
      id: `LK-${String(i + 1).padStart(2, '0')}`,
      type: t.type,
      skuId: sku.id,
      severity: t.severity,
      ratePerDayCents,
      status: 'active',
      detectedAtMs,
      title: t.title,
      rootCause: t.rootCause,
      detail: t.detail,
      actions: t.actions,
      claimCents,
    }
  })

  const dayStartMs = 0
  const totalLeakRate = leaks.reduce((a, l) => a + l.ratePerDayCents, 0)
  const dayFraction = Math.max(0, Math.min(1, (clockMs - dayStartMs) / DAY_MS))
  const accruedLeakTodayCents = Math.round(totalLeakRate * dayFraction)

  return {
    seed,
    clockMs,
    dayStartMs,
    storeName: 'Nordic Home',
    skuCount: SKU_COUNT,
    skus,
    leaks,
    accruedLeakTodayCents,
    savedThisWeekCents: 0,
    reimbursementsPendingCents: 0,
    resolvedCount: 0,
  }
}

/**
 * Build a Store from a real, imported SKU catalogue. Leaks are DERIVED from the
 * SKUs' actual economics (detectLeaks), not seeded templates — so the whole
 * dashboard runs on the user's real numbers. Monitoring starts "now": nothing is
 * accrued yet, the counter ticks forward from import.
 */
export function buildStoreFromSkus(skus: Sku[], clockMs: number, storeName: string): Store {
  const leaks = detectLeaks(skus, clockMs)
  return {
    seed: hashSeed(storeName || 'imported'),
    clockMs,
    // Imported KPIs represent one full average day from the supplied period.
    dayStartMs: clockMs - DAY_MS,
    storeName: storeName || 'Your store',
    skuCount: skus.length,
    skus,
    leaks,
    accruedLeakTodayCents: 0,
    savedThisWeekCents: 0,
    reimbursementsPendingCents: 0,
    resolvedCount: 0,
  }
}
