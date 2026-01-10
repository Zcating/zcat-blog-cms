import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  external: ['react', 'react-dom', 'tailwindcss'],
  // dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  bundle: true,
  treeshake: true,
});
