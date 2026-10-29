import { motion, AnimatePresence } from 'framer-motion'
import type { Store } from '../engine/types'
import { buildExecutiveReportData, generateExecutiveReportHtml } from '../engine/report'
import { formatEur, pct } from '../engine/money'

export interface ExecutiveReportModalProps {
  isOpen: boolean
  onClose: () => void
  store: Store
}

export function ExecutiveReportModal({
  isOpen,
  onClose,
  store,
}: ExecutiveReportModalProps) {
  if (!isOpen) return null

  const data = buildExecutiveReportData(store, store.storeName || 'Store Catalogue')

  const handlePrint = () => {
    const html = generateExecutiveReportHtml(data)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => {
        win.print()
      }, 250)
    }
  }

  const handleDownloadHtml = () => {
    const html = generateExecutiveReportHtml(data)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marginpulse-executive-audit-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const scoreColor = data.healthScore.total >= 70 ? '#10b981' : data.healthScore.total >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <AnimatePresence>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 7, 10, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
      >
        <motion.div
          className="modal-shell card"
          data-testid="audit-summary"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 14,
            width: '100%',
            maxWidth: 720,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 24,
            color: '#f8fafc',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <span className="overline" style={{ fontSize: 11, textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>
                Executive Financial Audit
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 2px 0' }}>Portfolio Health &amp; Bleed Assessment</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Catalogue: {data.totalSkus} SKUs across {data.channels.join(', ')}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Health Score Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: `4px solid ${scoreColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                color: scoreColor,
                flexShrink: 0,
              }}
            >
              {data.healthScore.total}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                Portfolio Health Rating: <span style={{ color: scoreColor }}>{data.healthScore.rating}</span>
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 3 }}>{data.healthScore.summary}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                Margin Health: <b>{data.healthScore.breakdown.marginHealth}/35</b> · Bleed Control: <b>{data.healthScore.breakdown.bleedControl}/30</b> · Cost Integrity: <b>{data.healthScore.breakdown.costIntegrity}/20</b> · Fee Efficiency: <b>{data.healthScore.breakdown.feeEfficiency}/15</b>
              </div>
            </div>
          </div>

          {/* Financial Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Monthly Revenue</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{formatEur(data.monthlyGrossRevenueCents, { cents: false })}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Net Margin</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: data.netMarginPct < 8 ? '#ef4444' : '#10b981' }}>
                {pct(data.netMarginPct)}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Monthly Bleed</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: '#ef4444' }}>
                −{formatEur(data.monthlyRecoverableBleedCents, { cents: false })}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Annual Preserved ROI</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: '#10b981' }}>
                +{formatEur(data.annualizedRecoverableBleedCents, { cents: false })}
              </div>
            </div>
          </div>

          {/* Directives Preview */}
          {data.directives.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Priority Remediation Directives</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.directives.map((dir, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: dir.priority.includes('P1') ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      borderLeft: `3px solid ${dir.priority.includes('P1') ? '#ef4444' : '#f59e0b'}`,
                      padding: '8px 12px',
                      borderRadius: '0 6px 6px 0',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>
                      {dir.priority}: {dir.title} (+{formatEur(dir.estimatedMonthlyRecoveryCents, { cents: false })}/mo)
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{dir.rationale}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-ghost" onClick={handleDownloadHtml}>
              Download HTML
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              Print / Save as PDF
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
