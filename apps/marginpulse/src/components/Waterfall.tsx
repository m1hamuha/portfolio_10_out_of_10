import { motion, useReducedMotion } from 'framer-motion'
import { formatEur, type WaterfallBar } from '../engine'

/**
 * Horizontal P&L bridge on a shared value axis with a zero baseline.
 * Revenue starts full; each cost group drains the bar leftward; the profit-leak
 * step drains it bright red. Handles loss-making (negative cumulative) too.
 * Bars animate in (width grows) on scroll-in; gated by prefers-reduced-motion.
 */
export function Waterfall({ bars }: { bars: WaterfallBar[] }) {
  const reduce = useReducedMotion()
  if (!bars.length) return null
  const cums = bars.map((b) => b.cumulativeCents)
  const lo = Math.min(0, ...cums)
  const hi = Math.max(0, ...cums)
  const range = hi - lo || 1
  const x = (v: number) => ((v - lo) / range) * 100 // 0..100
  const zero = x(0)
  const showZero = lo < 0

  let prev = 0
  return (
    <div className="waterfall" role="img" aria-label="Monthly profit bridge">
      {bars.map((b, i) => {
        const isTotal = b.kind === 'start' || b.kind === 'end'
        const from = isTotal ? 0 : prev
        const to = b.cumulativeCents
        prev = b.cumulativeCents
        const left = x(Math.min(from, to))
        const width = Math.max(x(Math.max(from, to)) - left, 1.4)
        const cls = b.isLeak ? 'leak' : b.kind
        const neg = b.deltaCents < 0
        return (
          <div className={`wf-row ${b.isLeak ? 'leak' : ''}`} key={i}>
            <span className="wf-label">{neg && !isTotal ? '▼ ' : ''}{b.label}</span>
            <span className="wf-track">
              {showZero && <span className="wf-zero-tick" style={{ left: `${zero}%` }} />}
              <motion.span
                className={`wf-bar ${cls}`}
                style={{ left: `${left}%` }}
                initial={reduce ? false : { width: 0 }}
                whileInView={{ width: `${width}%` }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: reduce ? 0 : i * 0.06 }}
              />
            </span>
            <span className={`wf-val num ${neg ? 'neg' : 'pos'}`}>
              {isTotal ? formatEur(b.cumulativeCents) : formatEur(b.deltaCents, { signed: true })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
