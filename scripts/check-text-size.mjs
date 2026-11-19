#!/usr/bin/env node
/**
 * P2-1 gate: no text below 12 px anywhere in src/.
 *
 * Fails on Tailwind arbitrary sizes, CSS font-size declarations, numeric
 * `fontSize` props, ternaries, and constants resolved in the same file. A
 * dynamic value such as `fontSize={unit}` fails unless
 * `scripts/text-size-allowlist.json` names the file and value *and* points at
 * a constant exported by that file that guarantees the 12 px floor. A stale
 * allowlist entry also fails, so the list cannot rot.
 */
import path from 'node:path';

import { FLOOR_PX, checkFiles, listSources, loadAllowlist } from './check-text-size-lib.mjs';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const allowlistFile = path.join(root, 'scripts', 'text-size-allowlist.json');

const files = listSources(sourceRoot);
const allowlist = loadAllowlist(allowlistFile);
const { violations, allowed, stale, unguarded } = checkFiles(files, allowlist);

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

if (violations.length || stale.length) {
  console.error(
    `[text-size] ${violations.length} size(s) below ${FLOOR_PX}px, ${stale.length} stale allowlist entr(ies)`,
  );
  process.exitCode = 1;
} else {
  console.log(`[text-size] ok - no text below ${FLOOR_PX}px in ${files.length} source files`);
}
