import { describe, it, expect } from 'vitest'
import { generateStore } from '../generate'
import { computeCanonicalWaterfall } from '../waterfall'

describe('Canonical 7-Stage Waterfall Engine', () => {
  it('computes all 7 canonical stages in order', () => {
    const store = generateStore(12345, 100000)
    const bars = computeCanonicalWaterfall(store)

    expect(bars).toHaveLength(7)
    expect(bars.map((b) => b.id)).toEqual([
      'gross_revenue',
      'returns',
      'cogs',
      'shipping',
      'ad_spend',
      'gateway_fees',
      'net_profit',
    ])
  })

  it('strictly satisfies the mathematical bridge invariant to the exact integer cent', () => {
    const store = generateStore(20260619, 11 * 3600000)
    const bars = computeCanonicalWaterfall(store)

    const gross = bars.find((b) => b.id === 'gross_revenue')!.cumulativeCents
    const returns = Math.abs(bars.find((b) => b.id === 'returns')!.deltaCents)
    const cogs = Math.abs(bars.find((b) => b.id === 'cogs')!.deltaCents)
    const shipping = Math.abs(bars.find((b) => b.id === 'shipping')!.deltaCents)
    const ads = Math.abs(bars.find((b) => b.id === 'ad_spend')!.deltaCents)
    const fees = Math.abs(bars.find((b) => b.id === 'gateway_fees')!.deltaCents)
    const netProfit = bars.find((b) => b.id === 'net_profit')!.cumulativeCents

    // Gross Revenue minus all expense deltas equals Net Profit
    expect(gross - returns - cogs - shipping - ads - fees).toBe(netProfit)

    // Verify all deltas and cumulatives are integer cents
    for (const bar of bars) {
      expect(Number.isInteger(bar.deltaCents)).toBe(true)
      expect(Number.isInteger(bar.cumulativeCents)).toBe(true)
    }
  })

  it('calculates correct percentages and affected SKU counts', () => {
    const store = generateStore(999, 1000)
    const bars = computeCanonicalWaterfall(store)

    const grossBar = bars[0]
    expect(grossBar.percentageOfGross).toBe(100)
    expect(grossBar.affectedSkuCount).toBe(store.skus.length)

    const netBar = bars[6]
    expect(netBar.isTotal).toBe(true)
    expect(netBar.cumulativeCents).toBe(bars[5].cumulativeCents)
  })
})
