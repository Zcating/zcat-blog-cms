import { defineConfig, devices } from '@playwright/test';

import {
  APP_PORT,
  APP_URL,
  MOCK_BACKEND_API_URL,
  MOCK_BACKEND_PORT,
} from './tests/e2e/e2e-ports';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Every spec file owns one shared, mutable mock backend
  // (tests/e2e/mock-backend.ts) and resets it from `beforeEach`.
  // `fullyParallel: false` only serialises tests *within* a file, so
  // running files in parallel lets one file's `/api/test/reset` wipe
  // the fixture state another file is mid-assertion on. Serialising
  // the files is what makes the suite deterministic.
  workers: 1,
  // Phase 3a: the e2e login suite is timing-sensitive because the
  // Nitro server runs RPC traffic back-to-back across tests. A single
  // retry absorbs the transient browser-navigation race that
  // occasionally leaves the URL on `/login` after a successful
  // submit. CI also gets the retry.
  retries: process.env.CI ? 2 : 1,
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: APP_URL,
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
      url: `${MOCK_BACKEND_API_URL}/health`,
      env: { E2E_MOCK_BACKEND_PORT: String(MOCK_BACKEND_PORT) },
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'node .output/server/index.mjs',
      url: `${APP_URL}/login`,
      env: {
        BACKEND_API_URL: MOCK_BACKEND_API_URL,
        PORT: String(APP_PORT),
        NODE_ENV: 'production',
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
