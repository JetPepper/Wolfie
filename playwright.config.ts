import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: { command: 'pnpm --dir apps/web dev', url: 'http://127.0.0.1:3000', reuseExistingServer: true, timeout: 120000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
