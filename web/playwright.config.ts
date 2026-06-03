import { defineConfig } from '@playwright/test';

const useSystemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...(useSystemChrome ? { channel: 'chrome' } : {})
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
});
