import type { Store } from './types'
import { unitEconomics } from './detect'

export type CanonicalWaterfallStage =
  | 'gross_revenue'
  | 'returns'
  | 'cogs'
  | 'shipping'
  | 'ad_spend'
  | 'gateway_fees'
  | 'net_profit'

export interface CanonicalWaterfallBar {
  id: CanonicalWaterfallStage
  label: string
  sublabel: string
  deltaCents: number // signed integer cents (negative for cost steps)
  cumulativeCents: number // running total integer cents
  percentageOfGross: number
  isTotal: boolean
  isBleed: boolean
  affectedSkuCount: number
}

export function computeCanonicalWaterfall(store: Store): CanonicalWaterfallBar[] {
  let gross = 0
  let returns = 0
  let cogs = 0
  let shipping = 0
  let ads = 0
  let fees = 0

  let returnsCount = 0
  let cogsExcessCount = 0
  let shippingExcessCount = 0
  let adsBleedCount = 0
  let feesExcessCount = 0

  for (const sku of store.skus) {
    const e = unitEconomics(sku)
    const monthlyUnits = sku.unitsPerDay * 30

    const skuGross = Math.round(sku.priceCents * monthlyUnits)
    const skuReturns = Math.round(e.returnCost * monthlyUnits)
    const skuCogs = Math.round(sku.costCents * monthlyUnits)
    const skuShipping = Math.round((e.shipping + e.fba) * monthlyUnits)
    const skuAds = Math.round(e.ppc * monthlyUnits)
    const skuFees = Math.round((e.referral + e.marketplaceFee + e.paymentFee) * monthlyUnits)

    gross += skuGross
    returns += skuReturns
    cogs += skuCogs
    shipping += skuShipping
    ads += skuAds
    fees += skuFees

    if (sku.returnRatePct > 8) returnsCount++
    if (sku.costCents > sku.priceCents * 0.6) cogsExcessCount++
    if (e.shipping + e.fba > sku.priceCents * 0.35) shippingExcessCount++
    if (e.ppc > Math.max(0, e.preAdContribution)) adsBleedCount++
    if (e.feeRatio > 0.4) feesExcessCount++
  }

  // Exact deterministic math invariant:
  const netProfit = gross - returns - cogs - shipping - ads - fees
  const calcPct = (cents: number) => (gross > 0 ? Math.round((Math.abs(cents) / gross) * 1000) / 10 : 0)

  let running = gross

  const bars: CanonicalWaterfallBar[] = [
    {
      id: 'gross_revenue',
      label: 'Gross Revenue',
      sublabel: 'Total invoiced catalogue sales',
      deltaCents: gross,
      cumulativeCents: running,
      percentageOfGross: 100,
      isTotal: true,
      isBleed: false,
      affectedSkuCount: store.skus.length,
    },
    {
      id: 'returns',
      label: 'Returns & Refunds',
      sublabel: 'Return slippage & restocking loss',
      deltaCents: -returns,
      cumulativeCents: (running -= returns),
      percentageOfGross: calcPct(returns),
      isTotal: false,
      isBleed: returns > gross * 0.08,
      affectedSkuCount: returnsCount,
    },
    {
      id: 'cogs',
      label: 'COGS',
      sublabel: 'Landed product manufacture cost',
      deltaCents: -cogs,
      cumulativeCents: (running -= cogs),
      percentageOfGross: calcPct(cogs),
      isTotal: false,
      isBleed: false,
      affectedSkuCount: cogsExcessCount,
    },
    {
      id: 'shipping',
      label: 'Shipping & Fulfilment',
      sublabel: 'Outbound courier & carrier fees',
      deltaCents: -shipping,
      cumulativeCents: (running -= shipping),
      percentageOfGross: calcPct(shipping),
      isTotal: false,
      isBleed: shipping > gross * 0.25,
      affectedSkuCount: shippingExcessCount,
    },
    {
      id: 'ad_spend',
      label: 'Ad Spend (PPC)',
      sublabel: 'Sponsored campaigns above margin',
      deltaCents: -ads,
      cumulativeCents: (running -= ads),
      percentageOfGross: calcPct(ads),
      isTotal: false,
      isBleed: adsBleedCount > 0,
      affectedSkuCount: adsBleedCount,
    },
    {
      id: 'gateway_fees',
      label: 'Marketplace & Gateway Fees',
      sublabel: 'Referral, Stripe/PayPal cuts',
      deltaCents: -fees,
      cumulativeCents: (running -= fees),
      percentageOfGross: calcPct(fees),
      isTotal: false,
      isBleed: feesExcessCount > 0,
      affectedSkuCount: feesExcessCount,
    },
    {
      id: 'net_profit',
      label: 'Net Profit',
      sublabel: netProfit >= 0 ? 'Retained cash profit' : 'Net portfolio loss',
      deltaCents: netProfit,
      cumulativeCents: netProfit,
      percentageOfGross: calcPct(netProfit),
      isTotal: true,
      isBleed: netProfit < 0,
      affectedSkuCount: store.skus.filter((s) => unitEconomics(s).contribution < 0).length,
    },
  ]

  return bars
}
