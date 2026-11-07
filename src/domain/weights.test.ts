import { describe, expect, it } from 'vitest';

import { makeWeight } from '@/test/factories';

import { adgFromHistory } from './weights';

describe('adgFromHistory', () => {
  it('returns null with fewer than two records', () => {
    expect(adgFromHistory([], 'an-1')).toBeNull();
    expect(adgFromHistory([makeWeight()], 'an-1')).toBeNull();
  });

  it('computes daily gain between the two most recent records', () => {
    const records = [
      makeWeight({ id: 'w1', kg: 40, at: '2026-08-01T10:00:00.000Z' }),
      makeWeight({ id: 'w2', kg: 46, at: '2026-08-11T10:00:00.000Z' }),
      makeWeight({ id: 'w3', kg: 50, at: '2026-08-21T10:00:00.000Z' }),
    ];
    expect(adgFromHistory(records, 'an-1')).toBe(0.4);
  });

  it('ignores records from other animals', () => {
    const records = [
      makeWeight({ id: 'w1', kg: 40, at: '2026-08-01T10:00:00.000Z' }),
      makeWeight({ id: 'w2', kg: 50, at: '2026-08-11T10:00:00.000Z', animalId: 'an-2' }),
    ];
    expect(adgFromHistory(records, 'an-1')).toBeNull();
  });

  it('refuses a same-day difference and reports negative gain', () => {
    const sameDay = [
      makeWeight({ id: 'w1', kg: 40, at: '2026-08-01T10:00:00.000Z' }),
      makeWeight({ id: 'w2', kg: 41, at: '2026-08-01T18:00:00.000Z' }),
    ];
    expect(adgFromHistory(sameDay, 'an-1')).toBeNull();

    const loss = [
      makeWeight({ id: 'w1', kg: 50, at: '2026-08-01T10:00:00.000Z' }),
      makeWeight({ id: 'w2', kg: 47, at: '2026-08-11T10:00:00.000Z' }),
    ];
    expect(adgFromHistory(loss, 'an-1')).toBe(-0.3);
  });
});
