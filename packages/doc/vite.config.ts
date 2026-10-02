import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'app',
      router: {
        routesDirectory: './routes',
        routeFileIgnorePattern: '\\.test\\.[jt]sx?$',
      },
    }),
    viteReact(),
    nitro(),
    tsconfigPaths(),
  ],
});
