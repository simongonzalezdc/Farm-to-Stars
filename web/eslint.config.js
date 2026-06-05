import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

const tsRecommendedRules = Object.assign(
  {},
  ...tsPlugin.configs["flat/recommended"]
    .filter((config) => config.rules)
    .map((config) => config.rules),
);

const browserGlobals = {
  ...globals.browser,
  ...globals.es2022,
};

export default [
  {
    ignores: ["dist/**", "public/assets/**", "scripts/**/*.mjs"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...browserGlobals,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: browserGlobals,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsRecommendedRules,
      "no-undef": "off",
      "no-useless-assignment": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.spec.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...browserGlobals,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
