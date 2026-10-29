import React from 'react';
import { BusinessKpiSummary } from '../engine/types';
import { KpiCard } from './KpiCard';
import { formatCurrency } from '../engine/math';

interface KpiGridProps {
  kpis: BusinessKpiSummary;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
      {/* 1. MRR */}
      <KpiCard
        label="Monthly Recurring Rev (MRR)"
        value={formatCurrency(kpis.mrrCents)}
        subValue="Predictable SaaS"
        trend={kpis.mrrTrend}
        icon="💳"
        testId="kpi-mrr-card"
      />

      {/* 2. ARR */}
      <KpiCard
        label="Annual Run Rate (ARR)"
        value={formatCurrency(kpis.arrCents)}
        subValue="MRR × 12"
        trend={kpis.arrTrend}
        icon="🚀"
        testId="kpi-arr-card"
      />

      {/* 3. Gross Margin */}
      <KpiCard
        label="Gross Margin"
        value={`${kpis.grossMarginPercent.toFixed(1)}%`}
        subValue="Net of COGS"
        trend={kpis.grossMarginTrend}
        icon="📊"
        testId="kpi-gross-margin-card"
      />

      {/* 4. Total OpEx */}
      <KpiCard
        label="Total Monthly OpEx"
        value={formatCurrency(kpis.totalOpExCents)}
        subValue="Categorized"
        trend={kpis.opExTrend}
        icon="💼"
        testId="kpi-opex-card"
      />
    </div>
  );
};
