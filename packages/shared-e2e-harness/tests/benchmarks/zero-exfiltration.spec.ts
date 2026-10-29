import { test, expect } from '../../src/fixtures/test-base.js';

test.describe('Security Benchmark: Zero Data Exfiltration', () => {
  test('MarginPulse executes parsing and report generation with 0 external egress bytes', async ({
    page,
    appUrls,
    exfiltrationGuard,
  }) => {
    await page.goto(appUrls.marginpulse);

    // Trigger sample data ingestion if button present
    const sampleBtn = page.getByRole('button', { name: /Shopify|Amazon|Sample/i }).first();
    if (await sampleBtn.isVisible()) {
      await sampleBtn.click();
    }

    // Trigger audit report view/export if button present
    const reportBtn = page.getByRole('button', { name: /Audit Report|Export/i }).first();
    if (await reportBtn.isVisible()) {
      await reportBtn.click();
    }

    // Verify ExfiltrationGuard recorded 0 external network requests
    expect(exfiltrationGuard.violations).toHaveLength(0);
    expect(exfiltrationGuard.getEgressBytes()).toBe(0);
  });
});
