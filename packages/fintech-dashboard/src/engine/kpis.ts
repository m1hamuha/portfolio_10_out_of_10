import {
  BaselineFinancials,
  Cents,
  ExpenseCategoryType,
  BusinessKpiSummary,
  TrendMetric,
  TrendDirection,
  OpExCategoryBreakdown,
} from './types';
import { assertInteger, addCents, subCents } from './math';

const CATEGORY_LABELS: Record<ExpenseCategoryType, string> = {
  R_AND_D: 'R&D / Engineering',
  SALES_AND_MARKETING: 'Sales & Marketing',
  GENERAL_AND_ADMIN: 'General & Administrative',
  OPERATIONS_SUPPORT: 'Operations & Customer Success',
};

function computeTrend(
  current: number,
  prior: number,
  higherIsBetter = true
): TrendMetric {
  const delta = current - prior;
  let percentChange = 0;
  if (prior !== 0) {
    percentChange = Math.round((delta / Math.abs(prior)) * 1000) / 10;
  }
  const direction: TrendDirection = delta > 0 ? 'UP' : delta < 0 ? 'DOWN' : 'FLAT';
  const isFavorable = higherIsBetter ? delta >= 0 : delta <= 0;

  return {
    current,
    prior,
    delta,
    percentChange,
    direction,
    isFavorable,
  };
}

export function calculateBusinessKpis(data: BaselineFinancials): BusinessKpiSummary {
  // 1. Monthly Recurring Revenue (MRR)
  const mrrCents = data.revenues.reduce<Cents>((sum, rev) => {
    assertInteger(rev.monthlyRecurringCents, `MRR stream ${rev.id}`);
    return addCents(sum, rev.monthlyRecurringCents);
  }, 0);

  // 2. Annual Run Rate (ARR = MRR * 12)
  const arrCents = mrrCents * 12;

  // 3. Gross Margin %: (Total Revenue - COGS) / Total Revenue
  const totalRevenueCents = data.revenues.reduce<Cents>((sum, rev) => {
    return addCents(sum, addCents(rev.monthlyRecurringCents, rev.nonRecurringCents));
  }, 0);

  const grossProfitCents = subCents(totalRevenueCents, data.cogsCents);
  const grossMarginPercent = totalRevenueCents > 0
    ? Math.round((grossProfitCents / totalRevenueCents) * 1000) / 10
    : 0;

  // 4. OpEx Breakdown by Category
  const categorySums: Record<ExpenseCategoryType, Cents> = {
    R_AND_D: 0,
    SALES_AND_MARKETING: 0,
    GENERAL_AND_ADMIN: 0,
    OPERATIONS_SUPPORT: 0,
  };

  let totalOpExCents: Cents = 0;
  for (const exp of data.expenses) {
    assertInteger(exp.monthlyAmountCents, `expense amount ${exp.id}`);
    categorySums[exp.category] = addCents(categorySums[exp.category], exp.monthlyAmountCents);
    totalOpExCents = addCents(totalOpExCents, exp.monthlyAmountCents);
  }

  const opExCategories: OpExCategoryBreakdown[] = Object.entries(categorySums).map(
    ([cat, amountCents]) => {
      const category = cat as ExpenseCategoryType;
      const percentage = totalOpExCents > 0
        ? Math.round((amountCents / totalOpExCents) * 1000) / 10
        : 0;
      return {
        category,
        label: CATEGORY_LABELS[category],
        amountCents,
        percentage,
      };
    }
  );

  // 5. Prior Month Trends
  const prior = data.priorMonthMetrics;
  const priorMrr = prior?.mrrCents ?? mrrCents;
  const priorArr = priorMrr * 12;
  const priorGrossMargin = prior?.grossMarginBps ? prior.grossMarginBps / 100 : grossMarginPercent;
  const priorOpEx = prior?.totalOpExCents ?? totalOpExCents;

  const mrrTrend = computeTrend(mrrCents, priorMrr, true);
  const arrTrend = computeTrend(arrCents, priorArr, true);
  const grossMarginTrend = computeTrend(grossMarginPercent, priorGrossMargin, true);
  const opExTrend = computeTrend(totalOpExCents, priorOpEx, false); // lower expense is favorable

  const netCashFlowCents = subCents(totalRevenueCents, totalOpExCents);

  return {
    mrrCents,
    mrrTrend,
    arrCents,
    arrTrend,
    grossMarginPercent,
    grossMarginTrend,
    totalOpExCents,
    opExTrend,
    opExCategories,
    netCashFlowCents,
  };
}
