import { test, expect } from '../src/fixtures/test-base.js';

test.describe('Kostin ERP Audit: 1-Click Presets & Diagnostic Engine (F19-F22, F27)', () => {
  test('Loads presets bar, switches presets, scores diagnostic, and enables Executive PDF export', async ({
    page,
    appUrls,
  }) => {
    await page.goto(appUrls.kostinErpAudit);

    // 1. Verify 1-Click Presets Bar is visible on intro page
    const presetsHeading = page.locator('text=1-Click Employer Presets').first();
    await expect(presetsHeading).toBeVisible();

    // 2. Click "Legacy 1C" preset
    const legacyPreset = page.getByRole('button', { name: /Legacy 1C/i }).first();
    await expect(legacyPreset).toBeVisible();
    await legacyPreset.click();

    // 3. Verify report generation and sub-scores
    await expect(page.locator('text=Your business systems report').first()).toBeVisible();
    await expect(page.locator('text=/100').first()).toBeVisible();

    // 4. Verify 4 Architectural Sub-Scores are rendered
    await expect(page.locator('text=Data Consistency').first()).toBeVisible();
    await expect(page.locator('text=Process Bottlenecks').first()).toBeVisible();
    await expect(page.locator('text=Migration Readiness').first()).toBeVisible();
    await expect(page.locator('text=System Architecture').first()).toBeVisible();

    // 5. Verify Executive PDF download button
    const pdfButton = page.getByRole('button', { name: /Download Executive PDF/i });
    await expect(pdfButton).toBeVisible();
  });
});
