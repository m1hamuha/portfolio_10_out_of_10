import { defineConfig, devices } from '@playwright/test';
import { APP_PORTS, APP_URLS } from './src/config/ports.js';

const isCI = !!process.env.CI;
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : 3,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: './test-results',
  reporter: isCI
    ? [
        ['github'],
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'test-results/report.json' }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
      ],
  use: {
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'benchmarks',
      testDir: './tests/benchmarks',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tier1-feature',
      testDir: './tests/tier1-feature',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tier2-boundary',
      testDir: './tests/tier2-boundary',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tier3-pairwise',
      testDir: './tests/tier3-pairwise',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tier4-workload',
      testDir: './tests/tier4-workload',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'marginpulse',
      testMatch: /.*marginpulse.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URLS.marginpulse,
      },
    },
    {
      name: 'invoice-autopilot',
      testMatch: /.*invoice-autopilot.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URLS.invoiceAutopilot,
      },
    },
    {
      name: 'slotsaver',
      testMatch: /.*slotsaver.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URLS.slotsaver,
      },
    },
    {
      name: 'kostin-erp-audit',
      testMatch: /.*kostin-erp-audit.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URLS.kostinErpAudit,
      },
    },
    {
      name: 'eudr-assistant',
      testMatch: /.*eudr-assistant.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URLS.eudrAssistant,
      },
    },
    {
      name: 'saas-crm-erp',
      testMatch: /.*saas-crm-erp.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URLS.saasCrmErp,
      },
    },
    {
      name: 'fintech-dashboard',
      testMatch: /.*fintech-dashboard.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: APP_URLS.fintechDashboard,
      },
    },
  ],
  webServer: [
    {
      command: `${npmCmd} run dev --workspace=marginpulse -- --port ${APP_PORTS.marginpulse}`,
      url: APP_URLS.marginpulse,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `${npmCmd} run dev --workspace=invoice-autopilot -- --port ${APP_PORTS.invoiceAutopilot}`,
      url: APP_URLS.invoiceAutopilot,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `${npmCmd} run dev --workspace=slotsaver -- --port ${APP_PORTS.slotsaver}`,
      url: APP_URLS.slotsaver,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `${npmCmd} run dev --workspace=kostin-erp-audit -- --port ${APP_PORTS.kostinErpAudit}`,
      url: APP_URLS.kostinErpAudit,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `${npmCmd} run dev --workspace=eudr-compliance-assistant -- -p ${APP_PORTS.eudrAssistant}`,
      url: APP_URLS.eudrAssistant,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `${npmCmd} run dev --workspace=@portfolio/saas-crm-erp -- -p ${APP_PORTS.saasCrmErp}`,
      url: APP_URLS.saasCrmErp,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `${npmCmd} run dev --workspace=fintech-dashboard -- --port ${APP_PORTS.fintechDashboard}`,
      url: APP_URLS.fintechDashboard,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
});
