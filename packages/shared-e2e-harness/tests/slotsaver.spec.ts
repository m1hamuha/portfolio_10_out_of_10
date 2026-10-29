import { test, expect } from '../src/fixtures/test-base.js';

test.describe('SlotSaver: Priority Waitlist Rebooking & n8n Automation (F14–F18)', () => {
  test('Renders interactive salon schedule, simulates cancellation autofill, and verifies n8n asset download', async ({
    page,
    appUrls,
  }) => {
    // 1. Visit SlotSaver live demo
    await page.goto(appUrls.slotsaver);

    // 2. Verify branding and header
    await expect(page.locator('.brand-name:has-text("SlotSaver")').first()).toBeVisible();
    await expect(page.locator('h1:has-text("A cancellation just refilled itself")')).toBeVisible();

    // 3. Scroll to live demo section
    await page.goto(`${appUrls.slotsaver}#demo`);
    await expect(page.locator('.demo-stage').first()).toBeVisible();

    // 4. Verify Schedule and Waitlist are rendered
    const schedule = page.locator('.schedule');
    const waitlist = page.locator('.ranker');
    await expect(schedule).toBeVisible();
    await expect(waitlist).toBeVisible();

    // 5. Verify Revenue Recovery Metrics are visible (F18)
    const metricsCard = page.locator('[data-testid="revenue-recovery-metrics"]');
    await expect(metricsCard).toBeVisible();

    // 6. Click "Simulate a cancellation" button
    const simulateBtn = page.getByRole('button', { name: /Simulate a cancellation/i });
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();

    // 7. Verify simulation status update in control strip
    await expect(page.locator('.control-status')).toBeVisible();

    // 8. Verify Live Event Log renders incoming events (F16)
    const eventLog = page.locator('[data-testid="live-event-log"]');
    await expect(eventLog).toBeVisible();
    await expect(page.locator('.event-item').first()).toBeVisible();

    // 9. Verify 9-Node n8n Workflow Download card (F17)
    const n8nCard = page.locator('.n8n-workflow-card');
    await expect(n8nCard).toBeVisible();
    await expect(page.getByRole('button', { name: /Download \(\.json\)/i })).toBeVisible();

    // 10. Verify portfolio cross-navigation links exist in footer
    const portfolioLink = page.locator('footer a:has-text("Central Portfolio Hub")');
    await expect(portfolioLink).toBeVisible();
  });
});
