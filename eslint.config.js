import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const FRAMEWORK = [
  'react',
  'react-dom',
  'react/*',
  'react-dom/*',
  'react-i18next',
  'i18next',
  '@tanstack/*',
  'zustand',
];

const LAYER_IMPORTS = {
  domain: [
    ...FRAMEWORK,
    '@/adapters/*',
    '@/app/*',
    '@/application/*',
    '@/components/*',
    '@/features/*',
    '@/ports/*',
    '@/routes/*',
  ],
  ports: [...FRAMEWORK, '@/adapters/*', '@/app/*', '@/components/*', '@/features/*', '@/routes/*'],
  application: [
    ...FRAMEWORK,
    '@/adapters/*',
    '@/app/*',
    '@/components/*',
    '@/features/*',
    '@/routes/*',
  ],
  ui: ['@/adapters/*', '@/app/*', '@/routes/*', '@/features/*'],
  adapters: [...FRAMEWORK, '@/app/*', '@/components/*', '@/features/*', '@/routes/*'],
};

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'public/fonts',
      'docs',
      '.agents',
      '.claude',
      '.codex',
      '.github/skills',
      '.github/agents',
      '.github/hooks',
      '.playwright',
      '.playwright-cli',
      'design-extract-output',
      // Agent harness layer: git-excluded setup scripts, not application source.
      '.dsh',
      'harness',
      'memory',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: LAYER_IMPORTS.domain }] }],
    },
  },
  {
    files: ['src/ports/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: LAYER_IMPORTS.ports }] }],
    },
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: LAYER_IMPORTS.application }] }],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: LAYER_IMPORTS.ui }] }],
    },
  },
  {
    files: ['src/adapters/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: LAYER_IMPORTS.adapters }] }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Scripts that drive a browser pass code into page.evaluate(), so browser globals are valid there.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-console': 'off' },
  },
);
