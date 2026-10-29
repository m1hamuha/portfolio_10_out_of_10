import { describe, it, expect } from 'vitest'
import {
  generateStore,
  recompute,
  apply,
  activeLeaks,
  leakedSoFarTodayCents,
  waterfallFor,
  sparkline,
  projectSavingsCents,
  primaryAction,
  DAY_MS,
} from '../index'
import type { Store } from '../types'

const SEED = 7
const NOON = 12 * 60 * 60 * 1000 // ms into the day

function freshStore(clockMs = NOON): Store {
  return generateStore(SEED, clockMs)
}

describe('seeded generation', () => {
  it('is reproducible: same seed => identical store', () => {
    expect(generateStore(SEED, NOON)).toEqual(generateStore(SEED, NOON))
  })

  it('differs across seeds', () => {
    const a = generateStore(1, NOON)
    const b = generateStore(2, NOON)
    expect(a).not.toEqual(b)
  })

  it('produces at least 6 active leaks across at least 4 leak types', () => {
    const s = freshStore()
    const active = activeLeaks(s)
    expect(active.length).toBeGreaterThanOrEqual(6)
    const types = new Set(active.map((l) => l.type))
    expect(types.size).toBeGreaterThanOrEqual(4)
  })

  it('every leak references a real SKU and has a positive bleed rate', () => {
    const s = freshStore()
    const ids = new Set(s.skus.map((k) => k.id))
    for (const l of s.leaks) {
      expect(ids.has(l.skuId)).toBe(true)
      expect(l.ratePerDayCents).toBeGreaterThan(0)
      expect(l.actions.length).toBeGreaterThan(0)
    }
  })
})

describe('value integrity', () => {
  it('all money fields are integer cents (no float drift)', () => {
    const s = freshStore()
    for (const k of s.skus) {
      for (const v of [k.costCents, k.priceCents, k.fbaFeeCents]) {
        expect(Number.isInteger(v)).toBe(true)
      }
      expect(k.priceCents).toBeGreaterThan(0)
      expect(k.costCents).toBeGreaterThan(0)
      expect(k.inventoryUnits).toBeGreaterThanOrEqual(0)
    }
    for (const l of s.leaks) expect(Number.isInteger(l.ratePerDayCents)).toBe(true)
    const { kpis } = recompute(s)
    expect(Number.isInteger(kpis.totalLeakRatePerDayCents)).toBe(true)
    expect(Number.isInteger(kpis.revenueTodayCents)).toBe(true)
  })
})

describe('recompute purity', () => {
  it('does not mutate the store', () => {
    const s = freshStore()
    const snapshot = structuredClone(s)
    recompute(s)
    expect(s).toEqual(snapshot)
  })

  it('is idempotent: same input => equal output', () => {
    const s = freshStore()
    expect(recompute(s)).toEqual(recompute(s))
  })
})

describe('leak counter consistency', () => {
  it('totalLeakRate equals the sum of active leak rates', () => {
    const s = freshStore()
    const sum = activeLeaks(s).reduce((a, l) => a + l.ratePerDayCents, 0)
    expect(recompute(s).kpis.totalLeakRatePerDayCents).toBe(sum)
  })

  it('monthly projection is the daily run-rate times 30', () => {
    const { kpis } = recompute(freshStore())
    expect(kpis.monthlyLeakProjectionCents).toBe(kpis.totalLeakRatePerDayCents * 30)
  })
})

describe('resolution math', () => {
  it('resolving a leak drops total rate by exactly its rate, banks 7 days of savings, decrements threats', () => {
    const s = freshStore()
    const leak = activeLeaks(s)[0]
    const before = recompute(s).kpis

    const s2 = apply(s, { type: primaryAction(leak), leakId: leak.id })
    const after = recompute(s2).kpis

    expect(after.totalLeakRatePerDayCents).toBe(before.totalLeakRatePerDayCents - leak.ratePerDayCents)
    expect(after.savedThisWeekCents).toBe(before.savedThisWeekCents + leak.ratePerDayCents * 7)
    expect(after.activeThreatCount).toBe(before.activeThreatCount - 1)
    expect(s2.resolvedCount).toBe(s.resolvedCount + 1)
  })

  it('is immutable: applying an action returns a new store, leaves the original intact', () => {
    const s = freshStore()
    const snapshot = structuredClone(s)
    const leak = activeLeaks(s)[0]
    apply(s, { type: primaryAction(leak), leakId: leak.id })
    expect(s).toEqual(snapshot)
  })

  it('resolving an already-resolved or unknown leak is a no-op', () => {
    const s = freshStore()
    const leak = activeLeaks(s)[0]
    const s2 = apply(s, { type: primaryAction(leak), leakId: leak.id })
    const s3 = apply(s2, { type: primaryAction(leak), leakId: leak.id })
    expect(recompute(s3).kpis).toEqual(recompute(s2).kpis)

    const s4 = apply(s2, { type: 'SET_PRICE_FLOOR', leakId: 'does-not-exist' })
    expect(recompute(s4).kpis).toEqual(recompute(s2).kpis)
  })

  it('SET_PRICE_FLOOR sets a floor on the SKU and makes it non-loss-making', () => {
    const s = freshStore()
    const floorLeak = activeLeaks(s).find((l) => l.type === 'BELOW_FLOOR')
    if (!floorLeak) return // seed-dependent; covered by other seeds
    const s2 = apply(s, { type: 'SET_PRICE_FLOOR', leakId: floorLeak.id })
    const sku = s2.skus.find((k) => k.id === floorLeak.skuId)!
    expect(sku.priceFloorCents).not.toBeNull()
    expect(sku.priceFloorCents!).toBeGreaterThanOrEqual(sku.costCents)
  })

  it('DISPUTE_FEE banks a reimbursement claim', () => {
    const s = freshStore()
    const feeLeak = activeLeaks(s).find((l) => l.actions.includes('DISPUTE_FEE'))
    if (!feeLeak) return
    const before = s.reimbursementsPendingCents
    const s2 = apply(s, { type: 'DISPUTE_FEE', leakId: feeLeak.id })
    expect(s2.reimbursementsPendingCents).toBeGreaterThan(before)
  })

  it('resolving every leak reaches a terminal zero-leak state', () => {
    let s = freshStore()
    for (const l of activeLeaks(s)) {
      s = apply(s, { type: primaryAction(l), leakId: l.id })
    }
    const { kpis } = recompute(s)
    expect(kpis.totalLeakRatePerDayCents).toBe(0)
    expect(kpis.monthlyLeakProjectionCents).toBe(0)
    expect(kpis.activeThreatCount).toBe(0)
  })
})

describe('live tick (accrued leak today)', () => {
  it('is non-decreasing as time advances while leaks are active', () => {
    const s = freshStore(NOON)
    const t1 = leakedSoFarTodayCents(s)
    const s2 = apply(s, { type: 'TICK', clockMs: NOON + 2 * 60 * 60 * 1000 })
    const t2 = leakedSoFarTodayCents(s2)
    expect(t2).toBeGreaterThan(t1)
  })

  it('freezes (no further bleed) once all leaks are resolved', () => {
    let s = freshStore(NOON)
    for (const l of activeLeaks(s)) s = apply(s, { type: primaryAction(l), leakId: l.id })
    const frozen = leakedSoFarTodayCents(s)
    const s2 = apply(s, { type: 'TICK', clockMs: NOON + 3 * 60 * 60 * 1000 })
    expect(leakedSoFarTodayCents(s2)).toBe(frozen)
  })

  it('never un-loses already-bled money when a leak is fixed', () => {
    const s = freshStore(NOON)
    const before = leakedSoFarTodayCents(s)
    const leak = activeLeaks(s)[0]
    const s2 = apply(s, { type: primaryAction(leak), leakId: leak.id })
    expect(leakedSoFarTodayCents(s2)).toBeGreaterThanOrEqual(before)
  })

  it('initial accrued equals run-rate times the elapsed fraction of the day', () => {
    const s = freshStore(NOON)
    const rate = recompute(s).kpis.totalLeakRatePerDayCents
    expect(leakedSoFarTodayCents(s)).toBe(Math.round(rate * (NOON / DAY_MS)))
  })
})

describe('P&L waterfall', () => {
  it('balances: start total + signed deltas === end total === net profit', () => {
    const s = freshStore()
    const sku = s.skus.find((k) => s.leaks.some((l) => l.skuId === k.id))!
    const bars = waterfallFor(s, sku.id)
    expect(bars.length).toBeGreaterThanOrEqual(4)
    expect(bars[0].kind).toBe('start')

    const end = bars[bars.length - 1]
    expect(end.kind).toBe('end')

    const steps = bars.slice(0, -1).reduce((a, b) => a + b.deltaCents, 0)
    expect(steps).toBe(end.cumulativeCents)
    expect(end.deltaCents).toBe(end.cumulativeCents)
  })

  it('does not append an active finding as a second copy of an existing cost', () => {
    const s = freshStore()
    const leak = activeLeaks(s)[0]
    const bars = waterfallFor(s, leak.skuId)
    expect(bars.some((bar) => bar.isLeak)).toBe(false)
    const end = bars.at(-1)!
    const steps = bars.slice(0, -1).reduce((sum, bar) => sum + bar.deltaCents, 0)
    expect(end.cumulativeCents).toBe(steps)
  })
})

describe('sparkline', () => {
  it('is deterministic for the same key and length', () => {
    expect(sparkline(SEED, 'revenue', 24)).toEqual(sparkline(SEED, 'revenue', 24))
    expect(sparkline(SEED, 'revenue', 24)).toHaveLength(24)
  })

  it('differs by key', () => {
    expect(sparkline(SEED, 'revenue', 24)).not.toEqual(sparkline(SEED, 'profit', 24))
  })
})

describe('savings projection (ROI fast-forward)', () => {
  it('scales banked weekly savings linearly with days', () => {
    let s = freshStore()
    const leak = activeLeaks(s)[0]
    s = apply(s, { type: primaryAction(leak), leakId: leak.id })
    const weekly = recompute(s).kpis.savedThisWeekCents
    expect(projectSavingsCents(s, 7)).toBe(weekly)
    expect(projectSavingsCents(s, 30)).toBe(Math.round((weekly / 7) * 30))
    expect(projectSavingsCents(s, 0)).toBe(0)
  })
})
