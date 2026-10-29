import { test, expect } from '../src/fixtures/test-base.js';

test.describe('MarginPulse: In-Browser Financial Analysis & Profit Leak Waterfall (F9–F13)', () => {
  test('Renders control tower, loads 1-click presets, filters waterfall stages, and opens executive audit report', async ({
    page,
    appUrls,
  }) => {
    // 1. Visit MarginPulse live demo
    await page.goto(appUrls.marginpulse);

    // 2. Verify branding and primary header
    await expect(page.locator('h1:has-text("MarginPulse")')).toBeVisible();
    await expect(page.locator('.store-chip')).toBeVisible();

    // 3. Verify PresetBar is present
    const presetBar = page.locator('.preset-bar');
    await expect(presetBar).toBeVisible();

    // 4. Test loading Shopify preset
    const shopifyBtn = page.getByRole('button', { name: /Shopify/i }).first();
    await expect(shopifyBtn).toBeVisible();
    await shopifyBtn.click();
    await expect(page.locator('.store-chip')).toContainText('Shopify');

    // 5. Test loading WooCommerce preset (F9)
    const wooBtn = page.getByRole('button', { name: /WooCommerce/i }).first();
    await expect(wooBtn).toBeVisible();
    await wooBtn.click();
    await expect(page.locator('.store-chip')).toContainText('WooCommerce');

    // 6. Verify Interactive Waterfall is rendered (F12)
    const waterfall = page.locator('[data-testid="waterfall-chart"]');
    await expect(waterfall).toBeVisible();

    // 7. Verify SkuLedgerTable is rendered
    const ledgerTable = page.locator('[data-testid="sku-ledger-table"]');
    await expect(ledgerTable).toBeVisible();

    // 8. Open Executive Audit Report Modal (F13)
    const reportBtn = page.getByRole('button', { name: /Executive Audit Report/i });
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    const reportModal = page.locator('[data-testid="audit-summary"]');
    await expect(reportModal).toBeVisible();
    await expect(page.locator('text=Portfolio Health').first()).toBeVisible();

    // Close Executive Audit Report Modal
    const closeModalBtn = reportModal.locator('button:has-text("✕")');
    await closeModalBtn.click();
    await expect(reportModal).not.toBeVisible();

    // 9. Verify portfolio cross-navigation links in footer
    const portfolioLink = page.locator('footer a:has-text("Central Portfolio Hub")');
    await expect(portfolioLink).toBeVisible();
  });
});
