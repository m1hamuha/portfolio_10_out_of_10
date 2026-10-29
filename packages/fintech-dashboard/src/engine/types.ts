export type Cents = number; // Integer invariant: Number.isInteger(cents) === true
export type BasisPoints = number; // 100 bps = 1.00%

export type AccountType = 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET' | 'TREASURY';

export interface FinancialAccount {
  readonly id: string;
  readonly name: string;
  readonly institution: string;
  readonly type: AccountType;
  readonly balanceCents: Cents;
  readonly currency: 'USD' | 'EUR' | 'GBP';
}

export type ExpenseCategoryType =
  | 'R_AND_D'              // Engineering, Product, Cloud Hosting (Dev)
  | 'SALES_AND_MARKETING'  // Ad Spend, Sales Commissions, Marketing Tools
  | 'GENERAL_AND_ADMIN'    // Legal, Finance, Office, Executive Payroll
  | 'OPERATIONS_SUPPORT';  // Customer Success, Support Systems, Tooling

export interface ExpenseItem {
  readonly id: string;
  readonly name: string;
  readonly category: ExpenseCategoryType;
  readonly monthlyAmountCents: Cents;
  readonly isPayroll: boolean;
}

export interface RevenueStream {
  readonly id: string;
  readonly name: string;
  readonly monthlyRecurringCents: Cents; // MRR component
  readonly nonRecurringCents: Cents;     // One-off services, setup fees
}

export interface BaselineFinancials {
  readonly referenceDate: string; // ISO date string e.g. "2026-10-01"
  readonly accounts: readonly FinancialAccount[];
  readonly revenues: readonly RevenueStream[];
  readonly expenses: readonly ExpenseItem[];
  readonly cogsCents: Cents; // Cost of Goods Sold (hosting, payment gateway fees)
  readonly priorMonthMetrics?: {
    readonly mrrCents: Cents;
    readonly revenueCents: Cents;
    readonly totalOpExCents: Cents;
    readonly grossMarginBps: number;
  };
}

export interface RunwayResult {
  readonly totalCashCents: Cents;
  readonly grossMonthlyBurnCents: Cents;
  readonly monthlyRevenueCents: Cents;
  readonly netMonthlyBurnCents: Cents; // GrossBurn - Revenue (can be negative if cash positive)
  readonly runwayMonths: number;      // e.g. 14.2, 0 if cash <= 0, Infinity if net burn <= 0
  readonly runwayZeroDate: string | null; // ISO YYYY-MM-DD or null if Default Alive
  readonly isDefaultAlive: boolean;    // true when netMonthlyBurnCents <= 0
}

export interface ScenarioModifiers {
  readonly hiringDeltaCount: number;     // e.g. -2, 0, +2
  readonly costPerHireMonthlyCents: Cents; // e.g. 1_250_000 ($12,500/mo)
  readonly revenueGrowthRateBps: number; // basis points, e.g. +2500 (+25%), -1000 (-10%)
  readonly expenseReductionBps: number;  // non-payroll cut basis points, e.g. 2000 (20%)
  readonly oneTimeCapexCents: Cents;     // upfront expense (cash reduction) or negative (injection)
  readonly name?: string;
}

export interface ScenarioComparisonResult {
  readonly baseline: RunwayResult;
  readonly projected: RunwayResult;
  readonly deltaRunwayMonths: number;   // projected.runwayMonths - baseline.runwayMonths
  readonly deltaNetBurnCents: Cents;    // projected.netMonthlyBurnCents - baseline.netMonthlyBurnCents
  readonly deltaCashCents: Cents;
  readonly activePresetName?: string;
}

export type TrendDirection = 'UP' | 'DOWN' | 'FLAT';

export interface TrendMetric {
  readonly current: number;
  readonly prior: number;
  readonly delta: number;
  readonly percentChange: number; // e.g. +14.5%
  readonly direction: TrendDirection;
  readonly isFavorable: boolean;  // true if revenue/margin went UP, or expenses went DOWN
}

export interface OpExCategoryBreakdown {
  readonly category: ExpenseCategoryType;
  readonly label: string;
  readonly amountCents: Cents;
  readonly percentage: number;    // e.g. 48.5 (%)
}

export interface BusinessKpiSummary {
  readonly mrrCents: Cents;
  readonly mrrTrend: TrendMetric;
  readonly arrCents: Cents;
  readonly arrTrend: TrendMetric;
  readonly grossMarginPercent: number; // e.g. 82.5 (%)
  readonly grossMarginTrend: TrendMetric;
  readonly totalOpExCents: Cents;
  readonly opExTrend: TrendMetric;
  readonly opExCategories: readonly OpExCategoryBreakdown[];
  readonly netCashFlowCents: Cents;
}

export type RunwayStatus = 'CRITICAL' | 'CAUTION' | 'HEALTHY' | 'DEFAULT_ALIVE';

export interface ExpenseBreakdown {
  payrollCents: Cents;
  cloudInfraCents: Cents;
  softwareToolingCents: Cents;
  marketingSalesCents: Cents;
  officeMiscCents: Cents;
}

export interface StartupPreset {
  id: 'seed-emergency' | 'series-a-scaleup' | 'bootstrapped-alive';
  name: string;
  badgeLabel: string;
  tagline: string;
  companyName: string;
  stageDescription: string;
  cashBalanceCents: Cents;
  mrrCents: Cents;
  grossMarginBps: BasisPoints;
  expenses: ExpenseBreakdown;
  headcount: number;
  expectedRunwayMonths: number;
  status: RunwayStatus;
  keyChallenge: string;
  recommendedFocus: string;
}

export interface CoachContext {
  cashBalanceCents: Cents;
  mrrCents: Cents;
  arrCents: Cents;
  monthlyExpensesCents: Cents;
  netBurnCents: Cents;
  runwayMonths: number;
  grossMarginBps: BasisPoints;
  status: RunwayStatus;
  activePresetName: string;
  scenario?: ScenarioModifiers;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isSimulated?: boolean;
  modelUsed?: string;
}
