import { describe, it, expect } from 'vitest'
import { detectSourceKind, importRawExports } from '../raw-import'
import { WOOCOMMERCE_PRESET } from '../presets'

describe('WooCommerce CSV parser', () => {
  it('correctly detects WooCommerce orders export', () => {
    const file = WOOCOMMERCE_PRESET.files[0]
    const kind = detectSourceKind(file.name, file.text)
    expect(kind).toBe('woocommerce-orders')
  })

  it('imports WooCommerce orders with embedded line COGS and payment fees', () => {
    const result = importRawExports(WOOCOMMERCE_PRESET.files)
    expect(result.readiness.canAnalyze).toBe(true)
    expect(result.channels).toContain('WooCommerce')
    expect(result.skus.length).toBeGreaterThanOrEqual(5)

    const coffee = result.skus.find((s) => s.sourceSku === 'WOO-COFFEE-01')
    expect(coffee).toBeDefined()
    expect(coffee?.priceCents).toBe(1850)
    expect(coffee?.costCents).toBe(720)
    expect(coffee?.unitsSold).toBe(6)
    expect(coffee?.marketplaceFeeCents).toBeGreaterThan(0) // payment gateway fee mapped
    expect(coffee?.providedFields).toContain('paymentFees')
  })

  it('handles refunded orders and discount amounts correctly', () => {
    const result = importRawExports(WOOCOMMERCE_PRESET.files)
    const scale = result.skus.find((s) => s.sourceSku === 'WOO-SCALE-03')
    expect(scale).toBeDefined()
    expect(scale?.returnRatePct).toBe(100)
    expect(scale?.returnCostCents).toBe(5400)
  })
})
