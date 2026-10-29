import { describe, it, expect } from 'vitest'
import {
  generateStore,
  rankCandidates,
  resolveFill,
  applyFill,
  openSlot,
  fastForward,
  averageSlotPriceCents,
  formatEur,
  formatTime,
  type Candidate,
  type Slot,
  type Store,
} from '../index'

const SEED = 42
const CLOCK = Date.UTC(2026, 5, 19, 9, 14, 0)

const fresh = () => generateStore(SEED, CLOCK)
const isInt = (n: number) => Number.isInteger(n)

// A booked slot we can free + cascade in tests.
function firstBooked(store: Store): Slot {
  const s = store.slots.find((x) => x.status === 'booked')
  if (!s) throw new Error('expected a booked slot')
  return s
}

describe('Invariant 1 — generateStore is deterministic & well-formed', () => {
  it('is deterministic for a given (seed, clockMs)', () => {
    expect(generateStore(SEED, CLOCK)).toEqual(generateStore(SEED, CLOCK))
  })

  it('different seeds yield different schedules', () => {
    const a = generateStore(1, CLOCK)
    const b = generateStore(2, CLOCK)
    expect(a).not.toEqual(b)
  })

  it('produces ≥1 day of slots, all with positive integer-cent prices', () => {
    const s = fresh()
    expect(s.slots.length).toBeGreaterThanOrEqual(1)
    for (const slot of s.slots) {
      expect(slot.priceCents).toBeGreaterThan(0)
      expect(isInt(slot.priceCents)).toBe(true)
      expect(formatTime(slot.minutes)).toBe(slot.time)
    }
  })

  it('produces ≥3 waitlist candidates with fitScore in 0..100', () => {
    const s = fresh()
    expect(s.waitlist.length).toBeGreaterThanOrEqual(3)
    for (const c of s.waitlist) {
      expect(c.fitScore).toBeGreaterThanOrEqual(0)
      expect(c.fitScore).toBeLessThanOrEqual(100)
    }
  })

  it('starts with zero recovered money & count, and an honest (<100%) fill rate', () => {
    const s = fresh()
    expect(s.recoveredThisMonthCents).toBe(0)
    expect(s.recoveredCount).toBe(0)
    expect(s.fillRatePct).toBeGreaterThan(0)
    expect(s.fillRatePct).toBeLessThan(100)
  })
})

describe('Invariant 2 — rankCandidates: fitScore-desc, stable, lossless', () => {
  it('sorts by fitScore descending', () => {
    const s = fresh()
    const slot = firstBooked(s)
    const ranked = rankCandidates(s.waitlist, slot)
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].fitScore).toBeGreaterThanOrEqual(ranked[i].fitScore)
    }
  })

  it('drops nobody and adds nobody (same id set)', () => {
    const s = fresh()
    const slot = firstBooked(s)
    const ranked = rankCandidates(s.waitlist, slot)
    expect(ranked.length).toBe(s.waitlist.length)
    expect(new Set(ranked.map((c) => c.id))).toEqual(new Set(s.waitlist.map((c) => c.id)))
  })

  it('is stable for equal fitScores (preserves input order on ties)', () => {
    const tie: Candidate[] = [
      { id: 'a', name: 'A', wantsService: 'X', fitScore: 80, willTake: false, loyalty: 'New', flexibility: 'Low' },
      { id: 'b', name: 'B', wantsService: 'X', fitScore: 80, willTake: false, loyalty: 'New', flexibility: 'Low' },
      { id: 'c', name: 'C', wantsService: 'X', fitScore: 90, willTake: false, loyalty: 'New', flexibility: 'Low' },
    ]
    const slot = firstBooked(fresh())
    const ranked = rankCandidates(tie, slot)
    expect(ranked.map((c) => c.id)).toEqual(['c', 'a', 'b'])
  })

  it('does not mutate the input array', () => {
    const s = fresh()
    const before = s.waitlist.map((c) => c.id)
    rankCandidates(s.waitlist, firstBooked(s))
    expect(s.waitlist.map((c) => c.id)).toEqual(before)
  })
})

describe('Invariant 3 — resolveFill: deterministic cascade, first-accepter wins', () => {
  it('is deterministic for a given (slot, waitlist, seed)', () => {
    const s = fresh()
    const slot = firstBooked(s)
    expect(resolveFill(slot, s.waitlist, s.seed)).toEqual(
      resolveFill(slot, s.waitlist, s.seed),
    )
  })

  it('walks candidates in ranked order', () => {
    const s = fresh()
    const slot = firstBooked(s)
    const ranked = rankCandidates(s.waitlist, slot)
    const res = resolveFill(slot, s.waitlist, s.seed)
    // attempts must be a prefix of the ranked order
    res.attempts.forEach((a, i) => expect(a.candidateId).toBe(ranked[i].id))
  })

  it('the filler is the first willTake candidate, and only that one accepts', () => {
    const s = fresh()
    const slot = firstBooked(s)
    const ranked = rankCandidates(s.waitlist, slot)
    const firstTaker = ranked.find((c) => c.willTake)
    const res = resolveFill(slot, s.waitlist, s.seed)
    if (firstTaker) {
      expect(res.filled).toBe(true)
      expect(res.filledBy?.id).toBe(firstTaker.id)
      expect(res.attempts.filter((a) => a.accepted)).toHaveLength(1)
      expect(res.attempts[res.attempts.length - 1].candidateId).toBe(firstTaker.id)
    } else {
      expect(res.filled).toBe(false)
    }
  })

  it('recoveredCents == price iff filled, else 0', () => {
    const s = fresh()
    const slot = firstBooked(s)
    const res = resolveFill(slot, s.waitlist, s.seed)
    expect(res.recoveredCents).toBe(res.filled ? slot.priceCents : 0)
  })

  it('with no willing candidates, the slot cannot be filled', () => {
    const s = fresh()
    const slot = firstBooked(s)
    const allDecline = s.waitlist.map((c) => ({ ...c, willTake: false }))
    const res = resolveFill(slot, allDecline, s.seed)
    expect(res.filled).toBe(false)
    expect(res.recoveredCents).toBe(0)
    expect(res.attempts).toHaveLength(allDecline.length)
  })
})

describe('Invariant 4 — applyFill: saved/lost transitions, no input mutation', () => {
  it('fills a freed, fillable slot → saved, recovered += price, count +1', () => {
    const base = fresh()
    const slot = firstBooked(base)
    const opened = openSlot(base, slot.id)
    const after = applyFill(opened, slot.id)
    const target = after.slots.find((x) => x.id === slot.id)!
    // This seed stages candidate #2 to accept, so the slot fills.
    expect(target.status).toBe('saved')
    expect(after.recoveredThisMonthCents).toBe(slot.priceCents)
    expect(after.recoveredCount).toBe(1)
  })

  it('an unfillable slot → lost, recovered/count unchanged', () => {
    const base = fresh()
    const slot = firstBooked(base)
    const opened = openSlot(base, slot.id)
    const noTakers: Store = { ...opened, waitlist: opened.waitlist.map((c) => ({ ...c, willTake: false })) }
    const after = applyFill(noTakers, slot.id)
    const target = after.slots.find((x) => x.id === slot.id)!
    expect(target.status).toBe('lost')
    expect(after.recoveredThisMonthCents).toBe(0)
    expect(after.recoveredCount).toBe(0)
  })

  it('does not mutate the input store', () => {
    const base = fresh()
    const slot = firstBooked(base)
    const opened = openSlot(base, slot.id)
    const snapshot = JSON.stringify(opened)
    applyFill(opened, slot.id)
    expect(JSON.stringify(opened)).toBe(snapshot)
  })
})

describe('Invariant 5 — fastForward projection', () => {
  it('days=0 → all zeros', () => {
    expect(fastForward(fresh(), 0)).toEqual({ recoveredCents: 0, saves: 0, lost: 0, cancellations: 0 })
  })

  it('is monotonic non-decreasing in days', () => {
    const s = fresh()
    const d7 = fastForward(s, 7)
    const d30 = fastForward(s, 30)
    expect(d30.recoveredCents).toBeGreaterThanOrEqual(d7.recoveredCents)
    expect(d30.saves).toBeGreaterThanOrEqual(d7.saves)
    expect(d30.cancellations).toBeGreaterThanOrEqual(d7.cancellations)
  })

  it('recoveredCents reconciles with saves × average slot value', () => {
    const s = fresh()
    const r = fastForward(s, 30)
    expect(r.recoveredCents).toBe(r.saves * averageSlotPriceCents(s))
    expect(r.saves + r.lost).toBe(r.cancellations)
  })

  it('is deterministic', () => {
    expect(fastForward(fresh(), 30)).toEqual(fastForward(fresh(), 30))
  })
})

describe('Invariant 6 — re-resolving a settled slot is a no-op', () => {
  it('applyFill on an already-saved slot changes nothing', () => {
    const base = fresh()
    const slot = firstBooked(base)
    const opened = openSlot(base, slot.id)
    const once = applyFill(opened, slot.id)
    const twice = applyFill(once, slot.id)
    expect(twice).toEqual(once)
  })

  it('openSlot on an already-open slot is a no-op', () => {
    const base = fresh()
    const slot = firstBooked(base)
    const opened = openSlot(base, slot.id)
    const again = openSlot(opened, slot.id)
    expect(again).toEqual(opened)
  })
})

describe('Formatting helpers (display edge only)', () => {
  it('formats integer cents as EUR', () => {
    expect(formatEur(6200)).toBe('62,00 €')
    expect(formatEur(6200, { whole: true })).toBe('62 €')
  })

  it('formats minutes as HH:MM', () => {
    expect(formatTime(14 * 60)).toBe('14:00')
    expect(formatTime(9 * 60 + 5)).toBe('09:05')
  })
})
