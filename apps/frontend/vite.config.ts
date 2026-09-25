import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
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
                // Phase 3a: ignore the legacy React-Router-only route
                // files. The phase keeps them on disk for the BFF
                // lanes (Phase 2b) but prevents the file-based
                // routing generator from emitting warnings about
                // unknown filenames. Phase 3b/c will delete them.
                //
                // Patterns (matched against the file basename):
                //   - `api-bff.*.ts`        — old `api/bff/*` proxy
                //   - `auth-bff.*.ts`       — old `auth/bff/*` proxy
                //   - `home.tsx`            — React-Router-only home
                //   - `article-categories.tsx` — RR-only legacy
                //   - `$.tsx`               — old splat catch-all
                routeFileIgnorePattern:
                  '^(api-bff\\..+|auth-bff\\..+|home\\.tsx|article-categories\\.tsx|\\$\\.tsx)$',
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
      port: Number(env.VITE_PORT),
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./app/test-setup.ts'],
      include: ['app/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      globals: true,
    },
  };
});
