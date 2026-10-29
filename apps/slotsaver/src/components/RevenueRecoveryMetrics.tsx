import { formatEur, pct } from '../engine/money'
import { IconCheck, IconClock, IconScissors, IconStar } from './icons'

interface RevenueRecoveryMetricsProps {
  recoveredCents: number
  recoveredCount: number
  fillRatePct: number
  averageFillTimeMinutes?: number
}

export function RevenueRecoveryMetrics({
  recoveredCents,
  recoveredCount,
  fillRatePct,
  averageFillTimeMinutes = 4.2,
}: RevenueRecoveryMetricsProps) {
  const cards = [
    {
      label: 'Recovered Revenue',
      value: formatEur(recoveredCents, { whole: true }),
      sub: 'Chair time preserved this month',
      accent: 'emerald',
      icon: <IconCheck size={16} />,
      color: '#10b981',
    },
    {
      label: 'Realized Fill Rate',
      value: pct(fillRatePct, 0),
      sub: 'Honest realized autofill rate',
      accent: 'sky',
      icon: <IconStar size={16} />,
      color: '#38bdf8',
    },
    {
      label: 'Avg Response & Fill',
      value: `${averageFillTimeMinutes.toFixed(1)} min`,
      sub: 'Cascade time from cancellation',
      accent: 'amber',
      icon: <IconClock size={16} />,
      color: '#f59e0b',
    },
    {
      label: 'Slots Saved',
      value: `${recoveredCount} chairs`,
      sub: 'Zero admin calls required',
      accent: 'purple',
      icon: <IconScissors size={16} />,
      color: '#a855f7',
    },
  ]

  return (
    <div
      data-testid="revenue-recovery-metrics"
      className="recovery-metrics-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="card"
          style={{
            background: 'var(--color-surface, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              {c.label}
            </span>
            <span style={{ color: c.color }}>{c.icon}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
            {c.value}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
