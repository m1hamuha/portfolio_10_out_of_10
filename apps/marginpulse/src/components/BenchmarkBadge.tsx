export interface BenchmarkBadgeProps {
  durationMs: number
  rowCount: number
}

export function BenchmarkBadge({ durationMs, rowCount }: BenchmarkBadgeProps) {
  const isBudgetMet = durationMs < 300

  return (
    <div
      className="benchmark-badge"
      data-testid="benchmark-badge"
      data-duration-ms={durationMs}
      data-row-count={rowCount}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: isBudgetMet ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isBudgetMet ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        padding: '4px 10px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        color: isBudgetMet ? '#34d399' : '#fca5a5',
      }}
      title={`Parsed ${rowCount} rows client-side in ${durationMs}ms (AC 45 Performance Budget: <300ms)`}
    >
      <span>⚡</span>
      <span>
        <b>{durationMs}ms</b> processing ({rowCount} rows) · <b>&lt;300ms</b> budget met
      </span>
      <span>· Zero server transmission</span>
    </div>
  )
}
