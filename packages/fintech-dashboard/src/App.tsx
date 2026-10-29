import React, { useState, useMemo } from 'react';
import {
  StartupPreset,
  ScenarioModifiers,
  CoachContext,
} from './engine/types';
import {
  SEED_EMERGENCY_PRESET,
  presetToBaselineFinancials,
} from './engine/presets';
import {
  calculateRunway,
  simulateScenario,
} from './engine/runway';
import { calculateBusinessKpis } from './engine/kpis';
import { PresetsBar } from './components/PresetsBar';
import { RunwayCard } from './components/RunwayCard';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { KpiGrid } from './components/KpiGrid';
import { OpExBreakdownCard } from './components/OpExBreakdownCard';
import { AiCoachDrawer } from './components/AiCoachDrawer';

export function App() {
  const [activePreset, setActivePreset] = useState<StartupPreset>(SEED_EMERGENCY_PRESET);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const [modifiers, setModifiers] = useState<ScenarioModifiers>({
    hiringDeltaCount: 0,
    costPerHireMonthlyCents: 1_250_000,
    revenueGrowthRateBps: 0,
    expenseReductionBps: 0,
    oneTimeCapexCents: 0,
  });

  // Re-derive financial baseline from active preset
  const baseline = useMemo(() => {
    return presetToBaselineFinancials(activePreset);
  }, [activePreset]);

  // Real-time deterministic runway calculation
  const runway = useMemo(() => {
    return calculateRunway(baseline);
  }, [baseline]);

  // Real-time deterministic scenario projection
  const scenarioComparison = useMemo(() => {
    return simulateScenario(baseline, modifiers);
  }, [baseline, modifiers]);

  // Real-time business KPIs with MoM trends
  const kpis = useMemo(() => {
    return calculateBusinessKpis(baseline);
  }, [baseline]);

  // Coach Context for AI Copilot (Dual-mode live/deterministic fallback)
  const coachContext: CoachContext = useMemo(() => {
    return {
      cashBalanceCents: scenarioComparison.projected.totalCashCents,
      mrrCents: scenarioComparison.projected.monthlyRevenueCents,
      arrCents: scenarioComparison.projected.monthlyRevenueCents * 12,
      monthlyExpensesCents: scenarioComparison.projected.grossMonthlyBurnCents,
      netBurnCents: scenarioComparison.projected.netMonthlyBurnCents,
      runwayMonths: scenarioComparison.projected.runwayMonths,
      grossMarginBps: activePreset.grossMarginBps,
      status: scenarioComparison.projected.isDefaultAlive ? 'DEFAULT_ALIVE' : activePreset.status,
      activePresetName: activePreset.name,
      scenario: modifiers,
    };
  }, [scenarioComparison, activePreset, modifiers]);

  const handleSelectPreset = (preset: StartupPreset) => {
    setActivePreset(preset);
    // Reset modifiers when preset changes
    setModifiers({
      name: undefined,
      hiringDeltaCount: 0,
      costPerHireMonthlyCents: 1_250_000,
      revenueGrowthRateBps: 0,
      expenseReductionBps: 0,
      oneTimeCapexCents: 0,
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d1117', color: '#f0f6fc', paddingBottom: 60 }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid #30363d',
          backgroundColor: '#161b22',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#238636',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              📈
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Fintech Analytics & Real-Time Runway Intelligence
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(56, 139, 253, 0.15)',
                    color: '#58a6ff',
                    border: '1px solid rgba(56, 139, 253, 0.4)',
                  }}
                >
                  Integer Cents
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#8b949e' }}>
                Deterministic Cash Burn Model · Resilient Dual-Mode AI Coach (F33–F37)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              data-testid="open-ai-coach-btn"
              onClick={() => setIsCoachOpen(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1f6feb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(31, 111, 235, 0.4)',
              }}
            >
              <span>🤖</span>
              <span>Open AI Copilot</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
        {/* 1. 1-Click Employer Demonstration Presets (F37) */}
        <PresetsBar
          activePresetId={activePreset.id}
          onSelectPreset={handleSelectPreset}
        />

        {/* 2. Hero Runway Card with Live Zero Date & Delta (F34) */}
        <RunwayCard
          runway={scenarioComparison.projected}
          status={scenarioComparison.projected.isDefaultAlive ? 'DEFAULT_ALIVE' : activePreset.status}
          deltaRunwayMonths={scenarioComparison.deltaRunwayMonths}
        />

        {/* 3. Core Business KPIs with MoM Trends (F35) */}
        <KpiGrid kpis={kpis} />

        {/* 4. OpEx Breakdown (F35) */}
        <OpExBreakdownCard categories={kpis.opExCategories} />

        {/* 5. Interactive Scenario Simulator (F34) */}
        <ScenarioSimulator
          modifiers={modifiers}
          onChangeModifiers={setModifiers}
          comparison={scenarioComparison}
        />
      </main>

      {/* Slide-over Embedded AI Copilot Coach Drawer (F36) */}
      <AiCoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        context={coachContext}
      />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #21262d', padding: '24px', textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span>Fintech Intelligence Engine · Zero Server Data Exfiltration · Integer-Cent Precision</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="https://m1hamuha.github.io/portfolio/" target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 600 }}>
              ← Central Portfolio Hub
            </a>
            <span>·</span>
            <a href="https://github.com/m1hamuha/portfolio_10_out_of_10" target="_blank" rel="noreferrer" style={{ color: '#8b949e', textDecoration: 'none' }}>
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
