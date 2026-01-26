import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv;

  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    server: {
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
    ssr: {
      external: [
        '@originjs/crypto-js-wasm',
        'cipher-base',
        'hash-base',
        'asn1.js',
      ],
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('mermaid') ||
                id.includes('cytoscape') ||
                id.includes('katex') ||
                id.includes('dagre') ||
                id.includes('graphlib')
              ) {
                return 'diagram';
              }
              if (id.includes('crypto-js') || id.includes('cipher-base')) {
                return 'crypto';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react';
              }
              if (id.includes('zcat')) {
                return 'zcat-ui';
              }
              return 'vendor';
            }
            return 'app';
          },
        },
      },
    },
  };
});
