import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  external: ['react', 'react-dom'],
  platform: 'neutral',
  injectStyle: false,
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  tsconfig: './tsconfig.build.json',
});
