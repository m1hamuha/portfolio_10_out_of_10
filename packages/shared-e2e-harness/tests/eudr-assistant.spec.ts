import { test, expect } from '../src/fixtures/test-base.js';

test.describe('EUDR Assistant: 1-Click Offline Interactive Demo & Compliance Pack (F23-F26, F27)', () => {
  test('Landing page links to /demo, renders presets, maps geolocations, and shows TRACES NT pack exporter', async ({
    page,
    appUrls,
  }) => {
    // 1. Visit landing page
    await page.goto(appUrls.eudrAssistant);
    const demoCta = page.getByRole('button', { name: /1-Click Interactive Demo|Demo/i }).first();
    await expect(demoCta).toBeVisible();

    // 2. Navigate to /demo
    await page.goto(`${appUrls.eudrAssistant}/demo`);
    await expect(page.locator('text=Interactive Geolocation Canvas').first()).toBeVisible();

    // 3. Verify the 3 employer demonstration presets
    const ghanaPreset = page.getByRole('button', { name: /Compliant Cocoa Ghana/i });
    const indonesiaPreset = page.getByRole('button', { name: /Supplier Conflict Indonesia/i });
    const brazilPreset = page.getByRole('button', { name: /Deforestation Brazil/i });

    await expect(ghanaPreset).toBeVisible();
    await expect(indonesiaPreset).toBeVisible();
    await expect(brazilPreset).toBeVisible();

    // 4. Default preset (Ghana) is COMPLIANT
    await expect(page.locator('text=COMPLIANT').first()).toBeVisible();

    // 5. Select Indonesia preset -> CONFLICT DETECTED
    await indonesiaPreset.click();
    await expect(page.locator('text=CONFLICT DETECTED').first()).toBeVisible();

    // 6. Select Brazil preset -> DEFORESTATION DETECTED
    await brazilPreset.click();
    await expect(page.locator('text=DEFORESTATION DETECTED').first()).toBeVisible();

    // 7. Verify Compliance Pack download button
    const downloadBtn = page.getByRole('button', { name: /Download TRACES NT Pack/i });
    await expect(downloadBtn).toBeVisible();
  });
});
