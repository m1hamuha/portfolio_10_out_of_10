import { describe, it, expect } from 'vitest';
import { calculateRunway } from '../src/engine/runway';
import {
  assertInteger,
  addCents,
  subCents,
  toCents,
  toDollars,
  applyBasisPoints,
  formatCurrency,
  calculateDateOffsetMonths,
} from '../src/engine/math';
import { BaselineFinancials } from '../src/engine/types';

describe('Feature F34: Deterministic Runway & Burn Engine', () => {
  const sampleFinancials: BaselineFinancials = {
    referenceDate: '2026-10-01',
    accounts: [
      { id: 'a1', name: 'Checking', institution: 'SVB', type: 'CHECKING', balanceCents: 15_000_000, currency: 'USD' }, // $150k
      { id: 'a2', name: 'Treasury', institution: 'Mercury', type: 'TREASURY', balanceCents: 85_000_000, currency: 'USD' }, // $850k
    ],
    revenues: [
      { id: 'r1', name: 'Subscriptions', monthlyRecurringCents: 4_000_000, nonRecurringCents: 0 }, // $40k/mo
    ],
    expenses: [
      { id: 'e1', name: 'Engineering Team', category: 'GENERAL_AND_ADMIN', monthlyAmountCents: 8_000_000, isPayroll: true }, // $80k
      { id: 'e2', name: 'Cloud Infra', category: 'R_AND_D', monthlyAmountCents: 4_000_000, isPayroll: false }, // $40k
    ],
    cogsCents: 500_000,
  };

  it('calculates total cash balance across accounts in integer cents', () => {
    const res = calculateRunway(sampleFinancials);
    // 150k + 850k = $1,000,000.00 -> 100,000,000 cents
    expect(res.totalCashCents).toBe(100_000_000);
  });

  it('calculates gross burn and net burn accurately', () => {
    const res = calculateRunway(sampleFinancials);
    // Gross burn: 80k + 40k = 120,000.00 -> 12,000,000 cents
    expect(res.grossMonthlyBurnCents).toBe(12_000_000);
    // Revenue: 40k -> 4,000,000 cents
    expect(res.monthlyRevenueCents).toBe(4_000_000);
    // Net burn: 120k - 40k = 80,000.00 -> 8,000,000 cents
    expect(res.netMonthlyBurnCents).toBe(8_000_000);
  });

  it('calculates runway in months rounded to 1 decimal place', () => {
    const res = calculateRunway(sampleFinancials);
    // Cash: 1,000,000 / Net burn: 80,000 = 12.5 months
    expect(res.runwayMonths).toBe(12.5);
    expect(res.isDefaultAlive).toBe(false);
  });

  it('projects zero date accurately based on reference date and runway', () => {
    const res = calculateRunway(sampleFinancials);
    expect(res.runwayZeroDate).toBeTruthy();
    expect(res.runwayZeroDate).toMatch(/^2027-/);
  });

  it('detects Default Alive when revenue exceeds gross operating burn', () => {
    const profitableData: BaselineFinancials = {
      ...sampleFinancials,
      revenues: [
        { id: 'r1', name: 'Enterprise Subscriptions', monthlyRecurringCents: 15_000_000, nonRecurringCents: 0 }, // $150k/mo
      ],
    };
    const res = calculateRunway(profitableData);
    // Revenue 150k > Gross burn 120k -> Net burn -30k
    expect(res.netMonthlyBurnCents).toBe(-3_000_000);
    expect(res.isDefaultAlive).toBe(true);
    expect(res.runwayMonths).toBe(Infinity);
    expect(res.runwayZeroDate).toBeNull();
  });

  it('handles zero cash balance correctly', () => {
    const zeroCashData: BaselineFinancials = {
      ...sampleFinancials,
      accounts: [
        { id: 'a1', name: 'Empty', institution: 'Bank', type: 'CHECKING', balanceCents: 0, currency: 'USD' },
      ],
    };
    const res = calculateRunway(zeroCashData);
    expect(res.totalCashCents).toBe(0);
    expect(res.runwayMonths).toBe(0);
    expect(res.runwayZeroDate).toBe('2026-10-01');
  });

  it('handles exact break-even (net burn = 0) as Default Alive', () => {
    const breakEvenData: BaselineFinancials = {
      ...sampleFinancials,
      revenues: [
        { id: 'r1', name: 'Rev', monthlyRecurringCents: 12_000_000, nonRecurringCents: 0 }, // $120k/mo matching 120k expenses
      ],
    };
    const res = calculateRunway(breakEvenData);
    expect(res.netMonthlyBurnCents).toBe(0);
    expect(res.isDefaultAlive).toBe(true);
    expect(res.runwayMonths).toBe(Infinity);
  });

  it('handles large multi-million enterprise valuations without integer overflow', () => {
    const enterpriseData: BaselineFinancials = {
      ...sampleFinancials,
      accounts: [
        { id: 'a1', name: 'Treasury', institution: 'Goldman', type: 'TREASURY', balanceCents: 8_500_000_000, currency: 'USD' }, // $85M
      ],
    };
    const res = calculateRunway(enterpriseData);
    expect(res.totalCashCents).toBe(8_500_000_000);
    expect(Number.isSafeInteger(res.totalCashCents)).toBe(true);
  });
});

describe('Integer-Cent Math Utilities', () => {
  it('assertInteger verifies integer invariant', () => {
    expect(() => assertInteger(100, 'cents')).not.toThrow();
    expect(() => assertInteger(12.5, 'cents')).toThrow(/Invariant Violation/);
  });

  it('converts dollars to cents and vice versa', () => {
    expect(toCents(12.5)).toBe(1250);
    expect(toDollars(1250)).toBe(12.5);
  });

  it('adds and subtracts cents safely', () => {
    expect(addCents(500, 250)).toBe(750);
    expect(subCents(1000, 300)).toBe(700);
  });

  it('applies basis points deterministically', () => {
    expect(applyBasisPoints(10000, 2500)).toBe(2500); // 25% of 100.00
  });

  it('formats currency with negative and positive signs', () => {
    expect(formatCurrency(125000)).toBe('$1,250');
    expect(formatCurrency(-50000)).toBe('-$500');
    expect(formatCurrency(125050)).toBe('$1,250.50');
  });

  it('calculates date offsets deterministically', () => {
    expect(calculateDateOffsetMonths('2026-10-01', 6)).toMatch(/^2027-/);
    expect(calculateDateOffsetMonths('2026-10-01', 0)).toBeNull();
    expect(calculateDateOffsetMonths('2026-10-01', Infinity)).toBeNull();
  });
});
