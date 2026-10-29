import {
  Cents,
  Customer,
  Deal,
  DealStage,
  Invoice,
  Payment,
  PaymentMethod,
  User,
  UserRole,
  Permission,
  KpiSummary,
  hasPermission,
  convertDealToDraftInvoice,
  recordInvoicePayment,
  recalculateCustomerLTV,
  computeKpiSummary,
  assertCents,
  formatCents,
} from '../../../shared-types/src';

import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_DEALS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
} from './seedData';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class InMemoryCrmBackend {
  private activeUser: User;
  private users: User[];
  private customers: Customer[];
  private deals: Deal[];
  private invoices: Invoice[];
  private payments: Payment[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.users = deepClone(INITIAL_USERS);
    this.activeUser = this.users[0]; // SuperAdmin default
    this.customers = deepClone(INITIAL_CUSTOMERS);
    this.deals = deepClone(INITIAL_DEALS);
    this.invoices = deepClone(INITIAL_INVOICES);
    this.payments = deepClone(INITIAL_PAYMENTS);
  }

  // --- Pub/Sub ---
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // --- RBAC & Personas ---
  public getActiveUser(): User {
    return { ...this.activeUser };
  }

  public getUsers(): User[] {
    return deepClone(this.users);
  }

  public setActiveUserRole(role: UserRole): User {
    const persona = this.users.find((u) => u.role === role);
    if (!persona) {
      throw new Error(`User with role "${role}" not found in system.`);
    }
    this.activeUser = { ...persona };
    this.notify();
    return this.getActiveUser();
  }

  public can(permission: Permission): boolean {
    return hasPermission(this.activeUser.role, permission);
  }

  private checkPermission(permission: Permission, operation: string): void {
    if (!this.can(permission)) {
      throw new Error(
        `[RBAC Security Violation] User "${this.activeUser.name}" (${this.activeUser.role}) is unauthorized to perform "${operation}". Required permission: "${permission}".`
      );
    }
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    this.checkPermission('customers:read', 'getCustomers');
    return deepClone(this.customers);
  }

  public getCustomer(id: string): Customer | undefined {
    this.checkPermission('customers:read', 'getCustomer');
    const cust = this.customers.find((c) => c.id === id);
    return cust ? deepClone(cust) : undefined;
  }

  public createCustomer(dto: {
    name: string;
    company: string;
    email: string;
    phone?: string;
    status?: Customer['status'];
  }): Customer {
    this.checkPermission('customers:write', 'createCustomer');
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: this.activeUser.organizationId,
      name: dto.name,
      company: dto.company,
      email: dto.email,
      phone: dto.phone,
      status: dto.status ?? 'lead',
      ltvCents: 0,
      assignedUserId: this.activeUser.id,
      dealCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.customers.unshift(newCustomer);
    this.notify();
    return deepClone(newCustomer);
  }

  public updateCustomer(id: string, dto: Partial<Customer>): Customer {
    this.checkPermission('customers:write', 'updateCustomer');
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with id "${id}" not found.`);
    }
    const updated: Customer = {
      ...this.customers[index],
      ...dto,
      id, // protect ID
      organizationId: this.customers[index].organizationId,
      updatedAt: new Date().toISOString(),
    };
    this.customers[index] = updated;
    this.notify();
    return deepClone(updated);
  }

  public deleteCustomer(id: string): boolean {
    this.checkPermission('customers:delete', 'deleteCustomer');
    const initialLen = this.customers.length;
    this.customers = this.customers.filter((c) => c.id !== id);
    if (this.customers.length !== initialLen) {
      this.notify();
      return true;
    }
    return false;
  }

  // --- Deals ---
  public getDeals(): Deal[] {
    this.checkPermission('deals:read', 'getDeals');
    return deepClone(this.deals);
  }

  public getDeal(id: string): Deal | undefined {
    this.checkPermission('deals:read', 'getDeal');
    const deal = this.deals.find((d) => d.id === id);
    return deal ? deepClone(deal) : undefined;
  }

  public createDeal(dto: {
    customerId: string;
    title: string;
    valueCents: Cents;
    stage?: DealStage;
    probability?: number;
    expectedCloseDate?: string;
    description?: string;
  }): Deal {
    this.checkPermission('deals:write', 'createDeal');
    assertCents(dto.valueCents, 'Deal value');
    const now = new Date().toISOString();
    const stage = dto.stage ?? 'prospect';
    const newDeal: Deal = {
      id: `deal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: this.activeUser.organizationId,
      customerId: dto.customerId,
      title: dto.title,
      valueCents: dto.valueCents,
      stage,
      probability: dto.probability ?? 20,
      expectedCloseDate: dto.expectedCloseDate ?? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      assignedUserId: this.activeUser.id,
      description: dto.description,
      createdAt: now,
      updatedAt: now,
    };
    this.deals.unshift(newDeal);

    // Update customer dealCount
    const customer = this.customers.find((c) => c.id === dto.customerId);
    if (customer) {
      customer.dealCount += 1;
      customer.updatedAt = now;
    }

    this.notify();
    return deepClone(newDeal);
  }

  public updateDeal(id: string, dto: Partial<Deal>): Deal {
    this.checkPermission('deals:write', 'updateDeal');
    if (dto.valueCents !== undefined) {
      assertCents(dto.valueCents, 'Deal value');
    }
    const index = this.deals.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Deal with id "${id}" not found.`);
    }
    const updated: Deal = {
      ...this.deals[index],
      ...dto,
      id,
      organizationId: this.deals[index].organizationId,
      updatedAt: new Date().toISOString(),
    };
    this.deals[index] = updated;
    this.notify();
    return deepClone(updated);
  }

  public moveDealStage(id: string, stage: DealStage): Deal {
    this.checkPermission('deals:write', 'moveDealStage');
    const deal = this.deals.find((d) => d.id === id);
    if (!deal) {
      throw new Error(`Deal with id "${id}" not found.`);
    }
    deal.stage = stage;
    deal.updatedAt = new Date().toISOString();
    if (stage === 'closed_won') {
      deal.probability = 100;
      deal.actualCloseDate = new Date().toISOString().split('T')[0];
    } else if (stage === 'closed_lost') {
      deal.probability = 0;
      deal.actualCloseDate = new Date().toISOString().split('T')[0];
    }
    this.notify();
    return deepClone(deal);
  }

  public deleteDeal(id: string): boolean {
    this.checkPermission('deals:delete', 'deleteDeal');
    const deal = this.deals.find((d) => d.id === id);
    if (!deal) return false;

    this.deals = this.deals.filter((d) => d.id !== id);

    // Decrement customer deal count
    const customer = this.customers.find((c) => c.id === deal.customerId);
    if (customer && customer.dealCount > 0) {
      customer.dealCount -= 1;
      customer.updatedAt = new Date().toISOString();
    }

    this.notify();
    return true;
  }

  // --- F29 Data Model Linkage: Won Deal -> Draft Invoice ---
  public convertDealToInvoice(dealId: string): Invoice {
    this.checkPermission('invoices:write', 'convertDealToInvoice');
    const deal = this.deals.find((d) => d.id === dealId);
    if (!deal) {
      throw new Error(`Deal with id "${dealId}" not found.`);
    }
    const customer = this.customers.find((c) => c.id === deal.customerId);
    if (!customer) {
      throw new Error(`Customer with id "${deal.customerId}" not found for deal "${deal.title}".`);
    }

    // Check if an invoice was already generated for this deal
    const existing = this.invoices.find((inv) => inv.dealId === dealId);
    if (existing) {
      return deepClone(existing);
    }

    const draftInvoice = convertDealToDraftInvoice(deal, customer);
    this.invoices.unshift(draftInvoice);
    this.notify();
    return deepClone(draftInvoice);
  }

  // --- Invoices ---
  public getInvoices(): Invoice[] {
    this.checkPermission('invoices:read', 'getInvoices');
    return deepClone(this.invoices);
  }

  public getInvoice(id: string): Invoice | undefined {
    this.checkPermission('invoices:read', 'getInvoice');
    const inv = this.invoices.find((i) => i.id === id);
    return inv ? deepClone(inv) : undefined;
  }

  // --- F29 Data Model Linkage: Invoice -> Payment -> Customer LTV ---
  public payInvoice(
    invoiceId: string,
    amountCents?: Cents,
    method: PaymentMethod = 'stripe'
  ): { updatedInvoice: Invoice; payment: Payment } {
    this.checkPermission('payments:record', 'payInvoice');
    const invIndex = this.invoices.findIndex((i) => i.id === invoiceId);
    if (invIndex === -1) {
      throw new Error(`Invoice with id "${invoiceId}" not found.`);
    }

    const invoice = this.invoices[invIndex];
    const { updatedInvoice, payment } = recordInvoicePayment(invoice, {
      amountCents,
      method,
    });

    this.invoices[invIndex] = updatedInvoice;
    this.payments.unshift(payment);

    // Deterministically update customer LTV in integer cents
    const newLtv = recalculateCustomerLTV(invoice.customerId, this.payments);
    const customer = this.customers.find((c) => c.id === invoice.customerId);
    if (customer) {
      customer.ltvCents = newLtv;
      if (customer.status === 'lead') {
        customer.status = 'active';
      }
      customer.updatedAt = new Date().toISOString();
    }

    this.notify();
    return { updatedInvoice: deepClone(updatedInvoice), payment: deepClone(payment) };
  }

  public getPayments(): Payment[] {
    this.checkPermission('finance:view_ledger', 'getPayments');
    return deepClone(this.payments);
  }

  // --- KPIs ---
  public getKpiSummary(): KpiSummary {
    return computeKpiSummary(this.customers, this.deals, this.payments);
  }

  // --- Reset to Demo Defaults (F32 1-Click Reset) ---
  public resetToDemoDefaults(): void {
    this.users = deepClone(INITIAL_USERS);
    this.activeUser = this.users[0];
    this.customers = deepClone(INITIAL_CUSTOMERS);
    this.deals = deepClone(INITIAL_DEALS);
    this.invoices = deepClone(INITIAL_INVOICES);
    this.payments = deepClone(INITIAL_PAYMENTS);
    this.notify();
  }

  // --- CSV Ledger Export ---
  public exportLedgerCsv(): string {
    this.checkPermission('finance:export', 'exportLedgerCsv');
    const headers = [
      'Invoice Number',
      'Customer',
      'Status',
      'Issue Date',
      'Due Date',
      'Subtotal ($)',
      'Tax ($)',
      'Total ($)',
      'Linked Deal ID',
    ];

    const customerMap = new Map(this.customers.map((c) => [c.id, c.name]));

    const rows = this.invoices.map((inv) => {
      const customerName = customerMap.get(inv.customerId) || 'Unknown';
      return [
        `"${inv.invoiceNumber}"`,
        `"${customerName}"`,
        `"${inv.status}"`,
        `"${inv.issuedDate}"`,
        `"${inv.dueDate}"`,
        `"${formatCents(inv.subtotalCents)}"`,
        `"${formatCents(inv.taxAmountCents)}"`,
        `"${formatCents(inv.totalAmountCents)}"`,
        `"${inv.dealId || 'N/A'}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

// Singleton instance for in-memory CRM operations across client components
export const crmBackend = new InMemoryCrmBackend();
