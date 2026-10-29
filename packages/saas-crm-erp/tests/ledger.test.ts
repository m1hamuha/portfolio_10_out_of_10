import { describe, it, expect } from 'vitest';
import {
  convertDealToDraftInvoice,
  recordInvoicePayment,
  recalculateCustomerLTV,
  Deal,
  Customer,
  Invoice,
} from '../packages/shared-types/src';

describe('Feature F29: Data Model Linkage & Ledger Calculations', () => {
  const sampleCustomer: Customer = {
    id: 'cust-test-1',
    organizationId: 'org-1',
    name: 'Stark Industries',
    company: 'Stark Enterprises LLC',
    email: 'tony@stark.com',
    status: 'lead',
    ltvCents: 0,
    assignedUserId: 'user-1',
    dealCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const sampleWonDeal: Deal = {
    id: 'deal-test-1',
    organizationId: 'org-1',
    customerId: 'cust-test-1',
    title: 'Arc Reactor Grid Integration',
    valueCents: 5_000_000, // $50,000.00
    stage: 'closed_won',
    probability: 100,
    expectedCloseDate: '2026-02-01',
    assignedUserId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('converts a Won Deal to a Draft Invoice in integer cents', () => {
    const invoice = convertDealToDraftInvoice(sampleWonDeal, sampleCustomer, {
      taxBps: 825, // 8.25% sales tax
      invoiceNumber: 'INV-TEST-001',
    });

    expect(invoice.id).toMatch(/^inv-/);
    expect(invoice.dealId).toBe(sampleWonDeal.id);
    expect(invoice.customerId).toBe(sampleCustomer.id);
    expect(invoice.status).toBe('draft');
    expect(invoice.subtotalCents).toBe(5_000_000);
    // 50,000 * 0.0825 = 4,125.00 -> 412,500 cents
    expect(invoice.taxAmountCents).toBe(412_500);
    expect(invoice.totalAmountCents).toBe(5_412_500);
    expect(invoice.items).toHaveLength(1);
    expect(invoice.items[0].totalCents).toBe(5_000_000);
  });

  it('records an invoice payment, returning paid status and payment receipt', () => {
    const invoice = convertDealToDraftInvoice(sampleWonDeal, sampleCustomer);
    const { updatedInvoice, payment } = recordInvoicePayment(invoice, {
      method: 'bank_transfer',
      transactionId: 'tx_ach_9876',
    });

    expect(updatedInvoice.status).toBe('paid');
    expect(payment.amountCents).toBe(invoice.totalAmountCents);
    expect(payment.status).toBe('completed');
    expect(payment.method).toBe('bank_transfer');
    expect(payment.transactionId).toBe('tx_ach_9876');
  });

  it('recalculates customer LTV as the cumulative sum of paid receipts', () => {
    const inv1 = convertDealToDraftInvoice(sampleWonDeal, sampleCustomer);
    const { payment: p1 } = recordInvoicePayment(inv1);

    const inv2: Invoice = {
      ...inv1,
      id: 'inv-test-2',
      totalAmountCents: 2_500_000, // $25,000.00
    };
    const { payment: p2 } = recordInvoicePayment(inv2);

    const ltv = recalculateCustomerLTV(sampleCustomer.id, [p1, p2]);
    // 50,000 + 25,000 = $75,000.00 -> 7,500,000 cents
    expect(ltv).toBe(7_500_000);
  });

  it('rejects invalid payment amounts (zero, negative, or exceeding total)', () => {
    const invoice = convertDealToDraftInvoice(sampleWonDeal, sampleCustomer);

    expect(() => recordInvoicePayment(invoice, { amountCents: 0 })).toThrow(
      /Payment amount must be greater than zero/
    );
    expect(() => recordInvoicePayment(invoice, { amountCents: -500 })).toThrow(
      /Payment amount must be greater than zero/
    );
    expect(() => recordInvoicePayment(invoice, { amountCents: 10_000_000 })).toThrow(
      /Payment amount cannot exceed invoice total/
    );
  });
});
