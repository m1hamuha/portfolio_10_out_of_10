import React from 'react';
import { OpExCategoryBreakdown } from '../engine/types';
import { formatCurrency } from '../engine/math';

interface OpExBreakdownCardProps {
  categories: readonly OpExCategoryBreakdown[];
}

const CATEGORY_COLORS: Record<string, string> = {
  R_AND_D: '#58a6ff',
  SALES_AND_MARKETING: '#bc8cff',
  GENERAL_AND_ADMIN: '#f0883e',
  OPERATIONS_SUPPORT: '#3fb950',
};

export const OpExBreakdownCard: React.FC<OpExBreakdownCardProps> = ({ categories }) => {
  return (
    <div
      role="region"
      aria-label="Operating Expense Breakdown"
      data-testid="opex-breakdown-card"
      style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 10,
        padding: '20px',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f0f6fc' }}>
          Operating Expense (OpEx) Distribution
        </h4>
        <span style={{ fontSize: 11, color: '#8b949e' }}>Deterministic Sum = 100%</span>
      </div>

      {/* Stacked Horizontal Progress Bar */}
      <div
        style={{
          display: 'flex',
          height: 12,
          borderRadius: 6,
          overflow: 'hidden',
          backgroundColor: '#21262d',
          marginBottom: 16,
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat.category}
            style={{
              width: `${cat.percentage}%`,
              backgroundColor: CATEGORY_COLORS[cat.category] || '#8b949e',
              transition: 'width 0.3s ease',
            }}
            title={`${cat.label}: ${cat.percentage}%`}
          />
        ))}
      </div>

      {/* Category Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {categories.map((cat) => {
          const color = CATEGORY_COLORS[cat.category] || '#8b949e';
          return (
            <div
              key={cat.category}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#0d1117',
                border: '1px solid #21262d',
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: color,
                  }}
                />
                <span style={{ fontSize: 12, color: '#c9d1d9', fontWeight: 500 }}>
                  {cat.label}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f6fc', fontFamily: 'monospace' }}>
                  {formatCurrency(cat.amountCents)}
                </span>
                <span style={{ fontSize: 11, color: '#8b949e', marginLeft: 6 }}>
                  ({cat.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
