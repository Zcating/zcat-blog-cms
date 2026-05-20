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
    include: ['src/**/*.e2e.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
