import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  FLOOR_PX,
  checkFiles,
  listSources,
  loadAllowlist,
  scanSource,
  toPx,
} from './check-text-size-lib.mjs';

/**
 * The text-size guard is a gate, so the gate itself is tested: a size below
 * 12 px must be found in all three declaration styles, a compliant size must
 * pass, and an allowlist entry must both suppress a violation and fail when it
 * no longer matches anything.
 */

describe('scanSource', () => {
  it('finds every Tailwind arbitrary size below the floor', () => {
    const hits = scanSource(
      '<p className="text-[10px]">a</p>\n<p className="text-[11px]">b</p>\n<p className="text-[12px]">c</p>\n<p className="text-[0.7rem]">d</p>\n<p className="text-xs">e</p>',
      'src/a.tsx',
    );
    expect(hits.map((hit) => hit.value)).toEqual(['10px', '11px', '0.7rem']);
    expect(hits.map((hit) => hit.line)).toEqual([1, 2, 4]);
  });

  it('finds CSS font-size declarations and inline fontSize', () => {
    const hits = scanSource(
      '.a { font-size: 11px; }\n.b { font-size: 0.75rem; }\n.c { font-size: 9pt; }\nconst s = { fontSize: 10 };\nconst t = { fontSize: "0.65rem" };',
      'src/a.css',
    );
    expect(hits.map((hit) => hit.value)).toEqual(['11px', '10px', '0.65rem']);
  });

  it('converts units to px before comparing', () => {
    expect(toPx(12, 'px')).toBe(12);
    expect(toPx(0.75, 'rem')).toBe(12);
    expect(toPx(9, 'pt')).toBe(12);
    expect(toPx(8, 'pt')).toBeCloseTo(10.67, 2);
    expect(scanSource('font-size: 8pt;', 'a.css')).toHaveLength(1);
    expect(scanSource('font-size: 9pt;', 'a.css')).toHaveLength(0);
  });

  it('keeps the documented floor at 12', () => {
    expect(FLOOR_PX).toBe(12);
  });
});

describe('checkFiles', () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'text-size-'));
  });

  it('passes a clean tree and reports the file count inputs', () => {
    const file = path.join(directory, 'clean.tsx');
    fs.writeFileSync(file, '<span className="text-xs">12 px</span>');
    const { violations, allowed, stale } = checkFiles([file]);
    expect(violations).toEqual([]);
    expect(allowed).toEqual([]);
    expect(stale).toEqual([]);
    expect(listSources(directory)).toEqual([file]);
  });

  it('fails a tree that hides a 10 px size', () => {
    const file = path.join(directory, 'bad.tsx');
    fs.writeFileSync(file, '<span className="text-[10px]">small</span>');
    const { violations } = checkFiles([file]);
    expect(violations).toHaveLength(1);
    expect(violations[0].value).toBe('10px');
  });

  it('suppresses an allowlisted value but reports a stale entry', () => {
    const file = path.join(directory, 'allowed.tsx');
    fs.writeFileSync(file, '<span className="text-[11px]">watermark</span>');
    const hit = checkFiles([file]).violations[0];
    const allowlist = {
      allow: [{ file: hit.file, value: hit.value, reason: 'aria-hidden watermark' }],
    };
    const result = checkFiles([file], allowlist);
    expect(result.violations).toEqual([]);
    expect(result.allowed).toHaveLength(1);
    expect(result.stale).toEqual([]);

    const unused = checkFiles([], allowlist);
    expect(unused.stale).toHaveLength(1);
  });

  it('rejects an allowlist entry without a reason', () => {
    const file = path.join(directory, 'allowlist.json');
    fs.writeFileSync(file, JSON.stringify({ allow: [{ file: 'src/a.tsx', value: '10px' }] }));
    expect(() => loadAllowlist(file)).toThrow(/reason/);
  });
});
