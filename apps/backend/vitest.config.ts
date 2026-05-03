import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@backend': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
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
        'node_modules/**',
        'dist/**',
        'test/**',
      ],
    },
  },
});
