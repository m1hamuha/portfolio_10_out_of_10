import { test } from '../../src/fixtures/test-base.js';

test.describe('Code Quality: Clean Console Auditor (Zero Errors & Warnings)', () => {
  test('All active live demo pages render without console errors or warnings', async ({
    page,
    appUrls,
    consoleAuditor,
  }) => {
    const demoUrls = [
      { name: 'MarginPulse', url: appUrls.marginpulse },
      { name: 'InvoiceAutopilot', url: appUrls.invoiceAutopilot },
      { name: 'SlotSaver', url: appUrls.slotsaver },
      { name: 'KostinErpAudit', url: appUrls.kostinErpAudit },
      { name: 'EudrAssistant', url: appUrls.eudrAssistant },
      { name: 'SaasCrmErp', url: appUrls.saasCrmErp },
      { name: 'FintechDashboard', url: appUrls.fintechDashboard },
    ];

    for (const demo of demoUrls) {
      consoleAuditor.clear();
      await page.goto(demo.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Asserts 0 console errors and 0 console warnings for this application
      consoleAuditor.assertClean();
    }
  });
});
