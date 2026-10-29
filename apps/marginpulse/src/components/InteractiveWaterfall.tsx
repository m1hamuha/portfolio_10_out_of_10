import { motion } from 'framer-motion'
import type { Store } from '../engine/types'
import {
  computeCanonicalWaterfall,
  type CanonicalWaterfallBar,
  type CanonicalWaterfallStage,
} from '../engine/waterfall'
import { formatEur } from '../engine/money'

export interface InteractiveWaterfallProps {
  store: Store
  selectedStage: CanonicalWaterfallStage | null
  onSelectStage: (stage: CanonicalWaterfallStage | null) => void
}

export function InteractiveWaterfall({
  store,
  selectedStage,
  onSelectStage,
}: InteractiveWaterfallProps) {
  const bars = computeCanonicalWaterfall(store)
  const maxVal = Math.max(...bars.map((b) => Math.abs(b.cumulativeCents)), 1)

  return (
    <section className="waterfall-section card" aria-label="Interactive Profit Leak Waterfall" data-testid="waterfall-chart">
      <header className="wf-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <span className="overline" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-primary-400, #38bdf8)', fontWeight: 700 }}>
            Bridge Economics · 7 Canonical Stages
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 2px 0' }}>Interactive Profit Leak Waterfall</h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-dim, #94a3b8)', margin: 0 }}>
            Click any cost stage to filter the SKU ledger table below and inspect bleeding products.
          </p>
        </div>
        {selectedStage && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onSelectStage(null)}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            ✕ Reset Filter
          </button>
        )}
      </header>

      <div
        className="wf-chart-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
          background: 'rgba(0,0,0,0.22)',
          padding: '16px 12px 12px 12px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'end',
          minHeight: 220,
        }}
      >
        {bars.map((bar: CanonicalWaterfallBar) => {
          const isSelected = selectedStage === bar.id
          const heightPct = Math.max(14, Math.round((Math.abs(bar.cumulativeCents) / maxVal) * 100))
          const isNeg = bar.deltaCents < 0
          const isProfit = bar.id === 'net_profit'

          let barColor = isNeg
            ? bar.isBleed
              ? 'rgba(239, 68, 68, 0.75)' // red bleed
              : 'rgba(245, 158, 11, 0.65)' // amber cost
            : isProfit
            ? bar.deltaCents >= 0
              ? 'rgba(16, 185, 129, 0.85)' // emerald profit
              : 'rgba(239, 68, 68, 0.85)' // net loss
            : 'rgba(56, 189, 248, 0.8)' // gross revenue blue

          return (
            <div
              key={bar.id}
              onClick={() => onSelectStage(isSelected ? null : bar.id)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
              title={`${bar.label}: ${formatEur(bar.deltaCents)} (${bar.affectedSkuCount} SKUs)`}
            >
              {/* Value tag above bar */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: isSelected ? '#fff' : 'var(--color-text-dim, #cbd5e1)',
                  whiteSpace: 'nowrap',
                }}
              >
                {bar.isTotal ? formatEur(bar.cumulativeCents, { cents: false }) : (isNeg ? '−' : '+') + formatEur(Math.abs(bar.deltaCents), { cents: false })}
              </div>

              {/* Bar Fill */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.4 }}
                style={{
                  width: '100%',
                  background: barColor,
                  borderRadius: '6px 6px 2px 2px',
                  border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: isSelected ? '0 0 14px rgba(255,255,255,0.3)' : 'none',
                  transition: 'border 0.2s, box-shadow 0.2s',
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -18,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#fff',
                      color: '#0f172a',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Active
                  </span>
                )}
              </motion.div>

              {/* Bar Label below */}
              <div style={{ marginTop: 8, textAlign: 'center', width: '100%' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 600,
                    color: isSelected ? '#38bdf8' : '#f1f5f9',
                    lineHeight: 1.2,
                  }}
                >
                  {bar.label}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  {bar.affectedSkuCount} SKU{bar.affectedSkuCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
