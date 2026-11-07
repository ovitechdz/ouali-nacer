import { describe, expect, it } from 'vitest';

import { NOW, makeAnimal, makeFeedLot, makeRecommendation } from '@/test/factories';

import { computeFarmKpis, latestRecommendationByAnimal } from './kpis';

describe('latestRecommendationByAnimal', () => {
  it('keeps the newest recommendation per animal', () => {
    const old = makeRecommendation({ id: 'old', createdAt: '2026-08-01T10:00:00.000Z' });
    const recent = makeRecommendation({
      id: 'new',
      createdAt: '2026-08-02T10:00:00.000Z',
    });
    const other = makeRecommendation({
      id: 'other',
      animalId: 'an-2',
      createdAt: '2026-08-01T10:00:00.000Z',
    });
    const map = latestRecommendationByAnimal([old, recent, other]);
    expect(map.get('an-1')?.id).toBe('new');
    expect(map.get('an-2')?.id).toBe('other');
  });
});

describe('computeFarmKpis', () => {
  it('returns zeroed KPIs for an empty herd', () => {
    const kpis = computeFarmKpis({
      animals: [],
      recommendations: [],
      feedLots: [],
      now: NOW,
    });
    expect(kpis).toMatchObject({
      activeCount: 0,
      identifiedPct: 0,
      meanWeightKg: 0,
      meanAdgKg: 0,
      recOk: 0,
      recBlock: 0,
      dataDrivenPct: 0,
      forageNeedKg: 0,
      concentrateNeedKg: 0,
      rationCost: 0,
      forageStockKg: 0,
      coverDays: null,
      missingWeightCount: 0,
      lowBcsCount: 0,
      staleScanCount: 0,
      pending: 0,
    });
  });

  it('derives identification, means and data-driven coverage', () => {
    const animals = [
      makeAnimal({ id: 'a', rfid: 'R1', weightKg: 40, adgKg: 0.1, lastScanAt: NOW.toISOString() }),
      makeAnimal({
        id: 'b',
        rfid: '',
        weightKg: 60,
        adgKg: 0.3,
        lastScanAt: '2026-08-01T10:00:00.000Z',
        bcs: 2,
      }),
      makeAnimal({ id: 'c', status: 'vendu', weightKg: 80 }),
    ];
    const recs = [
      makeRecommendation({ id: 'r1', animalId: 'a' }),
      makeRecommendation({ id: 'r2', animalId: 'b', ration: null }),
      makeRecommendation({ id: 'r3', animalId: 'c' }),
    ];
    const kpis = computeFarmKpis({
      animals,
      recommendations: recs,
      feedLots: [],
      now: NOW,
      pending: 4,
    });
    expect(kpis.activeCount).toBe(2);
    expect(kpis.identifiedPct).toBe(50);
    expect(kpis.meanWeightKg).toBe(50);
    expect(kpis.meanAdgKg).toBeCloseTo(0.2);
    expect(kpis.recOk).toBe(2);
    expect(kpis.recBlock).toBe(1);
    expect(kpis.dataDrivenPct).toBe(67);
    expect(kpis.lowBcsCount).toBe(1);
    expect(kpis.staleScanCount).toBe(1);
    expect(kpis.pending).toBe(4);
  });

  it('sums ration needs with the cheapest available prices', () => {
    const animals = [makeAnimal({ id: 'a' })];
    const recommendations = [
      makeRecommendation({
        animalId: 'a',
        ration: {
          forageKg: 2,
          concentrateKg: 1,
          mineralG: 10,
          waterL: 4,
          cpPercent: 15,
          meMj: 20,
          dmiKg: 3,
        },
      }),
    ];
    const feedLots = [
      makeFeedLot({ id: 'f1', kind: 'fourrage', costPerKg: 4, stockKg: 100 }),
      makeFeedLot({ id: 'f2', kind: 'fourrage', costPerKg: 2, stockKg: 30 }),
      makeFeedLot({ id: 'f3', kind: 'concentre', costPerKg: 6, stockKg: 10 }),
    ];
    const kpis = computeFarmKpis({ animals, recommendations, feedLots, now: NOW });
    expect(kpis.forageNeedKg).toBe(2);
    expect(kpis.concentrateNeedKg).toBe(1);
    expect(kpis.rationCost).toBe(10);
    expect(kpis.forageStockKg).toBe(130);
    expect(kpis.coverDays).toBe(65);
  });

  it('counts a missing weight and reports no cover when demand is zero', () => {
    const kpis = computeFarmKpis({
      animals: [makeAnimal({ weightKg: null })],
      recommendations: [],
      feedLots: [makeFeedLot({ stockKg: 50 })],
      now: NOW,
    });
    expect(kpis.missingWeightCount).toBe(1);
    expect(kpis.coverDays).toBeNull();
  });
});
