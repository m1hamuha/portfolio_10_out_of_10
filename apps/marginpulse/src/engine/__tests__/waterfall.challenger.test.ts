import { describe, it, expect } from 'vitest'
import { computeCanonicalWaterfall } from '../waterfall'
import { generateStore } from '../generate'
import type { Store, Sku } from '../types'

describe('Challenger Empirical Stress Suite: Waterfall Engine & Bridge Math', () => {
  describe('Invariant 1: Exact Mathematical Bridge across Multiple Generated Stores', () => {
    it('proves gross - sum(expenses) === netProfit across 50 seeded stores', () => {
      for (let seed = 100; seed < 150; seed++) {
        const store = generateStore(seed, 50000)
        const bars = computeCanonicalWaterfall(store)

        expect(bars).toHaveLength(7)

        const gross = bars[0].cumulativeCents
        const returns = Math.abs(bars[1].deltaCents)
        const cogs = Math.abs(bars[2].deltaCents)
        const shipping = Math.abs(bars[3].deltaCents)
        const ads = Math.abs(bars[4].deltaCents)
        const fees = Math.abs(bars[5].deltaCents)
        const netProfit = bars[6].cumulativeCents

        // Exact bridge invariant
        expect(gross - returns - cogs - shipping - ads - fees).toBe(netProfit)

        // Gateway fees running total must equal net_profit
        expect(bars[5].cumulativeCents).toBe(bars[6].cumulativeCents)

        // Every bar must have integer cents
        for (const bar of bars) {
          expect(Number.isInteger(bar.deltaCents)).toBe(true)
          expect(Number.isInteger(bar.cumulativeCents)).toBe(true)
          expect(Number.isNaN(bar.percentageOfGross)).toBe(false)
          expect(Number.isFinite(bar.percentageOfGross)).toBe(true)
        }
      }
    })
  })

  describe('Invariant 2: Pathological & Boundary Store Configurations', () => {
    it('handles empty store (0 SKUs) gracefully without NaN or division by zero', () => {
      const base = generateStore(1, 100)
      const emptyStore: Store = {
        ...base,
        storeName: 'Empty Test Store',
        skuCount: 0,
        skus: [],
      }

      const bars = computeCanonicalWaterfall(emptyStore)
      expect(bars).toHaveLength(7)

      for (const bar of bars) {
        expect(bar.deltaCents === 0).toBe(true)
        expect(bar.cumulativeCents === 0).toBe(true)
        expect(Number.isInteger(bar.deltaCents)).toBe(true)
        expect(Number.isInteger(bar.cumulativeCents)).toBe(true)
        expect(Number.isNaN(bar.percentageOfGross)).toBe(false)
      }

      expect(bars[6].id).toBe('net_profit')
      expect(bars[6].cumulativeCents).toBe(0)
      expect(bars[6].isBleed).toBe(false)
    })

    it('handles SKUs with float unitsPerDay and IEEE 754 precision drift', () => {
      const base = generateStore(2, 100)
      const sku1: Sku = {
        ...base.skus[0],
        id: 'SKU-FLOAT-1',
        title: 'Float Sku 1',
        priceCents: 1999,
        costCents: 850,
        unitsPerDay: 0.1 + 0.2, // 0.30000000000000004
        returnRatePct: 4.5,
        fbaFeeCents: 350,
        referralFeePct: 15.333333333,
        adSpendCents: 210,
      }
      const sku2: Sku = {
        ...base.skus[1],
        id: 'SKU-FLOAT-2',
        title: 'Float Sku 2',
        priceCents: 4999,
        costCents: 2100,
        unitsPerDay: 1 / 3, // 0.3333333333333333
        returnRatePct: 12.75,
        fbaFeeCents: 520,
        referralFeePct: 12.5,
        adSpendCents: 650,
      }

      const floatStore: Store = {
        ...base,
        storeName: 'Float Drift Store',
        skus: [sku1, sku2],
        skuCount: 2,
      }

      const bars = computeCanonicalWaterfall(floatStore)

      for (const bar of bars) {
        expect(Number.isInteger(bar.deltaCents)).toBe(true)
        expect(Number.isInteger(bar.cumulativeCents)).toBe(true)
      }

      const gross = bars[0].cumulativeCents
      const returns = Math.abs(bars[1].deltaCents)
      const cogs = Math.abs(bars[2].deltaCents)
      const shipping = Math.abs(bars[3].deltaCents)
      const ads = Math.abs(bars[4].deltaCents)
      const fees = Math.abs(bars[5].deltaCents)
      const netProfit = bars[6].cumulativeCents

      expect(gross - returns - cogs - shipping - ads - fees).toBe(netProfit)
      expect(bars[5].cumulativeCents).toBe(netProfit)
    })

    it('handles deep negative margin scenarios where costs vastly exceed revenue', () => {
      const base = generateStore(3, 100)
      const bleedSku: Sku = {
        ...base.skus[0],
        id: 'SKU-BLEED-MAX',
        title: 'Disaster SKU',
        priceCents: 1000, // €10.00
        costCents: 5000, // €50.00 cost
        unitsPerDay: 100,
        returnRatePct: 25.0, // huge return rate
        returnCostCents: 2000,
        fbaFeeCents: 1500,
        shippingCents: 1000,
        referralFeePct: 20,
        adSpendCents: 4000,
      }

      const catastrophicStore: Store = {
        ...base,
        storeName: 'Bleeding Store',
        skus: [bleedSku],
        skuCount: 1,
      }

      const bars = computeCanonicalWaterfall(catastrophicStore)

      const netBar = bars.find((b) => b.id === 'net_profit')!
      expect(netBar.cumulativeCents).toBeLessThan(0)
      expect(netBar.isBleed).toBe(true)
      expect(Number.isInteger(netBar.cumulativeCents)).toBe(true)
      expect(bars[5].cumulativeCents).toBe(netBar.cumulativeCents)
    })

    it('handles massive 5,000 SKU catalogue without integer overflow or float loss', () => {
      const base = generateStore(4, 100)
      const templateSku = base.skus[0]
      const skus: Sku[] = []
      for (let i = 0; i < 5000; i++) {
        skus.push({
          ...templateSku,
          id: `SKU-SCALE-${i}`,
          title: `Scale Product ${i}`,
          priceCents: 2500 + (i % 500) * 10,
          costCents: 1000 + (i % 200) * 5,
          unitsPerDay: 5 + (i % 20),
          returnRatePct: 3 + (i % 10),
          fbaFeeCents: 300,
          referralFeePct: 15,
          adSpendCents: 150,
        })
      }

      const bigStore: Store = {
        ...base,
        storeName: 'Enterprise Megastore',
        skus,
        skuCount: skus.length,
      }

      const start = performance.now()
      const bars = computeCanonicalWaterfall(bigStore)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(200) // 5k SKUs waterfall calculated in < 200ms
      expect(bars[0].cumulativeCents).toBeGreaterThan(1_000_000_00) // Multi-million euro catalogue
      expect(Number.isSafeInteger(bars[0].cumulativeCents)).toBe(true)
      expect(Number.isSafeInteger(bars[6].cumulativeCents)).toBe(true)

      const gross = bars[0].cumulativeCents
      const returns = Math.abs(bars[1].deltaCents)
      const cogs = Math.abs(bars[2].deltaCents)
      const shipping = Math.abs(bars[3].deltaCents)
      const ads = Math.abs(bars[4].deltaCents)
      const fees = Math.abs(bars[5].deltaCents)
      const netProfit = bars[6].cumulativeCents

      expect(gross - returns - cogs - shipping - ads - fees).toBe(netProfit)
    })
  })
})
