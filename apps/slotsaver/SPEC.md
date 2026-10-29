# SlotSaver — Specification

> **One-liner:** A salon/clinic cancellation just cost you €62 — watch SlotSaver auto-refill the empty slot from your waitlist in ~15 seconds while you do nothing, and ping the owner "slot saved, +€62".

Portfolio demo #3 of an automation studio selling to **European SMBs**. English UI, EUR, GDPR-aware. Self-contained, deterministic mock data. Spec-first, engine built test-first (TDD).

---

## 1. Purpose & audience
**Target client (Europe):** appointment-based local services — hair & beauty salons, barbershops, nail/brow studios, dental & aesthetic clinics, physio, tattoo. 1–6 chairs/rooms. Owner-operator. Same engine re-skins for dental/auto/fitness, but the demo is staged as a **premium hair & beauty studio** ("Lumière Studio", a fictional EU salon) because no-show/cancellation pain is worst there (15–30%).

**Pain:** last-minute cancellations & no-shows leave paid-for chair time empty = pure lost revenue. Filling a gap manually means phoning around — nobody has time mid-shift.

**Wow:** the 15-second choreography — cancel a high-value slot expecting to lose the money, then watch the waitlist cascade auto-fill it and the owner's phone light up "+€62 saved". Reframes automation from "software to learn" to "money found while I did nothing". A **"Fast-forward 30 days"** control rolls up cumulative recovered revenue that dwarfs a freelancer's fee ("pays for itself in 2 bookings").

## 2. The demo experience (happy path)
Split screen. **Left:** today's schedule — columns per stylist, time rows, each appointment a card with client, service, and € value; colour-coded (booked / open / filling / saved). A **"Simulate a cancellation"** button (or click a booked slot → Cancel). **Right:** the owner's phone mock (Telegram/WhatsApp style) + a "Recovered this month" counter.

Flow on cancel:
1. The slot flashes red → **"Opened — €62 at risk"**.
2. SlotSaver ranks the **waitlist** (3+ candidates) by a **fit-score** (service match, flexibility, loyalty, response history) — show the ranked list briefly.
3. An outbound message bubble goes to **candidate #1** with **"Take it / Not today"** + a **10-min countdown**.
4. #1 doesn't respond (seeded) → countdown expires → **auto-cascade to #2** → #2 taps **"Take it"**.
5. Slot turns **green "Booked"**; owner's phone gets **"🟢 14:00 colour slot saved. +€62 recovered."**; **"Recovered this month"** ticks up.
6. **"Fast-forward 30 days"** → simulates a month of cancellations + fills → cumulative recovered € + an ROI line ("≈ €X/mo · pays for a retainer in 2 saves").
7. Honesty line: *"Demo on sample data. In production this uses your booking system + a consented waitlist (GDPR). Realistic fill rate is shown, not 100% — some gaps won't fill, and that's honest."* Include a small "fill rate: ~68%" stat so a skeptic isn't misled.

## 3. Deterministic engine (TDD first — `src/engine/`, framework-free, integer cents)
### Types
```
SlotStatus = 'booked'|'open'|'filling'|'saved'|'lost'
Slot { id; time; staff; service; priceCents; status; clientName? }
Candidate { id; name; wantsService; fitScore /*0..100*/; willTake: boolean /*seeded response*/ }
FillAttempt { candidateId; name; responded: boolean; accepted: boolean }
FillResult { slotId; filled: boolean; filledBy?: Candidate; attempts: FillAttempt[]; recoveredCents: number }
Store { seed; clockMs; salonName; slots: Slot[]; waitlist: Candidate[];
        recoveredThisMonthCents; recoveredCount; cancellationsToday; fillRatePct }
```
### Functions (pure)
- `generateStore(seed, clockMs): Store` — seeded schedule (deterministic) + waitlist.
- `rankCandidates(waitlist, slot): Candidate[]` — sort by fitScore desc (deterministic, stable).
- `resolveFill(slot, waitlist, seed): FillResult` — deterministic cascade: walk ranked candidates; each `willTake` (seeded) decides; first accepter fills it (`recoveredCents = slot.priceCents`); if none, `filled:false, recoveredCents:0`. `attempts` records the walk (the UI animates these steps; the engine decides the outcome).
- `applyFill(store, slotId): Store` — runs resolveFill; if filled → slot.status `saved`, `recoveredThisMonthCents += price`, `recoveredCount+1`; else slot.status `lost`. Pure (clone).
- `fastForward(store, days): { recoveredCents; saves; lost }` — deterministic month projection from the seeded cancel/fill distribution and current fill rate.
- `formatEur`, `formatTime`.

### Invariants the tests enforce (write tests FIRST)
1. `generateStore` deterministic; ≥1 day of slots with positive € values; ≥3 waitlist candidates; money integer cents.
2. `rankCandidates` returns fitScore-descending, stable, no dropped/added candidates.
3. `resolveFill` deterministic for a given (slot, waitlist, seed); `attempts` walk the ranked order; the filler is the first `willTake` candidate; `recoveredCents == price` iff filled else 0.
4. `applyFill` on a fillable slot → status `saved`, recovered += price, count +1; on an unfillable slot → status `lost`, recovered unchanged, count unchanged. Input not mutated.
5. `fastForward(_,0)` → zeros; monotonic non-decreasing in `days`; `recoveredCents` consistent with `saves` and average slot value.
6. Re-cancelling/refilling an already-resolved slot is a no-op.

## 4. Tech & layout (reuse the #1/#2 recipe)
- Vite + React + TS + Vitest; Zustand; hand-SVG (ROI line, counters); Framer Motion for the cascade choreography + phone bubbles + countdown, respecting `prefers-reduced-motion`.
- Build: `tsc --noEmit -p tsconfig.json && vite build`; `base: './'`; tsconfig has NO project refs. Under `react-jsx`, `import { type ReactNode } from 'react'` (no `React.ReactNode`).
- `src/engine/` pure + tested; `src/store/`; `src/components/` (Schedule, SlotCard, WaitlistRanker, PhoneMock + MessageBubble + Countdown, RecoveredCounter, FastForward/RoiLine, FillRateStat, DemoBanner, icons).

## 5. Design system (premium salon — WARM, distinct from #1/#2 dark UIs)
Deliberately the warm, elegant counterpoint to the two dark data UIs (portfolio range). Light mode.
- Background ivory `#FBF8F3`; cards white `#FFFFFF`; ink text `#2B2A28`; muted `#8A8479`.
- Accents: sage/emerald **`#5B8C7E`** (primary/booked-ok), warm gold **`#C9A227`** (highlight/value), soft terracotta **`#C2674E`** (cancellation/at-risk), success green for "saved".
- Borders hairline `#ECE6DB`; generous whitespace; soft shadows; rounded.
- Type: an elegant display serif for headings (e.g. **Fraunces** or **Cormorant**) + clean sans for body (**Inter** or **Fira Sans**); Fira Code/tabular for € figures. (Confirm via ui-ux-pro-max before finalizing.)
- Phone mock styled like a real chat. Calm, premium, "spa" feel — NOT a data dashboard.
- Effects: gentle slot colour transitions, message bubbles slide in, countdown ring; reduced-motion freezes. WCAG AA (mind gold-on-white contrast — darken gold for text), visible focus, keyboard-operable. SVG icons, no emoji-as-icon (emoji allowed inside the chat message text, which is realistic).

## 6. Acceptance criteria (MVP done)
- [ ] Engine invariant tests green (`vitest run`).
- [ ] Schedule with €-valued slots; "Simulate cancellation" triggers the cascade.
- [ ] Waitlist ranked; candidate #1 declines/times out → auto-cascade → #2 accepts → slot "saved"; owner phone notification; recovered counter ticks.
- [ ] Fast-forward 30 days → cumulative recovered + ROI line; honest fill-rate stat shown.
- [ ] Premium WARM light design (distinct from #1/#2), responsive 1440/1024, reduced-motion safe, SVG icons.
- [ ] Screenshot-QA passed; private GitHub repo pushed; README + SPEC committed; local⟷remote synced.
