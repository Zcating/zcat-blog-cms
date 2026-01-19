import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  external: ['react', 'react-dom'],
  platform: 'neutral',
  injectStyle: false,
  dts: false,
  clean: !options.watch,
  splitting: true,
  treeshake: true,
  tsconfig: './tsconfig.build.json',
}));
