import { defineConfig } from "eslint/config";
import rootReactConfig from "../../eslint-react.config";

export default defineConfig([
  rootReactConfig,
  {
    ignores: ["eslint.config.ts"],
  },
]);
