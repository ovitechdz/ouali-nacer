import { describe, expect, it } from 'vitest';

import { middleTruncate } from './format';

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
