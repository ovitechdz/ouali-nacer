#!/usr/bin/env node
/**
 * P2-1 gate: no text below 12 px anywhere in src/.
 *
 * Fails on Tailwind arbitrary sizes, CSS font-size and inline fontSize below
 * the floor, unless `scripts/text-size-allowlist.json` names the file and value
 * with a reason. A stale allowlist entry also fails, so the list cannot rot.
 */
import path from 'node:path';

import { FLOOR_PX, checkFiles, listSources, loadAllowlist } from './check-text-size-lib.mjs';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const allowlistFile = path.join(root, 'scripts', 'text-size-allowlist.json');

const files = listSources(sourceRoot);
const allowlist = loadAllowlist(allowlistFile);
const { violations, allowed, stale } = checkFiles(files, allowlist);

for (const entry of allowed) {
  console.log(`[text-size] allowed ${entry.file}:${entry.line} ${entry.value} - ${entry.reason}`);
}
for (const entry of stale) {
  console.error(
    `[text-size] stale allowlist entry ${entry.file} ${entry.value} - remove it or fix the line`,
  );
}
for (const entry of violations) {
  console.error(
    `[text-size] ${entry.file}:${entry.line} ${entry.value} = ${entry.px}px (floor ${FLOOR_PX}px)`,
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
