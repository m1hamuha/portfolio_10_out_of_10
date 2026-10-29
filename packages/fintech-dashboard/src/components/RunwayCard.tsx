import React from 'react';
import { RunwayResult, RunwayStatus } from '../engine/types';
import { formatCurrency } from '../engine/math';

interface RunwayCardProps {
  runway: RunwayResult;
  status: RunwayStatus;
  deltaRunwayMonths?: number;
}

export const RunwayCard: React.FC<RunwayCardProps> = ({
  runway,
  status,
  deltaRunwayMonths,
}) => {
  const isAlive = runway.isDefaultAlive;
  const statusColors: Record<RunwayStatus, { bg: string; border: string; text: string }> = {
    CRITICAL: { bg: 'rgba(248, 81, 73, 0.1)', border: '#f85149', text: '#f85149' },
    CAUTION: { bg: 'rgba(210, 153, 34, 0.1)', border: '#d29922', text: '#d29922' },
    HEALTHY: { bg: 'rgba(88, 166, 255, 0.1)', border: '#58a6ff', text: '#58a6ff' },
    DEFAULT_ALIVE: { bg: 'rgba(63, 185, 80, 0.1)', border: '#3fb950', text: '#3fb950' },
  };

  const currentTheme = statusColors[status] || statusColors.HEALTHY;

  return (
    <div
      role="region"
      aria-label="Runway & Burn Analytics"
      style={{
        backgroundColor: '#161b22',
        border: `1px solid ${currentTheme.border}44`,
        borderRadius: 12,
        padding: '24px',
        marginBottom: 24,
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        {/* Left: Main Runway Display */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#8b949e' }}>
              Projected Capital Runway
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                backgroundColor: currentTheme.bg,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                textTransform: 'uppercase',
              }}
              data-testid="runway-status-badge"
            >
              {status === 'DEFAULT_ALIVE' ? 'DEFAULT ALIVE' : status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#f0f6fc',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: -1,
              }}
              data-testid="runway-months-display"
            >
              {isAlive ? 'Default Alive' : `${runway.runwayMonths.toFixed(1)} mo`}
            </div>

            {deltaRunwayMonths !== undefined && deltaRunwayMonths !== 0 && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  backgroundColor: deltaRunwayMonths > 0 ? 'rgba(63, 185, 80, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                  color: deltaRunwayMonths > 0 ? '#3fb950' : '#f85149',
                  border: `1px solid ${deltaRunwayMonths > 0 ? '#3fb950' : '#f85149'}`,
                }}
              >
                {deltaRunwayMonths > 0 ? `+${deltaRunwayMonths.toFixed(1)} mo` : `${deltaRunwayMonths.toFixed(1)} mo`}
              </span>
            )}
          </div>

          <div style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>
            {isAlive ? (
              <span style={{ color: '#3fb950', fontWeight: 600 }}>
                🛡️ Revenue exceeds gross operating burn. Capital is self-sustaining indefinitely.
              </span>
            ) : (
              <span>
                Projected Zero Cash Date:{' '}
                <strong style={{ color: currentTheme.text }}>
                  {runway.runwayZeroDate || 'Immediate'}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Right: Key Supporting Ledger Figures */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 2 }}>Total Liquid Cash</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', fontFamily: 'monospace' }}>
              {formatCurrency(runway.totalCashCents)}
            </div>
            <div style={{ fontSize: 11, color: '#58a6ff' }}>100% Verified in Cents</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 2 }}>Net Monthly Burn</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: runway.netMonthlyBurnCents > 0 ? '#f85149' : '#3fb950',
                fontFamily: 'monospace',
              }}
            >
              {runway.netMonthlyBurnCents > 0
                ? `-${formatCurrency(runway.netMonthlyBurnCents)}`
                : `+${formatCurrency(Math.abs(runway.netMonthlyBurnCents))}`}
            </div>
            <div style={{ fontSize: 11, color: '#8b949e' }}>
              Gross: {formatCurrency(runway.grossMonthlyBurnCents)}/mo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
