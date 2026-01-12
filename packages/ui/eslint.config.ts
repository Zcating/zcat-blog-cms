import globals from 'globals';
import { defineConfig } from 'eslint/config';
import rootConfig from '../../eslint.config';

export default defineConfig([
  rootConfig,
  {
    ignores: ['eslint.config.ts'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
        // @ts-ignore
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
      'react/no-children-prop': 'off',
    },
  },
]);
