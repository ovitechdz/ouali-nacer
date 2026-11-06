#!/usr/bin/env node
/**
 * Gate 8 - secret scan. Fails on private keys, cloud tokens and hard-coded
 * credentials in source, configuration and documentation.
 */
import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vite', 'public/fonts']);
const IGNORED_FILES = new Set(['package-lock.json']);
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.html',
  '.md',
  '.yml',
  '.yaml',
  '.env',
  '.example',
  '.txt',
]);

const PATTERNS = [
  { name: 'private key', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: 'OpenAI-style key', re: /\bsk-[A-Za-z0-9_-]{32,}\b/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'hard-coded password', re: /\bpassword\s*[:=]\s*['"][^'"]{4,}['"]/i },
  {
    name: 'hard-coded secret',
    re: /\b(?:api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-./+]{12,}['"]/i,
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (!IGNORED_FILES.has(entry.name)) out.push(full);
  }
  return out;
}

const hits = [];
for (const file of walk(process.cwd())) {
  const ext = path.extname(file);
  if (!TEXT_EXTENSIONS.has(ext) && !file.endsWith('.env.example')) continue;
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/CHANGEME|REPLACE_ME|example\.com/.test(line)) return;
    for (const pattern of PATTERNS) {
      if (pattern.re.test(line)) {
        hits.push(`${path.relative(process.cwd(), file)}:${index + 1} ${pattern.name}`);
      }
    }
  });
}

if (hits.length) {
  console.error(`[secrets] ${hits.length} potential secret(s):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log('[secrets] ok - no credential patterns found.');
