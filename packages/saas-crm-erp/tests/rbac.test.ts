import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  ROLE_PERMISSIONS,
  UserRole,
} from '../packages/shared-types/src';

describe('Role-Based Access Control (RBAC) Matrix Tests', () => {
  it('SuperAdmin has all 14 permissions', () => {
    const perms = ROLE_PERMISSIONS['SuperAdmin'];
    expect(perms).toHaveLength(14);
    expect(hasPermission('SuperAdmin', 'customers:delete')).toBe(true);
    expect(hasPermission('SuperAdmin', 'deals:delete')).toBe(true);
    expect(hasPermission('SuperAdmin', 'invoices:delete')).toBe(true);
    expect(hasPermission('SuperAdmin', 'org:manage')).toBe(true);
  });

  it('OrgAdmin has operational permissions but lacks destructive org:manage and delete perms', () => {
    expect(hasPermission('OrgAdmin', 'customers:write')).toBe(true);
    expect(hasPermission('OrgAdmin', 'deals:write')).toBe(true);
    expect(hasPermission('OrgAdmin', 'finance:view_ledger')).toBe(true);
    expect(hasPermission('OrgAdmin', 'customers:delete')).toBe(false);
    expect(hasPermission('OrgAdmin', 'org:manage')).toBe(false);
  });

  it('Manager can manage deals and view finance, but cannot record payments or export', () => {
    expect(hasPermission('Manager', 'deals:write')).toBe(true);
    expect(hasPermission('Manager', 'finance:view_ledger')).toBe(true);
    expect(hasPermission('Manager', 'payments:record')).toBe(false);
    expect(hasPermission('Manager', 'finance:export')).toBe(false);
  });

  it('FinanceViewer is read-only on pipeline but has full finance audit rights', () => {
    expect(hasPermission('FinanceViewer', 'finance:view_ledger')).toBe(true);
    expect(hasPermission('FinanceViewer', 'finance:export')).toBe(true);
    expect(hasPermission('FinanceViewer', 'customers:read')).toBe(true);
    expect(hasPermission('FinanceViewer', 'deals:write')).toBe(false);
    expect(hasPermission('FinanceViewer', 'deals:delete')).toBe(false);
    expect(hasPermission('FinanceViewer', 'customers:write')).toBe(false);
  });

  it('SalesRep can create customers, manage deals, and draft invoices, but cannot view finance ledger', () => {
    expect(hasPermission('SalesRep', 'customers:read')).toBe(true);
    expect(hasPermission('SalesRep', 'customers:write')).toBe(true);
    expect(hasPermission('SalesRep', 'deals:read')).toBe(true);
    expect(hasPermission('SalesRep', 'deals:write')).toBe(true);
    expect(hasPermission('SalesRep', 'invoices:write')).toBe(true);
    expect(hasPermission('SalesRep', 'finance:view_ledger')).toBe(false);
    expect(hasPermission('SalesRep', 'finance:export')).toBe(false);
    expect(hasPermission('SalesRep', 'customers:delete')).toBe(false);
  });

  it('evaluates hasAllPermissions and hasAnyPermission correctly', () => {
    expect(hasAllPermissions('SuperAdmin', ['customers:read', 'customers:delete'])).toBe(true);
    expect(hasAllPermissions('SalesRep', ['customers:read', 'customers:delete'])).toBe(false);
    expect(hasAnyPermission('SalesRep', ['customers:delete', 'deals:write'])).toBe(true);
    expect(hasAnyPermission('FinanceViewer', ['customers:delete', 'deals:write'])).toBe(false);
  });
});
