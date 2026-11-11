#!/usr/bin/env node
/**
 * Gate 13 - precache completeness.
 * Every route chunk, the shell, the manifest, the icons and the fonts must be
 * inside the generated service-worker precache list. A missing route fails CI.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const SRC_ROUTER = path.resolve('src/app/router.tsx');
const failures = [];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function normalize(value) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '').split('?')[0].split('#')[0];
}

if (!fs.existsSync(DIST)) {
  console.error('[precache] dist/ is missing - run `npm run build` first.');
  process.exit(1);
}

const swFile = path.join(DIST, 'sw.js');
const manifestFile = path.join(DIST, 'manifest.webmanifest');
if (!fs.existsSync(swFile)) failures.push('dist/sw.js is missing');
if (!fs.existsSync(manifestFile)) failures.push('dist/manifest.webmanifest is missing');

const sw = fs.existsSync(swFile) ? fs.readFileSync(swFile, 'utf8') : '';
const precached = new Set();
for (const match of sw.matchAll(/url\s*:\s*["']([^"']+)["']/g)) {
  precached.add(normalize(match[1]));
}
if (precached.size === 0) {
  // Fallback for minified string-array manifests.
  for (const match of sw.matchAll(
    /["']((?:assets|icons|fonts)\/[^"']+\.(?:js|css|woff2|png))["']/g,
  )) {
    precached.add(normalize(match[1]));
  }
}

const has = (file) => {
  const rel = normalize(file);
  if (precached.has(rel)) return true;
  return [...precached].some((entry) => entry.endsWith(`/${rel}`) || rel.endsWith(`/${entry}`));
};

const distFiles = walk(DIST).map((file) => normalize(path.relative(DIST, file)));
const assetFiles = distFiles.filter((file) => /^assets\/.+\.(js|css)$/.test(file));
const required = new Set(['index.html', 'manifest.webmanifest', 'favicon.svg']);

for (const file of assetFiles) required.add(file);
for (const file of distFiles.filter((entry) => entry.startsWith('icons/'))) required.add(file);
for (const file of distFiles.filter(
  (entry) => entry.startsWith('fonts/') && entry.endsWith('.woff2'),
)) {
  required.add(file);
}
if (distFiles.includes('logo.jpeg')) required.add('logo.jpeg');

for (const file of required) {
  if (!has(file)) failures.push(`not precached: ${file}`);
}

// Every lazy page import in the router must map to a built, precached chunk.
if (!fs.existsSync(SRC_ROUTER)) {
  failures.push('src/app/router.tsx is missing');
} else {
  const router = fs.readFileSync(SRC_ROUTER, 'utf8');
  const imports = [...router.matchAll(/import\(\s*['"]@\/pages\/([^'"]+)['"]\s*\)/g)].map((match) =>
    match[1].split('/').pop(),
  );
  const unique = [...new Set(imports)];
  for (const name of unique) {
    const chunk = assetFiles.find((file) => file.startsWith(`assets/${name}-`));
    if (!chunk) {
      failures.push(`route ${name} has no built chunk in dist/assets`);
    } else if (!has(chunk)) {
      failures.push(`route ${name} chunk is not precached: ${chunk}`);
    }
  }
  if (unique.length === 0) failures.push('router contains no lazy page imports');
  console.log(`[precache] ${unique.length} lazy route(s), ${assetFiles.length} asset(s).`);
}

const manifest = fs.existsSync(manifestFile)
  ? JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
  : { icons: [] };
for (const icon of manifest.icons ?? []) {
  if (icon.src && !has(icon.src)) failures.push(`manifest icon not precached: ${icon.src}`);
}

if (failures.length) {
  console.error(`[precache] ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`[precache] ok - ${precached.size} entries cover the shell and every route.`);
