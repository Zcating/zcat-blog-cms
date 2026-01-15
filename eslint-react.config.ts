import reactPlugin from "eslint-plugin-react";
import reactHookPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import { defineConfig } from "eslint/config";
import rootConfig from "./eslint.config";

export default defineConfig([
  rootConfig,
  reactPlugin.configs.flat.recommended,
  reactHookPlugin.configs.flat.recommended,
  {
    ignores: ["eslint-react.config.ts"],
  },
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
        projectService: true,
        // @ts-ignore
        tsconfigRootDir: import.meta.dirname,
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
]);
