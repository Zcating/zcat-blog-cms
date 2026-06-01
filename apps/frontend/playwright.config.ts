import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npx tsx ./tests/e2e/mock-backend.ts',
      url: 'http://127.0.0.1:9090/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'pnpm exec react-router dev --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173/login',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
