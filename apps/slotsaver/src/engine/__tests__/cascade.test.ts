import { describe, it, expect } from 'vitest'
import { generateStore } from '../store'
import { openSlot, resolveFill, applyFill } from '../fill'
import { calculateScoreBreakdown } from '../priorityQueue'

describe('End-to-End Cascade & Financial Precision Invariant', () => {
  const SEED = 42
  const CLOCK = Date.UTC(2026, 5, 19, 9, 14, 0)

  it('preserves exact integer cent precision across cancellation and autofill', () => {
    const store = generateStore(SEED, CLOCK)
    const booked = store.slots.find((s) => s.status === 'booked')!
    expect(Number.isInteger(booked.priceCents)).toBe(true)

    // Free the slot
    const openedStore = openSlot(store, booked.id)
    const freedSlot = openedStore.slots.find((s) => s.id === booked.id)!
    expect(freedSlot.status).toBe('open')

    // Resolve fill cascade
    const fillResult = resolveFill(freedSlot, openedStore.waitlist, openedStore.seed)
    expect(Number.isInteger(fillResult.recoveredCents)).toBe(true)

    if (fillResult.filled) {
      expect(fillResult.recoveredCents).toBe(booked.priceCents)
    }

    // Apply fill to store
    const appliedStore = applyFill(openedStore, booked.id)
    expect(Number.isInteger(appliedStore.recoveredThisMonthCents)).toBe(true)
    if (fillResult.filled) {
      expect(appliedStore.recoveredThisMonthCents).toBe(store.recoveredThisMonthCents + booked.priceCents)
    }
  })

  it('attaches 4-factor score breakdown to all waitlist candidates during cascade', () => {
    const store = generateStore(SEED, CLOCK)
    const slot = store.slots[0]

    for (const cand of store.waitlist) {
      const breakdown = calculateScoreBreakdown(cand, slot)
      expect(breakdown.total).toBeGreaterThanOrEqual(0)
      expect(breakdown.total).toBeLessThanOrEqual(100)
      expect(breakdown.serviceMatch + breakdown.availabilityFit + breakdown.historicalLtv + breakdown.responseSpeed).toBe(breakdown.total)
    }
  })
})
