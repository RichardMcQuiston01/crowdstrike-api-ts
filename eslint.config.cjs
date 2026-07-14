'use strict';
const {defineConfig} = require('eslint/config');

module.exports = defineConfig([
  ...require('gts'),
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      '.remember/**',
      'tsup.config.ts',
    ],
  },
]);
