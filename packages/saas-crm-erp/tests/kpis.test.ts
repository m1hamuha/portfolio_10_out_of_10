import { describe, it, expect } from 'vitest';
import { computeKpiSummary, Customer, Deal, Payment } from '../packages/shared-types/src';

describe('Feature F31: KPI Summary Calculations', () => {
  const customers: Customer[] = [
    {
      id: 'c1',
      organizationId: 'org1',
      name: 'Alpha',
      company: 'Alpha Inc',
      email: 'a@alpha.com',
      status: 'enterprise',
      ltvCents: 10_000_000,
      assignedUserId: 'u1',
      dealCount: 2,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'c2',
      organizationId: 'org1',
      name: 'Beta',
      company: 'Beta LLC',
      email: 'b@beta.com',
      status: 'active',
      ltvCents: 2_000_000,
      assignedUserId: 'u1',
      dealCount: 1,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'c3',
      organizationId: 'org1',
      name: 'Gamma',
      company: 'Gamma Corp',
      email: 'g@gamma.com',
      status: 'lead',
      ltvCents: 0,
      assignedUserId: 'u1',
      dealCount: 1,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const deals: Deal[] = [
    {
      id: 'd1',
      organizationId: 'org1',
      customerId: 'c1',
      title: 'Deal 1',
      valueCents: 3_000_000,
      stage: 'proposal',
      probability: 60,
      expectedCloseDate: '',
      assignedUserId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'd2',
      organizationId: 'org1',
      customerId: 'c2',
      title: 'Deal 2',
      valueCents: 1_500_000,
      stage: 'qualified',
      probability: 40,
      expectedCloseDate: '',
      assignedUserId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'd3',
      organizationId: 'org1',
      customerId: 'c1',
      title: 'Deal 3',
      valueCents: 10_000_000,
      stage: 'closed_won',
      probability: 100,
      expectedCloseDate: '',
      assignedUserId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'd4',
      organizationId: 'org1',
      customerId: 'c3',
      title: 'Deal 4',
      valueCents: 2_000_000,
      stage: 'closed_lost',
      probability: 0,
      expectedCloseDate: '',
      assignedUserId: 'u1',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const payments: Payment[] = [
    {
      id: 'p1',
      organizationId: 'org1',
      invoiceId: 'inv1',
      customerId: 'c1',
      amountCents: 10_000_000,
      method: 'bank_transfer',
      status: 'completed',
      createdAt: '',
    },
    {
      id: 'p2',
      organizationId: 'org1',
      invoiceId: 'inv2',
      customerId: 'c2',
      amountCents: 2_000_000,
      method: 'stripe',
      status: 'completed',
      createdAt: '',
    },
    {
      id: 'p3',
      organizationId: 'org1',
      invoiceId: 'inv3',
      customerId: 'c3',
      amountCents: 500_000,
      method: 'stripe',
      status: 'failed',
      createdAt: '',
    },
  ];

  it('computes total active pipeline excluding closed deals', () => {
    const summary = computeKpiSummary(customers, deals, payments);
    // 3,000,000 + 1,500,000 = 4,500,000 cents
    expect(summary.totalPipelineCents).toBe(4_500_000);
  });

  it('computes collected revenue summing completed payments only', () => {
    const summary = computeKpiSummary(customers, deals, payments);
    // 10,000,000 + 2,000,000 = 12,000,000 cents (failed 500,000 excluded)
    expect(summary.collectedRevenueCents).toBe(12_000_000);
  });

  it('counts active customers and computes average LTV', () => {
    const summary = computeKpiSummary(customers, deals, payments);
    // activeCustomerCount: enterprise (c1) + active (c2) = 2
    expect(summary.activeCustomerCount).toBe(2);
    // averageLtvCents: (10,000,000 + 2,000,000 + 0) / 3 = 4,000,000 cents
    expect(summary.averageLtvCents).toBe(4_000_000);
  });

  it('calculates win rate percentage accurately', () => {
    const summary = computeKpiSummary(customers, deals, payments);
    // 1 won (d3), 1 lost (d4) -> closedCount = 2 -> 50%
    expect(summary.winRatePercentage).toBe(50);
  });
});
