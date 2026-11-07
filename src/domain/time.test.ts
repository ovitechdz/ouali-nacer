import { describe, expect, it } from 'vitest';

import { NOW } from '@/test/factories';

import { SHEEP_GESTATION_DAYS, ageMonths, daysBetween, daysUntil, isStale } from './time';

describe('time helpers', () => {
  it('counts whole months of age', () => {
    expect(ageMonths('2024-01-15', NOW)).toBe(31);
    expect(ageMonths('2026-08-01', NOW)).toBe(0);
    expect(ageMonths('2027-01-01', NOW)).toBe(0);
  });

  it('returns zero for malformed or pre-epoch dates', () => {
    expect(ageMonths('not-a-date', NOW)).toBe(0);
    expect(ageMonths('1969-12-31', NOW)).toBe(0);
  });

  it('measures calendar days between timestamps', () => {
    expect(daysBetween('2026-08-01T10:00:00.000Z', '2026-08-28T10:00:00.000Z')).toBe(27);
    expect(daysBetween('2026-08-28T10:00:00.000Z', '2026-08-01T10:00:00.000Z')).toBe(-27);
  });

  it('returns whole days remaining until a date', () => {
    expect(daysUntil('2026-09-01T10:00:00.000Z', NOW)).toBe(4);
    expect(daysUntil(null, NOW)).toBeNull();
    expect(daysUntil('invalid', NOW)).toBeNull();
  });

  it('marks a missing or older-than-threshold timestamp as stale', () => {
    expect(isStale(null, NOW, 3)).toBe(true);
    expect(isStale('invalid', NOW, 3)).toBe(true);
    expect(isStale('2026-08-25T10:00:00.000Z', NOW, 3)).toBe(false);
    expect(isStale('2026-08-25T09:59:59.999Z', NOW, 3)).toBe(true);
  });

  it('exposes the sheep gestation constant', () => {
    expect(SHEEP_GESTATION_DAYS).toBe(150);
  });
});
