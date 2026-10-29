import React from 'react';
import { ScenarioModifiers, ScenarioComparisonResult } from '../engine/types';
import { SCENARIO_PRESETS } from '../engine/runway';
import { formatCurrency } from '../engine/math';

interface ScenarioSimulatorProps {
  modifiers: ScenarioModifiers;
  onChangeModifiers: (modifiers: ScenarioModifiers) => void;
  comparison: ScenarioComparisonResult;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  modifiers,
  onChangeModifiers,
  comparison,
}) => {
  const handlePresetClick = (presetKey: 'HIRING_FREEZE' | 'GROWTH_PUSH' | 'EXPENSE_REDUCTION') => {
    onChangeModifiers({ ...SCENARIO_PRESETS[presetKey] });
  };

  const handleReset = () => {
    onChangeModifiers({
      name: undefined,
      hiringDeltaCount: 0,
      costPerHireMonthlyCents: 1_250_000,
      revenueGrowthRateBps: 0,
      expenseReductionBps: 0,
      oneTimeCapexCents: 0,
    });
  };

  return (
    <section
      role="region"
      aria-label="Runway Scenario Simulator"
      style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 12,
        padding: '24px',
        marginBottom: 24,
      }}
    >
      {/* Header & 1-Click Scenario Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f6fc' }}>
            Interactive Runway Scenario Modeling
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#8b949e' }}>
            Simulate the capital impact of hiring plans, growth acceleration, or non-payroll cost reductions:
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            data-testid="scenario-preset-hiring-freeze"
            onClick={() => handlePresetClick('HIRING_FREEZE')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: modifiers.name === 'Hiring Freeze' ? '#1f6feb' : '#21262d',
              color: '#f0f6fc',
              border: '1px solid #30363d',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            ❄️ Hiring Freeze
          </button>

          <button
            type="button"
            data-testid="scenario-preset-growth-push"
            onClick={() => handlePresetClick('GROWTH_PUSH')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: modifiers.name === 'Growth Push' ? '#1f6feb' : '#21262d',
              color: '#f0f6fc',
              border: '1px solid #30363d',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            🚀 Growth Push (+2 Devs, +25% Rev)
          </button>

          <button
            type="button"
            data-testid="scenario-preset-expense-reduction"
            onClick={() => handlePresetClick('EXPENSE_REDUCTION')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: modifiers.name === 'Expense Reduction' ? '#1f6feb' : '#21262d',
              color: '#f0f6fc',
              border: '1px solid #30363d',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            ✂️ Expense Reduction (-20% Non-Payroll)
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: '#8b949e',
              border: '1px solid #30363d',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* 1. Headcount Delta */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: '#c9d1d9', fontWeight: 600 }}>Headcount Expansion:</span>
            <span style={{ color: modifiers.hiringDeltaCount > 0 ? '#58a6ff' : modifiers.hiringDeltaCount < 0 ? '#f85149' : '#8b949e', fontWeight: 700 }}>
              {modifiers.hiringDeltaCount > 0 ? `+${modifiers.hiringDeltaCount}` : modifiers.hiringDeltaCount} engineers
            </span>
          </div>
          <input
            type="range"
            min="-3"
            max="6"
            step="1"
            value={modifiers.hiringDeltaCount}
            onChange={(e) => onChangeModifiers({ ...modifiers, name: undefined, hiringDeltaCount: parseInt(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
            Cost: ${((modifiers.costPerHireMonthlyCents / 100) * Math.abs(modifiers.hiringDeltaCount)).toLocaleString()}/mo
          </div>
        </div>

        {/* 2. Revenue Growth Rate */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: '#c9d1d9', fontWeight: 600 }}>Revenue Growth (MoM):</span>
            <span style={{ color: modifiers.revenueGrowthRateBps >= 0 ? '#3fb950' : '#f85149', fontWeight: 700 }}>
              {modifiers.revenueGrowthRateBps > 0 ? `+${(modifiers.revenueGrowthRateBps / 100).toFixed(0)}%` : `${(modifiers.revenueGrowthRateBps / 100).toFixed(0)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-5000"
            max="10000"
            step="500"
            value={modifiers.revenueGrowthRateBps}
            onChange={(e) => onChangeModifiers({ ...modifiers, name: undefined, revenueGrowthRateBps: parseInt(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
            Range: -50% to +100%
          </div>
        </div>

        {/* 3. Non-Payroll Expense Cut */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: '#c9d1d9', fontWeight: 600 }}>Non-Payroll OpEx Cut:</span>
            <span style={{ color: modifiers.expenseReductionBps > 0 ? '#3fb950' : '#8b949e', fontWeight: 700 }}>
              {(modifiers.expenseReductionBps / 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5000"
            step="500"
            value={modifiers.expenseReductionBps}
            onChange={(e) => onChangeModifiers({ ...modifiers, name: undefined, expenseReductionBps: parseInt(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
            SaaS tooling, GPU compute & ad spend cuts
          </div>
        </div>

        {/* 4. One-Time Capex / Funding */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: '#c9d1d9', fontWeight: 600 }}>One-Time Capital / Capex:</span>
            <span style={{ color: modifiers.oneTimeCapexCents > 0 ? '#f85149' : modifiers.oneTimeCapexCents < 0 ? '#3fb950' : '#8b949e', fontWeight: 700 }}>
              {modifiers.oneTimeCapexCents > 0
                ? `-$${(modifiers.oneTimeCapexCents / 100).toLocaleString()}`
                : modifiers.oneTimeCapexCents < 0
                ? `+$${(Math.abs(modifiers.oneTimeCapexCents) / 100).toLocaleString()}`
                : '$0'}
            </span>
          </div>
          <input
            type="range"
            min="-50000000"
            max="50000000"
            step="5000000"
            value={modifiers.oneTimeCapexCents}
            onChange={(e) => onChangeModifiers({ ...modifiers, name: undefined, oneTimeCapexCents: parseInt(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
            Negative: funding injection · Positive: major capex
          </div>
        </div>
      </div>

      {/* Comparison Impact Table */}
      <div style={{ backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d', color: '#8b949e' }}>
              <th style={{ padding: '10px 14px' }}>Metric</th>
              <th style={{ padding: '10px 14px' }}>Current Baseline</th>
              <th style={{ padding: '10px 14px' }}>Projected Scenario</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Net Delta</th>
            </tr>
          </thead>
          <tbody style={{ color: '#c9d1d9' }}>
            <tr style={{ borderBottom: '1px solid #21262d' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Runway Duration</td>
              <td style={{ padding: '10px 14px' }}>
                {comparison.baseline.isDefaultAlive ? 'Default Alive (∞)' : `${comparison.baseline.runwayMonths.toFixed(1)} mo`}
              </td>
              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f0f6fc' }}>
                {comparison.projected.isDefaultAlive ? 'Default Alive (∞)' : `${comparison.projected.runwayMonths.toFixed(1)} mo`}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: comparison.deltaRunwayMonths >= 0 ? '#3fb950' : '#f85149' }}>
                {comparison.deltaRunwayMonths >= 0 ? `+${comparison.deltaRunwayMonths.toFixed(1)} mo` : `${comparison.deltaRunwayMonths.toFixed(1)} mo`}
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid #21262d' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Net Monthly Burn</td>
              <td style={{ padding: '10px 14px' }}>{formatCurrency(comparison.baseline.netMonthlyBurnCents)}/mo</td>
              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f0f6fc' }}>
                {formatCurrency(comparison.projected.netMonthlyBurnCents)}/mo
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: comparison.deltaNetBurnCents <= 0 ? '#3fb950' : '#f85149' }}>
                {comparison.deltaNetBurnCents <= 0
                  ? `-${formatCurrency(Math.abs(comparison.deltaNetBurnCents))}`
                  : `+${formatCurrency(comparison.deltaNetBurnCents)}`}
              </td>
            </tr>

            <tr>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Liquid Cash Reserves</td>
              <td style={{ padding: '10px 14px' }}>{formatCurrency(comparison.baseline.totalCashCents)}</td>
              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f0f6fc' }}>
                {formatCurrency(comparison.projected.totalCashCents)}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: comparison.deltaCashCents >= 0 ? '#3fb950' : '#f85149' }}>
                {comparison.deltaCashCents >= 0
                  ? `+${formatCurrency(comparison.deltaCashCents)}`
                  : `-${formatCurrency(Math.abs(comparison.deltaCashCents))}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
