import { describe, it, expect } from 'vitest';
import {
  generateDeterministicResponse,
  streamDeterministicHeuristic,
} from '../src/engine/mockAiCoach';
import { CoachContext } from '../src/engine/types';

describe('Feature F36: AI Copilot Coach Deterministic Heuristics Tests', () => {
  const seedContext: CoachContext = {
    cashBalanceCents: 18_000_000, // $180,000
    mrrCents: 1_200_000,          // $12,000
    arrCents: 14_400_000,         // $144,000
    monthlyExpensesCents: 6_200_000, // $62,000
    netBurnCents: 5_000_000,      // $50,000
    runwayMonths: 3.6,
    grossMarginBps: 7000,         // 70.0%
    status: 'CRITICAL',
    activePresetName: 'Seed Stage Runway Emergency',
  };

  it('generates structured diagnosis, action plan, and risks for hiring intent', () => {
    const res = generateDeterministicResponse('Can we afford to hire 2 senior engineers?', seedContext);

    expect(res).toContain('### 1. Diagnosis');
    expect(res).toContain('### 2. Action Plan');
    expect(res).toContain('### 3. Risks & Financial Sensitivities');

    // Asserts exact financial numbers calculated
    expect(res).toContain('$180,000');
    expect(res).toContain('$50,000');
    expect(res).toContain('$25,000'); // 2 * $12,500
    expect(res).toContain('CRITICAL ADVICE: REJECT OR DEFER');
  });

  it('generates 3-point cash extension plan for runway extension intent', () => {
    const res = generateDeterministicResponse('How do I extend runway by 6 months?', seedContext);

    expect(res).toContain('### 1. Diagnosis');
    expect(res).toContain('Point 1: Non-Payroll OpEx Triage');
    expect(res).toContain('Point 2: Strict Headcount & Contractor Freeze');
    expect(res).toContain('Point 3: Upfront Annual Contract Pull-Forward');
    expect(res).toContain('Seed Stage Runway Emergency');
  });

  it('generates OpEx and cloud rationalization plan for spend audit intent', () => {
    const res = generateDeterministicResponse('Audit our software and cloud spend', seedContext);

    expect(res).toContain('Cloud Infrastructure Rationalization');
    expect(res).toContain('SaaS Tooling Consolidation');
    expect(res).toContain('Vendor Payment Terms Renegotiation');
  });

  it('handles default alive context gracefully in growth evaluation', () => {
    const aliveContext: CoachContext = {
      ...seedContext,
      cashBalanceCents: 65_000_000,
      mrrCents: 8_500_000,
      monthlyExpensesCents: 7_200_000,
      netBurnCents: -1_300_000, // +$13k surplus
      runwayMonths: 999,
      status: 'DEFAULT_ALIVE',
      activePresetName: 'Bootstrapped Default Alive',
    };

    const res = generateDeterministicResponse('Evaluate growth push vs default alive', aliveContext);
    expect(res).toContain('DEFAULT_ALIVE');
    expect(res).toContain('Compounding Reinvestment');
  });

  it('streams chunks deterministically reconstructing full output', async () => {
    const chunks: string[] = [];
    for await (const chunk of streamDeterministicHeuristic('Help improve runway', seedContext, 0)) {
      chunks.push(chunk);
    }
    const fullStreamed = chunks.join('');
    const fullDirect = generateDeterministicResponse('Help improve runway', seedContext);
    expect(fullStreamed.trim()).toBe(fullDirect.trim());
  });

  it('handles 1 engineer hire and caution/approved verdicts', () => {
    // 1 engineer hire on Series A context
    const seriesAContext: CoachContext = {
      cashBalanceCents: 450_000_000, // $4.5M
      mrrCents: 18_500_000,
      arrCents: 222_000_000,
      monthlyExpensesCents: 42_500_000,
      netBurnCents: 24_000_000, // $240k
      runwayMonths: 18.75,
      grossMarginBps: 8250,
      status: 'HEALTHY',
      activePresetName: 'Series A Scaleup',
    };

    const resApproved = generateDeterministicResponse('Can we hire 1 engineer?', seriesAContext);
    expect(resApproved).toContain('Adding 1 Senior Engineer(s)');
    expect(resApproved).toContain('APPROVED: CAPACITY SUPPORTS EXPANSION');

    // Caution context
    const cautionContext: CoachContext = {
      ...seriesAContext,
      cashBalanceCents: 100_000_000, // $1M
      netBurnCents: 10_000_000, // $100k -> 10 months
      runwayMonths: 10.0,
      status: 'CAUTION',
    };
    const resCaution = generateDeterministicResponse('hire 1 staff member', cautionContext);
    expect(resCaution).toContain('CAUTION: PROCEED WITH REVENUE GATING');
  });

  it('handles general fallback query', () => {
    const res = generateDeterministicResponse('What is our baseline status?', seedContext);
    expect(res).toContain('### 1. Diagnosis');
    expect(res).toContain('Financial Baseline Verification');
    expect(res).toContain('Scenario Stress Testing');
  });
});

