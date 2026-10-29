export type { Cents } from './money';
import type { Cents } from './money';

export type CustomerStatus = 'lead' | 'active' | 'churned' | 'enterprise';

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: CustomerStatus;
  ltvCents: Cents;
  assignedUserId: string;
  dealCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DealStage =
  | 'prospect'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Deal {
  id: string;
  organizationId: string;
  customerId: string;
  title: string;
  valueCents: Cents;
  stage: DealStage;
  probability: number; // 0–100
  expectedCloseDate: string; // YYYY-MM-DD
  actualCloseDate?: string;
  assignedUserId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: Cents;
  totalCents: Cents;
}

export interface Invoice {
  id: string;
  organizationId: string;
  customerId: string;
  dealId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotalCents: Cents;
  taxAmountCents: Cents;
  discountAmountCents: Cents;
  totalAmountCents: Cents;
  issuedDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'stripe' | 'bank_transfer' | 'cash' | 'paypal';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  organizationId: string;
  invoiceId: string;
  customerId: string;
  amountCents: Cents;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  processedAt?: string;
  createdAt: string;
}

export type UserRole =
  | 'SuperAdmin'
  | 'OrgAdmin'
  | 'Manager'
  | 'FinanceViewer'
  | 'SalesRep';

export type Permission =
  | 'customers:read'
  | 'customers:write'
  | 'customers:delete'
  | 'deals:read'
  | 'deals:write'
  | 'deals:delete'
  | 'invoices:read'
  | 'invoices:write'
  | 'invoices:delete'
  | 'payments:record'
  | 'finance:view_ledger'
  | 'finance:export'
  | 'rbac:switch_role'
  | 'org:manage';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  title?: string;
}

export interface KpiSummary {
  totalPipelineCents: Cents;
  collectedRevenueCents: Cents;
  activeCustomerCount: number;
  averageLtvCents: Cents;
  winRatePercentage: number;
}
