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
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret',
    },
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**', 'test/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        'src/main.ts',
        'src/**/index.ts',
        'src/common/prisma.service.ts',
        'src/features/public/blog/blog.schema.ts',
        'src/**/*.e2e.test.ts',
        'node_modules/**',
        'dist/**',
        'test/**',
      ],
    },
  },
});
