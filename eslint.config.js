import js from "@eslint/js";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: { document: "readonly", fetch: "readonly" },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { react, "react-hooks": hooks },
    settings: { react: { version: "detect" } },
    rules: {
      ...hooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-vars": "error",
    },
  },
  {
    files: ["server/**/*.js"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
];
