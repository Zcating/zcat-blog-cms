import 'dotenv/config';

import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@backend': fileURLToPath(new URL('./src', import.meta.url)),
      '@backend/prisma': fileURLToPath(
        new URL('./generated/prisma/client', import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      JWT_SECRET: 'test-secret',
      OSS_ACCESS_KEY: 'test-access-key',
      OSS_SECRET_KEY: 'test-secret-key',
      OSS_BUCKET: 'pictures',
    },
    include: ['src/**/*.db.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
