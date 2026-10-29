import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { extract, validate, formatEur, type Box, type Extraction } from '../engine'
import { PaperDoc } from './PaperDoc'
import { IconBolt, IconCheckCircle, IconAlert, IconScan, IconArrowRight, IconShield } from './icons'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** One field that lights up on the left as its box is read on the right. */
interface HeroField {
  key: string
  label: string
  value: string
  box: Box
  y: number
  flagged?: boolean
  fix?: { from: string; to: string }
}

/* DOC-1 is the German Rechnung with the planted price typo — the strongest
   single asset. We render it pre-populated (the completed extraction) and, when
   motion is allowed, replay the bounding-box reveal once on load. */
function buildFields(ext: Extraction): HeroField[] {
  const issues = validate(ext)
  const anomaly = issues.find((i) => i.kind === 'price_anomaly')
  const flaggedLine = anomaly?.lineIndex
  const fields: HeroField[] = [
    { key: 'supplier', label: 'Vendor', value: ext.supplier.value, box: ext.supplier.box, y: ext.supplier.box.y },
    { key: 'invoiceNo', label: 'Invoice #', value: ext.invoiceNo.value, box: ext.invoiceNo.box, y: ext.invoiceNo.box.y },
    { key: 'invoiceDate', label: 'Date', value: ext.invoiceDate.value, box: ext.invoiceDate.box, y: ext.invoiceDate.box.y },
    { key: 'vatId', label: 'VAT ID', value: ext.vatId.value, box: ext.vatId.box, y: ext.vatId.box.y },
    ...ext.lineItems.map((l, i) => ({
      key: `line-${i}`,
      label: l.desc,
      value: `${l.qty} × ${formatEur(l.unitPriceCents)}`,
      box: l.box,
      y: l.box.y,
      flagged: i === flaggedLine,
      fix:
        i === flaggedLine && anomaly?.suggestedFixCents != null
          ? { from: formatEur(l.unitPriceCents), to: formatEur(anomaly.suggestedFixCents) }
          : undefined,
    })),
    { key: 'vat', label: `VAT ${ext.vatRatePct.value}%`, value: formatEur(ext.vatCents.value), box: ext.vatCents.box, y: ext.vatCents.box.y },
    { key: 'gross', label: 'Total', value: formatEur(ext.grossCents.value), box: ext.grossCents.box, y: ext.grossCents.box.y },
  ]
  return fields.sort((a, b) => a.y - b.y)
}

export function Hero() {
  const ext = useMemo(() => extract('DOC-1'), [])
  const fields = useMemo(() => buildFields(ext), [ext])
  const reduce = prefersReducedMotion()

  // revealCount: how many fields (top-to-bottom) are "read" so far.
  // Start fully revealed so cold load / no-JS / bots ALWAYS see the completed
  // extraction — never an empty box. Motion just replays the fill once.
  const [revealed, setRevealed] = useState(fields.length)
  const ranOnce = useRef(false)

  useEffect(() => {
    if (reduce || ranOnce.current) return
    ranOnce.current = true
    setRevealed(0)
    let n = 0
    const tick = () => {
      n += 1
      setRevealed(n)
      if (n < fields.length) timer = window.setTimeout(tick, 300)
    }
    let timer = window.setTimeout(tick, 600)
    return () => window.clearTimeout(timer)
  }, [reduce, fields.length])

  const sweep = fields.length > 0 ? Math.min(1, (revealed + 0.4) / fields.length) : 1
  const flagged = fields.find((f) => f.flagged)

  return (
    <section className="hero" aria-label="InvoiceAutopilot overview">
      <div className="hero-copy">
        <span className="overline"><IconBolt size={13} /> Supplier invoices, on autopilot</span>
        <h1 className="hero-headline">
          Invoices in, <span className="hl">posted entries out</span> — in seconds.
        </h1>
        <p className="hero-sub">
          Drop a messy supplier invoice. We read every field, catch the errors
          before they hit your books, and file a clean entry straight into your
          accounting software.
        </p>

        <div className="hero-stats">
          <div className="hstat">
            <div className="hstat-val num">
              <span className="from">7&nbsp;min</span>
              <IconArrowRight size={18} className="hstat-arrow" />
              <span className="to">9&nbsp;sec</span>
            </div>
            <div className="hstat-cap"><b className="num">47×</b> faster, every document</div>
          </div>
          <div className="hstat">
            <div className="hstat-val num accent">99%</div>
            <div className="hstat-cap">field accuracy</div>
          </div>
        </div>

        <div className="hero-cta">
          <a className="btn btn-primary btn-lg" href="#demo"><IconScan size={16} /> Try it on a sample invoice</a>
          <a className="btn btn-lg" href="#how">See the 30s demo</a>
        </div>

        <div className="hero-trust">
          <span><IconShield size={14} /> SOC 2 · GDPR · EU-hosted</span>
          <span><IconCheckCircle size={14} /> Posts to Xero · DATEV · QuickBooks</span>
        </div>
      </div>

      {/* THE wow: Rossum-style split-pane — fields on the left, real invoice
          with bounding boxes on the right. Pre-populated; replays once. */}
      <div className="hero-stage" aria-label="Live extraction: a real invoice being read into structured fields">
        <div className="hero-fields glass">
          <div className="hero-fields-head">
            <span className="overline">Extracted fields</span>
            <span className="hero-chip ok"><IconCheckCircle size={13} /> 12/12 read</span>
          </div>
          <div className="hero-fields-list">
            {fields.map((f, i) => {
              const on = i < revealed
              return (
                <motion.div
                  key={f.key}
                  className={`hf-row ${f.flagged ? 'flagged' : ''}`}
                  initial={false}
                  animate={{ opacity: on ? 1 : 0.16, x: on ? 0 : -6 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <span className="hf-label">{f.label}</span>
                  <span className={`hf-value num ${f.flagged ? 'bad' : ''}`}>{f.value}</span>
                  {f.flagged
                    ? <span className="hf-dot warn" role="img" aria-label="error caught" />
                    : <span className="hf-dot ok" aria-hidden="true" />}
                </motion.div>
              )
            })}
          </div>
          {flagged?.fix && (
            <div className="hf-flag">
              <span className="hf-flag-ico"><IconAlert size={15} /></span>
              <div className="hf-flag-body">
                <b>Price typo caught</b>
                <span className="hf-flag-diff num">
                  <s className="bad">{flagged.fix.from}</s>
                  <IconArrowRight size={13} />
                  <em className="good">{flagged.fix.to}</em>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="hero-paper-wrap">
          <div className="hero-chip-float"><span aria-hidden="true">🇩🇪</span> Phone photo · Germany</div>
          <div className="paper photo hero-paper">
            <PaperDoc ext={ext} />
            <div className="overlay">
              <AnimatePresence>
                {fields.map((f, i) => {
                  const visible = i < revealed
                  if (!visible) return null
                  return (
                    <motion.div
                      key={f.key}
                      className={`fbox ${f.flagged ? 'flagged' : ''}`}
                      style={{
                        left: `${f.box.x * 100}%`,
                        top: `${f.box.y * 100}%`,
                        width: `${f.box.w * 100}%`,
                        height: `${f.box.h * 100}%`,
                      }}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    />
                  )
                })}
              </AnimatePresence>
              {!reduce && revealed < fields.length && (
                <div className="scan-line" style={{ top: `${sweep * 100}%` }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
