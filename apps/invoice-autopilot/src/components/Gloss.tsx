import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconHelp } from './icons'

/**
 * Plain-language glossary entries. Every term a non-accountant might trip on
 * gets one short, jargon-free sentence. Keep these human — no nested jargon.
 */
export const GLOSSARY = {
  vat: {
    term: 'VAT',
    plain: 'Value-Added Tax — the sales tax added on top of the price. The supplier collects it for the tax office.',
  },
  net: {
    term: 'Net',
    plain: 'The price of the goods on their own, before tax is added.',
  },
  gross: {
    term: 'Gross',
    plain: 'The final amount actually paid — the net price plus the VAT tax.',
  },
  vatId: {
    term: 'VAT ID',
    plain: "The supplier's tax registration number. We check it's the right shape for their country.",
  },
  zugferd: {
    term: 'ZUGFeRD',
    plain: 'A German standard for invoices that are a normal PDF plus hidden machine-readable data.',
  },
  facturx: {
    term: 'Factur-X',
    plain: 'The French/EU version of the same idea: a readable PDF that also carries structured invoice data.',
  },
  peppol: {
    term: 'PEPPOL',
    plain: 'A Europe-wide network for sending invoices directly between businesses, no email needed.',
  },
  reconcile: {
    term: 'Reconcile',
    plain: 'Double-checking that all the numbers add up — line items, tax and total agree.',
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
    window.dispatchEvent(new CustomEvent('ia:gloss-open', { detail: id }))
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('ia:gloss-open', onOther)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('ia:gloss-open', onOther)
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
