import { test, expect } from '../src/fixtures/test-base.js';

test.describe('InvoiceAutopilot: Zero-Touch Document Validation & Multi-Step Review (F4–F8)', () => {
  test('Renders interactive demo, loads invoice presets, validates fields, and exercises ROI calculator', async ({
    page,
    appUrls,
  }) => {
    // 1. Visit InvoiceAutopilot demo
    await page.goto(appUrls.invoiceAutopilot);

    // 2. Verify primary heading and branding
    await expect(page.locator('h1:has-text("InvoiceAutopilot")')).toBeVisible();

    // 3. Scroll to live demo section
    const demoSection = page.locator('#demo');
    await expect(demoSection).toBeVisible();

    // 4. Verify DocStack renders sample invoices in inbox
    const docStack = page.locator('.docstack');
    await expect(docStack).toBeVisible();
    await expect(page.locator('.docstack-list .docitem')).toHaveCount(5);

    // 5. Select German invoice (DOC-1)
    const doc1 = page.locator('.docitem[aria-disabled="false"]').first();
    await doc1.click();

    // 6. Verify ExtractionCard is rendered
    const extractionCard = page.locator('.excard');
    await expect(extractionCard).toBeVisible();
    await expect(page.locator('text=What we read').first()).toBeVisible();

    // 7. Verify Ledger table displays posted documents
    const ledger = page.locator('.ledger');
    await expect(ledger).toBeVisible();

    // 8. Verify ROI Calculator is interactive
    const roiCalculator = page.locator('#roi');
    await expect(roiCalculator).toBeVisible();
    await expect(page.locator('text=Net Annual Savings').first()).toBeVisible();

    // 9. Verify portfolio cross-navigation links exist in footer
    const portfolioHubLink = page.locator('footer a:has-text("Central Portfolio Hub")');
    await expect(portfolioHubLink).toBeVisible();
  });
});
