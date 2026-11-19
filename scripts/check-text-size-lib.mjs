/**
 * Text-size floor guard (P2-1, hardened in P2-1 group E).
 *
 * The product may not render text below 12 px. This module finds every way a
 * size can be declared in the source and converts it to px before comparison:
 *
 * 1. Tailwind arbitrary utilities - `text-[10px]`, `text-[0.7rem]`;
 * 2. CSS declarations - `font-size: 11px`, `font-size: 0.7rem`;
 * 3. style objects and JSX props - `fontSize: 10`, `fontSize={'0.7rem'}`,
 *    `fontSize={10}`, `fontSize={wide ? 10 : 14}`;
 * 4. constants declared in the same file - `const MINI = 10` used by
 *    `fontSize={MINI}`.
 *
 * A value that cannot be resolved statically (`fontSize={unit}`) is a
 * violation unless the allowlist names the file and value *and* points at a
 * constant exported by that file which guarantees a value at or above the
 * floor. The allowlist therefore cannot hide a dynamic size without proof.
 */
import fs from 'node:fs';
import path from 'node:path';

export const FLOOR_PX = 12;
/** D-0056: Cairo at 12 px loses optical height, so Arabic informational text
 *  has one shared step override at 13 px. The guard verifies that rule exists
 *  and that nothing else in CSS declares a smaller size that bypasses it. */
export const ARABIC_FLOOR_PX = 13;
export const ARABIC_COVERED_STEPS = ['.text-xs', '.ov-micro'];
export const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

const UNIT_TO_PX = { px: 1, rem: 16, em: 16, pt: 4 / 3 };

/** Declarations whose value is written literally next to the size. */
const STATIC_PATTERNS = [
  // Tailwind arbitrary value: text-[10px], text-[0.7rem], text-[0.7em]
  { kind: 'tailwind', pattern: /text-\[(\d+(?:\.\d+)?)(px|rem|em|pt)\]/g },
  // CSS declaration: font-size: 11px / 0.7rem / 9pt
  { kind: 'css', pattern: /font-size\s*:\s*(\d+(?:\.\d+)?)\s*(px|rem|em|pt)\b/g },
  // Numeric style object or prop: fontSize: 11, fontSize: '0.7rem', fontSize: 11px
  {
    kind: 'style',
    pattern: /fontSize\s*:\s*['"`]?(\d+(?:\.\d+)?)(px|rem|em|pt)?['"`]?/g,
    defaultUnit: 'px',
  },
];

/**
 * Declarations whose value is an expression: a JSX prop (`fontSize={...}`) or
 * a style object whose value is not a literal (`fontSize: unit`).
 */
const EXPRESSION_PATTERNS = [
  { kind: 'jsx', pattern: /fontSize\s*=\s*\{([^{}]*)\}/g },
  // The lookahead keeps literal values out: they are already reported above.
  { kind: 'style', pattern: /fontSize\s*:\s*(?!['"`]?\d)([^,;{}\n]+)/g },
];

const IDENTIFIER = /^[A-Za-z_$][\w$]*(\s*\.\s*[A-Za-z_$][\w$]*)*$/;
const NUMBER = /(\d+(?:\.\d+)?)\s*(px|rem|em|pt)?/g;
const CONSTANT = /\b(export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(\d+(?:\.\d+)?)\b/g;

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

const round = (value) => Math.round(value * 100) / 100;

/**
 * Numeric constants declared in the file, so `fontSize={MINI}` can be
 * resolved when `const MINI = 10` sits a few lines above.
 *
 * @returns {Map<string, {px: number, exported: boolean}>}
 */
export function collectConstants(text) {
  const found = new Map();
  CONSTANT.lastIndex = 0;
  let match;
  while ((match = CONSTANT.exec(text)) !== null) {
    const name = match[2];
    if (!found.has(name)) {
      found.set(name, { px: round(Number(match[3])), exported: Boolean(match[1]) });
    }
  }
  return found;
}

function analyseExpression(expression, constants) {
  const trimmed = expression.trim();
  if (!trimmed) return [];

  const metrics = [];
  NUMBER.lastIndex = 0;
  let match;
  while ((match = NUMBER.exec(trimmed)) !== null) {
    const unit = match[2] ?? 'px';
    metrics.push({ value: `${match[1]}${unit}`, px: round(toPx(match[1], unit)) });
  }
  if (metrics.length > 0) {
    return metrics
      .filter((metric) => metric.px < FLOOR_PX)
      .map((metric) => ({ ...metric, dynamic: false }));
  }

  if (IDENTIFIER.test(trimmed)) {
    const name = trimmed.split('.')[0].trim();
    const constant = constants.get(name);
    if (constant) {
      return constant.px < FLOOR_PX
        ? [{ value: `${constant.px}px`, px: constant.px, dynamic: false, constant: name }]
        : [];
    }
    return [{ value: `fontSize={${trimmed}}`, px: Number.NaN, dynamic: true }];
  }

  return [{ value: `fontSize={${trimmed}}`, px: Number.NaN, dynamic: true }];
}

/**
 * @param {string} text file contents
 * @param {string} file repo-relative posix path
 * @returns {{file: string, line: number, value: string, px: number, kind: string, dynamic?: boolean}[]}
 */
export function scanSource(text, file) {
  const hits = [];
  const seen = new Set();
  const push = (hit) => {
    const key = `${hit.line}|${hit.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(hit);
  };

  for (const { kind, pattern, defaultUnit } of STATIC_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1];
      const unit = match[2] ?? defaultUnit ?? 'px';
      const px = round(toPx(raw, unit));
      if (px < FLOOR_PX)
        push({ file, line: lineOf(text, match.index), value: `${raw}${unit}`, px, kind });
    }
  }

  const constants = collectConstants(text);
  for (const { kind, pattern } of EXPRESSION_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const line = lineOf(text, match.index);
      for (const hit of analyseExpression(match[1], constants)) {
        push({ file, line, kind, ...hit });
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

/**
 * Allowlist entries are repo-relative so they survive a checkout on another
 * drive; files outside the working tree (the guard's own temp fixtures) keep
 * their absolute path.
 */
export function toPosix(file) {
  const posix = file.split(path.sep).join('/');
  const root = path.resolve(process.cwd()).split(path.sep).join('/');
  return posix.startsWith(`${root}/`) ? posix.slice(root.length + 1) : posix;
}

/**
 * Prove that an allowlist entry with `constant` really guarantees the floor:
 * the file must export that constant with a value at or above it.
 *
 * @returns {string|null} a problem description, or null when the proof holds
 */
export function checkGuarantee(text, entry, floor = FLOOR_PX) {
  const constant = collectConstants(text).get(entry.constant);
  if (!constant) return `constant ${entry.constant} is not declared in ${entry.file}`;
  if (!constant.exported) return `constant ${entry.constant} in ${entry.file} is not exported`;
  if (constant.px < floor) {
    return `constant ${entry.constant} in ${entry.file} is ${constant.px}px, below the ${floor}px floor`;
  }
  return null;
}

/**
 * Arabic floor: one shared `:lang(ar)` rule must raise every smallest text step
 * to at least 13 px. Any other sub-13 px CSS declaration would bypass it, and
 * an allowlisted dynamic size marked `arabic` must prove the higher floor too.
 *
 * @returns {string[]} problems (empty means the Arabic minimum holds)
 */
export function checkArabicMinimum(files, allowlist = { allow: [] }) {
  const problems = [];
  const cssFiles = files.filter((file) => file.endsWith('.css'));
  const ruleRe = /:lang\(ar\)\s*:is\(([^)]+)\)\s*\{([^}]*)\}/g;
  const rules = [];
  for (const file of cssFiles) {
    const text = fs.readFileSync(file, 'utf8');
    ruleRe.lastIndex = 0;
    let match;
    while ((match = ruleRe.exec(text)) !== null) {
      const size = match[2].match(/font-size\s*:\s*(\d+(?:\.\d+)?)(px|rem|em|pt)\b/);
      rules.push({
        file: toPosix(file),
        line: lineOf(text, match.index),
        classes: match[1]
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean),
        px: size ? round(toPx(size[1], size[2])) : Number.NaN,
      });
    }
  }

  if (rules.length !== 1) {
    problems.push(`expected exactly one :lang(ar) :is(...) override, found ${rules.length}`);
  } else {
    const [rule] = rules;
    for (const step of ARABIC_COVERED_STEPS) {
      if (!rule.classes.includes(step)) {
        problems.push(`Arabic override at ${rule.file}:${rule.line} must cover ${step}`);
      }
    }
    if (!(rule.px >= ARABIC_FLOOR_PX)) {
      problems.push(
        `Arabic override at ${rule.file}:${rule.line} is ${rule.px}px, below ${ARABIC_FLOOR_PX}px`,
      );
    }
  }

  const covered = rules[0]?.classes ?? ARABIC_COVERED_STEPS;
  for (const file of cssFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const pattern = /font-size\s*:\s*(\d+(?:\.\d+)?)\s*(px|rem|em|pt)\b/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const px = round(toPx(match[1], match[2]));
      if (px >= ARABIC_FLOOR_PX) continue;
      const before = text.slice(0, match.index);
      const selector = before.slice(before.lastIndexOf('}') + 1).split('{')[0];
      if (covered.some((step) => selector.includes(step))) continue;
      problems.push(
        `${toPosix(file)}:${lineOf(text, match.index)} ${match[1]}${match[2]} = ${px}px bypasses the Arabic ${ARABIC_FLOOR_PX}px rule`,
      );
    }
  }

  for (const entry of allowlist.allow ?? []) {
    if (!entry.arabic) continue;
    const file = files.find((candidate) => toPosix(candidate) === entry.file);
    if (!file) {
      problems.push(`Arabic allowlist file is missing: ${entry.file}`);
      continue;
    }
    const problem = checkGuarantee(fs.readFileSync(file, 'utf8'), entry, ARABIC_FLOOR_PX);
    if (problem) problems.push(`${entry.file} ${entry.value}: ${problem}`);
  }
  return problems;
}

/**
 * @param {{allow?: {file: string, value: string, reason: string, constant?: string}[]}} allowlist
 * @returns {{violations: object[], allowed: object[], stale: object[], unguarded: {entry: object, problem: string}[]}}
 */
export function checkFiles(files, allowlist = { allow: [] }) {
  const allow = allowlist.allow ?? [];
  const violations = [];
  const allowed = [];
  const unguarded = [];
  const used = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const hit of scanSource(text, toPosix(file))) {
      const entry = allow.find(
        (candidate) => candidate.file === hit.file && candidate.value === hit.value,
      );
      if (!entry) {
        violations.push(hit);
        continue;
      }
      used.add(entry);
      if (entry.constant) {
        const problem = checkGuarantee(text, entry);
        if (problem) {
          unguarded.push({ entry, problem });
          violations.push({ ...hit, reason: problem });
          continue;
        }
      }
      allowed.push({ ...hit, reason: entry.reason, constant: entry.constant });
    }
  }
  const stale = allow.filter((entry) => !used.has(entry));
  return { violations, allowed, stale, unguarded };
}

export function loadAllowlist(file) {
  if (!fs.existsSync(file)) return { allow: [] };
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const allow = Array.isArray(parsed.allow) ? parsed.allow : [];
  for (const entry of allow) {
    if (!entry.file || !entry.value || !entry.reason?.trim()) {
      throw new Error(`Allowlist entry needs file, value and reason: ${JSON.stringify(entry)}`);
    }
    if ('constant' in entry && !String(entry.constant ?? '').trim()) {
      throw new Error(`Allowlist entry constant must be a name: ${JSON.stringify(entry)}`);
    }
  }
  return { allow };
}
