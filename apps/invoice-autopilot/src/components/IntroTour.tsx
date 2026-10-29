import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import {
  IconBolt, IconClose, IconScan, IconAlert, IconSend, IconLayers, IconCheck, IconPlay, IconRoute,
} from './icons'

const SEEN_KEY = 'ia.introSeen.v1'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* ---------- guided-tour step definitions ----------
 * Each step spotlights a real DOM node (data-tour=…) at the right moment in the
 * demo, and can nudge the demo state machine forward via `advance` so the user
 * literally watches the key moments: pick a doc → scan → caught typo → post. */
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
          Skip <IconClose size={13} />
        </button>

        <div className="intro-badge">
          <span className="intro-logo"><IconBolt size={22} /></span>
          <div>
            <div className="intro-name">InvoiceAutopilot</div>
            <div className="intro-kicker">Supplier invoices, on autopilot</div>
          </div>
        </div>

        <h1 id="intro-title" className="intro-headline">
          Turn a photo of a supplier invoice into a checked, ready-to-file entry in seconds —
          and <span className="hl">catch the errors before they hit your books</span>.
        </h1>
        <p className="intro-sub">
          Typing invoices into accounting software by hand is slow and easy to get wrong.
          Watch one go from a messy phone photo to a clean, posted entry — with a hidden
          price typo caught along the way.
        </p>

        <div className="intro-points">
          <div className="ip"><span className="d blue"><IconScan size={13} /></span>Pick a document and watch it get read, field by field</div>
          <div className="ip"><span className="d amber"><IconAlert size={13} /></span>See a wrong price flagged — and fixed in one click</div>
          <div className="ip"><span className="d green"><IconCheck size={13} /></span>Send it to your accounting software, done</div>
        </div>

        <div className="intro-cta">
          <button ref={startRef} className="btn btn-primary btn-lg" onClick={onStart}>
            <IconPlay size={15} /> Try it on a sample invoice
          </button>
          <button className="btn btn-lg" onClick={onTour}>
            <IconRoute size={15} /> Show me how (30s)
          </button>
        </div>

        <div className="intro-note">
          <IconCheck size={13} />
          A demo on fixed sample documents — fully interactive. In production this reads your
          real inbox and posts into your own accounting software. It helps your bookkeeper, not replaces them.
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============================== Guided tour ============================== */
interface Rect { top: number; left: number; width: number; height: number }

function Tour({ onClose }: { onClose: () => void }) {
  const selectDoc = useStore((s) => s.selectDoc)
  const startScan = useStore((s) => s.startScan)
  const phase = useStore((s) => s.phase)

  const STEPS: Step[] = [
    {
      target: '[data-tour="inbox"]',
      title: '1 · Your inbox of invoices',
      body: 'These are incoming supplier invoices — a messy phone photo, a clean PDF, a crooked scan. We will start with the tricky photo (it has a hidden mistake).',
      icon: <IconLayers size={16} />,
      place: 'right',
      advance: () => selectDoc('DOC-1'),
      settle: 120,
    },
    {
      target: '[data-tour="canvas"]',
      title: '2 · Watch it get read',
      body: 'A scan line sweeps the page and lifts each field off it — supplier, dates, every line, the totals. No typing.',
      icon: <IconScan size={16} />,
      place: 'left',
      advance: () => { if (useStore.getState().phase === 'ready') startScan() },
      settle: 400,
    },
    {
      target: '[data-tour="extraction"]',
      title: '3 · A typo, caught',
      body: 'One price was read wrong — €1 200 instead of €12. We flag it in amber. Click "Fix it" and every total re-checks itself.',
      icon: <IconAlert size={16} />,
      place: 'left',
      settle: 200,
    },
    {
      target: '[data-tour="extraction"]',
      title: '4 · Send it to accounting',
      body: 'Once it is clean, one button files it into Xero or DATEV. It drops into the ledger and your saved-time counter ticks up.',
      icon: <IconSend size={16} />,
      place: 'left',
      settle: 120,
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

  // Re-measure when the scan finishes (the extraction panel reflows).
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
  const TT_H = 196
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
    <div className="tour-layer" role="dialog" aria-modal="true" aria-label={`How it works, step ${i + 1} of ${STEPS.length}: ${step.title}`}>
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
          <button className="tt-x" onClick={onClose} aria-label="End the walkthrough">
            <IconClose size={15} />
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
  const selectDoc = useStore((s) => s.selectDoc)
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
    if (phase === 'intro' || phase === 'tour') {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [phase])

  // Let an in-app button re-open the walkthrough at any time.
  useEffect(() => {
    const onReplay = () => { reset(); setPhase('tour') }
    window.addEventListener('ia:replay-tour', onReplay)
    return () => window.removeEventListener('ia:replay-tour', onReplay)
  }, [reset])

  // "Try it on a sample invoice" — preload the tricky doc so the user lands ready.
  const start = () => { remember(); selectDoc('DOC-1'); setPhase('done') }
  const tour = () => { remember(); reset(); setPhase('tour') }
  const skip = () => { remember(); setPhase('done') }

  return (
    <AnimatePresence mode="wait">
      {phase === 'intro' && <Intro key="intro" onStart={start} onTour={tour} onSkip={skip} />}
      {phase === 'tour' && <Tour key="tour" onClose={() => setPhase('done')} />}
    </AnimatePresence>
  )
}

/** Small affordance so the demo can re-run the walkthrough on demand. */
export function ReplayTourButton({ className = '' }: { className?: string }) {
  const replay = () => window.dispatchEvent(new CustomEvent('ia:replay-tour'))
  return (
    <button className={`btn btn-ghost btn-sm ${className}`} onClick={replay} title="Replay the walkthrough">
      <IconRoute size={14} /> How it works
    </button>
  )
}
