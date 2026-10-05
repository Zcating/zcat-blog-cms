import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { nitro } from 'nitro/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv;
  return {
    plugins: [
      tailwindcss(),
      ...(mode === 'test'
        ? []
        : [
            // tanstackStart MUST come before viteReact().
            tanstackStart({
              srcDirectory: 'app',
              router: {
                routesDirectory: './routes',
                // Colocated *.test.ts(x) files live beside the routes they
                // cover; the generator must skip them.
                routeFileIgnorePattern: '\\.(?:test|spec)\\.[jt]sx?$',
              },
            }),
            viteReact(),
            // nitro() runs the final SSR/CSR rollup output through the
            // node-server preset so `pnpm start` can serve
            // `.output/server/index.mjs`.
            nitro(),
          ]),
      tsconfigPaths(),
    ],
    server: {
      host: '127.0.0.1',
      port: Number(env.VITE_PORT),
    },
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['@originjs/crypto-js-wasm'],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['app/**/*.{test,spec}.{ts,tsx}'],
      globals: true,
    },
  };
});
