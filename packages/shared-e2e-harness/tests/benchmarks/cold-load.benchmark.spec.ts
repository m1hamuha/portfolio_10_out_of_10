import { test, expect } from '../../src/fixtures/test-base.js';
import { PERFORMANCE_BUDGETS } from '../../src/config/budgets.js';

test.describe('Performance Benchmark: Cold Page Load (<1.5s)', () => {
  test('InvoiceAutopilot cold load satisfies SLA (<1500ms)', async ({ page, appUrls, perf }) => {
    const start = performance.now();
    await page.goto(appUrls.invoiceAutopilot, { waitUntil: 'load' });
    const duration = performance.now() - start;

    const metrics = await perf.getNavigationMetrics();
    console.log(`[InvoiceAutopilot] Load: ${duration}ms, DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.COLD_LOAD_MAX_MS);
    await expect(page.locator('body')).toBeVisible();
  });

  test('MarginPulse cold load satisfies SLA (<1500ms)', async ({ page, appUrls, perf }) => {
    const start = performance.now();
    await page.goto(appUrls.marginpulse, { waitUntil: 'load' });
    const duration = performance.now() - start;

    const metrics = await perf.getNavigationMetrics();
    console.log(`[MarginPulse] Load: ${duration}ms, DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.COLD_LOAD_MAX_MS);
    await expect(page.locator('body')).toBeVisible();
  });

  test('SlotSaver cold load satisfies SLA (<1500ms)', async ({ page, appUrls, perf }) => {
    const start = performance.now();
    await page.goto(appUrls.slotsaver, { waitUntil: 'load' });
    const duration = performance.now() - start;

    const metrics = await perf.getNavigationMetrics();
    console.log(`[SlotSaver] Load: ${duration}ms, DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.COLD_LOAD_MAX_MS);
    await expect(page.locator('body')).toBeVisible();
  });

  test('KostinErpAudit cold load satisfies SLA (<1500ms)', async ({ page, appUrls, perf }) => {
    const start = performance.now();
    await page.goto(appUrls.kostinErpAudit, { waitUntil: 'load' });
    const duration = performance.now() - start;

    const metrics = await perf.getNavigationMetrics();
    console.log(`[KostinErpAudit] Load: ${duration}ms, DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.COLD_LOAD_MAX_MS);
    await expect(page.locator('body')).toBeVisible();
  });

  test('EudrAssistant cold load satisfies SLA (<1500ms)', async ({ page, appUrls, perf }) => {
    const start = performance.now();
    await page.goto(appUrls.eudrAssistant, { waitUntil: 'load' });
    const duration = performance.now() - start;

    const metrics = await perf.getNavigationMetrics();
    console.log(`[EudrAssistant] Load: ${duration}ms, DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.COLD_LOAD_MAX_MS);
    await expect(page.locator('body')).toBeVisible();
  });

  test('SaasCrmErp cold load satisfies SLA (<1500ms)', async ({ page, appUrls, perf }) => {
    const start = performance.now();
    await page.goto(appUrls.saasCrmErp, { waitUntil: 'load' });
    const duration = performance.now() - start;

    const metrics = await perf.getNavigationMetrics();
    console.log(`[SaasCrmErp] Load: ${duration}ms, DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.COLD_LOAD_MAX_MS);
    await expect(page.locator('body')).toBeVisible();
  });

  test('FintechDashboard cold load satisfies SLA (<1500ms)', async ({ page, appUrls, perf }) => {
    const start = performance.now();
    await page.goto(appUrls.fintechDashboard, { waitUntil: 'load' });
    const duration = performance.now() - start;

    const metrics = await perf.getNavigationMetrics();
    console.log(`[FintechDashboard] Load: ${duration}ms, DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);

    expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.COLD_LOAD_MAX_MS);
    await expect(page.locator('body')).toBeVisible();
  });
});
