#!/usr/bin/env node
/**
 * Gate 11 - deterministic, presentation-free domain.
 * Domain modules may not read the clock, the network, randomness or browser
 * storage, may not import outer layers, and may not embed French or Arabic
 * copy: every user-facing string is a message descriptor.
 */
import fs from 'node:fs';
import path from 'node:path';

const DOMAIN = path.resolve('src/domain');
const failures = [];

const FORBIDDEN_PATTERNS = [
  [/\bDate\.now\s*\(/, 'Date.now() - inject a clock instead'],
  [/\bnew\s+Date\s*\(\s*\)/, 'new Date() - inject a clock instead'],
  [/\bMath\.random\s*\(/, 'Math.random() - the domain must be deterministic'],
  [/\bfetch\s*\(/, 'fetch() - the domain is offline by contract'],
  [/\b(localStorage|sessionStorage|indexedDB)\b/, 'browser storage is an adapter concern'],
  [/\bcrypto\.(getRandomValues|subtle)\b/, 'crypto belongs in an adapter'],
  [/\b(process|Buffer)\./, 'Node globals are not part of the domain'],
];

const FORBIDDEN_IMPORTS = [
  '@/adapters',
  '@/application',
  '@/app',
  '@/components',
  '@/features',
  '@/ports',
  '@/routes',
  'react',
  'react-dom',
  'i18next',
  'react-i18next',
  '@tanstack',
  'zustand',
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

for (const file of walk(DOMAIN)) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(process.cwd(), file);

  for (const [pattern, reason] of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) failures.push(`${relative}: ${reason}`);
  }
  if (/[\u0600-\u06FF]/.test(source)) {
    failures.push(`${relative}: Arabic copy detected - use a domain message key`);
  }
  if (/[\u00C0-\u00FF]/.test(source)) {
    failures.push(`${relative}: accented French copy detected - use a domain message key`);
  }

  const specifiers = [...source.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
  for (const specifier of specifiers) {
    if (!specifier) continue;
    if (
      FORBIDDEN_IMPORTS.some(
        (blocked) => specifier === blocked || specifier.startsWith(`${blocked}/`),
      )
    ) {
      failures.push(`${relative}: forbidden import ${specifier}`);
    }
  }
}

if (failures.length) {
  console.error(`[domain] ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('[domain] ok - deterministic, offline and presentation-free.');
