#!/usr/bin/env node
/**
 * Gate 9 - forbidden dependency and import audit.
 * The MVP is static, local-first and dependency-light by decision.
 */
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN = [
  'pg',
  'pg-',
  'better-auth',
  'pdfmake',
  'recharts',
  'framer-motion',
  'react-hook-form',
  'nitro',
  '@tanstack/start',
  '@tanstack/react-start',
  '@tanstack/react-query',
  '@tanstack/react-table',
  'server-only',
  'grok',
];

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const installed = { ...pkg.dependencies, ...pkg.devDependencies };
const dependencyHits = Object.keys(installed).filter((name) =>
  FORBIDDEN.some((blocked) => name === blocked || name.startsWith(blocked)),
);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);
const importHits = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

for (const file of walk(path.resolve('src'))) {
  const source = fs.readFileSync(file, 'utf8');
  const specifiers = [...source.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
  for (const specifier of specifiers) {
    if (!specifier) continue;
    for (const blocked of FORBIDDEN) {
      if (specifier === blocked || specifier.startsWith(`${blocked}/`)) {
        importHits.push(`${path.relative(process.cwd(), file)} -> ${specifier}`);
      }
    }
  }
}

if (dependencyHits.length || importHits.length) {
  if (dependencyHits.length) {
    console.error(`[deps] forbidden package(s): ${dependencyHits.join(', ')}`);
  }
  for (const hit of importHits) console.error(`[deps] forbidden import: ${hit}`);
  process.exit(1);
}

console.log('[deps] ok - no forbidden packages or imports.');
