import { create } from 'zustand'
import {
  generateStore,
  pickDemoSlotId,
  rankCandidates,
  resolveFill,
  applyFill,
  openSlot,
  defaultDispatcher,
  formatTimestampMs,
  type Candidate,
  type FillAttempt,
  type Slot,
  type Store,
  type EventLogEntry,
} from '../engine'

// Deterministic wall-clock base for the demo (engine never reads Date.now()).
const BASE_MS = Date.UTC(2026, 5, 19, 9, 14, 0)
const SEED = 42

// The cascade is a phased timeline. The ENGINE decides the outcome up front;
// these phases just choreograph the reveal so the human can follow it.
export type Phase =
  | 'idle' // schedule shown, nothing happening
  | 'opening' // slot just freed → flashes red "Opened — €X at risk"
  | 'ranking' // waitlist sorted, ranked list shown
  | 'offering' // offer bubble sent to current candidate, countdown ticking
  | 'expired' // current candidate declined / timed out → about to cascade
  | 'saved' // a candidate accepted → slot green, owner notified
  | 'lost' // nobody took it → slot lost (honest outcome)

export interface ChatMessage {
  id: string
  kind: 'offer' | 'decline' | 'accept' | 'owner' | 'system'
  from: string
  text: string
  ts: string // "14:02"
}

interface AppState {
  store: Store
  demoSlotId: string
  phase: Phase
  reducedMotion: boolean

  // cascade working state
  ranked: Candidate[]
  attempts: FillAttempt[] // the engine's full walk for the active slot
  stepIndex: number // which attempt the choreography is on
  countdown: number // seconds left on the current offer (0..COUNTDOWN_SECONDS)
  chat: ChatMessage[]
  lastRecoveredCents: number // amount recovered by the last successful save

  // owner phone
  ownerToast: ChatMessage | null

  // operational event log & modal
  events: EventLogEntry[]
  selectedCandidateForModal: Candidate | null
  isScoreModalOpen: boolean

  // derived running totals mirror the engine store after applyFill
  selectSlot: (id: string) => void
  simulateCancellation: () => void
  setReducedMotion: (v: boolean) => void
  reset: () => void

  addEvent: (entry: Omit<EventLogEntry, 'id' | 'timestamp'>) => void
  clearEvents: () => void
  openScoreModal: (candidate: Candidate) => void
  closeScoreModal: () => void

  // choreography hooks (called by App's timeline effect)
  advanceCascade: () => void
  tickCountdown: () => void
  finalize: () => void
}

const COUNTDOWN_SECONDS = 10 // the "10-minute" offer, compressed to 10s for demo

let msgSeq = 0
const mkMsg = (m: Omit<ChatMessage, 'id'>): ChatMessage => ({ ...m, id: `m${msgSeq++}` })

function fmtClock(extraMin: number): string {
  const base = new Date(BASE_MS + (5 * 60 + extraMin) * 60_000) // demo "now" ≈ 14:0x
  return `${String(base.getUTCHours()).padStart(2, '0')}:${String(base.getUTCMinutes()).padStart(2, '0')}`
}

// A believable month-to-date baseline so the demo lands PRE-POPULATED — nothing
// ever reads €0. This is a display-layer seed only; the deterministic engine
// (generateStore) still starts at 0, so every engine test stays green. Demo
// saves accumulate ON TOP of this baseline.
const BASELINE_RECOVERED_CENTS = 2140_00
const BASELINE_RECOVERED_COUNT = 14

function freshStore(): Store {
  const s = generateStore(SEED, BASE_MS)
  // Pre-load the month-to-date totals at the app layer (engine untouched).
  return {
    ...s,
    recoveredThisMonthCents: BASELINE_RECOVERED_CENTS,
    recoveredCount: BASELINE_RECOVERED_COUNT,
  }
}

export const useStore = create<AppState>((set, get) => {
  const initial = freshStore()
  return {
    store: initial,
    demoSlotId: pickDemoSlotId(initial.slots),
    phase: 'idle',
    reducedMotion: false,
    ranked: [],
    attempts: [],
    stepIndex: 0,
    countdown: COUNTDOWN_SECONDS,
    chat: [],
    lastRecoveredCents: 0,
    ownerToast: null,
    events: [],
    selectedCandidateForModal: null,
    isScoreModalOpen: false,

    addEvent: (entry) => {
      const newEntry: EventLogEntry = {
        ...entry,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatTimestampMs(),
      }
      set((s) => ({ events: [newEntry, ...s.events] }))
    },
    clearEvents: () => set({ events: [] }),
    openScoreModal: (candidate) => set({ selectedCandidateForModal: candidate, isScoreModalOpen: true }),
    closeScoreModal: () => set({ selectedCandidateForModal: null, isScoreModalOpen: false }),

    setReducedMotion: (v) => set({ reducedMotion: v }),

    selectSlot: (id) => {
      if (get().phase !== 'idle') return
      const slot = get().store.slots.find((s) => s.id === id)
      if (slot && slot.status === 'booked') set({ demoSlotId: id })
    },

    simulateCancellation: () => {
      const st = get()
      if (st.phase !== 'idle') return
      const slot = st.store.slots.find((s) => s.id === st.demoSlotId)
      if (!slot || slot.status !== 'booked') return

      // Engine: free the slot, then pre-compute the deterministic outcome.
      const openedStore = openSlot(st.store, slot.id)
      const openedSlot = openedStore.slots.find((s) => s.id === slot.id)!
      const ranked = rankCandidates(openedStore.waitlist, openedSlot)
      const result = resolveFill(openedSlot, openedStore.waitlist, openedStore.seed)

      get().addEvent({
        type: 'cancellation_detected',
        title: `Cancellation: ${slot.service}`,
        detail: `Slot at ${slot.time} freed up (€${slot.priceCents / 100} at risk). Dispatching n8n webhook…`,
        payload: { slotId: slot.id, priceCents: slot.priceCents, time: slot.time, staff: slot.staff },
        severity: 'warn',
      })

      defaultDispatcher
        .dispatch('cancellation_detected', st.store.salonName, slot)
        .then((res) => {
          get().addEvent({
            type: res.simulated ? 'webhook_fallback' : 'webhook_sent',
            title: res.simulated ? 'n8n Fallback Simulation' : 'n8n Webhook Dispatched',
            detail: `Processed in ${res.durationMs}ms via ${res.endpoint}`,
            payload: res.payload as unknown as Record<string, unknown>,
            severity: 'info',
          })
        })

      set({
        store: openedStore,
        phase: 'opening',
        ranked,
        attempts: result.attempts,
        stepIndex: 0,
        countdown: COUNTDOWN_SECONDS,
        chat: [
          mkMsg({
            kind: 'system',
            from: 'SlotSaver',
            text: `Chair freed at ${openedSlot.time} — ${openedSlot.service}. Finding a match…`,
            ts: fmtClock(0),
          }),
        ],
      })

      // Reduced motion: skip straight to the resolved outcome.
      if (st.reducedMotion) {
        get().finalize()
      }
    },

    // Move the choreography to the next attempt (called when a countdown expires
    // or when ranking finishes). Sends the offer bubble for the current step.
    advanceCascade: () => {
      const st = get()
      const { attempts, stepIndex, phase } = st
      if (phase === 'saved' || phase === 'lost') return

      const current = attempts[stepIndex]
      if (!current) {
        get().finalize()
        return
      }

      const cand = st.ranked.find((c) => c.id === current.candidateId)
      const name = cand?.name ?? current.name
      const chat = [...st.chat]

      if (stepIndex === 0) {
        get().addEvent({
          type: 'candidates_ranked',
          title: `Ranked waitlist: ${st.ranked.length} candidates`,
          detail: `Top match: ${cand?.name} (composite fit ${cand?.fitScore}/100, LTV €${Math.round((cand?.historicalLtvCents ?? 0) / 100)})`,
          payload: {
            topCandidate: cand?.name,
            score: cand?.fitScore,
            breakdown: cand?.scoreBreakdown as unknown as Record<string, unknown>,
          },
          severity: 'info',
        })
      }

      get().addEvent({
        type: 'sms_dispatched',
        title: `SMS offer sent to ${name}`,
        detail: `10-min countdown started for ${slotService(st)} at ${slotTime(st)}`,
        payload: {
          candidate: name,
          fitScore: cand?.fitScore,
          service: slotService(st),
          time: slotTime(st),
        },
        severity: 'warn',
      })

      const targetSlot = activeSlot(st)
      if (targetSlot) {
        defaultDispatcher.dispatch('sms_dispatched', st.store.salonName, targetSlot, cand, stepIndex)
      }

      // Offer the slot to the current candidate.
      chat.push(
        mkMsg({
          kind: 'offer',
          from: 'SlotSaver → ' + name,
          text: `A ${slotService(st)} just opened at ${slotTime(st)}. Want it? Reply within 10 min.`,
          ts: fmtClock(1 + stepIndex),
        }),
      )

      set({ phase: 'offering', chat, countdown: COUNTDOWN_SECONDS })
    },

    tickCountdown: () => {
      const st = get()
      if (st.phase !== 'offering') return
      const next = st.countdown - 1

      // The engine already decided this step's outcome.
      const current = st.attempts[st.stepIndex]
      if (current?.accepted) {
        // Accepter taps "Take it" partway through the countdown.
        if (next <= COUNTDOWN_SECONDS - 4) {
          const cand = st.ranked.find((c) => c.id === current.candidateId)
          const name = cand?.name ?? current.name
          const chat = [
            ...st.chat,
            mkMsg({ kind: 'accept', from: name, text: 'Yes! Taking it 🙌 see you soon', ts: fmtClock(2 + st.stepIndex) }),
          ]
          set({ chat, phase: 'saved' })
          get().finalize()
          return
        }
        set({ countdown: next })
        return
      }

      // Non-accepter: declines or times out partway, then we cascade.
      // (A decliner replies sooner; a no-show runs the offer closer to expiry.)
      const cutoff = current?.responded ? 5 : 2
      if (next <= cutoff) {
        const cand = st.ranked.find((c) => c.id === current?.candidateId)
        const name = cand?.name ?? current?.name ?? ''
        const responded = current?.responded
        const chat = [
          ...st.chat,
          responded
            ? mkMsg({ kind: 'decline', from: name, text: 'Not today, sorry — thanks though!', ts: fmtClock(2 + st.stepIndex) })
            : mkMsg({ kind: 'system', from: 'SlotSaver', text: `${name} didn't respond in time. Offering the next match…`, ts: fmtClock(2 + st.stepIndex) }),
        ]
        set({ chat, phase: 'expired', stepIndex: st.stepIndex + 1, countdown: COUNTDOWN_SECONDS })
        // hand back to advanceCascade for the next candidate
        setTimeout(() => get().advanceCascade(), 0)
        return
      }
      set({ countdown: next })
    },

    // Apply the engine outcome to the real store and emit the owner notification.
    finalize: () => {
      const st = get()
      if (st.phase === 'lost' || (st.phase === 'saved' && st.ownerToast)) return
      const next = applyFill(st.store, st.demoSlotId)
      const slot = next.slots.find((s) => s.id === st.demoSlotId)!
      const filled = slot.status === 'saved'

      if (filled) {
        const recovered = next.recoveredThisMonthCents - st.store.recoveredThisMonthCents
        const ownerMsg = mkMsg({
          kind: 'owner',
          from: 'SlotSaver',
          text: `🟢 ${slot.time} ${slot.service} saved — ${slot.clientName} is booked in. +${eur(recovered)} recovered.`,
          ts: fmtClock(3),
        })

        get().addEvent({
          type: 'slot_claimed',
          title: `Slot claimed by ${slot.clientName}`,
          detail: `Accepted offer. Calendar updated automatically.`,
          payload: { client: slot.clientName, time: slot.time, service: slot.service },
          severity: 'success',
        })
        get().addEvent({
          type: 'revenue_recovered',
          title: `+${eur(recovered)} recovered!`,
          detail: `Preserved chair time without manual phone calls.`,
          payload: { recoveredCents: recovered, totalMonthCents: next.recoveredThisMonthCents },
          severity: 'success',
        })

        defaultDispatcher.dispatch('slot_claimed', st.store.salonName, slot)

        set({
          store: next,
          phase: 'saved',
          lastRecoveredCents: recovered,
          ownerToast: ownerMsg,
          chat: [...st.chat, ownerMsg],
        })
      } else {
        set({
          store: next,
          phase: 'lost',
          chat: [
            ...st.chat,
            mkMsg({ kind: 'system', from: 'SlotSaver', text: 'No match took this one — it happens. (Realistic fill rate ≈ 68%.)', ts: fmtClock(3) }),
          ],
        })
      }
    },

    reset: () => {
      const s = freshStore()
      set({
        store: s,
        demoSlotId: pickDemoSlotId(s.slots),
        phase: 'idle',
        ranked: [],
        attempts: [],
        stepIndex: 0,
        countdown: COUNTDOWN_SECONDS,
        chat: [],
        lastRecoveredCents: 0,
        ownerToast: null,
      })
    },
  }
})

// --- small selectors used by the choreography text -------------------------
function activeSlot(st: AppState): Slot | undefined {
  return st.store.slots.find((s) => s.id === st.demoSlotId)
}
function slotService(st: AppState): string {
  return activeSlot(st)?.service ?? 'slot'
}
function slotTime(st: AppState): string {
  return activeSlot(st)?.time ?? ''
}
function eur(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100)
}

export { COUNTDOWN_SECONDS }
