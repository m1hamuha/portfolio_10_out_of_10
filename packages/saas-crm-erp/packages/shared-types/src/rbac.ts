import type { UserRole, Permission } from './types';

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  SuperAdmin: [
    'customers:read', 'customers:write', 'customers:delete',
    'deals:read', 'deals:write', 'deals:delete',
    'invoices:read', 'invoices:write', 'invoices:delete',
    'payments:record', 'finance:view_ledger', 'finance:export',
    'rbac:switch_role', 'org:manage'
  ],
  OrgAdmin: [
    'customers:read', 'customers:write',
    'deals:read', 'deals:write',
    'invoices:read', 'invoices:write',
    'payments:record', 'finance:view_ledger', 'finance:export',
    'rbac:switch_role'
  ],
  Manager: [
    'customers:read', 'customers:write',
    'deals:read', 'deals:write',
    'invoices:read',
    'finance:view_ledger',
    'rbac:switch_role'
  ],
  FinanceViewer: [
    'customers:read',
    'invoices:read',
    'finance:view_ledger', 'finance:export',
    'rbac:switch_role'
  ],
  SalesRep: [
    'customers:read', 'customers:write',
    'deals:read', 'deals:write',
    'invoices:read', 'invoices:write',
    'rbac:switch_role'
  ]
};

export const ROLE_METADATA: Record<UserRole, { label: string; description: string; badgeColor: string }> = {
  SuperAdmin: {
    label: 'Super Admin',
    description: 'Unrestricted global governance, system config, destructive operations',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300',
  },
  OrgAdmin: {
    label: 'Organization Admin',
    description: 'Full team and operational administration within the organization',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300',
  },
  Manager: {
    label: 'Sales Manager',
    description: 'Pipeline oversight, deal approvals, sales performance review',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300',
  },
  FinanceViewer: {
    label: 'Finance / Auditor',
    description: 'Financial ledger inspection, invoice audits, revenue exports (read-only pipeline)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  SalesRep: {
    label: 'Sales Representative',
    description: 'Direct customer engagement, deal progression, draft invoice generation',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300',
  },
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
