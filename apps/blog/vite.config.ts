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
                // The index/, toolbox/ and ai-chat/ subtrees plus the two
                // bracket-escaped xml routes are still React Router v7
                // modules, migrated in later phases. They are matched by
                // basename so the generator skips the whole subtree.
                // index/ now holds only routes/index/about.tsx (the React
                // Router module behind /about) and the unregistered
                // routes/index/test-statistics.tsx; the migrated content
                // routes live in routes/_blog/.
                routeFileIgnorePattern:
                  '^(?:index|toolbox|ai-chat|rss\\[\\.\\]xml\\.ts|sitemap\\[\\.\\]xml\\.ts)$|\\.(?:test|spec)\\.[jt]sx?$',
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
      proxy: {
        '/api': {
          target: env.VITE_SERVER_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
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
