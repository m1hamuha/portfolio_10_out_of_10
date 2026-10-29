import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { extract, type Box, type Extraction, type Issue } from '../engine'
import { PaperDoc } from './PaperDoc'
import { useStore, DOCS } from '../store/useStore'
import { IconScan } from './icons'

interface OverlayBox {
  key: string
  box: Box
  y: number // box top, for sweep ordering
  flagged: boolean
}

/** Collect every field box in top-to-bottom order so reveals track the sweep. */
function collectBoxes(ext: Extraction, issues: Issue[]): OverlayBox[] {
  const anomalyLines = new Set(
    issues.filter((i) => i.kind === 'price_anomaly').map((i) => i.lineIndex),
  )
  const boxes: OverlayBox[] = [
    { key: 'supplier', box: ext.supplier.box, y: ext.supplier.box.y, flagged: false },
    { key: 'invoiceNo', box: ext.invoiceNo.box, y: ext.invoiceNo.box.y, flagged: false },
    { key: 'invoiceDate', box: ext.invoiceDate.box, y: ext.invoiceDate.box.y, flagged: false },
    { key: 'dueDate', box: ext.dueDate.box, y: ext.dueDate.box.y, flagged: false },
    { key: 'vatId', box: ext.vatId.box, y: ext.vatId.box.y, flagged: false },
    ...ext.lineItems.map((l, i) => ({
      key: `line-${i}`,
      box: l.box,
      y: l.box.y,
      flagged: anomalyLines.has(i),
    })),
    { key: 'net', box: ext.netCents.box, y: ext.netCents.box.y, flagged: false },
    { key: 'vat', box: ext.vatCents.box, y: ext.vatCents.box.y, flagged: false },
    { key: 'gross', box: ext.grossCents.box, y: ext.grossCents.box.y, flagged: false },
  ]
  return boxes.sort((a, b) => a.y - b.y)
}

const DEFAULT_SCAN_MS = 2600
// Allow ?scanms=N to slow the sweep (handy for QA / screenshots); clamped sane.
function scanDurationMs(): number {
  if (typeof window === 'undefined') return DEFAULT_SCAN_MS
  const p = new URLSearchParams(window.location.search).get('scanms')
  const n = p ? Number(p) : NaN
  return Number.isFinite(n) && n >= 400 && n <= 30000 ? n : DEFAULT_SCAN_MS
}

export function DocCanvas() {
  const phase = useStore((s) => s.phase)
  const selectedDoc = useStore((s) => s.selectedDoc)
  const extraction = useStore((s) => s.extraction)
  const scanProgress = useStore((s) => s.scanProgress)
  const issues = useStore((s) => s.issues)
  const resolved = useStore((s) => s.resolved)
  const setScanProgress = useStore((s) => s.setScanProgress)
  const finishScan = useStore((s) => s.finishScan)
  const raf = useRef<number>()

  const meta = DOCS.find((d) => d.id === selectedDoc)

  // Drive the scan sweep via requestAnimationFrame; honour reduced motion.
  useEffect(() => {
    if (phase !== 'scanning') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setScanProgress(1)
      const t = setTimeout(finishScan, 120)
      return () => clearTimeout(t)
    }
    const start = performance.now()
    const dur = scanDurationMs()
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur)
      setScanProgress(k)
      if (k < 1) raf.current = requestAnimationFrame(step)
      else finishScan()
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [phase, setScanProgress, finishScan])

  // Memoised so the per-field sort doesn't rerun on every scan-progress frame.
  // Declared before the early return below to keep hook order stable.
  const boxes = useMemo(
    () => (extraction ? collectBoxes(extraction, issues) : []),
    [extraction, issues],
  )

  if (!meta || !selectedDoc) {
    return (
      <div className="canvas empty">
        <div className="canvas-empty-inner">
          <IconScan size={40} />
          <h3>Pick an invoice to start</h3>
          <p>Choose one from your inbox on the left. Then press scan, and watch the details lift off the page.</p>
        </div>
      </div>
    )
  }

  // Render the paper as soon as a doc is selected; overlay boxes only appear
  // once the scan has produced a real extraction.
  const displayExt = extraction ?? extract(selectedDoc)
  const sweeping = phase === 'scanning'
  // During scan, only reveal boxes the line has already passed (+ a small lead).
  const revealThreshold = scanProgress + 0.04

  return (
    <div className="canvas">
      <div className="paper-wrap" style={{ transform: `rotate(${meta.skew}deg)` }}>
        <div className={`paper ${meta.id === 'DOC-1' ? 'photo' : ''} ${meta.id === 'DOC-3' ? 'scan' : ''}`}>
          <PaperDoc ext={displayExt} />

          {/* field highlight boxes */}
          <div className="overlay">
            <AnimatePresence>
              {boxes.map((b) => {
                const visible = sweeping ? b.y <= revealThreshold : true
                if (!visible) return null
                const isFlagged = b.flagged && !resolvedClears(b, resolved, issues)
                return (
                  <motion.div
                    key={b.key}
                    className={`fbox ${isFlagged ? 'flagged' : ''}`}
                    style={{
                      left: `${b.box.x * 100}%`,
                      top: `${b.box.y * 100}%`,
                      width: `${b.box.w * 100}%`,
                      height: `${b.box.h * 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  />
                )
              })}
            </AnimatePresence>
          </div>

          {/* scan-line sweep */}
          {sweeping && (
            <>
              <div className="scan-line" style={{ top: `${scanProgress * 100}%` }} />
              <div className="scan-mask" style={{ height: `${scanProgress * 100}%` }} />
            </>
          )}
        </div>
      </div>

      <div className="canvas-foot">
        <span className={`chip ${meta.id}`}><span aria-hidden="true">{meta.flag}</span> {meta.kind}</span>
        <span className="canvas-note">{meta.note}</span>
      </div>
    </div>
  )
}

/** A flagged box stops being flagged once its issue is resolved. */
function resolvedClears(b: OverlayBox, resolved: Set<string>, issues: Issue[]): boolean {
  if (!b.key.startsWith('line-')) return false
  const idx = Number(b.key.split('-')[1])
  const issue = issues.find((i) => i.lineIndex === idx && i.kind === 'price_anomaly')
  if (!issue) return true // no open anomaly for this line anymore
  return resolved.has(issue.id)
}
