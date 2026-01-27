import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zcat/ui': path.resolve(__dirname, '../src'),
    },
  },
  root: './e2e',
  server: {
    port: 5199,
    host: true,
  },
});
