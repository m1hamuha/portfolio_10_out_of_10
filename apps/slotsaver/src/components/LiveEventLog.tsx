import { useState } from 'react'
import type { EventLogEntry, EventType } from '../engine/types'
import { IconClock, IconRefresh } from './icons'

interface LiveEventLogProps {
  events: EventLogEntry[]
  onClear: () => void
}

type FilterCategory = 'all' | 'webhook' | 'sms' | 'recovery'

export function LiveEventLog({ events, onClear }: LiveEventLogProps) {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'webhook') return e.type.includes('webhook')
    if (filter === 'sms') return e.type === 'sms_dispatched' || e.type === 'candidates_ranked'
    if (filter === 'recovery') return e.type === 'slot_claimed' || e.type === 'revenue_recovered'
    return true
  })

  const copyPayload = (id: string, payload?: Record<string, unknown>) => {
    if (!payload) return
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const badgeColor = (type: EventType) => {
    switch (type) {
      case 'cancellation_detected':
      case 'slot_opened':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' }
      case 'candidates_ranked':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' }
      case 'sms_dispatched':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' }
      case 'webhook_sent':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7' }
      case 'webhook_fallback':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' }
      case 'slot_claimed':
      case 'revenue_recovered':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' }
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', text: '#94a3b8' }
    }
  }

  return (
    <div
      className="card live-event-log"
      data-testid="live-event-log"
      style={{
        background: 'var(--color-surface, #1e293b)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Live Operational Event Log
          </h3>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
            ({filteredEvents.length} events)
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="seg" role="group" style={{ display: 'flex' }}>
            {(['all', 'webhook', 'sms', 'recovery'] as FilterCategory[]).map((cat) => (
              <button
                key={cat}
                className={`seg-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
                style={{ fontSize: 11, padding: '3px 8px', textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>
          {events.length > 0 && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={onClear}
              style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
              title="Clear event log"
            >
              <IconRefresh size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Events Terminal View */}
      <div
        style={{
          maxHeight: 320,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b' }}>
            <IconClock size={20} />
            <div style={{ marginTop: 6, fontSize: 12 }}>Waiting for salon operational events…</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              Click &quot;Simulate a cancellation&quot; above to trigger the n8n webhook and SMS cascade.
            </div>
          </div>
        ) : (
          filteredEvents.map((e) => {
            const b = badgeColor(e.type)
            const isExpanded = expandedId === e.id
            return (
              <div
                key={e.id}
                className="event-item"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {e.timestamp}
                    </span>
                    <span
                      style={{
                        background: b.bg,
                        color: b.text,
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.type.replace('_', ' ')}
                    </span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.title}
                    </span>
                  </div>

                  {e.payload && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : e.id)}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          color: '#94a3b8',
                          padding: '2px 6px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 10,
                        }}
                      >
                        {isExpanded ? 'Hide JSON' : 'JSON'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, paddingLeft: 70 }}>
                  {e.detail}
                </div>

                {/* Expandable JSON Payload */}
                {isExpanded && e.payload && (
                  <div style={{ marginTop: 8, paddingLeft: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Payload Metadata</span>
                      <button
                        onClick={() => copyPayload(e.id, e.payload)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedId === e.id ? '#10b981' : '#38bdf8',
                          cursor: 'pointer',
                          fontSize: 10,
                        }}
                      >
                        {copiedId === e.id ? '✓ Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: 8,
                        borderRadius: 4,
                        fontSize: 10,
                        color: '#a5f3fc',
                        overflowX: 'auto',
                        margin: 0,
                      }}
                    >
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
