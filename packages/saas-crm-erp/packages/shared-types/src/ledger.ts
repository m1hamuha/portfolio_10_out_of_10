import { assertCents, calculateBasisPoints } from './money';
import type { Customer, Deal, Invoice, Payment, KpiSummary, Cents } from './types';

export function convertDealToDraftInvoice(
  deal: Deal,
  customer: Customer,
  options: { taxBps?: number; invoiceNumber?: string; dueDateDays?: number } = {}
): Invoice {
  assertCents(deal.valueCents, 'Deal value');
  const taxBps = options.taxBps ?? 0;
  const taxAmountCents = calculateBasisPoints(deal.valueCents, taxBps);
  const totalAmountCents = deal.valueCents + taxAmountCents;
  const now = new Date();
  const dueDate = new Date(now.getTime() + (options.dueDateDays ?? 30) * 86400000);

  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    organizationId: deal.organizationId,
    customerId: customer.id,
    dealId: deal.id,
    invoiceNumber: options.invoiceNumber ?? `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'draft',
    subtotalCents: deal.valueCents,
    taxAmountCents,
    discountAmountCents: 0,
    totalAmountCents,
    issuedDate: now.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    items: [
      {
        id: 'li-1',
        description: `Contract Delivery: ${deal.title}`,
        quantity: 1,
        unitPriceCents: deal.valueCents,
        totalCents: deal.valueCents,
      },
    ],
    notes: `Generated from Won Deal "${deal.title}" for customer ${customer.name}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function recordInvoicePayment(
  invoice: Invoice,
  options: {
    amountCents?: Cents;
    method?: Payment['method'];
    transactionId?: string;
  } = {}
): { updatedInvoice: Invoice; payment: Payment } {
  const amountCents = options.amountCents ?? invoice.totalAmountCents;
  assertCents(amountCents, 'Payment amount');

  if (amountCents <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }
  if (amountCents > invoice.totalAmountCents) {
    throw new Error('Payment amount cannot exceed invoice total');
  }

  const now = new Date().toISOString();
  const payment: Payment = {
    id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    organizationId: invoice.organizationId,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    amountCents,
    method: options.method ?? 'stripe',
    status: 'completed',
    transactionId: options.transactionId ?? `tx_mock_${Date.now()}`,
    processedAt: now,
    createdAt: now,
  };

  const updatedInvoice: Invoice = {
    ...invoice,
    status: 'paid',
    updatedAt: now,
  };

  return { updatedInvoice, payment };
}

export function recalculateCustomerLTV(customerId: string, payments: Payment[]): Cents {
  const customerPayments = payments.filter(
    (p) => p.customerId === customerId && p.status === 'completed'
  );
  return customerPayments.reduce((acc, p) => {
    assertCents(p.amountCents, 'Payment amount in LTV calculation');
    return acc + p.amountCents;
  }, 0);
}

export function computeKpiSummary(
  customers: Customer[],
  deals: Deal[],
  payments: Payment[]
): KpiSummary {
  const activeDeals = deals.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );
  const totalPipelineCents = activeDeals.reduce((sum, d) => sum + d.valueCents, 0);

  const completedPayments = payments.filter((p) => p.status === 'completed');
  const collectedRevenueCents = completedPayments.reduce((sum, p) => sum + p.amountCents, 0);

  const activeCustomers = customers.filter((c) => c.status === 'active' || c.status === 'enterprise');
  const activeCustomerCount = activeCustomers.length;

  const totalLtv = customers.reduce((sum, c) => sum + c.ltvCents, 0);
  const averageLtvCents = customers.length > 0 ? Math.round(totalLtv / customers.length) : 0;

  const wonDeals = deals.filter((d) => d.stage === 'closed_won').length;
  const lostDeals = deals.filter((d) => d.stage === 'closed_lost').length;
  const closedCount = wonDeals + lostDeals;
  const winRatePercentage = closedCount > 0 ? Math.round((wonDeals / closedCount) * 100) : 0;

  return {
    totalPipelineCents,
    collectedRevenueCents,
    activeCustomerCount,
    averageLtvCents,
    winRatePercentage,
  };
}
