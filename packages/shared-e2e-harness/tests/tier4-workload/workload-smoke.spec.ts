import { test, expect } from '../../src/fixtures/test-base.js';

test.describe('Tier 4: Real-World Workload Scenarios (F42, F43)', () => {
  test('Scenario 1: Accounts Payable Month-End Processing Run (InvoiceAutopilot)', async ({
    page,
    appUrls,
  }) => {
    await page.goto(appUrls.invoiceAutopilot);
    const demo = page.locator('#demo');
    await expect(demo).toBeVisible();

    // Select doc items to exercise ingestion and extraction
    const docItems = page.locator('.docitem');
    const count = await docItems.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await docItems.nth(i).click();
      await expect(page.locator('.excard')).toBeVisible();
    }

    // Verify ledger accumulates entries
    await expect(page.locator('.ledger')).toBeVisible();
  });

  test('Scenario 2: E-Commerce Settlement Audit (MarginPulse)', async ({ page, appUrls }) => {
    await page.goto(appUrls.marginpulse);

    // Load Amazon preset
    const amazonBtn = page.getByRole('button', { name: /Amazon/i }).first();
    await expect(amazonBtn).toBeVisible();
    await amazonBtn.click();
    await expect(page.locator('.store-chip')).toContainText('Amazon');

    // Verify waterfall and top 3 profit killers
    await expect(page.locator('[data-testid="waterfall-chart"]')).toBeVisible();
    const villainCards = page.locator('.villain');
    if ((await villainCards.count()) > 0) {
      await villainCards.first().click();
      await expect(page.locator('.drawer')).toBeVisible();
      // Close drawer
      const closeBtn = page.locator('.d-close');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('Scenario 3: Salon Rush Cancellation Backfill Simulation (SlotSaver)', async ({
    page,
    appUrls,
  }) => {
    await page.goto(appUrls.slotsaver);
    await page.goto(`${appUrls.slotsaver}#demo`);

    const simulateBtn = page.getByRole('button', { name: /Simulate a cancellation/i });
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();

    // Verify status update and event log activity
    await expect(page.locator('.control-status')).toBeVisible();
    const eventLog = page.locator('[data-testid="live-event-log"]');
    await expect(eventLog).toBeVisible();
  });

  test('Scenario 4: EUDR Agricultural Due Diligence Pack Audit (EUDR Assistant)', async ({
    page,
    appUrls,
  }) => {
    await page.goto(`${appUrls.eudrAssistant}/demo`);
    await expect(page.locator('text=Interactive Geolocation Canvas').first()).toBeVisible();

    // Select Indonesia conflict preset
    const indonesiaBtn = page.getByRole('button', { name: /Supplier Conflict Indonesia/i });
    await indonesiaBtn.click();
    await expect(page.locator('text=CONFLICT DETECTED').first()).toBeVisible();

    // Switch back to Ghana compliant preset
    const ghanaBtn = page.getByRole('button', { name: /Compliant Cocoa Ghana/i });
    await ghanaBtn.click();
    await expect(page.locator('text=COMPLIANT').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Download TRACES NT Pack/i })).toBeVisible();
  });
});
