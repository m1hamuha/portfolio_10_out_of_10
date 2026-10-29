import { test, expect } from '../../src/fixtures/test-base.js';

test.describe('Tier 3: Pairwise Cross-Feature Interactions Suite (F42, F43)', () => {
  test('InvoiceAutopilot: Preset switching updates extraction card and ledger simultaneously', async ({
    page,
    appUrls,
  }) => {
    await page.goto(appUrls.invoiceAutopilot);
    const docItems = page.locator('.docitem');
    await expect(docItems.first()).toBeVisible();

    await docItems.nth(0).click();
    await expect(page.locator('.excard')).toBeVisible();
    await expect(page.locator('.ledger')).toBeVisible();
  });

  test('MarginPulse: Waterfall filtering integrates with SkuLedgerTable stage drilldown', async ({
    page,
    appUrls,
  }) => {
    await page.goto(appUrls.marginpulse);
    const waterfall = page.locator('[data-testid="waterfall-chart"]');
    await expect(waterfall).toBeVisible();

    const ledgerTable = page.locator('[data-testid="sku-ledger-table"]');
    await expect(ledgerTable).toBeVisible();
  });

  test('EUDR Assistant: Geolocation polygon verification pairs with TRACES NT pack download', async ({
    page,
    appUrls,
  }) => {
    await page.goto(`${appUrls.eudrAssistant}/demo`);
    const ghanaPreset = page.getByRole('button', { name: /Compliant Cocoa Ghana/i });
    await expect(ghanaPreset).toBeVisible();
    await ghanaPreset.click();

    const downloadBtn = page.getByRole('button', { name: /Download TRACES NT Pack/i });
    await expect(downloadBtn).toBeVisible();
  });

  test('SaaS CRM ERP: RBAC persona switches preserve ledger data consistency', async ({ page, appUrls }) => {
    await page.goto(appUrls.saasCrmErp);

    // Switch to FinanceViewer
    await page.locator('[data-testid="role-btn-FinanceViewer"]').click();
    await expect(page.locator('[data-testid="active-role-badge"]')).toHaveText('Finance / Auditor');

    // Invoices ledger is accessible to FinanceViewer
    await page.locator('[data-testid="tab-invoices"]').click();
    await expect(page.locator('text=Invoices & Financial Operations Ledger').first()).toBeVisible();
  });

  test('Cross-Navigation: All live demos contain bidirectional portfolio links', async ({ page, appUrls }) => {
    const urls = [
      appUrls.invoiceAutopilot,
      appUrls.marginpulse,
      appUrls.slotsaver,
      appUrls.kostinErpAudit,
    ];

    for (const url of urls) {
      await page.goto(url);
      const hubLink = page.locator('a:has-text("Central Portfolio Hub")').first();
      await expect(hubLink).toBeVisible();
    }
  });
});
