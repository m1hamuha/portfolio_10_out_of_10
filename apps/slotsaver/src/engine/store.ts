import type { Candidate, Slot, Store } from './types'
import { mulberry32, type Rng } from './prng'

// ---------------------------------------------------------------------------
// Deterministic data generation for "Lumière Studio", a fictional EU salon.
// Everything below is a pure function of (seed, clockMs). No Date.now(), no
// Math.random() — feeding the same inputs always yields the same Store.
// Money is integer CENTS; every slot has a positive € value.
// ---------------------------------------------------------------------------

const SALON_NAME = 'Lumière Studio'

// The honest, realized fill rate we advertise (NOT 100%). Some gaps don't fill.
export const FILL_RATE_PCT = 68

interface ServiceDef {
  name: string
  priceCents: number
  minutes: number // duration, drives layout height
}

// Catalogue of services with their list prices (cents) and durations (min).
const SERVICES: ServiceDef[] = [
  { name: 'Colour & gloss', priceCents: 124_00, minutes: 90 },
  { name: 'Balayage', priceCents: 168_00, minutes: 120 },
  { name: 'Cut & finish', priceCents: 62_00, minutes: 60 },
  { name: 'Root retouch', priceCents: 78_00, minutes: 75 },
  { name: 'Keratin treatment', priceCents: 145_00, minutes: 105 },
  { name: 'Blow-dry & style', priceCents: 42_00, minutes: 45 },
  { name: 'Toner refresh', priceCents: 54_00, minutes: 45 },
]

const STAFF = ['Camille', 'Anaïs', 'Léo'] as const

// Client names for booked appointments (deterministic pool).
const CLIENTS = [
  'Sofia M.', 'Hannah R.', 'Émilie D.', 'Greta B.', 'Lena K.',
  'Yuki T.', 'Marta P.', 'Chloé V.', 'Nora S.', 'Inès F.',
  'Paula G.', 'Mireille A.', 'Juno W.', 'Elsa N.',
]

// Waitlist client names (separate pool so they read as "waiting", not booked).
const WAITERS = [
  { name: 'Amélie L.', loyalty: 'VIP' as const },
  { name: 'Théo R.', loyalty: 'Regular' as const },
  { name: 'Bea K.', loyalty: 'Regular' as const },
  { name: 'Noémie C.', loyalty: 'New' as const },
  { name: 'Linh P.', loyalty: 'VIP' as const },
  { name: 'Oskar H.', loyalty: 'Regular' as const },
]

function svcByName(name: string): ServiceDef {
  return SERVICES.find((s) => s.name === name) ?? SERVICES[0]
}

// Fixed daily grid the salon works to: 10:00 → 17:30 in 30-min anchor rows.
const DAY_START_MIN = 10 * 60 // 10:00
const ROW_STEP_MIN = 30

function buildSlots(rng: Rng): Slot[] {
  const slots: Slot[] = []
  let clientIdx = 0
  // Per stylist, lay a deterministic column of appointments down the day.
  STAFF.forEach((staff, col) => {
    let cursor = DAY_START_MIN // all columns share the day start
    let n = 0
    while (cursor < 17 * 60 + 30 && n < 5) {
      const svc = SERVICES[Math.floor(rng() * SERVICES.length)]
      // ~22% of slots start open (a realistic salon has gaps); the rest booked.
      const isOpen = rng() < 0.22 && n > 0
      const id = `S-${col + 1}-${n + 1}`
      const slot: Slot = {
        id,
        time: minToHHMM(cursor),
        minutes: cursor,
        staff,
        service: svc.name,
        priceCents: svc.priceCents,
        status: isOpen ? 'open' : 'booked',
        clientName: isOpen ? undefined : CLIENTS[clientIdx++ % CLIENTS.length],
      }
      slots.push(slot)
      // Advance the cursor by the service duration, snapped up to the next row.
      const dur = Math.max(ROW_STEP_MIN, Math.ceil(svc.minutes / ROW_STEP_MIN) * ROW_STEP_MIN)
      cursor += dur
      n++
    }
  })
  return slots
}

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function buildWaitlist(rng: Rng): Candidate[] {
  return WAITERS.map((w, i) => {
    const wantsService = SERVICES[Math.floor(rng() * SERVICES.length)].name
    // fitScore is a deterministic blend in 40..98, stable per seed.
    const base = 96 - i * 9
    const jitter = Math.floor(rng() * 7) - 3
    const fitScore = Math.max(40, Math.min(98, base + jitter))
    const flexPool = ['Low', 'Medium', 'High'] as const
    const flexibility = flexPool[Math.floor(rng() * flexPool.length)]
    // Seeded response: the top candidate is staged to NOT take it (so the demo
    // cascades), the next reliably accepts. Remaining vary deterministically.
    let willTake: boolean
    if (i === 0) willTake = false
    else if (i === 1) willTake = true
    else willTake = rng() < 0.55
    const ltvCents =
      w.loyalty === 'VIP' ? 1450_00 + i * 50_00 : w.loyalty === 'Regular' ? 620_00 + i * 30_00 : 150_00
    const avgResponseMinutes =
      w.loyalty === 'VIP' ? 1.5 + (i % 2) * 0.4 : w.loyalty === 'Regular' ? 3.2 + (i % 3) * 0.5 : 7.8
    return {
      id: `W-${i + 1}`,
      name: w.name,
      wantsService,
      fitScore,
      willTake,
      loyalty: w.loyalty,
      flexibility,
      historicalLtvCents: ltvCents,
      avgResponseMinutes,
    }
  })
}

/**
 * Choose the flagship "Simulate a cancellation" slot deterministically.
 * Preference: a mid-day, high-value, currently-booked colour slot — that's the
 * appointment whose loss stings most, and the one the SPEC narrative features.
 */
export function pickDemoSlotId(slots: Slot[]): string {
  const booked = slots.filter((s) => s.status === 'booked')
  const colour = booked
    .filter((s) => /colour|balayage|root|keratin/i.test(s.service))
    .sort((a, b) => b.priceCents - a.priceCents)
  const chosen = colour[0] ?? booked[0] ?? slots[0]
  return chosen.id
}

/**
 * Build the full deterministic Store for a (seed, clockMs).
 * Guarantees: ≥1 day of slots with positive € values; ≥3 waitlist candidates;
 * all money in integer cents; identical output for identical inputs.
 */
export function generateStore(seed: number, clockMs: number): Store {
  const rng = mulberry32(seed)
  const slots = buildSlots(rng)
  const waitlist = buildWaitlist(rng)
  const cancellationsToday = 1 + Math.floor(rng() * 3) // 1..3
  return {
    seed,
    clockMs,
    salonName: SALON_NAME,
    slots,
    waitlist,
    recoveredThisMonthCents: 0,
    recoveredCount: 0,
    cancellationsToday,
    fillRatePct: FILL_RATE_PCT,
  }
}

export { SERVICES, STAFF, svcByName }
