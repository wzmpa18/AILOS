module.exports = {
  root: true,
  env: { node: true, es2021: true },
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-undef': 'error',
    'no-var': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'prefer-const': 'warn',
    'no-empty': 'warn',
    'no-console': 'off',
    'no-prototype-builtins': 'off',
  },
  ignorePatterns: ['node_modules', 'dist', '**/*.bak.*'],
};
