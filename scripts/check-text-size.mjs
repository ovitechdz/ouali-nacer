#!/usr/bin/env node
/**
 * P2-1 gate: no text below 12 px anywhere in src/, and Arabic informational
 * text uses one shared :lang(ar) override at 13 px (D-0056).
 *
 * Fails on Tailwind arbitrary sizes, CSS font-size declarations, numeric
 * `fontSize` props, ternaries, and constants resolved in the same file. A
 * dynamic value such as `fontSize={unit}` fails unless
 * `scripts/text-size-allowlist.json` names the file and value *and* points at
 * a constant exported by that file that guarantees the floor; entries marked
 * `arabic` must prove 13 px. The Arabic check also fails when the single
 * shared override is missing, too small, or bypassed by another small CSS
 * declaration. A stale allowlist entry fails, so the list cannot rot.
 */
import path from 'node:path';

import {
  ARABIC_FLOOR_PX,
  FLOOR_PX,
  checkArabicMinimum,
  checkFiles,
  listSources,
  loadAllowlist,
} from './check-text-size-lib.mjs';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const allowlistFile = path.join(root, 'scripts', 'text-size-allowlist.json');

const files = listSources(sourceRoot);
const allowlist = loadAllowlist(allowlistFile);
const { violations, allowed, stale, unguarded } = checkFiles(files, allowlist);
const arabicProblems = checkArabicMinimum(files, allowlist);

for (const entry of allowed) {
  const proof = entry.constant ? ` via ${entry.constant}` : '';
  console.log(
    `[text-size] allowed ${entry.file}:${entry.line} ${entry.value}${proof} - ${entry.reason}`,
  );
}
for (const entry of stale) {
  console.error(
    `[text-size] stale allowlist entry ${entry.file} ${entry.value} - remove it or fix the line`,
  );
}
for (const { entry, problem } of unguarded) {
  console.error(`[text-size] unguarded allowlist entry ${entry.file} ${entry.value} - ${problem}`);
}
for (const entry of violations) {
  const spoken = Number.isNaN(entry.px) ? 'unresolved dynamic size' : `${entry.px}px`;
  const why = entry.reason ? ` - ${entry.reason}` : '';
  console.error(
    `[text-size] ${entry.file}:${entry.line} ${entry.value} = ${spoken} (floor ${FLOOR_PX}px)${why}`,
  );
}

for (const problem of arabicProblems) {
  console.error(`[text-size] Arabic ${ARABIC_FLOOR_PX}px: ${problem}`);
}

if (violations.length || stale.length || arabicProblems.length) {
  console.error(
    `[text-size] ${violations.length} size(s) below ${FLOOR_PX}px, ${stale.length} stale allowlist entr(ies), ${arabicProblems.length} Arabic minimum problem(s)`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `[text-size] ok - no text below ${FLOOR_PX}px in ${files.length} source files, Arabic floor ${ARABIC_FLOOR_PX}px`,
  );
}
