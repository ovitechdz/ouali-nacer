import { describe, expect, it } from 'vitest';

import { NOW, makeAnimal, makeRecommendation, makeWeight } from '@/test/factories';

import { computeAnimalHealth } from './health';

function health(
  overrides: Parameters<typeof makeAnimal>[0] = {},
  weights = [] as ReturnType<typeof makeWeight>[],
) {
  return computeAnimalHealth({
    animal: makeAnimal(overrides),
    weights,
    latestRecommendation: undefined,
    now: NOW,
  });
}

describe('health signals', () => {
  it('returns ok with no signal for a healthy animal', () => {
    const result = health();
    expect(result.status).toBe('ok');
    expect(result.signals).toEqual([]);
    expect(result.vetReview).toBe(false);
  });

  it('alerts on a weight loss of at least six percent', () => {
    const records = [
      makeWeight({ id: 'w1', kg: 100, at: '2026-08-01T10:00:00.000Z' }),
      makeWeight({ id: 'w2', kg: 94, at: '2026-08-20T10:00:00.000Z' }),
    ];
    const result = health({ lastScanAt: NOW.toISOString() }, records);
    expect(result.signals).toContainEqual({ id: 'poids', level: 'alerte' });
    expect(result.status).toBe('alerte');
    expect(result.vetReview).toBe(true);
  });

  it('does not alert below the six percent threshold', () => {
    const records = [
      makeWeight({ id: 'w1', kg: 100, at: '2026-08-01T10:00:00.000Z' }),
      makeWeight({ id: 'w2', kg: 94.1, at: '2026-08-20T10:00:00.000Z' }),
    ];
    expect(health({ lastScanAt: NOW.toISOString() }, records).signals).toEqual([]);
  });

  it('scores low body condition at the 2.0 and 2.5 boundaries', () => {
    expect(health({ bcs: 1.9, lastScanAt: NOW.toISOString() }).status).toBe('alerte');
    expect(health({ bcs: 2, lastScanAt: NOW.toISOString() }).status).toBe('suivi');
    expect(health({ bcs: 2.4, lastScanAt: NOW.toISOString() }).status).toBe('suivi');
    expect(health({ bcs: 2.5, lastScanAt: NOW.toISOString() }).status).toBe('ok');
  });

  it('treats exactly three days as fresh and older as stale', () => {
    const exactly = health({ lastScanAt: '2026-08-25T10:00:00.000Z' });
    const older = health({ lastScanAt: '2026-08-25T09:59:59.999Z' });
    expect(exactly.signals).toEqual([]);
    expect(older.signals).toContainEqual({ id: 'scan', level: 'suivi' });
  });

  it('honours a custom stale threshold', () => {
    const result = computeAnimalHealth({
      animal: makeAnimal({ lastScanAt: '2026-08-26T10:00:00.000Z' }),
      weights: [],
      latestRecommendation: undefined,
      now: NOW,
      scanStaleDays: 1,
    });
    expect(result.signals).toContainEqual({ id: 'scan', level: 'suivi' });
  });

  it('watches a gestation within ten days of lambing', () => {
    const close = health({
      stage: 'brebis_gestation',
      expectedLambingAt: '2026-09-05T10:00:00.000Z',
      lastScanAt: NOW.toISOString(),
    });
    const far = health({
      stage: 'brebis_gestation',
      expectedLambingAt: '2026-09-10T10:00:00.000Z',
      lastScanAt: NOW.toISOString(),
    });
    expect(close.signals).toContainEqual({ id: 'gestation', level: 'suivi' });
    expect(far.signals).toEqual([]);
  });

  it('alerts when the latest recommendation is a refusal', () => {
    const result = computeAnimalHealth({
      animal: makeAnimal({ lastScanAt: NOW.toISOString() }),
      weights: [],
      latestRecommendation: makeRecommendation({ ration: null }),
      now: NOW,
    });
    expect(result.signals).toContainEqual({ id: 'refus', level: 'alerte' });
    expect(result.status).toBe('alerte');
  });

  it('keeps the strongest level when signals combine', () => {
    const result = computeAnimalHealth({
      animal: makeAnimal({ bcs: 2.2, lastScanAt: null }),
      weights: [],
      latestRecommendation: makeRecommendation({ ration: null }),
      now: NOW,
    });
    expect(result.status).toBe('alerte');
    expect(result.signals.length).toBeGreaterThan(1);
    expect(result.vetReview).toBe(true);
  });
});
