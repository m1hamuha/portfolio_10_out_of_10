import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { IconClose } from './icons'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Centered dialog with the same a11y contract as the leak drawer:
 * focus the close button on open, trap Tab inside, close on Escape or scrim click.
 */
export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  wide,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduce = prefersReducedMotion()

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const card = cardRef.current
      if (!card) return
      const f = card.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [onClose])

  return (
    <>
      <motion.div className="scrim" onClick={onClose} aria-hidden="true"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <div className="modal-wrap" role="presentation">
        <motion.div ref={cardRef} className={`modal-card${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}
          initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 300 }}>
          <div className="modal-head">
            {icon && <span className="modal-icon" aria-hidden="true">{icon}</span>}
            <div className="modal-head-text">
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button ref={closeRef} className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close panel">
              <IconClose size={16} />
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </motion.div>
      </div>
    </>
  )
}
