// ESLint flat config (ESLint 10+)
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // --- TypeScript recommended rules ---
      ...tsPlugin.configs["recommended"].rules,

      // Allow `any` in Genkit flow schemas (z.any()) and Data Connect results
      "@typescript-eslint/no-explicit-any": "warn",

      // Allow unused vars prefixed with _ (common in callbacks)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Firebase Functions v2 patterns use floating promises intentionally
      "@typescript-eslint/no-floating-promises": "error",

      // Prefer const
      "prefer-const": "error",
    },
  },
  {
    // Ignore compiled output and scripts
    ignores: ["lib/**", "scripts/**", "node_modules/**"],
  },
];
