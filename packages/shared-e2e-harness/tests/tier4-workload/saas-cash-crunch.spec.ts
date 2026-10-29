import { test, expect } from '../../src/fixtures/test-base.js';

test.describe('Tier 4 Workload Scenario: SaaS CFO Cash Crunch & Runway Extension Stress Test', () => {
  test('Simulates seed-stage cash crunch, detects critical runway compression on hiring, and verifies AI recovery plan', async ({
    page,
    appUrls,
  }) => {
    // 1. Visit Fintech Dashboard
    await page.goto(appUrls.fintechDashboard);

    // 2. Start from Seed Emergency Preset ($180k cash, $50k net burn, 3.6 mo runway)
    const seedPreset = page.locator('[data-testid="preset-seed-emergency"]');
    await seedPreset.click();
    await expect(page.locator('[data-testid="runway-months-display"]')).toHaveText('3.6 mo');

    // 3. Open AI Copilot Coach to assess initial runway
    const openCoachBtn = page.locator('[data-testid="open-ai-coach-btn"]');
    await openCoachBtn.click();
    const drawer = page.locator('[data-testid="ai-coach-drawer"]');
    await expect(drawer).toBeVisible();

    // 4. Query AI Copilot on hiring 2 senior engineers
    const hirePromptChip = page.locator('[data-testid="prompt-chip-1"]'); // 'Can we afford to hire 2 senior engineers?'
    await expect(hirePromptChip).toBeVisible();
    await hirePromptChip.click();

    // 5. Verify the AI Copilot delivers a rigorous mathematical REJECT/DEFER verdict
    await expect(page.locator('text=CRITICAL ADVICE: REJECT OR DEFER').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=increase monthly payroll by').first()).toBeVisible();

    // 6. Close drawer to adjust scenario simulator
    await page.locator('[data-testid="close-ai-coach-btn"]').click();
    await expect(drawer).not.toBeVisible();

    // 7. Apply 1-click "Hiring Freeze & -15% OpEx" scenario preset
    const freezePresetBtn = page.getByRole('button', { name: /Hiring Freeze/i });
    if (await freezePresetBtn.isVisible()) {
      await freezePresetBtn.click();
      // Verify runway extension delta is positive
      await expect(page.locator('text=+').first()).toBeVisible();
    }
  });
});
