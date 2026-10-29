import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCrmBackend } from '../src/mock/inMemoryBackend';

describe('Feature F32: InMemoryCrmBackend Engine Tests', () => {
  let backend: InMemoryCrmBackend;

  beforeEach(() => {
    backend = new InMemoryCrmBackend();
  });

  it('initializes with pristine enterprise demo dataset', () => {
    const user = backend.getActiveUser();
    expect(user.role).toBe('SuperAdmin');
    expect(backend.getUsers()).toHaveLength(5);
    expect(backend.getCustomers().length).toBeGreaterThanOrEqual(8);
    expect(backend.getDeals().length).toBeGreaterThanOrEqual(12);
    expect(backend.getInvoices().length).toBeGreaterThanOrEqual(8);
  });

  it('switches user roles and enforces RBAC permission gating', () => {
    expect(backend.can('customers:delete')).toBe(true); // SuperAdmin

    backend.setActiveUserRole('SalesRep');
    expect(backend.getActiveUser().role).toBe('SalesRep');
    expect(backend.can('customers:delete')).toBe(false);
    expect(backend.can('deals:write')).toBe(true);
    expect(backend.can('finance:view_ledger')).toBe(false);

    // SalesRep cannot delete customer
    const customers = backend.getCustomers();
    expect(() => backend.deleteCustomer(customers[0].id)).toThrow(/RBAC Security Violation/);
  });

  it('allows SuperAdmin to create, update, and delete customers', () => {
    const newCust = backend.createCustomer({
      name: 'Cyberdyne Systems',
      company: 'Cyberdyne LLC',
      email: 'admin@cyberdyne.ai',
      status: 'lead',
    });

    expect(newCust.id).toMatch(/^cust-/);
    expect(backend.getCustomer(newCust.id)?.name).toBe('Cyberdyne Systems');

    const updated = backend.updateCustomer(newCust.id, { status: 'enterprise' });
    expect(updated.status).toBe('enterprise');

    const deleted = backend.deleteCustomer(newCust.id);
    expect(deleted).toBe(true);
    expect(backend.getCustomer(newCust.id)).toBeUndefined();
  });

  it('executes full F29 lifecycle: Move to Won -> Convert to Invoice -> Pay -> Accrue LTV', () => {
    // 1. Create a customer and deal
    const cust = backend.createCustomer({
      name: 'Wayne Enterprises',
      company: 'Wayne Enterprises Global',
      email: 'bruce@wayne.com',
    });

    const deal = backend.createDeal({
      customerId: cust.id,
      title: 'Satellite Defense Matrix',
      valueCents: 10_000_000, // $100,000.00
      stage: 'proposal',
    });

    // 2. Advance deal to closed_won
    const wonDeal = backend.moveDealStage(deal.id, 'closed_won');
    expect(wonDeal.stage).toBe('closed_won');
    expect(wonDeal.probability).toBe(100);

    // 3. Convert deal to invoice
    const invoice = backend.convertDealToInvoice(deal.id);
    expect(invoice.dealId).toBe(deal.id);
    expect(invoice.status).toBe('draft');
    expect(invoice.totalAmountCents).toBe(10_000_000);

    // 4. Pay invoice
    const { updatedInvoice, payment } = backend.payInvoice(invoice.id);
    expect(updatedInvoice.status).toBe('paid');
    expect(payment.amountCents).toBe(10_000_000);

    // 5. Verify customer LTV is updated
    const updatedCust = backend.getCustomer(cust.id);
    expect(updatedCust?.ltvCents).toBe(10_000_000);
    expect(updatedCust?.status).toBe('active');
  });

  it('notifies subscribers on state mutations', () => {
    let callCount = 0;
    const unsubscribe = backend.subscribe(() => {
      callCount++;
    });

    backend.createCustomer({
      name: 'Observer Corp',
      company: 'Observer LLC',
      email: 'test@observer.com',
    });

    expect(callCount).toBe(1);
    unsubscribe();

    backend.createCustomer({
      name: 'Observer Corp 2',
      company: 'Observer 2 LLC',
      email: 'test2@observer.com',
    });
    expect(callCount).toBe(1); // No longer notified
  });

  it('exports ledger CSV with valid RFC headers', () => {
    const csv = backend.exportLedgerCsv();
    expect(csv).toContain('Invoice Number,Customer,Status,Issue Date');
    expect(csv).toContain('INV-2026-1001');
    expect(csv).toContain('Acme Corporation');
  });

  it('retrieves single records by id and returns undefined for unknown ids', () => {
    const custs = backend.getCustomers();
    expect(backend.getCustomer(custs[0].id)?.name).toBe(custs[0].name);
    expect(backend.getCustomer('non-existent')).toBeUndefined();

    const deals = backend.getDeals();
    expect(backend.getDeal(deals[0].id)?.title).toBe(deals[0].title);
    expect(backend.getDeal('non-existent')).toBeUndefined();

    const invoices = backend.getInvoices();
    expect(backend.getInvoice(invoices[0].id)?.invoiceNumber).toBe(invoices[0].invoiceNumber);
    expect(backend.getInvoice('non-existent')).toBeUndefined();

    expect(backend.getPayments().length).toBeGreaterThan(0);
  });

  it('updates deals and supports deal deletion', () => {
    const deal = backend.getDeals()[0];
    const updated = backend.updateDeal(deal.id, { title: 'Updated Deal Title', valueCents: 9_999_999 });
    expect(updated.title).toBe('Updated Deal Title');
    expect(updated.valueCents).toBe(9_999_999);

    const deleted = backend.deleteDeal(deal.id);
    expect(deleted).toBe(true);
    expect(backend.getDeal(deal.id)).toBeUndefined();
    expect(backend.deleteDeal('non-existent')).toBe(false);
  });
});

