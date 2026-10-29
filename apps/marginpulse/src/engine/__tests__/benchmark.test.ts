import { describe, it, expect } from 'vitest'
import { STRESS_1000_PRESET } from '../presets'
import { importRawExports } from '../raw-import'
import { buildStoreFromSkus } from '../generate'
import { computeCanonicalWaterfall } from '../waterfall'
import { computePortfolioHealthScore } from '../report'

describe('1,000-Row Multi-Channel Stress & Benchmark Test', () => {
  it('parses and processes 1,000 rows in under 300ms performance budget', () => {
    const startTime = performance.now()

    // 1. Ingest raw CSV
    const result = importRawExports(STRESS_1000_PRESET.files)
    expect(result.readiness.canAnalyze).toBe(true)
    expect(result.skus.length).toBe(1000)

    // 2. Build Store
    const store = buildStoreFromSkus(result.skus, 100000, 'Stress Test Store')
    expect(store.skus.length).toBe(1000)

    // 3. Compute 7-stage Waterfall
    const waterfall = computeCanonicalWaterfall(store)
    expect(waterfall).toHaveLength(7)

    // 4. Compute Health Score
    const health = computePortfolioHealthScore(store)
    expect(health.score).toBeGreaterThan(0)

    const duration = performance.now() - startTime

    // Assert strictly under 300ms requirement
    expect(duration).toBeLessThan(300)
  })

  it('guarantees integer cent precision across all 1,000 SKUs', () => {
    const result = importRawExports(STRESS_1000_PRESET.files)
    for (const sku of result.skus) {
      expect(Number.isInteger(sku.priceCents)).toBe(true)
      expect(Number.isInteger(sku.costCents)).toBe(true)
      if (sku.marketplaceFeeCents !== undefined) {
        expect(Number.isInteger(sku.marketplaceFeeCents)).toBe(true)
      }
      if (sku.adSpendCents !== undefined) {
        expect(Number.isInteger(sku.adSpendCents)).toBe(true)
      }
    }
  })
})
