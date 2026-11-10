#!/usr/bin/env node
/**
 * Gate 12 - bundle and font budget report.
 * Reports a baseline for every build and fails when a hard budget is exceeded.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST = path.resolve('dist');
const FONT_DIR = path.resolve('public/fonts');

const JS_BUDGET = 180 * 1024; // initial/entry JS, gzip
const CHUNK_BUDGET = 120 * 1024; // any single JS chunk, gzip
const LAZY_CHUNK_BUDGET = 60 * 1024; // each lazy route/locale chunk, gzip
const FONT_BUDGET = 120 * 1024; // self-hosted WOFF2 total

if (!fs.existsSync(DIST)) {
  console.error('[bundle] dist/ is missing - run `npm run build` first.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const gzip = (buffer) => zlib.gzipSync(buffer, { level: 9 }).length;

const files = walk(DIST);
const assets = files
  .filter((file) => /\.(js|css|html|svg|json|woff2)$/.test(file))
  .map((file) => {
    const buffer = fs.readFileSync(file);
    return {
      file: path.relative(DIST, file),
      raw: buffer.length,
      gzip: gzip(buffer),
    };
  })
  .sort((a, b) => b.gzip - a.gzip);

const js = assets.filter((asset) => asset.file.endsWith('.js'));
const css = assets.filter((asset) => asset.file.endsWith('.css'));
const html = assets.filter((asset) => asset.file.endsWith('.html'));

// The entry is the script the HTML actually loads, not every chunk whose
// basename happens to start with "index" (dynamic imports inherit that name).
const HTML_FILE = path.join(DIST, 'index.html');
const entryNames = new Set();
if (fs.existsSync(HTML_FILE)) {
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  for (const match of html.matchAll(/<script[^>]+src="[^"]*\/([^"/]+\.js)"/g)) {
    entryNames.add(match[1]);
  }
}
const isEntry = (file) => entryNames.has(path.basename(file));
const entryJs = js.filter((asset) => isEntry(asset.file));
if (entryJs.length === 0) {
  console.error('[bundle] could not identify the entry script from dist/index.html.');
  process.exit(1);
}
const lazyJs = js.filter((asset) => !isEntry(asset.file));
const initialJs = entryJs.reduce((sum, asset) => sum + asset.gzip, 0);
const totalJs = js.reduce((sum, asset) => sum + asset.gzip, 0);
const totalCss = css.reduce((sum, asset) => sum + asset.gzip, 0);
const totalHtml = html.reduce((sum, asset) => sum + asset.gzip, 0);

const fontFiles = fs.existsSync(FONT_DIR)
  ? fs.readdirSync(FONT_DIR).filter((file) => file.endsWith('.woff2'))
  : [];
const totalFont = fontFiles.reduce(
  (sum, file) => sum + fs.statSync(path.join(FONT_DIR, file)).size,
  0,
);

console.log('[bundle] baseline');
for (const asset of assets.slice(0, 8)) {
  console.log(
    `  ${asset.file.padEnd(36)} raw ${(asset.raw / 1024).toFixed(1)} kB  gzip ${(asset.gzip / 1024).toFixed(1)} kB`,
  );
}
console.log(
  `  entry JS (gzip)   ${(initialJs / 1024).toFixed(1)} kB / ${(JS_BUDGET / 1024).toFixed(0)} kB`,
);
console.log(
  `  lazy JS (gzip)    ${((totalJs - initialJs) / 1024).toFixed(1)} kB across ${lazyJs.length} chunk(s) / ${(LAZY_CHUNK_BUDGET / 1024).toFixed(0)} kB each`,
);
console.log(`  total CSS (gzip)  ${(totalCss / 1024).toFixed(1)} kB`);
console.log(`  total HTML (gzip) ${(totalHtml / 1024).toFixed(1)} kB`);
console.log(
  `  fonts (raw)       ${(totalFont / 1024).toFixed(1)} kB / ${(FONT_BUDGET / 1024).toFixed(0)} kB`,
);

const failures = [];
if (initialJs > JS_BUDGET)
  failures.push(`entry JS ${(initialJs / 1024).toFixed(1)} kB exceeds budget`);

// The entry bundle is the initial payload and is governed by JS_BUDGET above.
// Route/locale chunks are lazy: they get the tighter per-chunk budget.
for (const chunk of lazyJs) {
  if (chunk.gzip > LAZY_CHUNK_BUDGET) {
    failures.push(
      `${chunk.file} ${(chunk.gzip / 1024).toFixed(1)} kB exceeds the ${(LAZY_CHUNK_BUDGET / 1024).toFixed(0)} kB lazy-chunk budget`,
    );
  }
  if (chunk.gzip > CHUNK_BUDGET) {
    failures.push(
      `${chunk.file} ${(chunk.gzip / 1024).toFixed(1)} kB exceeds the absolute per-chunk budget`,
    );
  }
}
if (totalFont > FONT_BUDGET)
  failures.push(`fonts ${(totalFont / 1024).toFixed(1)} kB exceed budget`);

if (failures.length) {
  for (const failure of failures) console.error(`[bundle] FAIL ${failure}`);
  process.exit(1);
}

console.log('[bundle] ok - within budget.');
