import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  IconUpload, IconScan, IconAlert, IconSend, IconShield, IconCheckCircle,
} from './icons'

/* Lightweight scroll-reveal: starts at low-but-visible, never opacity:0 to bots,
   gated by prefers-reduced-motion. */
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }),
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    // Safety net: never leave content invisible to bots / slow loads / if the
    // observer never fires. Reveal regardless after a short beat.
    const fallback = window.setTimeout(() => setShown(true), 1400)
    return () => { io.disconnect(); window.clearTimeout(fallback) }
  }, [])
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={{ opacity: shown ? 1 : 0.001, y: shown ? 0 : 8 }}
      transition={{ duration: 0.22, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

const STEPS = [
  { icon: <IconUpload size={20} />, n: '01', title: 'Upload', body: 'Drop a photo, PDF or scan — or let it read your inbox and e-invoicing feed.' },
  { icon: <IconScan size={20} />, n: '02', title: 'Extract', body: 'Template-free OCR lifts every field off the page in seconds. No setup per vendor.' },
  { icon: <IconAlert size={20} />, n: '03', title: 'Validate', body: 'Totals reconcile, VAT is checked, and a wrong price gets flagged before it posts.' },
  { icon: <IconSend size={20} />, n: '04', title: 'Auto-post', body: 'A clean entry files straight into Xero, DATEV or QuickBooks — done.' },
]

export function MagicStrip() {
  return (
    <section className="band" id="how">
      <Reveal className="section-head">
        <span className="overline">How the magic works</span>
        <h2 className="section-title">Four steps. No typing.</h2>
        <p className="section-sub">From a messy supplier invoice to a posted, reconciled entry — automatically.</p>
      </Reveal>
      <div className="magic-grid">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} className="magic-card glass" delay={i * 0.05}>
            <div className="magic-top">
              <span className="magic-ico">{s.icon}</span>
              <span className="magic-n num">{s.n}</span>
            </div>
            <h3 className="magic-title">{s.title}</h3>
            <p className="magic-body">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const FIELDS = [
  'Vendor name', 'VAT ID', 'Invoice number', 'PO number',
  'Invoice date', 'Due date', 'IBAN', 'Currency',
  'Line items', 'Quantities', 'Unit prices', 'Net total',
  'VAT rate', 'VAT amount', 'Gross total', 'Payment terms',
]

export function FieldsWeRead() {
  return (
    <section className="band band-surface" id="fields">
      <Reveal className="section-head">
        <span className="overline">Fields we read</span>
        <h2 className="section-title">It handles your documents.</h2>
        <p className="section-sub">German Rechnungen, French Factur-X, Italian Fatture — every field, template-free.</p>
      </Reveal>
      <Reveal className="fields-wall">
        {FIELDS.map((f) => (
          <span key={f} className="field-chip">
            <IconCheckCircle size={14} /> {f}
          </span>
        ))}
      </Reveal>
    </section>
  )
}

const LOGOS = ['Xero', 'DATEV', 'QuickBooks', 'Sage', 'PEPPOL', 'Factur-X']

export function IntegrationWall() {
  return (
    <section className="band" id="integrations">
      <Reveal className="section-head">
        <span className="overline">Posts where you already work</span>
        <h2 className="section-title">It files into your accounting software.</h2>
      </Reveal>
      <Reveal className="logo-wall">
        {LOGOS.map((l) => (
          <span key={l} className="logo-pill">{l}</span>
        ))}
      </Reveal>
    </section>
  )
}

const TRUST = [
  { title: 'SOC 2 Type II', body: 'Independently audited security controls.' },
  { title: 'GDPR compliant', body: 'EU-hosted, data-minimised, your data stays yours.' },
  { title: 'Encrypted in transit & at rest', body: 'AES-256 everywhere, read-only access.' },
  { title: 'Helps your bookkeeper', body: 'Augments your team — it never replaces them.' },
]

export function TrustRail() {
  return (
    <section className="band band-surface" id="trust">
      <Reveal className="section-head">
        <span className="overline">Built for the books</span>
        <h2 className="section-title">Trusted with your numbers.</h2>
      </Reveal>
      <div className="trust-grid">
        {TRUST.map((t, i) => (
          <Reveal key={t.title} className="trust-card glass" delay={i * 0.05}>
            <span className="trust-ico"><IconShield size={18} /></span>
            <div>
              <h3 className="trust-title">{t.title}</h3>
              <p className="trust-body">{t.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
