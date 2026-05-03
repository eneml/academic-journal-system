// Shared ESLint flat config preset.
// Apps and packages extend this for consistent rules.
export default [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/node_modules/**",
      "**/*.config.*",
      "**/generated/**",
    ],
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
    },
  },
];
