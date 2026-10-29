import React from 'react';
import { TrendMetric } from '../engine/types';

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend: TrendMetric;
  icon?: string;
  testId?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  testId,
}) => {
  const trendColor = trend.isFavorable ? '#3fb950' : '#f85149';
  const trendBg = trend.isFavorable ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)';
  const arrow = trend.direction === 'UP' ? '↑' : trend.direction === 'DOWN' ? '↓' : '→';

  return (
    <div
      role="region"
      aria-label={label}
      data-testid={testId}
      style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 10,
        padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>

      <div style={{ fontSize: 26, fontWeight: 800, color: '#f0f6fc', fontFamily: 'ui-monospace, monospace' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 12,
            backgroundColor: trendBg,
            color: trendColor,
            border: `1px solid ${trendColor}44`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
          aria-label={`Trend: ${trend.direction} by ${trend.percentChange}%`}
        >
          <span>{arrow}</span>
          <span>{Math.abs(trend.percentChange).toFixed(1)}% MoM</span>
        </span>

        {subValue && (
          <span style={{ fontSize: 11, color: '#8b949e' }}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};
