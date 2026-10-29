import {
  BaselineFinancials,
  Cents,
  RunwayResult,
  ScenarioModifiers,
  ScenarioComparisonResult,
} from './types';
import {
  assertInteger,
  addCents,
  subCents,
  applyBasisPoints,
  calculateDateOffsetMonths,
} from './math';

export const SCENARIO_PRESETS: Record<'HIRING_FREEZE' | 'GROWTH_PUSH' | 'EXPENSE_REDUCTION', ScenarioModifiers> = {
  HIRING_FREEZE: {
    name: 'Hiring Freeze',
    hiringDeltaCount: 0,
    costPerHireMonthlyCents: 1_250_000, // $12,500/mo
    revenueGrowthRateBps: 0,
    expenseReductionBps: 0,
    oneTimeCapexCents: 0,
  },
  GROWTH_PUSH: {
    name: 'Growth Push',
    hiringDeltaCount: 2,               // +2 Senior Engineers
    costPerHireMonthlyCents: 1_250_000, // +$25,000/mo OpEx
    revenueGrowthRateBps: 2500,        // +25% revenue acceleration
    expenseReductionBps: 0,
    oneTimeCapexCents: 5_000_000,       // $50,000 upfront capex
  },
  EXPENSE_REDUCTION: {
    name: 'Expense Reduction',
    hiringDeltaCount: -1,              // Freeze / attrite 1 contractor
    costPerHireMonthlyCents: 1_250_000,
    revenueGrowthRateBps: 0,
    expenseReductionBps: 2000,         // 20% cut across non-payroll OpEx
    oneTimeCapexCents: 0,
  },
};

export function calculateRunway(data: BaselineFinancials): RunwayResult {
  // 1. Total Cash Balance
  const totalCashCents = data.accounts.reduce<Cents>((sum, acc) => {
    assertInteger(acc.balanceCents, `account balance ${acc.id}`);
    return addCents(sum, acc.balanceCents);
  }, 0);

  // 2. Gross Monthly Burn (Total Operating Expenses)
  const grossMonthlyBurnCents = data.expenses.reduce<Cents>((sum, exp) => {
    assertInteger(exp.monthlyAmountCents, `expense amount ${exp.id}`);
    return addCents(sum, exp.monthlyAmountCents);
  }, 0);

  // 3. Gross Monthly Revenue
  const monthlyRevenueCents = data.revenues.reduce<Cents>((sum, rev) => {
    const revTotal = addCents(rev.monthlyRecurringCents, rev.nonRecurringCents);
    return addCents(sum, revTotal);
  }, 0);

  // 4. Net Monthly Burn Rate
  const netMonthlyBurnCents = subCents(grossMonthlyBurnCents, monthlyRevenueCents);
  const isDefaultAlive = netMonthlyBurnCents <= 0;

  // 5. Runway in Months
  let runwayMonths: number;
  if (totalCashCents <= 0) {
    runwayMonths = 0;
  } else if (isDefaultAlive) {
    runwayMonths = Infinity;
  } else {
    // Round to 1 decimal place for UI presentation, keep float
    const rawMonths = totalCashCents / netMonthlyBurnCents;
    runwayMonths = Math.round(rawMonths * 10) / 10;
  }

  // 6. Projected Zero Date
  let runwayZeroDate: string | null = null;
  if (!isDefaultAlive && runwayMonths > 0) {
    runwayZeroDate = calculateDateOffsetMonths(data.referenceDate, runwayMonths);
  } else if (totalCashCents <= 0) {
    runwayZeroDate = data.referenceDate;
  }

  return {
    totalCashCents,
    grossMonthlyBurnCents,
    monthlyRevenueCents,
    netMonthlyBurnCents,
    runwayMonths,
    runwayZeroDate,
    isDefaultAlive,
  };
}

export function simulateScenario(
  baselineData: BaselineFinancials,
  modifiers: ScenarioModifiers
): ScenarioComparisonResult {
  const baseline = calculateRunway(baselineData);

  // 1. Adjusted Cash (Cash - OneTimeCapex)
  const adjCashCents = Math.max(
    0,
    subCents(baseline.totalCashCents, modifiers.oneTimeCapexCents)
  );

  // 2. Adjusted Revenues
  const adjRevenueCents = baselineData.revenues.reduce<Cents>((sum, rev) => {
    const totalRev = addCents(rev.monthlyRecurringCents, rev.nonRecurringCents);
    const growthCents = applyBasisPoints(totalRev, modifiers.revenueGrowthRateBps);
    const adjusted = Math.max(0, addCents(totalRev, growthCents));
    return addCents(sum, adjusted);
  }, 0);

  // 3. Adjusted Expenses (Payroll + Non-Payroll with modifiers)
  let adjPayrollCents: Cents = 0;
  let adjNonPayrollCents: Cents = 0;

  for (const exp of baselineData.expenses) {
    if (exp.isPayroll) {
      adjPayrollCents = addCents(adjPayrollCents, exp.monthlyAmountCents);
    } else {
      const cutCents = applyBasisPoints(exp.monthlyAmountCents, modifiers.expenseReductionBps);
      const remaining = Math.max(0, subCents(exp.monthlyAmountCents, cutCents));
      adjNonPayrollCents = addCents(adjNonPayrollCents, remaining);
    }
  }

  // Add hiring impact to payroll
  const hiringImpactCents = modifiers.hiringDeltaCount * modifiers.costPerHireMonthlyCents;
  adjPayrollCents = Math.max(0, adjPayrollCents + hiringImpactCents);

  const adjGrossBurnCents = addCents(adjPayrollCents, adjNonPayrollCents);
  const adjNetBurnCents = subCents(adjGrossBurnCents, adjRevenueCents);
  const isDefaultAlive = adjNetBurnCents <= 0;

  let adjRunwayMonths: number;
  if (adjCashCents <= 0) {
    adjRunwayMonths = 0;
  } else if (isDefaultAlive) {
    adjRunwayMonths = Infinity;
  } else {
    const raw = adjCashCents / adjNetBurnCents;
    adjRunwayMonths = Math.round(raw * 10) / 10;
  }

  let adjZeroDate: string | null = null;
  if (!isDefaultAlive && adjRunwayMonths > 0) {
    adjZeroDate = calculateDateOffsetMonths(baselineData.referenceDate, adjRunwayMonths);
  } else if (adjCashCents <= 0) {
    adjZeroDate = baselineData.referenceDate;
  }

  const projected: RunwayResult = {
    totalCashCents: adjCashCents,
    grossMonthlyBurnCents: adjGrossBurnCents,
    monthlyRevenueCents: adjRevenueCents,
    netMonthlyBurnCents: adjNetBurnCents,
    runwayMonths: adjRunwayMonths,
    runwayZeroDate: adjZeroDate,
    isDefaultAlive,
  };

  const deltaRunwayMonths = (isFinite(projected.runwayMonths) && isFinite(baseline.runwayMonths))
    ? Math.round((projected.runwayMonths - baseline.runwayMonths) * 10) / 10
    : (projected.runwayMonths === Infinity ? 999 : -999);

  return {
    baseline,
    projected,
    deltaRunwayMonths,
    deltaNetBurnCents: subCents(projected.netMonthlyBurnCents, baseline.netMonthlyBurnCents),
    deltaCashCents: subCents(projected.totalCashCents, baseline.totalCashCents),
    activePresetName: modifiers.name,
  };
}
