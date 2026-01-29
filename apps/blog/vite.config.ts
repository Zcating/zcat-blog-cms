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
        'mermaid',
        'cytoscape',
        'dagre',
        'graphlib',
        'unified',
        'react-markdown',
        'remark-parse',
        'remark-math',
        'remark-gfm',
        'remark-rehype',
        'rehype-stringify',
        'rehype-katex',
      ],
      noExternal: ['@zcat/ui'],
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return 'app';
            }
            if (
              id.includes('mermaid') ||
              id.includes('cytoscape') ||
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

            if (
              id.includes('katex') ||
              id.includes('rehype-katex') ||
              id.includes('remark-math') ||
              id.includes('remark-gfm') ||
              id.includes('remark-rehype') ||
              id.includes('rehype-stringify') ||
              id.includes('react-markdown')
            ) {
              return 'react-markdown';
            }
            return 'vendor';
          },
        },
      },
    },
  };
});
