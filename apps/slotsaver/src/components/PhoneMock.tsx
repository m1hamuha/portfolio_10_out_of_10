import { AnimatePresence, motion } from 'framer-motion'
import { useStore, COUNTDOWN_SECONDS, type ChatMessage } from '../store/useStore'
import { IconPhone, IconCheck, IconX, IconLeaf } from './icons'

// A real-feeling chat client (the client's phone, with the owner's notification
// arriving as a pinned banner). Bubbles slide in; the active offer carries a
// countdown ring; emoji INSIDE message text is allowed (it's realistic).

function Countdown({ seconds, max }: { seconds: number; max: number }) {
  const r = 15
  const c = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, seconds / max))
  const urgent = seconds <= 3
  return (
    <span className={`countdown ${urgent ? 'countdown-urgent' : ''}`} role="timer" aria-label={`${seconds} seconds left to respond`}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} className="cd-track" />
        <motion.circle
          cx="20" cy="20" r={r}
          className="cd-arc"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - frac) }}
          transition={{ duration: 0.9, ease: 'linear' }}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="cd-num num">{seconds}</span>
    </span>
  )
}

function Bubble({ m, showCountdown }: { m: ChatMessage; showCountdown: boolean }) {
  const seconds = useStore((s) => s.countdown)
  const reduced = useStore((s) => s.reducedMotion)
  const mine = m.kind === 'accept' || m.kind === 'decline' // the client's own replies
  const align = mine ? 'right' : 'left'

  return (
    <motion.div
      className={`bubble-row bubble-${align} bubble-${m.kind}`}
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      <div className="bubble">
        {!mine && <div className="bubble-from">{m.from}</div>}
        <div className="bubble-text">{m.text}</div>
        <div className="bubble-meta">
          <span className="bubble-ts num">{m.ts}</span>
          {mine && <IconCheck size={12} className="bubble-read" />}
        </div>
        {m.kind === 'offer' && showCountdown && (
          <div className="offer-actions">
            <button className="offer-btn offer-take" type="button" tabIndex={-1}>
              <IconCheck size={13} /> Take it
            </button>
            <button className="offer-btn offer-skip" type="button" tabIndex={-1}>
              <IconX size={13} /> Not today
            </button>
            <Countdown seconds={seconds} max={COUNTDOWN_SECONDS} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function PhoneMock() {
  const chat = useStore((s) => s.chat)
  const phase = useStore((s) => s.phase)
  const salonName = useStore((s) => s.store.salonName)

  // The countdown only attaches to the latest offer while we're actively offering.
  const lastOfferId = [...chat].reverse().find((m) => m.kind === 'offer')?.id

  return (
    <div className="phone-wrap">
      <div className="phone" role="img" aria-label="Client's phone showing the SlotSaver conversation">
        <div className="phone-notch" />
        <header className="phone-header">
          <span className="phone-avatar"><IconLeaf size={16} /></span>
          <div className="phone-title">
            <span className="phone-name">{salonName}</span>
            <span className="phone-status">
              <span className="phone-dot" /> SlotSaver assistant
            </span>
          </div>
          <span className="phone-call"><IconPhone size={15} /></span>
        </header>

        <div className="phone-body">
          {chat.length === 0 && (
            <div className="phone-empty">
              <p>Cancel a chair on the left — the guest&apos;s SMS thread plays out right here, live.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {chat.map((m) => (
              <Bubble
                m={m}
                key={m.id}
                showCountdown={m.id === lastOfferId && phase === 'offering'}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="phone-input" aria-hidden="true">
          <span className="phone-input-box">Message…</span>
        </div>
      </div>
    </div>
  )
}
