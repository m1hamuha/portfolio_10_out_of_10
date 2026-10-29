import { describe, expect, it } from 'vitest'
import {
  detectLeaks,
  buildStoreFromSkus,
  parseCsv,
  parseCsvBundle,
  profitReportCsv,
  summarizeCoverage,
  recompute,
  storeWaterfall,
  unitEconomics,
} from '../index'
import type { Sku } from '../types'

const CLIENT_CSV = `sku,variant_id,title,channel,marketplace,period_days,units_sold,unit_price,unit_cost,shipping_per_unit,discount_per_unit,ad_spend_total,payment_fees_total,marketplace_fees_total,fulfilment_per_unit,refunds_total,vat_rate_pct,expected_vat_rate_pct,price_includes_vat
TS-1,BLUE,T-shirt blue,Shopify,DE,30,10,30.00,10.00,2.00,1.00,50.00,6.00,20.00,0,30.00,19,19,true`

describe('client-ready CSV contract', () => {
  it('uses supplied period costs and VAT instead of hidden estimates', () => {
    const result = parseCsv(CLIENT_CSV)
    expect(result.warnings).toHaveLength(0)
    expect(result.skus).toHaveLength(1)

    const row = result.skus[0]
    expect(row.channel).toBe('Shopify')
    expect(row.variantId).toBe('BLUE')
    expect(row.unitsSold).toBe(10)
    expect(row.periodDays).toBe(30)
    expect(row.unitsPerDay).toBeCloseTo(1 / 3)
    expect(row.shippingCents).toBe(200)
    expect(row.discountCents).toBe(100)
    expect(row.adSpendCents).toBe(500)
    expect(row.paymentFeeCents).toBe(60)
    expect(row.marketplaceFeeCents).toBe(200)
    expect(row.returnCostCents).toBe(300)
    expect(row.vatCents).toBe(479)

    const economics = unitEconomics(row)
    expect(economics.ppc).toBe(500)
    expect(economics.contribution).toBe(161)
  })

  it('never invents advertising or VAT when those columns are absent', () => {
    const result = parseCsv('sku,cost,price,units_sold,period_days\nA,10,30,10,30')
    const row = result.skus[0]
    expect(row.adSpendCents).toBeUndefined()
    expect(row.vatCents).toBeUndefined()
    expect(unitEconomics(row).ppc).toBe(0)

    const coverage = summarizeCoverage(result.skus)
    expect(coverage.missing).toContain('Advertising')
    expect(coverage.missing).toContain('VAT')
    expect(coverage.scorePct).toBeLessThan(100)
  })

  it('reads semicolon-separated EU files with decimal commas', () => {
    const result = parseCsv([
      'sku;unit_cost;unit_price;units_sold;period_days;ad_spend_total',
      'EU-1;10,00;30,00;10;30;50,00',
    ].join('\n'))
    expect(result.warnings).toHaveLength(0)
    expect(result.skus).toHaveLength(1)
    expect(result.skus[0].costCents).toBe(1_000)
    expect(result.skus[0].priceCents).toBe(3_000)
    expect(result.skus[0].adSpendCents).toBe(500)
  })

  it('keeps the same SKU separate across Shopify and Amazon files', () => {
    const base = 'sku,title,cost,price,units_sold,period_days,ad_spend_total\nSAME,Widget,10,30,10,30,20'
    const result = parseCsvBundle([
      { name: 'shopify-july.csv', text: base },
      { name: 'amazon-july.csv', text: base },
    ])

    expect(result.skus).toHaveLength(2)
    expect(new Set(result.skus.map((row) => row.id)).size).toBe(2)
    expect(result.channels).toEqual(['Amazon', 'Shopify'])
    expect(result.skus.map((row) => row.channel).sort()).toEqual(['Amazon', 'Shopify'])
  })
})

describe('client-ready findings and handoff', () => {
  function sku(partial: Partial<Sku>): Sku {
    return {
      id: 'Amazon:A',
      sourceSku: 'A',
      asin: 'B0TEST',
      title: 'Test',
      marketplace: 'DE',
      channel: 'Amazon',
      category: 'Test',
      costCents: 400,
      priceCents: 1500,
      priceFloorCents: null,
      referralFeePct: 0,
      fbaFeeCents: 0,
      unitsPerDay: 5,
      unitsSold: 150,
      periodDays: 30,
      returnRatePct: 0,
      inventoryUnits: 0,
      buyBoxWon: true,
      repricerActive: false,
      providedFields: [],
      ...partial,
    }
  }

  it('flags actual ad spend above break-even contribution', () => {
    const row = sku({ adSpendCents: 1_200, providedFields: ['advertising'] })
    const leak = detectLeaks([row], 0).find((item) => item.type === 'PPC_BLEED')
    expect(leak).toBeDefined()
    expect(leak?.ratePerDayCents).toBe(500)
    expect(leak?.rootCause).toMatch(/actual ad cost/i)
  })

  it('does not ignore a material slow-selling SKU', () => {
    const row = sku({ priceCents: 3_000, costCents: 2_900, unitsPerDay: 0.8 })
    const leak = detectLeaks([row], 0).find((item) => item.type === 'BELOW_FLOOR')
    expect(leak).toBeDefined()
    expect(leak?.ratePerDayCents).toBe(112)
  })

  it('flags a VAT rate that differs from the supplied expected rate', () => {
    const row = sku({
      priceCents: 11_900,
      vatRatePct: 19,
      expectedVatRatePct: 7,
      vatCents: 1_900,
      providedFields: ['vat'],
    })
    const leak = detectLeaks([row], 0).find((item) => item.type === 'VAT_MISMATCH')
    expect(leak).toBeDefined()
    expect(leak?.ratePerDayCents).toBeGreaterThan(0)
    expect(leak?.rootCause).toContain('19.0%')
    expect(leak?.rootCause).toContain('7.0%')
  })

  it('exports a channel-level profitability report with coverage', () => {
    const parsed = parseCsv(CLIENT_CSV)
    const csv = profitReportCsv(parsed.skus)
    const [header, row] = csv.split('\n')
    expect(header).toContain('Channel')
    expect(header).toContain('Advertising_EUR')
    expect(header).toContain('VAT_EUR')
    expect(header).toContain('Net_profit_EUR')
    expect(header).toContain('Data_coverage_pct')
    expect(row).toContain('Shopify')
    expect(row).toContain('TS-1')
  })

  it('does not subtract a finding twice from already-net profit', () => {
    const row = sku({ adSpendCents: 1_200, providedFields: ['advertising'] })
    const store = buildStoreFromSkus([row], 0, 'Client')
    expect(store.leaks.some((leak) => leak.type === 'PPC_BLEED')).toBe(true)

    // €15 sale - €4 COGS - €12 actual ads = -€1/unit; 5 units/day = -€5/day.
    expect(recompute(store).kpis.netProfitTodayCents).toBe(-500)
    const end = storeWaterfall(store).at(-1)
    expect(end?.label).toBe('Net profit')
    expect(end?.cumulativeCents).toBe(-15_000)
    expect(storeWaterfall(store).some((bar) => bar.label === 'Profit leaks')).toBe(false)
  })
})
