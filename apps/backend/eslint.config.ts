// @ts-check
import { defineConfig } from 'eslint/config';
import rootConfig from '../../eslint.config';
import globals from 'globals';

export default defineConfig([
  {
    ignores: ['eslint.config.ts'],
  },
  rootConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        // @ts-ignore
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
