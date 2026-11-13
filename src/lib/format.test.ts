import { describe, expect, it } from 'vitest';

import { formatDate, formatDateTime, middleTruncate } from './format';

// 2026-03-04T21:05Z is 22:05 in Africa/Algiers (UTC+1, pinned in vitest.config.ts).
const INSTANT = '2026-03-04T21:05:00.000Z';
const NOON = '2026-03-04T11:00:00.000Z'; // 12:00 local

describe('formatDate', () => {
  it('keeps the year and the day-month order in each locale', () => {
    expect(formatDate(INSTANT, 'fr')).toBe('04 mars 2026');
    expect(formatDate(INSTANT, 'en')).toBe('04 Mar 2026');
    expect(formatDate(INSTANT, 'ar')).toContain('2026');
  });

  it('returns a dash for missing and invalid values', () => {
    expect(formatDate(null, 'fr')).toBe('—');
    expect(formatDate('not-a-date', 'fr')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('uses a 24-hour clock and includes the year in French', () => {
    const value = formatDateTime(INSTANT, 'fr');
    expect(value).toBe('04 mars 2026, 22:05');
    expect(value).not.toMatch(/AM|PM/);
  });

  it('uses a 24-hour clock and includes the year in English', () => {
    const value = formatDateTime(INSTANT, 'en');
    expect(value).toBe('04 Mar 2026, 22:05');
    expect(value).not.toMatch(/AM|PM/);
  });

  it('keeps the Arabic day period and the project digit convention', () => {
    const value = formatDateTime(NOON, 'ar');
    expect(value).toContain('2026');
    expect(value).toMatch(/12:00/);
    expect(value).toMatch(/[صم]/);
    // ar-DZ-u-nu-latn renders Latin digits; Arabic-Indic digits would break
    // the tables that align on tabular-nums.
    expect(value).not.toMatch(/[\u0660-\u0669]/);
  });

  it('returns a dash for missing and invalid values', () => {
    expect(formatDateTime(null, 'ar')).toBe('—');
    expect(formatDateTime('', 'en')).toBe('—');
  });
});

describe('middleTruncate', () => {
  it('leaves short values untouched', () => {
    expect(middleTruncate('مزرعة صغيرة', 34)).toBe('مزرعة صغيرة');
  });

  it('keeps both ends of a long farm name', () => {
    const value = 'مزرعة العرض التجريبية الكبيرة — سيدي بلعباس';
    const result = middleTruncate(value, 24);
    expect(Array.from(result).length).toBe(24);
    expect(result.startsWith('مزرعة')).toBe(true);
    expect(result.endsWith('بلعباس')).toBe(true);
    expect(result).toContain('…');
  });

  it('handles tiny limits without throwing', () => {
    expect(middleTruncate('abcdefgh', 4)).toBe('abcd');
  });
});
