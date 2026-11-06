import { describe, expect, it } from 'vitest';

import { UlidGenerator } from './ulid-ids';

const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe('UlidGenerator', () => {
  it('emits 26 Crockford base32 characters', () => {
    const generator = new UlidGenerator();
    const value = generator.next();
    expect(value).toHaveLength(26);
    expect(value).toMatch(CROCKFORD);
  });

  it('emits unique values', () => {
    const generator = new UlidGenerator();
    const values = new Set(Array.from({ length: 500 }, () => generator.next()));
    expect(values.size).toBe(500);
  });

  it('keeps the timestamp prefix non-decreasing', () => {
    const generator = new UlidGenerator();
    const prefixes = Array.from({ length: 100 }, () => generator.next().slice(0, 10));
    expect([...prefixes].sort()).toEqual(prefixes);
  });
});
