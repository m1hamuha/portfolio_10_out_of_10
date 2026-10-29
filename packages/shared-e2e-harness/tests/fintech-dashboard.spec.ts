import { test, expect } from '../src/fixtures/test-base.js';

test.describe('Fintech Dashboard & AI Financial Copilot (F33–F37)', () => {
  test('Renders 1-click presets, updates runway dynamically, and opens resilient AI Copilot Coach', async ({
    page,
    appUrls,
  }) => {
    // 1. Visit Fintech Dashboard live demo
    await page.goto(appUrls.fintechDashboard);

    // 2. Verify primary header and integer cent badge
    await expect(page.locator('h1:has-text("Fintech Analytics & Real-Time Runway Intelligence")')).toBeVisible();
    await expect(page.locator('text=Integer Cents')).toBeVisible();

    // 3. Verify the 3 employer demonstration presets (F37)
    const seedPreset = page.locator('[data-testid="preset-seed-emergency"]');
    const seriesAPreset = page.locator('[data-testid="preset-series-a-scaleup"]');
    const bootstrappedPreset = page.locator('[data-testid="preset-bootstrapped-alive"]');

    await expect(seedPreset).toBeVisible();
    await expect(seriesAPreset).toBeVisible();
    await expect(bootstrappedPreset).toBeVisible();

    // 4. Default Seed Emergency preset check (F33)
    const runwayDisplay = page.locator('[data-testid="runway-months-display"]');
    const runwayBadge = page.locator('[data-testid="runway-status-badge"]');
    await expect(runwayDisplay).toHaveText('3.6 mo');
    await expect(runwayBadge).toHaveText('CRITICAL');

    // 5. Select Series A Scaleup preset -> updates to 18.8 mo runway
    await seriesAPreset.click();
    await expect(runwayDisplay).toHaveText('18.8 mo');
    await expect(runwayBadge).toHaveText('HEALTHY');

    // 6. Select Bootstrapped Default Alive preset -> shows Default Alive
    await bootstrappedPreset.click();
    await expect(runwayDisplay).toHaveText('Default Alive');
    await expect(runwayBadge).toHaveText('DEFAULT ALIVE');

    // Switch back to Seed Emergency to test scenario simulation and AI advice
    await seedPreset.click();
    await expect(runwayDisplay).toHaveText('3.6 mo');

    // 7. Verify Core Financial KPIs & OpEx Breakdown (F35)
    await expect(page.locator('[data-testid="kpi-mrr-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-arr-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="opex-breakdown-card"]')).toBeVisible();

    // 8. Open AI Copilot Coach Drawer (F36)
    const openCoachBtn = page.locator('[data-testid="open-ai-coach-btn"]');
    await openCoachBtn.click();

    const drawer = page.locator('[data-testid="ai-coach-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(page.locator('text=Deterministic Heuristics (Offline)')).toBeVisible();

    // 9. Send Quick Prompt Chip for runway extension
    const promptChip0 = page.locator('[data-testid="prompt-chip-0"]');
    await expect(promptChip0).toBeVisible();
    await promptChip0.click();

    // 10. Verify assistant response renders structured 3-part diagnosis
    await expect(page.locator('text=1. Diagnosis').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=2. Action Plan').first()).toBeVisible();

    // 11. Close drawer
    await page.locator('[data-testid="close-ai-coach-btn"]').click();
    await expect(drawer).not.toBeVisible();
  });
});
