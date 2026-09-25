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
