import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { IconCalendar, IconLeaf, IconPhone, IconCheck, IconBolt } from './icons'

/* ============================================================================
   THE hero "wow": the SLOT-FLIP.
   A calendar cell reading red "13:00 · CANCELLED · €168" MORPHS (framer
   layoutId) into green "13:00 · REFILLED · €168" beside a PRE-POPULATED SMS
   conversation. Auto-cycles so the morph is the one confident animated moment.
   Reduced motion: rests on the REFILLED (resolved) state, never blank.
   ========================================================================== */

type FlipState = 'cancelled' | 'refilled'

// the pre-populated SMS thread (no "phone will light up here" placeholder)
const THREAD = [
  { kind: 'system', from: 'SlotSaver', text: 'Chair freed at 13:00 — Balayage. Texting your best match…', ts: '13:01' },
  { kind: 'offer', from: 'SlotSaver → Amélie L.', text: 'A Balayage just opened at 13:00 with Camille today. Want it? €168.', ts: '13:01' },
  { kind: 'accept', from: 'Amélie L.', text: "Yes please! Taking it 🙌 see you at 1.", ts: '13:04' },
  { kind: 'owner', from: 'SlotSaver', text: '🟢 13:00 Balayage saved — Amélie L. is booked in. +168 € recovered.', ts: '13:04' },
] as const

export function HeroVisual() {
  const reduced = useStore((s) => s.reducedMotion)
  const [flip, setFlip] = useState<FlipState>(reduced ? 'refilled' : 'cancelled')

  // auto-cycle the morph: cancelled → (1.6s) → refilled → (3.4s) → repeat
  useEffect(() => {
    if (reduced) {
      setFlip('refilled')
      return
    }
    let t: ReturnType<typeof setTimeout>
    const tick = (next: FlipState) => {
      setFlip(next)
      t = setTimeout(() => tick(next === 'cancelled' ? 'refilled' : 'cancelled'), next === 'cancelled' ? 1700 : 3600)
    }
    t = setTimeout(() => tick('refilled'), 1700)
    return () => clearTimeout(t)
  }, [reduced])

  return (
    <div className="hero-visual">
      {/* mini agenda board with the flip cell */}
      <div className="board card">
        <div className="board-head">
          <span className="ico"><IconCalendar size={18} /></span>
          <div>
            <h2>Today · Lumière Studio</h2>
            <span className="sub">Camille · Thu 19 Jun</span>
          </div>
        </div>

        <div className="board-rows">
          <div className="cell cell-booked">
            <span className="cell-time">11:30</span>
            <div className="cell-main">
              <div className="cell-svc">Cut &amp; finish</div>
              <div className="cell-who">Sofia M.</div>
            </div>
            <span className="cell-price">62 €</span>
          </div>

          {/* THE flip cell — morphs between states via layoutId */}
          <AnimatePresence mode="wait" initial={false}>
            {flip === 'cancelled' ? (
              <motion.div
                key="cancelled"
                layoutId="flip-cell"
                className="cell flip-cell flip-cancelled"
                initial={reduced ? false : { opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="cell-time">13:00</span>
                <div className="cell-main">
                  <div className="cell-svc">Balayage</div>
                  <div className="cell-who">Greta B. cancelled · 168 €</div>
                </div>
                <span className="cell-tag">Cancelled</span>
              </motion.div>
            ) : (
              <motion.div
                key="refilled"
                layoutId="flip-cell"
                className="cell flip-cell flip-refilled"
                initial={reduced ? false : { opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="cell-time">13:00</span>
                <div className="cell-main">
                  <div className="cell-svc">Balayage</div>
                  <div className="cell-who">Amélie L. · +168 €</div>
                </div>
                <span className="cell-tag">Refilled</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="cell cell-booked">
            <span className="cell-time">15:30</span>
            <div className="cell-main">
              <div className="cell-svc">Root retouch</div>
              <div className="cell-who">Hannah R.</div>
            </div>
            <span className="cell-price">78 €</span>
          </div>
        </div>

        <div className="board-foot">
          <IconBolt size={14} className="pillico" /> You did nothing — SlotSaver texted the waitlist and refilled it.
        </div>
      </div>

      {/* pre-populated SMS / phone */}
      <div className="phone-wrap">
        <div className="phone" role="img" aria-label="A pre-populated SlotSaver conversation: a cancelled Balayage at 13:00 was offered to Amélie L., who accepted, and the owner was notified +168 € recovered.">
          <div className="phone-notch" />
          <header className="phone-header">
            <span className="phone-avatar"><IconLeaf size={16} /></span>
            <div className="phone-title">
              <span className="phone-name">Lumière Studio</span>
              <span className="phone-status"><span className="phone-dot" /> SlotSaver assistant</span>
            </div>
            <span className="phone-call"><IconPhone size={15} /></span>
          </header>

          <div className="phone-body">
            {THREAD.map((m, i) => {
              const mine = m.kind === 'accept'
              const align = mine ? 'right' : 'left'
              return (
                <motion.div
                  key={i}
                  className={`bubble-row bubble-${align} bubble-${m.kind}`}
                  initial={reduced ? false : { opacity: 0.001, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : i * 0.12 }}
                >
                  <div className="bubble">
                    {!mine && <div className="bubble-from">{m.from}</div>}
                    <div className="bubble-text">{m.text}</div>
                    <div className="bubble-meta">
                      <span className="bubble-ts num">{m.ts}</span>
                      {mine && <IconCheck size={12} className="bubble-read" />}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="phone-input" aria-hidden="true">
            <span className="phone-input-box">Message…</span>
          </div>
        </div>
      </div>
    </div>
  )
}
