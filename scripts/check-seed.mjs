#!/usr/bin/env node
/**
 * Gate 10 - seed-in-production guard.
 * Seed fixtures are development-only. Any module matching seed*.ts must carry
 * the marker, and its importers must be guarded by import.meta.env.DEV.
 */
import fs from 'node:fs';
import path from 'node:path';

const SEED_MARKER = '__OVITECH_SEED__';
const SRC = path.resolve('src');
const DIST = path.resolve('dist');
const failures = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const sourceFiles = walk(SRC).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
const seedFiles = sourceFiles.filter((file) => /(^|[\\/])seed[^\\/]*\.(ts|tsx|js|mjs)$/.test(file));

for (const seed of seedFiles) {
  const source = fs.readFileSync(seed, 'utf8');
  if (!source.includes(SEED_MARKER)) {
    failures.push(`${path.relative(process.cwd(), seed)} is missing the ${SEED_MARKER} marker`);
  }
  const base = path.basename(seed).replace(/\.(ts|tsx|js|mjs)$/, '');
  for (const file of sourceFiles) {
    if (file === seed) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (!new RegExp(`from\\s+['"]@?[^'"]*${base}['"]`).test(source)) continue;
    if (!/import\.meta\.env\.DEV/.test(source)) {
      failures.push(
        `${path.relative(process.cwd(), file)} imports a seed module without an import.meta.env.DEV guard`,
      );
    }
  }
}

if (fs.existsSync(DIST) && seedFiles.length > 0) {
  const bundled = walk(DIST).filter((file) => /\.(js|html)$/.test(file));
  for (const file of bundled) {
    if (fs.readFileSync(file, 'utf8').includes(SEED_MARKER)) {
      failures.push(
        `${path.relative(process.cwd(), file)} contains seed data in the production bundle`,
      );
    }
  }
}

if (failures.length) {
  console.error(`[seed] ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  seedFiles.length === 0
    ? '[seed] ok - no seed modules in this phase.'
    : `[seed] ok - ${seedFiles.length} seed module(s) development-guarded.`,
);
