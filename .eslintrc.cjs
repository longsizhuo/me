module.exports = {
  root: true,
  env: {
    browser: true,
    es2025: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: { version: "18.3.1" },
  },
  plugins: ["react-refresh", "@typescript-eslint"],
  rules: {
    "react/jsx-no-target-blank": "off",
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    // 添加更多有用的规则
    "no-unused-vars": "warn",
    "no-undef": "error",
    "no-console": "warn",
    "prefer-const": "warn",
    "no-var": "error",
    eqeqeq: "warn",
    curly: "warn",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
  },
};
