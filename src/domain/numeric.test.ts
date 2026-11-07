import { describe, expect, it } from 'vitest';

import { clamp, round0, round1, round3, stableHash } from './numeric';

describe('numeric helpers', () => {
  it('rounds to integers and decimals', () => {
    expect(round0(1.4)).toBe(1);
    expect(round0(1.5)).toBe(2);
    expect(round1(1.25)).toBe(1.3);
    expect(round1(-1.25)).toBe(-1.2);
    expect(round3(0.12345)).toBe(0.123);
  });

  it('clamps within bounds', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
    expect(clamp(2, 1, 3)).toBe(2);
  });

  it('produces a deterministic, input-sensitive hash', () => {
    expect(stableHash('abc')).toBe(stableHash('abc'));
    expect(stableHash('abc')).not.toBe(stableHash('abd'));
    expect(stableHash('')).toMatch(/^[0-9a-f]{8}$/);
  });
});
