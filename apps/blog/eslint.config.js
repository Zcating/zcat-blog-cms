import eslint from "@eslint/js";
import checkFile from "eslint-plugin-check-file";
import reactPlugin from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["build"]),
  {
    ignores: ["eslint.config.js"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/require-await": "off",
      "no-unused-vars": "off",
      "react/prop-types": "off",
      "react/no-children-prop": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["app/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{jsx,tsx,js,ts}": "KEBAB_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "app/**/__tests__/": "__+([a-z])__",
          "app/**/!(__tests__)/": "KEBAB_CASE",
        },
      ],
    },
  },
]);
