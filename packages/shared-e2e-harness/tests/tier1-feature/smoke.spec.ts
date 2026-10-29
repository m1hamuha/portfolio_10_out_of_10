import { test, expect } from '../../src/fixtures/test-base.js';

test.describe('Tier 1: Feature Smoke Scaffolding', () => {
  test('InvoiceAutopilot loads and renders primary header', async ({ page, appUrls }) => {
    await page.goto(appUrls.invoiceAutopilot);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('MarginPulse loads and renders primary header', async ({ page, appUrls }) => {
    await page.goto(appUrls.marginpulse);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('SlotSaver loads and renders primary header', async ({ page, appUrls }) => {
    await page.goto(appUrls.slotsaver);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('KostinErpAudit loads and renders primary header', async ({ page, appUrls }) => {
    await page.goto(appUrls.kostinErpAudit);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('EudrAssistant loads and renders primary header', async ({ page, appUrls }) => {
    await page.goto(appUrls.eudrAssistant);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('SaasCrmErp loads and renders primary header', async ({ page, appUrls }) => {
    await page.goto(appUrls.saasCrmErp);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('FintechDashboard loads and renders primary header', async ({ page, appUrls }) => {
    await page.goto(appUrls.fintechDashboard);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });
});
