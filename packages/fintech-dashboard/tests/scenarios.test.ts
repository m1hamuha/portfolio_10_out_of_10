import { describe, it, expect } from 'vitest';
import { simulateScenario, SCENARIO_PRESETS } from '../src/engine/runway';
import { BaselineFinancials } from '../src/engine/types';

describe('Feature F34: Interactive Scenario Simulator Tests', () => {
  const sampleFinancials: BaselineFinancials = {
    referenceDate: '2026-10-01',
    accounts: [
      { id: 'a1', name: 'Operating', institution: 'SVB', type: 'CHECKING', balanceCents: 100_000_000, currency: 'USD' }, // $1M
    ],
    revenues: [
      { id: 'r1', name: 'MRR', monthlyRecurringCents: 4_000_000, nonRecurringCents: 0 }, // $40k
    ],
    expenses: [
      { id: 'e1', name: 'Payroll', category: 'GENERAL_AND_ADMIN', monthlyAmountCents: 8_000_000, isPayroll: true }, // $80k
      { id: 'e2', name: 'Non-Payroll', category: 'R_AND_D', monthlyAmountCents: 4_000_000, isPayroll: false }, // $40k
    ],
    cogsCents: 500_000,
  };

  it('applies Hiring Freeze preset preserving baseline runway', () => {
    const res = simulateScenario(sampleFinancials, SCENARIO_PRESETS.HIRING_FREEZE);
    expect(res.projected.runwayMonths).toBe(res.baseline.runwayMonths);
    expect(res.deltaRunwayMonths).toBe(0);
    expect(res.deltaNetBurnCents).toBe(0);
  });

  it('applies Growth Push (+2 Devs, +25% Rev, $50k Capex)', () => {
    const res = simulateScenario(sampleFinancials, SCENARIO_PRESETS.GROWTH_PUSH);

    // Baseline Cash was $1M; $50k capex reduces cash to $950k (95,000,000 cents)
    expect(res.projected.totalCashCents).toBe(95_000_000);

    // +2 hires adds 2 * 12.5k = $25,000/mo (2,500,000 cents)
    // +25% rev on 40k = +$10,000/mo (1,000,000 cents) -> 5,000,000 cents rev
    // Total exp: 80k + 25k + 40k = 145k (14,500,000 cents)
    // Net burn: 145k - 50k = 95k (9,500,000 cents)
    expect(res.projected.netMonthlyBurnCents).toBe(9_500_000);

    // Projected runway: 950k / 95k = 10.0 months
    expect(res.projected.runwayMonths).toBe(10.0);
    // Baseline was 1,000k / 80k = 12.5 months -> Delta: -2.5 months
    expect(res.deltaRunwayMonths).toBe(-2.5);
  });

  it('applies Expense Reduction preset extending runway', () => {
    const res = simulateScenario(sampleFinancials, SCENARIO_PRESETS.EXPENSE_REDUCTION);

    // -1 hire: payroll drops from 80k to 67.5k (-1,250,000 cents)
    // -20% non-payroll: 40k drops to 32k (-800,000 cents)
    // Total exp: 67.5k + 32k = 99.5k (9,950,000 cents)
    // Net burn: 99.5k - 40k = 59.5k (5,950,000 cents)
    expect(res.projected.netMonthlyBurnCents).toBe(5_950_000);

    // Projected runway: 1,000k / 59.5k = 16.8 months
    expect(res.projected.runwayMonths).toBe(16.8);
    expect(res.deltaRunwayMonths).toBeGreaterThan(0);
  });

  it('handles funding injection via negative one-time capex', () => {
    const fundingRound = {
      ...SCENARIO_PRESETS.HIRING_FREEZE,
      oneTimeCapexCents: -200_000_000, // +$2.0M funding round
    };
    const res = simulateScenario(sampleFinancials, fundingRound);
    // Cash increases from $1M to $3M
    expect(res.projected.totalCashCents).toBe(300_000_000);
    expect(res.projected.runwayMonths).toBe(37.5);
    expect(res.deltaRunwayMonths).toBe(25.0);
  });

  it('handles transition from cash burn to Default Alive via high revenue growth', () => {
    const massiveGrowth = {
      ...SCENARIO_PRESETS.HIRING_FREEZE,
      revenueGrowthRateBps: 25000, // +250% revenue growth
    };
    const res = simulateScenario(sampleFinancials, massiveGrowth);
    expect(res.projected.isDefaultAlive).toBe(true);
    expect(res.projected.runwayMonths).toBe(Infinity);
  });
});
