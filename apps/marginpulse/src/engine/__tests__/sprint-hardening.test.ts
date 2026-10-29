import { describe, it, expect } from 'vitest'
import {
  generateStore,
  storeWaterfall,
  sparkline,
  activeLeaks,
  dayFraction,
  formatEur,
  pct,
  clamp,
  DAY_MS,
} from '../index'

const SEED = 7
const NOON = 12 * 60 * 60 * 1000

// ── money.ts: display-edge formatting was the least-covered engine module ──
describe('money formatting', () => {
  it('formats cents as whole-euro by default (rounded, no decimals)', () => {
    const out = formatEur(12345) // €123.45 -> rounds to €123
    expect(out).toContain('123')
    expect(out).not.toContain('.')
    expect(out).not.toContain('−')
  })

  it('keeps two decimals when opts.cents is set (live odometer)', () => {
    expect(formatEur(12345, { cents: true })).toContain('123.45')
  })

  it('uses a real minus sign for negative amounts', () => {
    const out = formatEur(-10000)
    expect(out).toContain('−') // U+2212, not ASCII hyphen
    expect(out).toContain('100')
  })

  it('prefixes an explicit sign when opts.signed is set', () => {
    expect(formatEur(500, { signed: true }).startsWith('+')).toBe(true)
    expect(formatEur(-500, { signed: true }).startsWith('−')).toBe(true)
    // zero gets no sign
    const zero = formatEur(0, { signed: true })
    expect(zero.startsWith('+')).toBe(false)
    expect(zero.startsWith('−')).toBe(false)
  })

  it('pct renders with the requested precision', () => {
    expect(pct(12.345)).toBe('12.3%')
    expect(pct(50, 0)).toBe('50%')
  })

  it('clamp bounds a value on both sides and passes through the middle', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})

// ── recompute.ts: the store-wide waterfall (hero chart) + sparkline ──
describe('store waterfall (hero bridge)', () => {
  const store = generateStore(SEED, NOON)
  const bars = storeWaterfall(store)

  it('opens on Revenue and closes on Net profit', () => {
    expect(bars[0].kind).toBe('start')
    expect(bars[0].label).toBe('Revenue')
    const last = bars[bars.length - 1]
    expect(last.kind).toBe('end')
    expect(last.label).toBe('Net profit')
  })

  it('balances: sum of every step equals the final net-profit total', () => {
    const last = bars[bars.length - 1]
    const sumOfSteps = bars
      .filter((b) => b.kind !== 'end')
      .reduce((a, b) => a + b.deltaCents, 0)
    expect(sumOfSteps).toBe(last.cumulativeCents)
    expect(last.deltaCents).toBe(last.cumulativeCents)
  })

  it('revenue is positive and every cost step drains (non-positive)', () => {
    expect(bars[0].deltaCents).toBeGreaterThan(0)
    for (const b of bars.filter((x) => x.kind === 'decrease')) {
      expect(b.deltaCents).toBeLessThanOrEqual(0)
    }
  })

  it('does not double-count findings as an extra Profit-leaks drain', () => {
    expect(activeLeaks(store).length).toBeGreaterThan(0)
    expect(bars.some((bar) => bar.label === 'Profit leaks')).toBe(false)
    expect(bars.some((bar) => bar.isLeak)).toBe(false)
  })
})

describe('sparkline', () => {
  it('returns the requested length, all values in [0,1]', () => {
    const line = sparkline(SEED, 'kpi', 24)
    expect(line).toHaveLength(24)
    for (const v of line) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic by seed+key and varies by key', () => {
    expect(sparkline(SEED, 'kpi', 24)).toEqual(sparkline(SEED, 'kpi', 24))
    expect(sparkline(SEED, 'kpi', 24)).not.toEqual(sparkline(SEED, 'other', 24))
  })
})

// ── recompute.ts: dayFraction clamp edges ──
describe('dayFraction', () => {
  const store = generateStore(SEED, NOON)
  it('is 0 at start of day and clamps to 1 past the day end', () => {
    expect(dayFraction(store, store.dayStartMs)).toBe(0)
    expect(dayFraction(store, store.dayStartMs + DAY_MS * 2)).toBe(1)
  })
})
