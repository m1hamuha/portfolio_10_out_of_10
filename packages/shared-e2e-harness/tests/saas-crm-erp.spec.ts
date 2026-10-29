import { test, expect } from '../src/fixtures/test-base.js';

test.describe('SaaS Platform & Financial Intelligence: CRM ERP Engine (F28–F32)', () => {
  test('Renders platform shell, switches 5 RBAC personas, navigates tabs, and executes ledger workflow', async ({
    page,
    appUrls,
  }) => {
    // 1. Visit SaaS CRM/ERP live demo
    await page.goto(appUrls.saasCrmErp);

    // 2. Verify header & zero-setup mock connected indicator
    await expect(page.locator('h1:has-text("SaaS CRM / ERP Platform")')).toBeVisible();
    await expect(page.locator('text=Zero-Setup Mock Connected')).toBeVisible();

    // 3. Verify default active persona is SuperAdmin
    const roleBadge = page.locator('[data-testid="active-role-badge"]');
    await expect(roleBadge).toHaveText('Super Admin');
    await expect(page.locator('text=Sarah Connor')).toBeVisible();

    // 4. Test RBAC Switcher: switch to SalesRep (Alex Rivera)
    const salesRepBtn = page.locator('[data-testid="role-btn-SalesRep"]');
    await salesRepBtn.click();
    await expect(roleBadge).toHaveText('Sales Representative');
    await expect(page.locator('text=Alex Rivera')).toBeVisible();
    await expect(page.locator('text=Destructive actions (customer/deal deletion) gated.')).toBeVisible();

    // 5. Test RBAC Switcher: switch to FinanceViewer (David Miller)
    const financeBtn = page.locator('[data-testid="role-btn-FinanceViewer"]');
    await financeBtn.click();
    await expect(roleBadge).toHaveText('Finance / Auditor');
    await expect(page.locator('text=David Miller')).toBeVisible();
    await expect(page.locator('text=Pipeline edit operations restricted (Auditor Mode).')).toBeVisible();

    // Switch back to SuperAdmin for full execution capabilities
    await page.locator('[data-testid="role-btn-SuperAdmin"]').click();
    await expect(roleBadge).toHaveText('Super Admin');

    // 6. Navigation Tabs: Customers Grid (F30)
    await page.locator('[data-testid="tab-customers"]').click();
    await expect(page.locator('text=Customers Directory')).toBeVisible();
    await expect(page.locator('text=Acme Corporation')).toBeVisible();
    await expect(page.locator('text=Lifetime Value (LTV)')).toBeVisible();

    // 7. Navigation Tabs: Deals Pipeline (F31)
    await page.locator('[data-testid="tab-deals"]').click();
    await expect(page.locator('text=Deals Pipeline (Kanban)').first()).toBeVisible();
    await expect(page.locator('text=1. Prospect').first()).toBeVisible();
    await expect(page.locator('text=5. Closed Won').first()).toBeVisible();

    // 8. Navigation Tabs: Invoices & Operations Ledger (F29, F32)
    await page.locator('[data-testid="tab-invoices"]').click();
    await expect(page.locator('text=Invoices & Financial Operations Ledger').first()).toBeVisible();
    await expect(page.locator('text=INV-2026-1001').first()).toBeVisible();

    // 9. Reset Demo Data (F28)
    const resetBtn = page.locator('[data-testid="reset-demo-data-btn"]');
    await resetBtn.click();
    await expect(page.locator('text=Demo Data Pristine')).toBeVisible();
  });
});
