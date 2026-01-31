import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // Type-aware linting for TypeScript in src/ only (uses tsconfig for type information)
  ...tseslint.config(
    {
      files: ["src/**/*.ts"],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
    // Apply type-checked rules only to src/ so root .js config files are not included
    ...tseslint.configs.recommendedTypeChecked.map((c) => ({
      ...c,
      files: ["src/**/*.ts"],
    })),
  ),
  {
    ignores: ["dist/"],
  },
];
