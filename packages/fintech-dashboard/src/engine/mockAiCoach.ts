import { CoachContext } from './types';
import { formatCurrency } from './math';

export function generateDeterministicResponse(prompt: string, ctx: CoachContext): string {
  const p = prompt.toLowerCase();
  const cashStr = formatCurrency(ctx.cashBalanceCents);
  const burnStr = formatCurrency(ctx.netBurnCents);
  const mrrStr = formatCurrency(ctx.mrrCents);
  const runwayStr = ctx.status === 'DEFAULT_ALIVE' ? 'Default Alive (Infinite)' : `${ctx.runwayMonths.toFixed(1)} months`;

  // 1. Hiring Intent
  if (/hire|hiring|engineer|headcount|staff|payroll|salary/i.test(p)) {
    const costPerEngineerCents = 1_250_000; // $12,500/mo ($150k/yr base + taxes)
    const proposedHires = p.includes('1') ? 1 : 2;
    const addedBurnCents = proposedHires * costPerEngineerCents;
    const newBurnCents = ctx.netBurnCents + addedBurnCents;
    const newRunway = ctx.status === 'DEFAULT_ALIVE' && newBurnCents <= 0
      ? 999
      : Math.max(0, ctx.cashBalanceCents / Math.max(1, Math.abs(newBurnCents)));

    const verdict = newRunway < 6.0
      ? 'CRITICAL ADVICE: REJECT OR DEFER'
      : newRunway < 12.0
      ? 'CAUTION: PROCEED WITH REVENUE GATING'
      : 'APPROVED: CAPACITY SUPPORTS EXPANSION';

    return `### 1. Diagnosis
Current cash balance is ${cashStr} with net monthly burn of ${burnStr} (${runwayStr} runway). Adding ${proposedHires} Senior Engineer(s) will increase monthly payroll by ${formatCurrency(addedBurnCents)}, raising burn to ${formatCurrency(newBurnCents)}/mo and compressing runway to ${newRunway.toFixed(1)} months. Verdict: **${verdict}**.

### 2. Action Plan
- **Step 1: Gated Hiring Trigger**: Defer full-time hires until MRR reaches at least ${formatCurrency(ctx.mrrCents + addedBurnCents * 2)} to offset the incremental cash bleed.
- **Step 2: Fractional / Contractor Bridge**: Engage specialized contractors on a 90-day deliverable contract at ~50% of the fixed payroll commitment.
- **Step 3: R&D Efficiency**: Conduct an engineering throughput audit to ensure existing architecture bottlenecks are resolved before scaling headcount.

### 3. Risks & Financial Sensitivities
- **Zero Cash Date**: Under the increased burn rate, runway expires in ${newRunway.toFixed(1)} months (${new Date(Date.now() + newRunway * 30.4 * 86400000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}).
- **Revenue Shock Sensitivity**: A 15% dip in MRR accelerates cash depletion by an additional ~${(newRunway * 0.18).toFixed(1)} months.`;
  }

  // 2. Runway Extension / Cash Preservation Intent
  if (/extend|runway|burn|cash|emergency|survive/i.test(p)) {
    const nonPayrollOpexCents = ctx.monthlyExpensesCents * 0.25; // Approximate 25% OpEx
    const potentialSavingsCents = nonPayrollOpexCents * 0.3; // 30% cut on non-payroll
    const extendedBurnCents = ctx.netBurnCents + potentialSavingsCents;
    const extendedRunway = Math.max(0, ctx.cashBalanceCents / Math.abs(extendedBurnCents));
    const gainedMonths = extendedRunway - ctx.runwayMonths;

    return `### 1. Diagnosis
Operating in **${ctx.activePresetName}** with ${cashStr} in cash reserves and ${burnStr} net monthly burn. Runway is currently **${runwayStr}**. To achieve a 6-month extension, monthly cash drain must decrease by at least ${formatCurrency(Math.abs(ctx.netBurnCents) * 0.35)}.

### 2. Action Plan (3-Point Cash Extension Strategy)
- **Point 1: Non-Payroll OpEx Triage (Immediate +${Math.max(1, gainedMonths).toFixed(1)} Mo)**: Execute immediate audit on cloud GPU/hosting and SaaS seat licenses. Eliminate redundant subscriptions and commit to 1-year reserved instances for an estimated ${formatCurrency(potentialSavingsCents)}/mo cash conservation.
- **Point 2: Strict Headcount & Contractor Freeze**: Freeze all uncommitted hiring and transition discretionary marketing spend strictly into zero-CAC inbound channels.
- **Point 3: Upfront Annual Contract Pull-Forward**: Offer existing monthly customers an 8–10% prepayment discount on annual commitments, unlocking upfront liquid collections without equity dilution.

### 3. Risks & Financial Sensitivities
- **Critical Timeline**: Implementation must occur within 14 calendar days; delaying by one month consumes ~${formatCurrency(Math.abs(ctx.netBurnCents))} of irreplaceable liquid capital.
- **Downside Safeguard**: Maintain a non-negotiable minimum survival buffer of $50,000 for statutory liabilities.`;
  }

  // 3. OpEx & Software Spend Audit Intent
  if (/audit|software|cloud|opex|cost|cut|spend/i.test(p)) {
    return `### 1. Diagnosis
Total monthly operating expenditures stand at ${formatCurrency(ctx.monthlyExpensesCents)}. Infrastructure and SaaS licensing account for substantial recurrent burn.

### 2. Action Plan
- **Cloud Infrastructure Rationalization**: Transition on-demand compute instances to 1-year or 3-year Compute Savings Plans, reducing baseline infrastructure bills by 22–35%.
- **SaaS Tooling Consolidation**: Review single sign-on (SSO) activity logs. De-provision unused seat licenses across project management, BI, and observability tools.
- **Vendor Payment Terms Renegotiation**: Transition key enterprise vendors from Net-15 to Net-45 payment terms to smooth operational working capital.

### 3. Risks & Financial Sensitivities
- **Performance Trade-Offs**: Ensure infrastructure downsizing does not impact customer SLA latency or API error rates.`;
  }

  // 4. Growth vs Default Alive Intent
  if (/growth|scale|scaleup|series a|invest|expand|push|alive/i.test(p)) {
    const isAlive = ctx.status === 'DEFAULT_ALIVE';
    return `### 1. Diagnosis
Financial state: **${ctx.status}** with ${mrrStr} MRR and ${(ctx.grossMarginBps / 100).toFixed(1)}% gross margin. ${
  isAlive
    ? 'The business is generating cash surplus and operates from a position of absolute capital resilience.'
    : `Runway is capped at ${runwayStr}. Growth initiatives must be unit-economics accretive within 90 days.`
}

### 2. Action Plan
- **${isAlive ? 'Compounding Reinvestment' : 'Controlled Experiments'}**: ${
      isAlive
        ? `Deploy 60% of the ${formatCurrency(Math.abs(ctx.netBurnCents))} monthly cash surplus into validated customer acquisition channels.`
        : 'Allocate capped $5,000 monthly micro-budgets for high-intent paid search, requiring 100% payback in <60 days.'
    }
- **Gross Margin Protection**: Maintain gross margin strictly above 80% by automating onboarding and support workflows.
- **Expansion Metrics**: Track Burn Multiple (Net Burn / Net New ARR). Aim for a Burn Multiple below 1.2x.

### 3. Risks & Financial Sensitivities
- **Market Volatility**: Avoid long-term upfront commitments to unproven acquisition channels.`;
  }

  // 5. Default Fallback
  return `### 1. Diagnosis
Company is operating under the **${ctx.activePresetName}** profile. Cash reserves: ${cashStr}. Current monthly burn rate: ${burnStr}. Current runway status: **${ctx.status}** (${runwayStr}).

### 2. Action Plan
- **Financial Baseline Verification**: Reconcile integer-cent ledger balances against projected quarterly collections.
- **Scenario Stress Testing**: Utilize the scenario sliders to test hiring (+1 to +5 headcount) and OpEx adjustments.
- **Runway Target Optimization**: Target a sustainable operating baseline of at least 18 months prior to significant capital deployment.

### 3. Risks & Financial Sensitivities
- **Zero Cash Date**: Under baseline burn, capital depletion date is ${
    ctx.status === 'DEFAULT_ALIVE' ? 'N/A (Positive Cashflow)' : `${ctx.runwayMonths.toFixed(1)} months from today`
  }.`;
}

/**
 * Async generator for deterministic streaming simulation.
 */
export async function* streamDeterministicHeuristic(
  prompt: string,
  ctx: CoachContext,
  delayMs = 15
): AsyncGenerator<string, void, unknown> {
  const fullText = generateDeterministicResponse(prompt, ctx);
  const words = fullText.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i === words.length - 1 ? '' : ' ');
    if (delayMs > 0) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}
