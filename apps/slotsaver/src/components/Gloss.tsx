import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconHelp } from './icons'

/**
 * Plain-language glossary entries. Any term a non-expert salon owner might trip
 * on gets one short, jargon-free sentence. Keep these human — no nested jargon.
 */
export const GLOSSARY = {
  fitScore: {
    term: 'Fit score',
    plain: 'How well a waiting client matches this open chair — based on the service they want, how flexible they are, and how reliably they show up. Higher means a better match, so we offer it to them first.',
  },
  waitlist: {
    term: 'Waitlist',
    plain: 'Clients who asked to be told when a chair frees up. They have opted in (GDPR-consented), so SlotSaver may message them with an offer.',
  },
  fillRate: {
    term: 'Fill rate',
    plain: 'Out of every 10 chairs that open up, how many actually get refilled. We show the honest number (~7 in 10) — not a fantasy 100%.',
  },
  cascade: {
    term: 'Cascade',
    plain: 'If the best-matched client does not reply in time, the offer automatically rolls down to the next-best match — no phone calls from you.',
  },
} as const

export type GlossKey = keyof typeof GLOSSARY

/**
 * A small "?" affordance next to a piece of jargon. Click/tap toggles a
 * plain-language explanation (works on touch, where hover doesn't), and it also
 * opens on hover/focus for mouse + keyboard users. Fully keyboard-operable.
 */
export function Gloss({ k, className = '' }: { k: GlossKey; className?: string }) {
  const entry = GLOSSARY[k]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()

  // Close on outside click / Escape, and ensure only one gloss is ever open:
  // opening any gloss broadcasts so the others close.
  useEffect(() => {
    if (!open) return
    window.dispatchEvent(new CustomEvent('ss:gloss-open', { detail: id }))
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('ss:gloss-open', onOther)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('ss:gloss-open', onOther)
    }
  }, [open, id])

  return (
    <span
      className={`gloss ${className}`}
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="gloss-btn"
        aria-label={`What is ${entry.term}?`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <IconHelp size={13} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            className="gloss-pop"
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.16 }}
          >
            <b>{entry.term}</b>
            {entry.plain}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
