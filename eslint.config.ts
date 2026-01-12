// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
// @ts-ignore
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

import checkFile from 'eslint-plugin-check-file';

// @ts-ignore

export default defineConfig(
  globalIgnores(['build', 'dist', 'node_modules']),
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  importPlugin.flatConfigs.recommended,
  {
    ignores: ['eslint.config.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'import/no-dynamic-require': 'warn',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          // pathGroups: [
          //   {
          //     pattern: '@nestjs/*',
          //     group: 'builtin',
          //     position: 'before',
          //   },
          //   {
          //     pattern: '@backend/*',
          //     group: 'builtin',
          //     position: 'before',
          //   },
          // ],
          'newlines-between': 'always',
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            // 字母表排序
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    files: [
      '{apps,packages}/**/{app,src}/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          'app/**/__tests__/': '__+([a-z])__',
          'app/**/!(__tests__)/': 'KEBAB_CASE',
          'src/**/__tests__/': '__+([a-z])__',
          'src/**/!(__tests__)/': 'KEBAB_CASE',
        },
      ],
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{jsx,tsx,js,ts}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
);
