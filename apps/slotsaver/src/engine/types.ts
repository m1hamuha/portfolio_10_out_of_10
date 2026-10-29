// SlotSaver deterministic engine — framework-free, integer CENTS everywhere.
// Money is NEVER a float in here; format only at the display edge (money.ts).
// The engine never reads Date.now(): the clock is injected (clockMs).

export type SlotStatus = 'booked' | 'open' | 'filling' | 'saved' | 'lost'

/** A chair-time appointment on the day's schedule. */
export interface Slot {
  id: string
  time: string // "14:00", local salon time, deterministic
  minutes: number // minutes-from-midnight, for sorting/layout
  staff: string // stylist name
  service: string // e.g. "Colour & gloss"
  priceCents: number // integer cents, always > 0
  status: SlotStatus
  clientName?: string // present while booked/filling/saved
}

export interface ScoreBreakdown {
  serviceMatch: number // max 40
  availabilityFit: number // max 25
  historicalLtv: number // max 20
  responseSpeed: number // max 15
  total: number // sum 0..100
  serviceMatchDetails: string
  availabilityDetails: string
  ltvDetails: string
  responseSpeedDetails: string
}

/** A consented client on the waitlist, ready to take a freed slot. */
export interface Candidate {
  id: string
  name: string
  wantsService: string // the service they're waiting for
  fitScore: number // 0..100 — service match + flexibility + loyalty + response history
  willTake: boolean // seeded response: would this person accept the offer?
  // Human-readable fit breakdown (purely descriptive; does not affect ranking).
  loyalty: 'New' | 'Regular' | 'VIP'
  flexibility: 'Low' | 'Medium' | 'High'
  historicalLtvCents?: number // integer cents, e.g. 1450_00
  avgResponseMinutes?: number // average time in minutes to respond to offers
  scoreBreakdown?: ScoreBreakdown
}

export type EventType =
  | 'cancellation_detected'
  | 'slot_opened'
  | 'candidates_ranked'
  | 'sms_dispatched'
  | 'webhook_sent'
  | 'webhook_fallback'
  | 'slot_claimed'
  | 'revenue_recovered'

export interface EventLogEntry {
  id: string
  timestamp: string // "HH:mm:ss.SSS"
  type: EventType
  title: string
  detail: string
  payload?: Record<string, unknown>
  severity?: 'info' | 'success' | 'warn' | 'error'
}

/** One step of the cascade: an offer sent to a candidate and what happened. */
export interface FillAttempt {
  candidateId: string
  name: string
  responded: boolean // did they reply at all before the offer expired?
  accepted: boolean // did they take the slot? (only the first accepter is true)
}

/** The deterministic outcome of trying to refill a freed slot. */
export interface FillResult {
  slotId: string
  filled: boolean
  filledBy?: Candidate
  attempts: FillAttempt[] // the ranked walk the UI animates
  recoveredCents: number // == slot.priceCents iff filled, else 0
}

/** The whole demo's deterministic state snapshot. */
export interface Store {
  seed: number
  clockMs: number // injected wall-clock base (engine never reads Date.now())
  salonName: string
  slots: Slot[]
  waitlist: Candidate[]
  recoveredThisMonthCents: number
  recoveredCount: number
  cancellationsToday: number
  fillRatePct: number // honest realized fill rate, e.g. 68
}
