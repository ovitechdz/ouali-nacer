import { describe, expect, it } from 'vitest';

import {
  NOW,
  makeAnimal,
  makeDocument,
  makeFeedLot,
  makeRecommendation,
  makeWeight,
} from '@/test/factories';
import { animalById, countByStatus, farmKpis, herdRows, latestRec } from './selectors';

const older = makeRecommendation({ id: 'rec-old', createdAt: '2026-08-01T10:00:00.000Z' });
const newer = makeRecommendation({ id: 'rec-new', createdAt: '2026-08-20T10:00:00.000Z' });

const document = makeDocument({
  animals: [
    makeAnimal({ id: 'an-1' }),
    makeAnimal({ id: 'an-2', code: 'OV-2402', rfid: 'RFID-2' }),
  ],
  weights: [
    makeWeight({ id: 'w-1', animalId: 'an-1' }),
    makeWeight({ id: 'w-2', animalId: 'an-2', kg: 38 }),
  ],
  recommendations: [older, newer],
  feedLots: [makeFeedLot({ id: 'feed-forage', kind: 'fourrage', stockKg: 100 })],
});

describe('store selectors', () => {
  it('pairs every animal with its newest recommendation and health state', () => {
    const rows = herdRows(document, NOW);
    const [first, second] = rows;

    expect(rows).toHaveLength(2);
    expect(first?.animal.id).toBe('an-1');
    expect(first?.rec?.id).toBe('rec-new');
    expect(second?.rec).toBeNull();
    expect(['ok', 'suivi', 'alerte']).toContain(first?.health.status);
  });

  it('answers the per-animal lookups the detail pages rely on', () => {
    expect(latestRec(document, 'an-1')?.id).toBe('rec-new');
    expect(latestRec(document, 'missing')).toBeNull();
    expect(animalById(document, 'an-2')?.rfid).toBe('RFID-2');
    expect(animalById(document, 'missing')).toBeUndefined();
  });

  it('derives the dashboard KPIs from the same document', () => {
    const kpis = farmKpis(document, NOW);

    expect(kpis.activeCount).toBe(2);
    expect(kpis.forageStockKg).toBe(100);
    expect(kpis.identifiedPct).toBe(100);
  });

  it('counts the herd rows by health status without losing any', () => {
    const counts = countByStatus(herdRows(document, NOW));

    expect(counts.alerte + counts.suivi + counts.ok).toBe(2);
  });
});
