/**
 * Text-size floor guard (P2-1).
 *
 * The product may not render text below 12 px. This module finds every way a
 * size can be declared in the source - Tailwind arbitrary utilities, CSS
 * declarations and inline `fontSize` - converts rem/em/pt to px, and reports
 * anything below the floor unless an allowlist entry with a reason covers it.
 *
 * The allowlist exists for a future, deliberate exception; it starts empty.
 */
import fs from 'node:fs';
import path from 'node:path';

export const FLOOR_PX = 12;
export const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

const PATTERNS = [
  // Tailwind arbitrary value: text-[10px], text-[0.7rem]
  /text-\[(\d+(?:\.\d+)?)(px|rem|em|pt)\]/g,
  // CSS declaration: font-size: 11px / 0.7rem
  /font-size\s*:\s*(\d+(?:\.\d+)?)\s*(px|rem|em|pt)\b/g,
  // Inline style object: fontSize: 11 or fontSize: '11px'
  /fontSize\s*:\s*['"`]?(\d+(?:\.\d+)?)(px|rem|em|pt)?['"`]?/g,
];

const UNIT_TO_PX = { px: 1, rem: 16, em: 16, pt: 4 / 3 };

export function toPx(value, unit) {
  const factor = UNIT_TO_PX[unit];
  if (!factor) throw new Error(`Unknown unit: ${unit}`);
  return Number(value) * factor;
}

export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

/**
 * @param {string} text file contents
 * @param {string} file repo-relative posix path
 * @returns {{file: string, line: number, value: string, px: number}[]}
 */
export function scanSource(text, file) {
  const hits = [];
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1];
      const unit = match[2] ?? 'px';
      const value = `${raw}${unit}`;
      const px = Math.round(toPx(raw, unit) * 100) / 100;
      if (px < FLOOR_PX) {
        hits.push({ file, line: lineOf(text, match.index), value, px });
      }
    }
  }
  return hits;
}

export function listSources(root, extensions = SOURCE_EXTENSIONS) {
  const out = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        walk(full);
      } else if (extensions.has(path.extname(entry.name))) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out.sort();
}

export function toPosix(file) {
  return file.split(path.sep).join('/');
}

/**
 * @param {{allow?: {file: string, value: string, reason: string}[]}} allowlist
 * @returns {{violations: object[], allowed: object[], stale: object[]}}
 */
export function checkFiles(files, allowlist = { allow: [] }) {
  const allow = allowlist.allow ?? [];
  const violations = [];
  const allowed = [];
  const used = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const hit of scanSource(text, toPosix(file))) {
      const entry = allow.find(
        (candidate) => candidate.file === hit.file && candidate.value === hit.value,
      );
      if (entry) {
        used.add(entry);
        allowed.push({ ...hit, reason: entry.reason });
      } else {
        violations.push(hit);
      }
    }
  }
  const stale = allow.filter((entry) => !used.has(entry));
  return { violations, allowed, stale };
}

export function loadAllowlist(file) {
  if (!fs.existsSync(file)) return { allow: [] };
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const allow = Array.isArray(parsed.allow) ? parsed.allow : [];
  for (const entry of allow) {
    if (!entry.file || !entry.value || !entry.reason?.trim()) {
      throw new Error(`Allowlist entry needs file, value and reason: ${JSON.stringify(entry)}`);
    }
  }
  return { allow };
}
