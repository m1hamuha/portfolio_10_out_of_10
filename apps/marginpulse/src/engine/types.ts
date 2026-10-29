export type Marketplace = string

export type CostInput =
  | 'advertising'
  | 'shipping'
  | 'discounts'
  | 'refunds'
  | 'paymentFees'
  | 'marketplaceFees'
  | 'fulfilment'
  | 'vat'
  | 'otherCosts'

export type LeakType =
  | 'BELOW_FLOOR' // selling below cost / margin floor (often repricer-driven)
  | 'FEE_HIKE' // Amazon referral/FBA/storage fee increase on an ASIN
  | 'RETURN_SPIKE' // return rate above normal
  | 'BUYBOX_LOST' // lost the Buy Box -> sales drop
  | 'STORAGE_FEE' // long-term storage fee imminent on aged stock
  | 'PPC_BLEED' // ad spend (ACoS) exceeding unit margin
  | 'VAT_MISMATCH' // wrong VAT rate applied on a marketplace

export type Severity = 'low' | 'med' | 'high'

export type ActionType =
  | 'SET_PRICE_FLOOR'
  | 'PAUSE_REPRICER'
  | 'DISPUTE_FEE'
  | 'DISPUTE_STORAGE'
  | 'RESOLVE_RETURNS'
  | 'WIN_BUYBOX'
  | 'FIX_VAT'
  | 'CAP_AD_SPEND'
  | 'CREATE_RESTOCK_ALERT'

export interface Sku {
  id: string
  /** Original merchant SKU before channel namespacing. */
  sourceSku?: string
  variantId?: string
  channel?: string
  sourceFile?: string
  asin: string
  title: string
  marketplace: Marketplace
  category: string
  costCents: number
  priceCents: number
  priceFloorCents: number | null
  referralFeePct: number
  fbaFeeCents: number
  unitsPerDay: number
  unitsSold?: number
  periodDays?: number
  returnRatePct: number
  /** Actual or explicitly calculated per-unit costs. Missing means unknown, not zero. */
  shippingCents?: number
  discountCents?: number
  adSpendCents?: number
  paymentFeeCents?: number
  marketplaceFeeCents?: number
  returnCostCents?: number
  vatCents?: number
  otherCostCents?: number
  vatRatePct?: number
  expectedVatRatePct?: number
  providedFields?: CostInput[]
  inventoryUnits: number
  buyBoxWon: boolean
  repricerActive: boolean
}

export interface Leak {
  id: string
  type: LeakType
  skuId: string
  severity: Severity
  ratePerDayCents: number
  status: 'active' | 'resolved'
  detectedAtMs: number
  title: string
  rootCause: string
  detail: string
  /** Action buttons offered for this leak, in priority order. */
  actions: ActionType[]
  /** For DISPUTE_* actions: claimable amount. */
  claimCents?: number
}

export interface Store {
  seed: number
  /** Injected wall clock (ms). Engine never reads Date.now(). */
  clockMs: number
  /** Start-of-today (ms) for the "leaked so far today" fraction. */
  dayStartMs: number
  storeName: string
  skuCount: number
  skus: Sku[]
  leaks: Leak[]
  /** Money already bled today (monotonic: a fix stops further bleed, never un-loses past loss). */
  accruedLeakTodayCents: number
  savedThisWeekCents: number
  reimbursementsPendingCents: number
  resolvedCount: number
}

export type Action =
  | { type: ActionType; leakId: string }
  | { type: 'TICK'; clockMs: number }

export interface Kpis {
  revenueTodayCents: number
  netProfitTodayCents: number
  marginPct: number
  activeThreatCount: number
  totalLeakRatePerDayCents: number
  monthlyLeakProjectionCents: number
  savedThisWeekCents: number
  reimbursementsPendingCents: number
  skuCount: number
}

export interface WaterfallBar {
  label: string
  kind: 'start' | 'increase' | 'decrease' | 'end'
  /** Signed contribution (negative for costs). For start/end this equals the running total. */
  deltaCents: number
  /** Running cumulative total after this bar. */
  cumulativeCents: number
  /** Marks the bar corresponding to the active leak (highlighted red). */
  isLeak?: boolean
}
