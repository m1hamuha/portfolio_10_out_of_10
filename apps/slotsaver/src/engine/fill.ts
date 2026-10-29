import type { Candidate, FillAttempt, FillResult, Slot, Store } from './types'
import { mulberry32 } from './prng'
import { calculateScoreBreakdown } from './priorityQueue'

// ---------------------------------------------------------------------------
// The cascade engine. Pure & deterministic: the engine DECIDES the outcome;
// the UI merely animates the recorded `attempts` walk. No mutation, no clock.
// ---------------------------------------------------------------------------

/**
 * Rank a waitlist for a given slot by fitScore descending.
 * Stable (ties keep input order) and lossless (same set out as in).
 */
export function rankCandidates(waitlist: Candidate[], slot: Slot): Candidate[] {
  return waitlist
    .map((c, i) => ({
      c: {
        ...c,
        scoreBreakdown: calculateScoreBreakdown(c, slot),
      },
      i,
    }))
    .sort((a, b) => b.c.fitScore - a.c.fitScore || a.i - b.i)
    .map(({ c }) => c)
}

/**
 * Walk the ranked candidates and decide who fills the freed slot.
 *  - Each step records whether the candidate responded and accepted.
 *  - The FIRST candidate whose seeded `willTake` is true fills the slot.
 *  - recoveredCents == slot.priceCents iff filled, else 0.
 * Deterministic for a given (slot, waitlist, seed).
 */
export function resolveFill(slot: Slot, waitlist: Candidate[], seed: number): FillResult {
  const ranked = rankCandidates(waitlist, slot)
  // The seed perturbs "responded" (a non-taker may still reply "Not today"),
  // purely cosmetic — acceptance is governed by willTake so the walk is stable.
  const rng = mulberry32(seed ^ hashId(slot.id))
  const attempts: FillAttempt[] = []
  let filledBy: Candidate | undefined

  for (const c of ranked) {
    const accepted = c.willTake
    // If they accept, they obviously responded. Otherwise it's a seeded
    // "declined" vs "timed out" flavour — both end the offer for that person.
    const responded = accepted ? true : rng() < 0.5
    attempts.push({ candidateId: c.id, name: c.name, responded, accepted })
    if (accepted) {
      filledBy = c
      break
    }
  }

  const filled = !!filledBy
  return {
    slotId: slot.id,
    filled,
    filledBy,
    attempts,
    recoveredCents: filled ? slot.priceCents : 0,
  }
}

/**
 * Run resolveFill against a slot in the store and return a NEW store.
 *  - filled  → slot.status = 'saved', recovered += price, count += 1
 *  - unfilled→ slot.status = 'lost', totals unchanged
 *  - already-resolved slot ('saved'/'lost') → no-op (returns a clone)
 * The input store is never mutated.
 */
export function applyFill(store: Store, slotId: string): Store {
  const next = cloneStore(store)
  const slot = next.slots.find((s) => s.id === slotId)
  if (!slot) return next
  // Re-cancelling/refilling an already-resolved slot is a no-op.
  if (slot.status === 'saved' || slot.status === 'lost') return next

  const result = resolveFill(slot, next.waitlist, next.seed)
  if (result.filled && result.filledBy) {
    slot.status = 'saved'
    slot.clientName = result.filledBy.name
    next.recoveredThisMonthCents += result.recoveredCents
    next.recoveredCount += 1
  } else {
    slot.status = 'lost'
    slot.clientName = undefined
  }
  return next
}

/**
 * Mark a booked slot as freed ('open') so the cascade can run on it.
 * Pure. No-op on slots that are already resolved or already open.
 * Note: `cancellationsToday` is the seeded daily BASELINE that drives the
 * month projection — it is intentionally NOT bumped here, so fastForward stays
 * stable and believable no matter how many demo cancellations the user runs.
 */
export function openSlot(store: Store, slotId: string): Store {
  const next = cloneStore(store)
  const slot = next.slots.find((s) => s.id === slotId)
  if (!slot) return next
  if (slot.status !== 'booked') return next
  slot.status = 'open'
  slot.clientName = undefined
  return next
}

export interface FastForwardResult {
  recoveredCents: number
  saves: number
  lost: number
  cancellations: number
}

/**
 * Project a month of cancellations + fills from the seeded distribution and the
 * store's realized fill rate. Deterministic; zeros at days=0; monotonic
 * non-decreasing in days; recoveredCents consistent with saves × avg slot value.
 */
export function fastForward(store: Store, days: number): FastForwardResult {
  if (days <= 0) return { recoveredCents: 0, saves: 0, lost: 0, cancellations: 0 }

  const avgPriceCents = averageSlotPriceCents(store)
  const rng = mulberry32(store.seed ^ 0x5f3759df)
  let cancellations = 0
  let saves = 0
  let recoveredCents = 0

  for (let d = 0; d < days; d++) {
    // Deterministic daily cancellations in 0..3 around the seeded baseline.
    const todays = Math.round(store.cancellationsToday * (0.6 + rng() * 0.9))
    for (let c = 0; c < todays; c++) {
      cancellations++
      // A cancellation fills iff it lands under the honest fill rate.
      if (rng() * 100 < store.fillRatePct) {
        saves++
        recoveredCents += avgPriceCents
      }
    }
  }
  return { recoveredCents, saves, lost: cancellations - saves, cancellations }
}

/** Mean of all slot prices in the store (integer cents, rounded). */
export function averageSlotPriceCents(store: Store): number {
  if (store.slots.length === 0) return 0
  const sum = store.slots.reduce((a, s) => a + s.priceCents, 0)
  return Math.round(sum / store.slots.length)
}

// --- internals -------------------------------------------------------------

function cloneStore(store: Store): Store {
  return {
    ...store,
    slots: store.slots.map((s) => ({ ...s })),
    waitlist: store.waitlist.map((c) => ({ ...c })),
  }
}

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
