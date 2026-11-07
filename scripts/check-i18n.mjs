#!/usr/bin/env node
/**
 * Gate 6 - i18n parity and Latin-leak audit.
 * Every locale must expose exactly the same keys as the Arabic catalogue, and
 * Arabic values must not silently fall back to Latin prose.
 */
import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.resolve('src/i18n/locales');
const REFERENCE = 'ar';
const ALLOWED_LATIN = new Set([
  'OVITECH',
  'DDNE',
  'PDF',
  'JSON',
  'API',
  'RTL',
  'LTR',
  'WhatsApp',
  'Cairo',
  'Inter',
]);

function flatten(value, prefix = '', out = new Map()) {
  for (const [key, entry] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      flatten(entry, full, out);
    } else {
      out.set(full, entry);
    }
  }
  return out;
}

function readLocale(code) {
  const file = path.join(LOCALES_DIR, `${code}.json`);
  if (!fs.existsSync(file)) {
    console.error(`[i18n] missing locale file: ${file}`);
    process.exit(1);
  }
  return flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
}

const codes = fs
  .readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => path.basename(file, '.json'))
  .sort();

const reference = readLocale(REFERENCE);
let failed = false;

for (const code of codes) {
  const catalogue = readLocale(code);
  const missing = [...reference.keys()].filter((key) => !catalogue.has(key));
  const extra = [...catalogue.keys()].filter((key) => !reference.has(key));
  const empty = [...catalogue.entries()].filter(([, value]) => String(value).trim() === '');

  if (missing.length || extra.length || empty.length) {
    failed = true;
    console.error(
      `[i18n] ${code}: ${missing.length} missing, ${extra.length} extra, ${empty.length} empty`,
    );
    for (const key of missing) console.error(`  missing: ${key}`);
    for (const key of extra) console.error(`  extra:   ${key}`);
    for (const [key] of empty) console.error(`  empty:   ${key}`);
  }
}

const leaks = [];
for (const [key, value] of reference.entries()) {
  const withoutPlaceholders = String(value).replace(/\{\{[^}]+\}\}/g, '');
  const words = withoutPlaceholders.match(/[A-Za-z][A-Za-z0-9_-]*/g) ?? [];
  for (const word of words) {
    if (!ALLOWED_LATIN.has(word)) leaks.push(`${key}: "${word}" in "${value}"`);
  }
}

if (leaks.length) {
  failed = true;
  console.error(`[i18n] ${leaks.length} Latin word(s) in the Arabic catalogue:`);
  for (const leak of leaks) console.error(`  ${leak}`);
}

if (failed) process.exit(1);

console.log(
  `[i18n] ok - ${codes.length} locales, ${reference.size} keys each, 0 Latin leaks in ${REFERENCE}.`,
);
