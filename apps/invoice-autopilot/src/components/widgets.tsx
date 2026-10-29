import { useEffect, useRef, useState } from 'react'
import { formatEur, formatDuration } from '../engine'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Eases a displayed integer toward `value` over `dur` ms (cubic-out). */
function useEased(value: number, dur = 700): number {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const raf = useRef<number>()
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value)
      from.current = value
      return
    }
    const start = performance.now()
    const a = from.current
    const b = value
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      setShown(Math.round(a + (b - a) * eased))
      if (k < 1) raf.current = requestAnimationFrame(step)
      else from.current = b
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, dur])
  return shown
}

export function AnimatedEuro({ valueCents, className }: { valueCents: number; className?: string }) {
  const shown = useEased(valueCents)
  return <span className={className}>{formatEur(shown)}</span>
}

export function AnimatedDuration({ seconds, className }: { seconds: number; className?: string }) {
  const shown = useEased(seconds)
  return <span className={className}>{formatDuration(shown)}</span>
}

export function AnimatedInt({ value, className }: { value: number; className?: string }) {
  const shown = useEased(value, 500)
  return <span className={className}>{shown}</span>
}

/**
 * Circular confidence meter (hand-rolled SVG). `value` 0..1.
 * Colour shifts blue → green as it fills; amber when below the warn threshold.
 */
export function ConfidenceMeter({
  value,
  size = 116,
  label = 'Confidence',
}: {
  value: number
  size?: number
  label?: string
}) {
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const dash = c * v
  const color = v >= 0.9 ? 'var(--green)' : v >= 0.75 ? 'var(--blue)' : 'var(--amber)'
  const pct = Math.round(v * 100)
  return (
    <div className="confmeter" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--paper-line)" strokeWidth={stroke} fill="none" opacity={0.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray .25s ease, stroke .3s ease' }}
        />
      </svg>
      <div className="confmeter-center">
        <div className="confmeter-pct num" style={{ color }}>{pct}<span>%</span></div>
        <div className="confmeter-label">{label}</div>
      </div>
    </div>
  )
}

/**
 * Before/after horizontal bars comparing manual vs autopilot time.
 * Pure SVG; widths derive from the values so they can never contradict.
 */
export function BeforeAfter({ manualSec, autoSec }: { manualSec: number; autoSec: number }) {
  const max = Math.max(manualSec, autoSec)
  const w = 100
  const manualW = (manualSec / max) * w
  const autoW = Math.max((autoSec / max) * w, 1.5)
  const factor = Math.round(manualSec / autoSec)
  return (
    <div className="beforeafter">
      <div className="ba-row">
        <span className="ba-tag">Manual keying</span>
        <div className="ba-track">
          <div className="ba-fill manual" style={{ width: `${manualW}%` }} />
        </div>
        <span className="ba-val num">{formatDuration(manualSec)}</span>
      </div>
      <div className="ba-row">
        <span className="ba-tag accent">Autopilot</span>
        <div className="ba-track">
          <div className="ba-fill auto" style={{ width: `${autoW}%` }} />
        </div>
        <span className="ba-val num accent">{formatDuration(autoSec)}</span>
      </div>
      <div className="ba-foot">
        <b className="num">{factor}×</b> faster · every document, every time
      </div>
    </div>
  )
}
