import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { formatEur, fastForward, averageSlotPriceCents, FILL_RATE_PCT } from '../engine'
import { IconCoins, IconTrendUp, IconShield, IconBell, IconCheckCircle, IconSparkle } from './icons'
import { Gloss } from './Gloss'
import { useCountUp } from '../hooks/useCountUp'

export function RecoveredCounter() {
  const recovered = useStore((s) => s.store.recoveredThisMonthCents)
  const count = useStore((s) => s.store.recoveredCount)
  const reduced = useStore((s) => s.reducedMotion)
  const phase = useStore((s) => s.phase)
  const display = useCountUp(recovered, reduced)
  const justSaved = phase === 'saved'

  return (
    <section className="counter card" aria-label="Recovered this month">
      <div className="counter-top">
        <span className="counter-ico"><IconCoins size={18} /></span>
        <span className="counter-label">Recovered this month</span>
      </div>
      <motion.div
        className="counter-value num"
        animate={justSaved && !reduced ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        {formatEur(display, { whole: true })}
      </motion.div>
      <div className="counter-sub">
        <span className="counter-chip"><IconCheckCircle size={12} /> {count} {count === 1 ? 'chair saved' : 'chairs saved'}</span>
        <span className="counter-chip counter-chip-soft">from your waitlist</span>
      </div>
    </section>
  )
}

// ---- owner phone notification (slides up when a save lands) ----------------
export function OwnerNotification() {
  const toast = useStore((s) => s.ownerToast)
  const reduced = useStore((s) => s.reducedMotion)
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="owner-note"
          initial={reduced ? false : { opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          role="status"
        >
          <span className="owner-note-ico"><IconBell size={16} /></span>
          <div className="owner-note-body">
            <div className="owner-note-title">Owner&apos;s phone</div>
            <div className="owner-note-text">{toast.text}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---- fill-rate honesty stat ------------------------------------------------
export function FillRateStat() {
  return (
    <div className="fillrate" aria-label="Realistic fill rate">
      <span className="fillrate-ico"><IconShield size={14} /></span>
      <div className="fillrate-body">
        <div className="fillrate-line">
          <span className="fillrate-num num">~{FILL_RATE_PCT}%</span>
          <span className="fillrate-label">of opened chairs get refilled<Gloss k="fillRate" /></span>
        </div>
        <p className="fillrate-note">Honest, not 100%. Roughly 7 in 10 gaps fill — some won&apos;t, and we&apos;d rather show you the real number.</p>
      </div>
    </div>
  )
}

// ---- fast-forward 30 days + ROI line --------------------------------------
const RETAINER_CENTS = 300_00 // a freelancer retainer to compare against

export function FastForward() {
  const store = useStore((s) => s.store)
  const reduced = useStore((s) => s.reducedMotion)
  // Start pre-projected to 7 days so the card lands with a real number, never €0.
  const [days, setDays] = useState(7)
  // Memoised: fastForward/averageSlotPriceCents run seeded RNG loops, and this
  // component re-renders ~60x/sec while the count-up animates. Recompute only
  // when the inputs actually change.
  const projected = useMemo(() => fastForward(store, days), [store, days])
  const display = useCountUp(projected.recoveredCents, reduced, 1100)
  const avg = useMemo(() => averageSlotPriceCents(store), [store])
  const monthly = useMemo(() => fastForward(store, 30), [store])
  const savesForRetainer = avg > 0 ? Math.max(1, Math.ceil(RETAINER_CENTS / avg)) : 0

  return (
    <section className="ff card" aria-label="Fast-forward projection">
      <header className="ff-head">
        <span className="ff-ico"><IconTrendUp size={16} /></span>
        <h3>Project it forward</h3>
        {days > 0 && <span className="ff-badge num">{days} days</span>}
      </header>

      <RoiLine cents={projected.recoveredCents} maxCents={monthly.recoveredCents || 1} reduced={reduced} />

      <div className="ff-value-row">
        <div>
          <div className="ff-value num">{formatEur(display, { whole: true })}</div>
          <div className="ff-value-cap">
            {days === 0 ? 'recovered — fast-forward to project a month' : `recovered across ${days} days · ${projected.saves} saves, ${projected.lost} missed`}
          </div>
        </div>
      </div>

      <div className="ff-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => setDays(7)} disabled={days === 7}>+7 days</button>
        <button className="btn btn-primary btn-sm" onClick={() => setDays(30)} disabled={days === 30}>Fast-forward 30 days</button>
        {days > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setDays(0)}>Reset</button>}
      </div>

      {days >= 30 && (
        <motion.div
          className="ff-roi"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="ff-roi-ico"><IconSparkle size={14} /></span>
          <span>
            ≈ <strong className="num">{formatEur(monthly.recoveredCents, { whole: true })}/mo</strong> recovered —
            pays for a {formatEur(RETAINER_CENTS, { whole: true })} retainer in <strong>{savesForRetainer} saves</strong>.
          </span>
        </motion.div>
      )}
    </section>
  )
}

// ---- hand-rolled SVG ROI line (no chart lib) ------------------------------
function RoiLine({ cents, maxCents, reduced }: { cents: number; maxCents: number; reduced: boolean }) {
  const W = 320
  const H = 64
  const pad = 4
  const pts = 30
  // Smooth cumulative curve from 0 → cents over 30 "days", scaled to maxCents.
  const target = maxCents > 0 ? cents / maxCents : 0
  const path: string[] = []
  for (let i = 0; i <= pts; i++) {
    const t = i / pts
    const x = pad + t * (W - pad * 2)
    // ease-out cumulative growth, scaled by how far the user has fast-forwarded
    const grown = (1 - Math.pow(1 - t, 1.6)) * target
    const y = H - pad - grown * (H - pad * 2)
    path.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const d = path.join(' ')
  const area = `${d} L${(W - pad).toFixed(1)},${H - pad} L${pad},${H - pad} Z`

  return (
    <svg className="roi-line" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden="true">
      <defs>
        <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#roiFill)" />
      <motion.path
        d={d}
        fill="none"
        stroke="var(--gold-ink)"
        strokeWidth={2.2}
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </svg>
  )
}
