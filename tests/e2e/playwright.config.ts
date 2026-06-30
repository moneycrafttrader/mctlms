import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : 1,
  maxFailures: CI ? 5 : undefined,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  outputDir: 'test-results',

  use: {
    baseURL: process.env.API_URL || 'http://localhost:3001',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    trace: CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: CI ? 'retain-on-failure' : 'off',
  },

  projects: [
    {
      name: 'recordings-api',
      testMatch: 'recordings/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: CI
        ? 'pnpm --filter @lms/api start'
        : 'pnpm --filter @lms/api dev',
      url: process.env.API_URL || 'http://localhost:3001/api/health',
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(CI
      ? [['json', { outputFile: 'test-results/e2e-results.json' }]]
      : []),
  ],
});
