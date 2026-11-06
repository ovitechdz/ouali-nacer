#!/usr/bin/env node
/**
 * Gate 7 - logical-property audit.
 * Physical left/right utilities break RTL. Only logical utilities are allowed:
 * ms/me, ps/pe, start/end, border-s/e, text-start/end, rounded-s/e.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

const RULES = [
  { name: 'physical margin', re: /\b(?:ml|mr)-(?:\d|\[|auto)/g },
  { name: 'physical padding', re: /\b(?:pl|pr)-(?:\d|\[)/g },
  { name: 'physical inset', re: /\b(?:left|right)-(?:\d|\[|auto|full)/g },
  { name: 'physical text alignment', re: /\btext-(?:left|right)\b/g },
  { name: 'physical border side', re: /\bborder-(?:l|r)(?:-|\b)/g },
  { name: 'physical rounded side', re: /\brounded-(?:l|r|tl|tr|bl|br)(?:-|\b)/g },
  { name: 'horizontal space/divide flow', re: /\b(?:space|divide)-x-/g },
  {
    name: 'physical transform axis',
    re: /\b(?:origin|translate|rotate|skew|scale)-(?:x|y|left|right)\b/g,
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(ROOT)) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      const matches = line.match(rule.re);
      if (matches) {
        for (const match of matches) {
          violations.push(
            `${path.relative(process.cwd(), file)}:${index + 1} ${rule.name}: ${match}`,
          );
        }
      }
    }
  });
}

if (violations.length) {
  console.error(`[rtl] ${violations.length} physical utilit(ies) found:`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log('[rtl] ok - no physical direction utilities in src/.');
