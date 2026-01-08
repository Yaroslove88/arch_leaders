module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "@typescript-eslint/prefer-nullish-coalescing": "off",
  },
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      rules: { "@typescript-eslint/prefer-nullish-coalescing": "off" },
    },
  ],
};
