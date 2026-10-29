import { describe, it, expect } from 'vitest';
import { calculateBusinessKpis } from '../src/engine/kpis';
import { BaselineFinancials } from '../src/engine/types';

describe('Feature F35: Core Business KPIs Engine Tests', () => {
  const sampleFinancials: BaselineFinancials = {
    referenceDate: '2026-10-01',
    accounts: [
      { id: 'a1', name: 'Operating', institution: 'SVB', type: 'CHECKING', balanceCents: 50_000_000, currency: 'USD' },
    ],
    revenues: [
      { id: 'r1', name: 'Subscription MRR', monthlyRecurringCents: 8_500_000, nonRecurringCents: 0 }, // $85,000 MRR
    ],
    expenses: [
      { id: 'e1', name: 'Engineering', category: 'R_AND_D', monthlyAmountCents: 3_500_000, isPayroll: true }, // $35k
      { id: 'e2', name: 'Marketing', category: 'SALES_AND_MARKETING', monthlyAmountCents: 1_500_000, isPayroll: false }, // $15k
      { id: 'e3', name: 'Legal/Admin', category: 'GENERAL_AND_ADMIN', monthlyAmountCents: 1_000_000, isPayroll: false }, // $10k
      { id: 'e4', name: 'Customer Success', category: 'OPERATIONS_SUPPORT', monthlyAmountCents: 1_000_000, isPayroll: true }, // $10k
    ],
    cogsCents: 1_020_000, // $10,200 (12.0% of revenue)
    priorMonthMetrics: {
      mrrCents: 7_500_000, // Prior $75,000 (+13.3%)
      revenueCents: 7_500_000,
      totalOpExCents: 6_500_000, // Prior $65,000 -> Current $70,000 (+7.7% expense increase)
      grossMarginBps: 8500, // Prior 85.0%
    },
  };

  it('calculates MRR and annualized ARR accurately in integer cents', () => {
    const kpis = calculateBusinessKpis(sampleFinancials);
    expect(kpis.mrrCents).toBe(8_500_000);
    expect(kpis.arrCents).toBe(102_000_000); // $1,020,000 ARR
  });

  it('calculates Gross Margin % net of COGS', () => {
    const kpis = calculateBusinessKpis(sampleFinancials);
    // (85k - 10.2k) / 85k = 74.8k / 85k = 88.0%
    expect(kpis.grossMarginPercent).toBe(88.0);
  });

  it('categorizes OpEx across 4 distinct standard operational categories', () => {
    const kpis = calculateBusinessKpis(sampleFinancials);
    // Total: 35k + 15k + 10k + 10k = $70k (7,000,000 cents)
    expect(kpis.totalOpExCents).toBe(7_000_000);
    expect(kpis.opExCategories).toHaveLength(4);

    const sumPercentages = kpis.opExCategories.reduce((sum, c) => sum + c.percentage, 0);
    expect(Math.round(sumPercentages)).toBe(100);
  });

  it('computes MoM trend metrics with directional indicators', () => {
    const kpis = calculateBusinessKpis(sampleFinancials);

    // MRR went from 75k to 85k (+13.3%) -> UP & favorable
    expect(kpis.mrrTrend.direction).toBe('UP');
    expect(kpis.mrrTrend.isFavorable).toBe(true);
    expect(kpis.mrrTrend.percentChange).toBe(13.3);

    // OpEx went from 65k to 70k (+7.7%) -> UP but UNFAVORABLE (higher expense is bad)
    expect(kpis.opExTrend.direction).toBe('UP');
    expect(kpis.opExTrend.isFavorable).toBe(false);
  });

  it('calculates net cash flow accurately', () => {
    const kpis = calculateBusinessKpis(sampleFinancials);
    // 85k rev - 70k expenses = +15k cash flow (1,500,000 cents)
    expect(kpis.netCashFlowCents).toBe(1_500_000);
  });

  it('handles zero revenue and downward trends safely', () => {
    const zeroRevData: BaselineFinancials = {
      ...sampleFinancials,
      revenues: [],
      priorMonthMetrics: {
        mrrCents: 5_000_000,
        revenueCents: 5_000_000,
        totalOpExCents: 0,
        grossMarginBps: 0,
      },
    };
    const kpis = calculateBusinessKpis(zeroRevData);
    expect(kpis.mrrCents).toBe(0);
    expect(kpis.grossMarginPercent).toBe(0);
    expect(kpis.mrrTrend.direction).toBe('DOWN');
    expect(kpis.mrrTrend.isFavorable).toBe(false);
  });
});

