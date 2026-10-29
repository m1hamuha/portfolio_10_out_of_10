import { StartupPreset, BaselineFinancials, FinancialAccount, ExpenseItem, RevenueStream } from './types';
export type { StartupPreset } from './types';

export const SEED_EMERGENCY_PRESET: StartupPreset = {
  id: 'seed-emergency',
  name: 'Seed Stage Runway Emergency',
  badgeLabel: '⚡ 3.6 Mo Runway',
  tagline: 'High burn post-seed with <4 months cash remaining',
  companyName: 'Apex AI, Inc.',
  stageDescription: 'Seed ($1.5M raised, $180k remaining)',
  cashBalanceCents: 18_000_000, // $180,000
  mrrCents: 1_200_000,          // $12,000/mo (ARR: $144,000)
  grossMarginBps: 7000,         // 70.0%
  expenses: {
    payrollCents: 4_200_000,    // $42,000 (4 team members)
    cloudInfraCents: 1_100_000, // $11,000 (GPU clusters & hosting)
    softwareToolingCents: 450_000, // $4,500
    marketingSalesCents: 450_000,  // $4,500
    officeMiscCents: 0,
  },
  headcount: 4,
  expectedRunwayMonths: 3.6,
  status: 'CRITICAL',
  keyChallenge: 'Zero cash date in under 110 days without immediate burn reduction.',
  recommendedFocus: 'Freeze hiring, cut GPU idle spend, offer annual billing discounts to pull cash forward.',
};

export const SERIES_A_SCALEUP_PRESET: StartupPreset = {
  id: 'series-a-scaleup',
  name: 'Series A Scaleup',
  badgeLabel: '🚀 18.8 Mo Runway',
  tagline: 'High-growth B2B enterprise SaaS deploying Series A capital',
  companyName: 'DataSphere Analytics',
  stageDescription: 'Series A ($6.0M raised, $4.5M cash in bank)',
  cashBalanceCents: 450_000_000, // $4,500,000
  mrrCents: 18_500_000,          // $185,000/mo (ARR: $2,220,000)
  grossMarginBps: 8250,          // 82.5%
  expenses: {
    payrollCents: 29_000_000,    // $290,000 (22 team members)
    cloudInfraCents: 6_500_000,  // $65,000 (Multi-region Kubernetes)
    softwareToolingCents: 2_200_000, // $22,000
    marketingSalesCents: 4_800_000,  // $48,000 (GTM acquisition)
    officeMiscCents: 0,
  },
  headcount: 22,
  expectedRunwayMonths: 18.75,
  status: 'HEALTHY',
  keyChallenge: 'Scaling ARR to $5M+ while defending CAC payback (<14 months) before Series B.',
  recommendedFocus: 'Accelerate proven sales channels, monitor engineering hiring velocity.',
};

export const BOOTSTRAPPED_ALIVE_PRESET: StartupPreset = {
  id: 'bootstrapped-alive',
  name: 'Bootstrapped Default Alive',
  badgeLabel: '🛡️ Default Alive (∞)',
  tagline: 'Self-sustaining profitable micro-SaaS with positive cash flow',
  companyName: 'CloudMetrics SaaS',
  stageDescription: 'Bootstrapped ($0 external dilution, cash-flow positive)',
  cashBalanceCents: 65_000_000,  // $650,000
  mrrCents: 8_500_000,           // $85,000/mo (ARR: $1,020,000)
  grossMarginBps: 8800,          // 88.0%
  expenses: {
    payrollCents: 5_200_000,     // $52,000 (5 senior remote devs)
    cloudInfraCents: 950_000,    // $9,500 (Lean serverless)
    softwareToolingCents: 450_000, // $4,500
    marketingSalesCents: 600_000,  // $6,000
    officeMiscCents: 0,
  },
  headcount: 5,
  expectedRunwayMonths: Infinity, // Effectively Infinite
  status: 'DEFAULT_ALIVE',
  keyChallenge: 'Allocating surplus profit without introducing operational bloat.',
  recommendedFocus: 'Reinvest $13k monthly surplus into organic acquisition and retention tooling.',
};

export const FINTECH_PRESETS: StartupPreset[] = [
  SEED_EMERGENCY_PRESET,
  SERIES_A_SCALEUP_PRESET,
  BOOTSTRAPPED_ALIVE_PRESET,
];

export function getPresetById(id: string): StartupPreset {
  const found = FINTECH_PRESETS.find((p) => p.id === id);
  return found || SEED_EMERGENCY_PRESET;
}

export function presetToBaselineFinancials(preset: StartupPreset): BaselineFinancials {
  const accounts: FinancialAccount[] = [
    {
      id: `${preset.id}-checking`,
      name: 'Primary Operating Checking',
      institution: 'Silicon Valley Bank / First Republic',
      type: 'CHECKING',
      balanceCents: preset.cashBalanceCents,
      currency: 'USD',
    },
  ];

  const revenues: RevenueStream[] = [
    {
      id: `${preset.id}-subscription-mrr`,
      name: 'Software Subscription ARR/MRR',
      monthlyRecurringCents: preset.mrrCents,
      nonRecurringCents: 0,
    },
  ];

  const expenses: ExpenseItem[] = [
    {
      id: `${preset.id}-payroll`,
      name: 'Team Payroll & Benefits',
      category: 'GENERAL_AND_ADMIN',
      monthlyAmountCents: preset.expenses.payrollCents,
      isPayroll: true,
    },
    {
      id: `${preset.id}-cloud`,
      name: 'Cloud Infrastructure & GPU Compute',
      category: 'R_AND_D',
      monthlyAmountCents: preset.expenses.cloudInfraCents,
      isPayroll: false,
    },
    {
      id: `${preset.id}-software`,
      name: 'SaaS Tooling & Engineering Licenses',
      category: 'OPERATIONS_SUPPORT',
      monthlyAmountCents: preset.expenses.softwareToolingCents,
      isPayroll: false,
    },
    {
      id: `${preset.id}-marketing`,
      name: 'Sales & Customer Acquisition',
      category: 'SALES_AND_MARKETING',
      monthlyAmountCents: preset.expenses.marketingSalesCents,
      isPayroll: false,
    },
  ];

  // Calculate COGS from grossMarginBps: COGS = Revenue * (10000 - grossMarginBps) / 10000
  const cogsCents = Math.round((preset.mrrCents * (10000 - preset.grossMarginBps)) / 10000);

  const totalOpEx =
    preset.expenses.payrollCents +
    preset.expenses.cloudInfraCents +
    preset.expenses.softwareToolingCents +
    preset.expenses.marketingSalesCents;

  return {
    referenceDate: '2026-10-01',
    accounts,
    revenues,
    expenses,
    cogsCents,
    priorMonthMetrics: {
      mrrCents: Math.round(preset.mrrCents * 0.92), // 8% prior growth
      revenueCents: Math.round(preset.mrrCents * 0.92),
      totalOpExCents: Math.round(totalOpEx * 0.95),
      grossMarginBps: preset.grossMarginBps - 150,
    },
  };
}
