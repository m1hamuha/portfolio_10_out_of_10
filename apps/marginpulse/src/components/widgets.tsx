import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { formatEur } from '../engine'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Dramatic count-up from 0 → value (whole euros). The ONE hero count-up. Respects reduced-motion. */
export function CountUpEuro({ valueCents, durationMs = 1500 }: { valueCents: number; durationMs?: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? valueCents : 0))
  const raf = useRef<number>()
  useEffect(() => {
    if (prefersReducedMotion()) { setShown(valueCents); return }
    const start = performance.now()
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / durationMs)
      const eased = 1 - Math.pow(1 - k, 4) // strong ease-out, lands hard
      setShown(Math.round(valueCents * eased))
      if (k < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [valueCents, durationMs])
  return <>{formatEur(shown)}</>
}

/**
 * Scroll-reveal: 220ms ease-out fade + 8px slide via IntersectionObserver.
 * Never leaves content at opacity:0 for bots/slow loads or reduced-motion — it
 * starts visible and only animates when motion is allowed and the element enters.
 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.22, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

/** Smoothly eases a displayed cents value toward `valueCents`. */
export function AnimatedEuro({
  valueCents,
  cents = false,
  className,
}: {
  valueCents: number
  cents?: boolean
  className?: string
}) {
  const [shown, setShown] = useState(valueCents)
  const from = useRef(valueCents)
  const raf = useRef<number>()

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(valueCents)
      from.current = valueCents
      return
    }
    const start = performance.now()
    const a = from.current
    const b = valueCents
    const dur = 600
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      const v = Math.round(a + (b - a) * eased)
      setShown(v)
      if (k < 1) raf.current = requestAnimationFrame(step)
      else from.current = b
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [valueCents])

  return <span className={className}>{formatEur(shown, { cents })}</span>
}

/** Deterministic mini line chart. */
export function Sparkline({
  data,
  width = 72,
  height = 28,
  color = '#F5B544',
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
}) {
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / span) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const id = `sg-${color.replace('#', '')}`
  return (
    <svg width={width} height={height} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${id})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
