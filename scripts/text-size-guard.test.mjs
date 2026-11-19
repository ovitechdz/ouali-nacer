import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  ARABIC_FLOOR_PX,
  FLOOR_PX,
  checkArabicMinimum,
  checkFiles,
  checkGuarantee,
  collectConstants,
  listSources,
  loadAllowlist,
  scanSource,
  toPosix,
  toPx,
} from './check-text-size-lib.mjs';

/**
 * The text-size guard is a gate, so the gate itself is tested: a size below
 * 12 px must be found in every declaration style (utility, CSS, numeric prop,
 * ternary, same-file constant), a compliant size must pass, a dynamic value
 * must fail unless an allowlist entry points at an exported constant that
 * proves the floor, and an allowlist entry must fail when it no longer
 * matches anything.
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

  it('finds rem and em arbitrary sizes below 0.75rem and accepts 0.75rem', () => {
    const hits = scanSource(
      '<p className="text-[0.7rem]">a</p>\n<p className="text-[0.7em]">b</p>\n<p className="text-[0.75rem]">c</p>\n<p className="text-[0.8em]">d</p>',
      'src/a.tsx',
    );
    expect(hits.map((hit) => hit.value)).toEqual(['0.7rem', '0.7em']);
    expect(hits.map((hit) => hit.px)).toEqual([11.2, 11.2]);
  });

  it('finds CSS font-size declarations and inline fontSize', () => {
    const hits = scanSource(
      '.a { font-size: 11px; }\n.b { font-size: 0.75rem; }\n.c { font-size: 9pt; }\nconst s = { fontSize: 10 };\nconst t = { fontSize: "0.65rem" };',
      'src/a.css',
    );
    expect(hits.map((hit) => hit.value)).toEqual(['11px', '10px', '0.65rem']);
  });

  it('finds a numeric fontSize prop written as JSX', () => {
    expect(scanSource('<text fontSize={10}>1</text>', 'src/a.tsx').map((hit) => hit.value)).toEqual(
      ['10px'],
    );
    expect(scanSource('<text fontSize={12}>1</text>', 'src/a.tsx')).toEqual([]);
    expect(
      scanSource("<text fontSize={'0.7rem'}>1</text>", 'src/a.tsx').map((hit) => hit.value),
    ).toEqual(['0.7rem']);
  });

  it('finds both branches of a ternary below the floor', () => {
    const hits = scanSource(
      '<text fontSize={wide ? 10 : 11}>a</text>\n<text fontSize={wide ? 12 : 14}>b</text>',
      'src/a.tsx',
    );
    expect(hits.map((hit) => hit.value)).toEqual(['10px', '11px']);
  });

  it('resolves a constant declared in the same file', () => {
    const source = 'const MINI = 10;\nconst OK = 12;\n<text fontSize={MINI}>a</text>';
    const hits = scanSource(source, 'src/a.tsx');
    expect(hits.map((hit) => hit.value)).toEqual(['10px']);
    expect(hits[0].constant).toBe('MINI');
    expect(scanSource('const OK = 12;\n<text fontSize={OK}>a</text>', 'src/a.tsx')).toEqual([]);
  });

  it('reports an unresolved bare identifier as a dynamic violation', () => {
    const hits = scanSource('<text fontSize={unit}>a</text>', 'src/a.tsx');
    expect(hits).toHaveLength(1);
    expect(hits[0].value).toBe('fontSize={unit}');
    expect(hits[0].dynamic).toBe(true);
    expect(hits[0].px).toBeNaN();
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

describe('collectConstants', () => {
  it('records the value and whether the constant is exported', () => {
    const constants = collectConstants(
      'const MINI = 10;\nexport const CHART_TEXT_MIN = 12;\nconst TEXT: number = 14;',
    );
    expect(constants.get('MINI')).toEqual({ px: 10, exported: false });
    expect(constants.get('CHART_TEXT_MIN')).toEqual({ px: 12, exported: true });
    expect(constants.get('TEXT')).toEqual({ px: 14, exported: false });
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

  it('fails an unresolved dynamic size without an allowlist entry', () => {
    const file = path.join(directory, 'chart.tsx');
    fs.writeFileSync(file, 'const unit = unitsFor(width);\n<text fontSize={unit}>1</text>');
    const { violations } = checkFiles([file]);
    expect(violations).toHaveLength(1);
    expect(violations[0].value).toBe('fontSize={unit}');
  });

  it('suppresses a dynamic size only through a constant that guarantees the floor', () => {
    const file = path.join(directory, 'chart.tsx');
    fs.writeFileSync(
      file,
      'export const CHART_TEXT_MIN = 12;\nconst unit = unitsFor(width);\n<text fontSize={unit}>1</text>',
    );
    const [hit] = checkFiles([file]).violations;
    const allowlist = {
      allow: [
        {
          file: hit.file,
          value: hit.value,
          constant: 'CHART_TEXT_MIN',
          reason: 'SVG axis label sized from the measured container',
        },
      ],
    };
    const result = checkFiles([file], allowlist);
    expect(result.violations).toEqual([]);
    expect(result.unguarded).toEqual([]);
    expect(result.allowed).toHaveLength(1);
    expect(result.allowed[0].constant).toBe('CHART_TEXT_MIN');
  });

  it('fails a dynamic size whose guarantee is missing, unexported or too small', () => {
    const cases = [
      {
        source: 'const unit = unitsFor(width);\n<text fontSize={unit}>1</text>',
        problem: /not declared/,
      },
      {
        source:
          'const CHART_TEXT_MIN = 12;\nconst unit = unitsFor(width);\n<text fontSize={unit}>1</text>',
        problem: /not exported/,
      },
      {
        source:
          'export const CHART_TEXT_MIN = 8;\nconst unit = unitsFor(width);\n<text fontSize={unit}>1</text>',
        problem: /below the 12px floor/,
      },
    ];
    for (const { source, problem } of cases) {
      const file = path.join(directory, 'chart.tsx');
      fs.writeFileSync(file, source);
      const [hit] = checkFiles([file]).violations;
      const allowlist = {
        allow: [
          { file: hit.file, value: hit.value, constant: 'CHART_TEXT_MIN', reason: 'svg axis' },
        ],
      };
      const result = checkFiles([file], allowlist);
      expect(result.violations).toHaveLength(1);
      expect(result.unguarded).toHaveLength(1);
      expect(result.unguarded[0].problem).toMatch(problem);
    }
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

  it('rejects an empty guarantee name', () => {
    const file = path.join(directory, 'allowlist.json');
    fs.writeFileSync(
      file,
      JSON.stringify({
        allow: [{ file: 'src/a.tsx', value: 'fontSize={unit}', reason: 'x', constant: ' ' }],
      }),
    );
    expect(() => loadAllowlist(file)).toThrow(/constant/);
  });
});

describe('checkGuarantee', () => {
  it('accepts an exported constant at or above the floor', () => {
    expect(
      checkGuarantee('export const CHART_TEXT_MIN = 12;', { constant: 'CHART_TEXT_MIN' }),
    ).toBeNull();
  });

  it('rejects a constant below the floor', () => {
    const text = 'export const CHART_TEXT_MIN = 11;';
    expect(checkGuarantee(text, { file: 'a.tsx', constant: 'CHART_TEXT_MIN' })).toMatch(/11px/);
  });

  it('accepts an explicit higher floor for Arabic', () => {
    expect(ARABIC_FLOOR_PX).toBe(13);
    expect(
      checkGuarantee('export const CHART_TEXT_MIN = 12;', { constant: 'CHART_TEXT_MIN' }, 13),
    ).toMatch(/below the 13px floor/);
    expect(
      checkGuarantee('export const CHART_TEXT_MIN = 13;', { constant: 'CHART_TEXT_MIN' }, 13),
    ).toBeNull();
  });
});

describe('checkArabicMinimum', () => {
  let directory;
  const override = (size) => `.ov-micro { font-size: 0.75rem; }
:lang(ar) :is(.text-xs, .ov-micro) { font-size: ${size}; }
`;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'arabic-size-'));
  });

  it('accepts one shared override that covers both smallest steps at 13 px', () => {
    const css = path.join(directory, 'base.css');
    fs.writeFileSync(css, override('0.8125rem'));
    expect(checkArabicMinimum([css])).toEqual([]);
  });

  it('fails a missing, undersized or incomplete override', () => {
    const css = path.join(directory, 'base.css');
    const cases = [
      '.ov-micro { font-size: 0.75rem; }',
      override('0.75rem'),
      ':lang(ar) :is(.ov-micro) { font-size: 0.8125rem; }',
    ];
    for (const source of cases) {
      fs.writeFileSync(css, source);
      expect(checkArabicMinimum([css]).length).toBeGreaterThan(0);
    }
  });

  it('fails a small CSS size that bypasses the covered steps', () => {
    const css = path.join(directory, 'base.css');
    fs.writeFileSync(css, `${override('0.8125rem')}.bypass { font-size: 11px; }`);
    expect(checkArabicMinimum([css]).join(' ')).toMatch(/bypasses/);
  });

  it('requires an Arabic allowlisted dynamic size to prove 13 px', () => {
    const chart = path.join(directory, 'chart.tsx');
    const css = path.join(directory, 'base.css');
    fs.writeFileSync(css, override('0.8125rem'));
    const files = [chart, css];
    const allowlist = {
      allow: [
        {
          file: toPosix(chart),
          value: 'fontSize={unit}',
          constant: 'CHART_TEXT_MIN',
          arabic: true,
          reason: 'svg axis label',
        },
      ],
    };
    fs.writeFileSync(chart, 'export const CHART_TEXT_MIN = 12;\n<text fontSize={unit}>1</text>');
    expect(checkArabicMinimum(files, allowlist).join(' ')).toMatch(/below the 13px floor/);
    fs.writeFileSync(chart, 'export const CHART_TEXT_MIN = 13;\n<text fontSize={unit}>1</text>');
    expect(checkArabicMinimum(files, allowlist)).toEqual([]);
  });
});
