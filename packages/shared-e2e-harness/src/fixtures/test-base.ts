import { test as baseTest, expect } from '@playwright/test';
import { ConsoleAuditor } from '../helpers/clean-console.js';
import { ExfiltrationGuard } from '../helpers/exfiltration-guard.js';
import { PerfMeasurer } from '../helpers/perf-measurer.js';
import { APP_URLS } from '../config/ports.js';

export interface HarnessFixtures {
  consoleAuditor: ConsoleAuditor;
  exfiltrationGuard: ExfiltrationGuard;
  perf: PerfMeasurer;
  appUrls: typeof APP_URLS;
}

export const test = baseTest.extend<HarnessFixtures>({
  consoleAuditor: async ({ page }, use) => {
    const auditor = new ConsoleAuditor(page);
    await use(auditor);
    auditor.assertClean();
  },

  exfiltrationGuard: async ({ page }, use) => {
    const guard = new ExfiltrationGuard(page);
    await guard.start();
    await use(guard);
    guard.assertZeroExfiltration();
  },

  perf: async ({ page }, use) => {
    const perf = new PerfMeasurer(page);
    await use(perf);
  },

  appUrls: async ({}, use) => {
    await use(APP_URLS);
  },
});

export { expect };
