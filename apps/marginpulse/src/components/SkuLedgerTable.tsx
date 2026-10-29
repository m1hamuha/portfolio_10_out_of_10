import { useState, useMemo } from 'react'
import type { Sku, Store } from '../engine/types'
import { unitEconomics } from '../engine/detect'
import { formatEur, pct } from '../engine/money'
import type { CanonicalWaterfallStage } from '../engine/waterfall'

export interface SkuLedgerTableProps {
  store: Store
  selectedStage: CanonicalWaterfallStage | null
  onClearStageFilter?: () => void
  onSelectSku?: (sku: Sku) => void
}

type TabFilter = 'all' | 'bleeding' | 'thin'

export function SkuLedgerTable({
  store,
  selectedStage,
  onClearStageFilter,
  onSelectSku,
}: SkuLedgerTableProps) {
  const [tab, setTab] = useState<TabFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Filter SKUs based on stage, tab, and search query
  const filteredSkus = useMemo(() => {
    return store.skus.filter((sku) => {
      const e = unitEconomics(sku)

      // Search match
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchesQuery =
          (sku.sourceSku ?? sku.id).toLowerCase().includes(query) ||
          sku.title.toLowerCase().includes(query) ||
          sku.category.toLowerCase().includes(query) ||
          (sku.channel ?? sku.marketplace).toLowerCase().includes(query)
        if (!matchesQuery) return false
      }

      // Waterfall stage filter
      if (selectedStage) {
        if (selectedStage === 'returns' && sku.returnRatePct <= 8) return false
        if (selectedStage === 'cogs' && sku.costCents <= sku.priceCents * 0.6) return false
        if (selectedStage === 'shipping' && e.shipping + e.fba <= sku.priceCents * 0.35) return false
        if (selectedStage === 'ad_spend' && e.ppc <= Math.max(0, e.preAdContribution)) return false
        if (selectedStage === 'gateway_fees' && e.feeRatio <= 0.4) return false
        if (selectedStage === 'net_profit' && e.contribution >= 0) return false
      }

      // Tab filter
      if (tab === 'bleeding' && e.contribution >= 0) return false
      if (tab === 'thin' && (e.contribution < 0 || e.marginPct > 15)) return false

      return true
    })
  }, [store.skus, selectedStage, tab, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSkus.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedSkus = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSkus.slice(start, start + pageSize)
  }, [filteredSkus, currentPage, pageSize])

  const stageLabelMap: Record<CanonicalWaterfallStage, string> = {
    gross_revenue: 'All Revenue SKUs',
    returns: 'High Return Slippage (>8%)',
    cogs: 'High Landed COGS (>60%)',
    shipping: 'Elevated Shipping & FBA (>35%)',
    ad_spend: 'PPC Bleed (Ad Spend > Margin)',
    gateway_fees: 'High Fee Drag (>40%)',
    net_profit: 'Negative Margin SKUs (Loss Making)',
  }

  return (
    <div className="sku-ledger-card card" data-testid="sku-ledger-table" style={{ marginTop: 20 }}>
      {/* Table Header & Controls */}
      <div
        className="ledger-controls"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>SKU Catalogue Ledger</h3>
          <span
            style={{
              fontSize: 12,
              background: 'rgba(255,255,255,0.08)',
              padding: '2px 8px',
              borderRadius: 12,
              color: '#94a3b8',
            }}
          >
            {filteredSkus.length} of {store.skus.length} SKUs
          </span>
          {selectedStage && (
            <span
              style={{
                fontSize: 11,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Stage Filter: {stageLabelMap[selectedStage]}
              {onClearStageFilter && (
                <button
                  onClick={onClearStageFilter}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    fontSize: 12,
                    lineHeight: 1,
                    padding: 0,
                  }}
                  title="Clear stage filter"
                >
                  ✕
                </button>
              )}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Quick tab filter */}
          <div className="seg" role="group" style={{ display: 'flex' }}>
            <button
              className={`seg-btn ${tab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setTab('all')
                setPage(1)
              }}
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              All
            </button>
            <button
              className={`seg-btn ${tab === 'bleeding' ? 'active' : ''}`}
              onClick={() => {
                setTab('bleeding')
                setPage(1)
              }}
              style={{ fontSize: 11, padding: '4px 10px', color: tab === 'bleeding' ? '#ef4444' : undefined }}
            >
              Bleeding Only
            </button>
            <button
              className={`seg-btn ${tab === 'thin' ? 'active' : ''}`}
              onClick={() => {
                setTab('thin')
                setPage(1)
              }}
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              Thin Margin (&lt;15%)
            </button>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search SKU or title…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: '5px 10px',
              color: '#fff',
              fontSize: 12,
              width: 180,
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8' }}>SKU</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8' }}>Product Title</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8' }}>Channel</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8' }}>Market</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>COGS</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>Margin %</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>Mo. Profit</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>Health</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSkus.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                  No SKUs matched the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedSkus.map((sku) => {
                const e = unitEconomics(sku)
                const monthlyProfitCents = Math.round(e.contribution * sku.unitsPerDay * 30)
                const isLoss = e.contribution < 0

                return (
                  <tr
                    key={sku.id}
                    onClick={() => onSelectSku?.(sku)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isLoss ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                      cursor: onSelectSku ? 'pointer' : 'default',
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{sku.sourceSku}</td>
                    <td style={{ padding: '10px 12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sku.title}>
                      {sku.title}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{sku.channel}</td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{sku.marketplace}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatEur(sku.priceCents)}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                      {formatEur(sku.costCents)}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: isLoss ? '#ef4444' : e.marginPct < 15 ? '#f59e0b' : '#10b981',
                      }}
                    >
                      {pct(e.marginPct)}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: isLoss ? '#ef4444' : '#10b981',
                      }}
                    >
                      {formatEur(monthlyProfitCents, { cents: false })}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {isLoss ? (
                        <span
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          BLEED
                        </span>
                      ) : e.marginPct < 15 ? (
                        <span
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          THIN
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
            fontSize: 12,
            color: '#94a3b8',
          }}
        >
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSkus.length)} of {filteredSkus.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-ghost btn-xs"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ padding: '4px 8px', fontWeight: 600, color: '#fff' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-xs"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
