import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

import autoprefixer from 'autoprefixer';
import postcssImport from 'postcss-import';
import tailwindcss from '@tailwindcss/postcss';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const dependencyNames = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);

function isExternal(id) {
  if (id.startsWith('node:')) return true;
  if (dependencyNames.has(id)) return true;
  for (const dep of dependencyNames) {
    if (id.startsWith(`${dep}/`)) return true;
  }
  return false;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function subpathAlias(prefix, targetDir) {
  return {
    find: new RegExp(`^${escapeRegExp(prefix)}(?=$|/)`),
    replacement: targetDir,
  };
}

const srcDir = path.resolve(rootDir, 'src');
fs.mkdirSync(path.resolve(rootDir, 'dist'), { recursive: true });

export default {
  input: path.resolve(srcDir, 'index.ts'),
  external: isExternal,
  plugins: [
    alias({
      entries: [
        subpathAlias(
          '@zcat-cms/z-components/ui',
          path.resolve(srcDir, 'components/ui'),
        ),
        subpathAlias(
          '@zcat-cms/z-components/hooks',
          path.resolve(srcDir, 'components/hooks'),
        ),
        subpathAlias(
          '@zcat-cms/z-components/lib',
          path.resolve(srcDir, 'components/lib'),
        ),
        subpathAlias(
          '@zcat-cms/z-components/design',
          path.resolve(srcDir, 'design'),
        ),
        subpathAlias('@zcat-cms/z-components', srcDir),
      ],
    }),
    json(),
    postcss({
      extract: path.resolve(rootDir, 'dist/style.css'),
      minimize: true,
      sourceMap: true,
      plugins: [postcssImport(), tailwindcss(), autoprefixer()],
    }),
    nodeResolve({
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
    }),
    commonjs(),
    typescript({
      tsconfig: path.resolve(rootDir, 'tsconfig.app.json'),
      tsconfigOverride: {
        compilerOptions: {
          noEmit: false,
          declaration: false,
          declarationMap: false,
          emitDeclarationOnly: false,
        },
      },
      declaration: false,
      emitDeclarationOnly: false,
    }),
  ],
  output: [
    {
      dir: path.resolve(rootDir, 'dist/esm'),
      format: 'es',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/[name]-[hash].js',
    },
    {
      dir: path.resolve(rootDir, 'dist/cjs'),
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].cjs',
      chunkFileNames: 'chunks/[name]-[hash].cjs',
    },
  ],
};
