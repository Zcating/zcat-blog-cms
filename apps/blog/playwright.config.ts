import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: 'http://localhost:1024',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], timezoneId: 'Asia/Shanghai' },
    },
  ],
  webServer: {
    command: 'node .output/server/index.mjs',
    url: 'http://localhost:1024/toolbox',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      PORT: '1024',
      BACKEND_API_URL: 'http://localhost:9090/api',
      BLOG_SITE_URL: 'http://localhost:1024',
    },
  },
});
