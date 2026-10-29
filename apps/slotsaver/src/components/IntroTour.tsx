import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import {
  IconLeaf, IconX2, IconPlay, IconRoute, IconCheck,
  IconScissors, IconBell, IconUsers, IconClock,
} from './icons'

const SEEN_KEY = 'ss.introSeen.v1'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* ---------- guided-tour step definitions ----------
 * Each step spotlights a real DOM node (data-tour=…) at the right beat of the
 * demo, and nudges the live state machine forward so the viewer literally
 * watches the key moments: cancel a chair → an offer goes out with a countdown
 * → it cascades to the next match → the chair is saved and the owner is pinged. */
interface Step {
  target: string
  title: string
  body: string
  icon: React.ReactNode
  place: 'bottom' | 'top' | 'left' | 'right'
  /** Called when this step becomes active — drives the live demo. */
  advance?: () => void
  /** ms to wait before measuring (lets the app settle / animate into place). */
  settle?: number
}

/* ============================== Intro overlay ============================== */
function Intro({ onStart, onTour, onSkip }: { onStart: () => void; onTour: () => void; onSkip: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    startRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  const reduce = prefersReducedMotion()
  return (
    <motion.div
      className="intro-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="intro-card"
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      >
        <button className="intro-skip" onClick={onSkip} aria-label="Skip the intro and open the demo">
          Skip <IconX2 size={13} />
        </button>

        <div className="intro-badge">
          <span className="intro-logo"><IconLeaf size={22} /></span>
          <div>
            <div className="intro-name">SlotSaver</div>
            <div className="intro-kicker">Empty chairs, refilled</div>
          </div>
        </div>

        <h1 id="intro-title" className="intro-headline">
          A client cancels — watch the empty chair <span className="hl">refill itself</span> from
          your waitlist in seconds.
        </h1>
        <p className="intro-sub">
          Last-minute cancellations leave paid-for chair time sitting empty. Cancel a booking below
          and do nothing — SlotSaver messages your waiting clients, fills the gap, and pings you
          <em> &ldquo;chair saved, +€62.&rdquo;</em>
        </p>

        <div className="intro-points">
          <div className="ip"><span className="d terra"><IconScissors size={13} /></span>Cancel a high-value chair — see the money at risk</div>
          <div className="ip"><span className="d gold"><IconClock size={13} /></span>An offer goes to the best-matched client, with a countdown</div>
          <div className="ip"><span className="d green"><IconCheck size={13} /></span>It refills, the owner is pinged, and recovered revenue ticks up</div>
        </div>

        <div className="intro-cta">
          <button ref={startRef} className="btn btn-primary btn-lg" onClick={onStart}>
            <IconPlay size={15} /> Run the live demo
          </button>
          <button className="btn btn-lg" onClick={onTour}>
            <IconRoute size={15} /> Take the guided tour
          </button>
        </div>

        <div className="intro-note">
          <IconCheck size={13} />
          A demo on sample data — fully interactive. In production SlotSaver plugs into your booking
          system and a consented waitlist (GDPR), messaging clients over WhatsApp / SMS.
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============================== Guided tour ============================== */
interface Rect { top: number; left: number; width: number; height: number }

function Tour({ onClose }: { onClose: () => void }) {
  const simulate = useStore((s) => s.simulateCancellation)
  const phase = useStore((s) => s.phase)

  const STEPS: Step[] = [
    {
      target: '[data-tour="control"]',
      title: '1 · Cancel a chair',
      body: 'A client just dropped their high-value colour appointment — that chair time is about to sit empty and unpaid. We start the clock here.',
      icon: <IconScissors size={16} />,
      place: 'bottom',
      advance: () => { if (useStore.getState().phase === 'idle') simulate() },
      settle: 150,
    },
    {
      target: '[data-tour="phone"]',
      title: '2 · An offer goes out',
      body: 'SlotSaver messages the best-matched waiting client with a one-tap Take it / Not today and a live countdown. No phone calls from you.',
      icon: <IconClock size={16} />,
      place: 'left',
      settle: 200,
    },
    {
      target: '[data-tour="waitlist"]',
      title: '3 · It cascades to the next match',
      body: 'If the top match does not reply in time, the offer rolls straight down the ranked waitlist to the next best person — automatically.',
      icon: <IconUsers size={16} />,
      place: 'left',
      settle: 200,
    },
    {
      target: '[data-tour="owner"]',
      title: '4 · Saved — and you get pinged',
      body: 'Someone takes it, the chair turns green, and the owner gets a single calm notification: "chair saved, +€62 recovered." Watch the counter below tick up.',
      icon: <IconBell size={16} />,
      place: 'left',
      settle: 200,
    },
  ]

  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  const reduce = prefersReducedMotion()

  // Fire the step's demo action once when it becomes active.
  useEffect(() => {
    step.advance?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  const measure = useCallback(() => {
    const el = document.querySelector(step.target)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    const pad = 8
    setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 })
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  }, [step.target, reduce])

  useLayoutEffect(() => { measure() }, [measure])
  useEffect(() => {
    const t = setTimeout(measure, step.settle ?? 120)
    const t2 = setTimeout(measure, (step.settle ?? 120) + 350)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t); clearTimeout(t2)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure, step.settle])

  // Re-measure as the live demo reflows (phone bubbles, owner note appearing).
  useEffect(() => { measure() }, [phase, measure])

  const next = useCallback(() => (last ? onClose() : setI((n) => n + 1)), [last, onClose])
  const prev = useCallback(() => setI((n) => Math.max(0, n - 1)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  // Viewport-aware tooltip placement so it never clips off-screen.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900
  const TT_W = Math.min(340, vw - 32)
  const TT_H = 200
  const clampTop = (t: number) => Math.max(16, Math.min(t, vh - TT_H - 16))
  const clampLeft = (l: number) => Math.max(16, Math.min(l, vw - TT_W - 16))
  let ttStyle: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: TT_W }
  if (rect) {
    const spaceRight = vw - (rect.left + rect.width)
    if (step.place === 'left' || step.place === 'right') {
      const onLeft = step.place === 'left' ? rect.left > TT_W + 28 : spaceRight < TT_W + 28
      const left = onLeft ? clampLeft(rect.left - TT_W - 14) : clampLeft(rect.left + rect.width + 14)
      const top = clampTop(rect.top + rect.height / 2 - TT_H / 2)
      ttStyle = { left, top, width: TT_W }
    } else {
      const left = clampLeft(rect.left + rect.width / 2 - TT_W / 2)
      const spaceBelow = vh - (rect.top + rect.height)
      const placeTop = step.place === 'top' ? rect.top > TT_H + 28 : spaceBelow < TT_H + 28
      const top = placeTop ? clampTop(rect.top - TT_H - 14) : clampTop(rect.top + rect.height + 14)
      ttStyle = { left, top, width: TT_W }
    }
  }

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-label={`Guided tour, step ${i + 1} of ${STEPS.length}: ${step.title}`}>
      <motion.div
        className="tour-spot"
        initial={false}
        animate={rect
          ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height, opacity: 1 }
          : { opacity: 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 260 }}
        onClick={onClose}
      />
      <motion.div
        className="tour-tip"
        key={i}
        style={ttStyle}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="tt-head">
          <span className="tt-icon">{step.icon}</span>
          <h3>{step.title}</h3>
          <button className="tt-x" onClick={onClose} aria-label="End the tour">
            <IconX2 size={15} />
          </button>
        </div>
        <p className="tt-body">{step.body}</p>
        <div className="tt-foot">
          <div className="tt-dots" aria-hidden="true">
            {STEPS.map((_, n) => <span key={n} className={n === i ? 'on' : ''} />)}
          </div>
          <div className="tt-btns">
            {i > 0 && <button className="btn btn-ghost btn-sm" onClick={prev}>Back</button>}
            <button className="btn btn-primary btn-sm" onClick={next}>
              {last ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ============================== Orchestrator ============================== */
export function IntroTour() {
  const simulate = useStore((s) => s.simulateCancellation)
  const reset = useStore((s) => s.reset)

  const [phase, setPhase] = useState<'intro' | 'tour' | 'done'>(() => {
    if (typeof window === 'undefined') return 'done'
    try {
      return window.localStorage.getItem(SEEN_KEY) ? 'done' : 'intro'
    } catch {
      return 'intro'
    }
  })

  const remember = useCallback(() => {
    try { window.localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
  }, [])

  // Lock body scroll while a modal phase is active.
  useEffect(() => {
    if (phase === 'intro') {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [phase])

  // Let an in-app button re-open the walkthrough at any time.
  useEffect(() => {
    const onReplay = () => { reset(); setPhase('tour') }
    window.addEventListener('ss:replay-tour', onReplay)
    return () => window.removeEventListener('ss:replay-tour', onReplay)
  }, [reset])

  // "Run the live demo" — kick the cascade off immediately so the viewer lands
  // straight in the action.
  const start = () => { remember(); reset(); simulate(); setPhase('done') }
  const tour = () => { remember(); reset(); setPhase('tour') }
  const skip = () => { remember(); setPhase('done') }

  return (
    <AnimatePresence mode="wait">
      {phase === 'intro' && <Intro key="intro" onStart={start} onTour={tour} onSkip={skip} />}
      {phase === 'tour' && <Tour key="tour" onClose={() => setPhase('done')} />}
    </AnimatePresence>
  )
}

/** Small affordance so the demo can re-run the guided tour on demand. */
export function ReplayTourButton({ className = '' }: { className?: string }) {
  const replay = () => window.dispatchEvent(new CustomEvent('ss:replay-tour'))
  return (
    <button className={`btn btn-ghost btn-sm ${className}`} onClick={replay} title="Replay the guided tour">
      <IconRoute size={14} /> How it works
    </button>
  )
}
