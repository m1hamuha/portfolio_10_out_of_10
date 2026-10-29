import { describe, expect, it } from 'vitest'
import { detectSourceKind, importRawExports, unitEconomics } from '../index'

const SHOPIFY_ORDERS = `Name,Created at,Currency,Subtotal,Shipping,Taxes,Total,Discount Amount,Refunded Amount,Lineitem quantity,Lineitem name,Lineitem price,Lineitem SKU,Lineitem discount,Shipping Country
#1001,2026-07-01 10:00:00 +0200,EUR,59.80,4.90,11.36,76.06,0,0,2,Blue T-shirt,29.90,TS-1,0,DE
#1002,2026-07-02 11:00:00 +0200,EUR,29.90,4.90,5.30,38.10,2.00,0,1,Blue T-shirt,29.90,TS-1,2.00,DE`

const SHOPIFY_PRODUCTS = `Title,SKU,Price,Cost per item
Blue T-shirt,TS-1,29.90,12.00`

const SKU_AD_SPEND = `SKU,Ad spend
TS-1,9.00`

const AMAZON_SETTLEMENT = `date/time,settlement-id,type,order-id,sku,description,quantity,marketplace,fulfillment,product-sales,product-sales-tax,shipping-credits,promotional-rebates,selling-fees,fba-fees,other-transaction-fees,other,total
2026-07-01 10:00:00 UTC,S1,Order,A-1,AMZ-1,Travel mug,2,amazon.de,Amazon,50.00,9.50,0,0,-7.50,-6.00,0,0,46.00
2026-07-03 10:00:00 UTC,S1,Order,A-2,AMZ-1,Travel mug,1,amazon.de,Amazon,25.00,4.75,0,0,-3.75,-3.00,0,0,23.00`

const AMAZON_COSTS = `SKU,Cost per item,Title
AMZ-1,8.00,Travel mug`

const AMAZON_ADS = `Advertised SKU,Spend
AMZ-1,12.00`

describe('raw export source detection', () => {
  it('recognises standard Shopify and Amazon exports from their headers', () => {
    expect(detectSourceKind('orders_export.csv', SHOPIFY_ORDERS)).toBe('shopify-orders')
    expect(detectSourceKind('products_export.csv', SHOPIFY_PRODUCTS)).toBe('product-costs')
    expect(detectSourceKind('settlement.csv', AMAZON_SETTLEMENT)).toBe('amazon-settlement')
    expect(detectSourceKind('advertised-product.csv', AMAZON_ADS)).toBe('ad-spend')
  })

  it('does not pretend an unrelated CSV is supported', () => {
    expect(detectSourceKind('customers.csv', 'Email,First Name,Last Name\na@example.com,A,B')).toBe('unknown')
  })

  it('rejects a recognised sales export when it has no usable SKU rows', () => {
    const emptyOrders = 'Name,Created at,Currency,Lineitem quantity,Lineitem name,Lineitem price,Lineitem SKU\n#1,2026-07-01,EUR,1,No SKU,20.00,'
    const result = importRawExports([{ name: 'orders.csv', text: emptyOrders }])
    expect(result.readiness.canAnalyze).toBe(false)
    expect(result.readiness.blockers.join(' ')).toMatch(/valid sales rows/i)
  })
})

describe('self-serve Shopify import', () => {
  it('joins raw orders, product costs, and SKU ad spend without a prepared template', () => {
    const result = importRawExports([
      { name: 'orders_export.csv', text: SHOPIFY_ORDERS },
      { name: 'products_export.csv', text: SHOPIFY_PRODUCTS },
      { name: 'shopify-ad-spend.csv', text: SKU_AD_SPEND },
    ])

    expect(result.readiness.canAnalyze).toBe(true)
    expect(result.readiness.blockers).toHaveLength(0)
    expect(result.sources.map((source) => source.kind)).toEqual([
      'shopify-orders', 'product-costs', 'ad-spend',
    ])
    expect(result.skus).toHaveLength(1)

    const row = result.skus[0]
    expect(row.channel).toBe('Shopify')
    expect(row.sourceSku).toBe('TS-1')
    expect(row.unitsSold).toBe(3)
    expect(row.periodDays).toBe(2)
    expect(row.unitsPerDay).toBe(1.5)
    expect(row.priceCents).toBe(2_990)
    expect(row.costCents).toBe(1_200)
    expect(row.discountCents).toBe(67)
    expect(row.adSpendCents).toBe(300)
    expect(unitEconomics(row).contribution).toBe(1_423)
  })

  it('blocks analysis and tells the customer to add product costs', () => {
    const result = importRawExports([{ name: 'orders.csv', text: SHOPIFY_ORDERS }])
    expect(result.readiness.canAnalyze).toBe(false)
    expect(result.readiness.blockers.join(' ')).toMatch(/cost|COGS/i)
    expect(result.skus).toHaveLength(0)
  })

  it('keeps missing advertising visibly missing instead of treating it as zero', () => {
    const result = importRawExports([
      { name: 'orders_export.csv', text: SHOPIFY_ORDERS },
      { name: 'products_export.csv', text: SHOPIFY_PRODUCTS },
    ])
    expect(result.readiness.canAnalyze).toBe(true)
    expect(result.skus[0].adSpendCents).toBeUndefined()
    expect(result.skus[0].providedFields).not.toContain('advertising')
    expect(result.readiness.notices.join(' ')).toMatch(/Advertising/i)
  })

  it('still accepts the advanced MarginPulse format as a fallback', () => {
    const result = importRawExports([{
      name: 'advanced.csv',
      text: 'sku,unit_price,unit_cost,units_sold,period_days\nSKU-1,20,8,4,2',
    }])
    expect(result.readiness.canAnalyze).toBe(true)
    expect(result.sources[0].kind).toBe('marginpulse')
    expect(result.skus[0].sourceSku).toBe('SKU-1')
  })
})

describe('self-serve Amazon import', () => {
  it('joins settlement, product costs, and advertised-product spend by SKU', () => {
    const result = importRawExports([
      { name: 'settlement.csv', text: AMAZON_SETTLEMENT },
      { name: 'amazon-costs.csv', text: AMAZON_COSTS },
      { name: 'advertised-product.csv', text: AMAZON_ADS },
    ])

    expect(result.readiness.canAnalyze).toBe(true)
    expect(result.skus).toHaveLength(1)
    const row = result.skus[0]
    expect(row.channel).toBe('Amazon')
    expect(row.unitsSold).toBe(3)
    expect(row.periodDays).toBe(3)
    expect(row.priceCents).toBe(2_500)
    expect(row.costCents).toBe(800)
    expect(row.marketplaceFeeCents).toBe(375)
    expect(row.fbaFeeCents).toBe(300)
    expect(row.adSpendCents).toBe(400)
    expect(row.vatCents).toBe(0)
    expect(row.providedFields).toContain('vat')
  })

  it('reports unsupported files instead of silently ignoring them', () => {
    const result = importRawExports([{ name: 'customers.csv', text: 'Email,Name\na@example.com,A' }])
    expect(result.readiness.canAnalyze).toBe(false)
    expect(result.sources[0].kind).toBe('unknown')
    expect(result.sources[0].status).toBe('error')
    expect(result.readiness.blockers.join(' ')).toMatch(/recognise|supported/i)
  })
})
