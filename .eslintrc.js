module.exports = {
  env: {
    commonjs: true,
    es2021: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        offsetTernaryExpressions: true,
        flatTernaryExpressions: false,
      },
    ],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
  },
}
