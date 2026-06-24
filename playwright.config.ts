import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: {
    command: 'corepack pnpm --dir apps/web dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      WOLFIE_WAITLIST_EMAIL_MODE: 'file',
      WOLFIE_WAITLIST_XLSX_PATH: '/tmp/wolfie-playwright-waitlist.xlsx',
      WOLFIE_WAITLIST_EMAIL_PATH: '/tmp/wolfie-playwright-waitlist-email.json'
    }
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
