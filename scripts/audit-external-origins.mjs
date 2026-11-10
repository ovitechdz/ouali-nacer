#!/usr/bin/env node
/**
 * Offline-origin audit: the built app must not reference any network origin.
 * Allowed URL origins are XML namespaces and React error-documentation links,
 * which are never fetched at runtime.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const ALLOWED_HOSTS = new Set([
  'www.w3.org', // SVG/XML namespaces
  'react.dev', // error documentation links in React's messages
  'reactjs.org',
  'www.i18next.com', // error documentation strings
  'locize.com', // i18next's default backend string (never configured here)
  'localhost', // i18next's unused default loadPath
  'json-schema.org', // Zod's JSON-Schema dialect identifier (never fetched)
  'gsap.com', // GSAP licence URL embedded in its bundle (never fetched)
]);
const HARD_BLOCK = [/fonts\.googleapis\.com/i, /fonts\.gstatic\.com/i, /vercel\.app/i, /grok/i];

if (!fs.existsSync(DIST)) {
  console.error('[origins] dist/ is missing - run `npm run build` first.');
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

const files = walk(DIST).filter((file) => /\.(js|css|html|json|webmanifest)$/.test(file));
const origins = new Map();
const blocked = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(process.cwd(), file);

  for (const pattern of HARD_BLOCK) {
    if (pattern.test(source)) blocked.push(`${relative}: ${pattern}`);
  }

  for (const match of source.matchAll(/https?:\/\/[^\s"'`<>)\\]+/g)) {
    try {
      const host = new URL(match[0]).host;
      // Minified template literals such as `https://${link}` are not origins.
      if (host.includes('${') || host.includes('{')) continue;
      if (!ALLOWED_HOSTS.has(host)) {
        const list = origins.get(host) ?? [];
        list.push(relative);
        origins.set(host, list);
      }
    } catch {
      // Not a real URL; ignore fragments produced by minification.
    }
  }
}

if (origins.size || blocked.length) {
  for (const [host, where] of origins) {
    console.error(`[origins] external host ${host} in ${[...new Set(where)].join(', ')}`);
  }
  for (const hit of blocked) console.error(`[origins] forbidden reference ${hit}`);
  process.exit(1);
}

console.log('[origins] ok - no external runtime origins in dist/.');
