import { describe, expect, it } from 'vitest';

import {
  makeAnimal,
  makeApproved,
  makeDocument,
  makeFeedLot,
  makeRecommendation,
} from '@/test/factories';

import { buildRationSheet, canServe } from './ration';

describe('canServe', () => {
  it('rejects an absent or refused recommendation', () => {
    expect(canServe(undefined).reason?.key).toBe('domain.ration.noRation');
    expect(canServe(makeRecommendation({ ration: null })).reason?.key).toBe(
      'domain.ration.refused',
    );
  });

  it('requires human approval before serving', () => {
    expect(canServe(makeRecommendation()).reason?.key).toBe('domain.ration.approvalRequired');
  });

  it('rejects an already served ration', () => {
    expect(
      canServe(makeApproved({ servedAt: '2026-08-28T10:00:00.000Z', stocksDeducted: true })).reason
        ?.key,
    ).toBe('domain.ration.alreadyServed');
  });

  it('accepts an approved, unserved ration', () => {
    expect(canServe(makeApproved())).toEqual({ ok: true });
  });
});

describe('buildRationSheet', () => {
  const animals = [
    makeAnimal({ id: 'a1', code: 'OV-2', pen: 'P2', weightKg: 40 }),
    makeAnimal({ id: 'a2', code: 'OV-1', pen: 'P2', weightKg: 50 }),
    makeAnimal({ id: 'a3', code: 'OV-3', pen: 'P1', weightKg: 60 }),
    makeAnimal({ id: 'a4', code: 'OV-4', pen: 'P1', status: 'vendu' }),
  ];
  const feed = [
    makeFeedLot({ id: 'f1', kind: 'fourrage', costPerKg: 3 }),
    makeFeedLot({ id: 'f2', kind: 'concentre', costPerKg: 5 }),
  ];

  it('aggregates rows by pen, sorted by code', () => {
    const recs = [
      makeApproved({ id: 'r1', animalId: 'a1' }),
      makeRecommendation({ id: 'r2', animalId: 'a2' }),
    ];
    const sheet = buildRationSheet(animals, recs, feed);
    expect(sheet.groups.map((group) => group.pen)).toEqual(['P1', 'P2']);
    expect(sheet.groups[1]!.rows.map((row) => row.animal.code)).toEqual(['OV-1', 'OV-2']);
    expect(sheet.total).toBe(3);
    expect(sheet.blocked).toBe(1);
    expect(sheet.covered).toBe(2);
    expect(sheet.ready).toBe(1);
    expect(sheet.served).toBe(0);
  });

  it('sums quantities, cost and counts served rows', () => {
    const served = makeApproved({
      id: 'r3',
      animalId: 'a3',
      servedAt: '2026-08-28T10:00:00.000Z',
      stocksDeducted: true,
    });
    const sheet = buildRationSheet(animals, [served], feed);
    expect(sheet.forageKg).toBeCloseTo(0.85);
    expect(sheet.concentrateKg).toBeCloseTo(0.78);
    expect(sheet.mineralG).toBe(16);
    expect(sheet.waterL).toBeCloseTo(4.9);
    expect(sheet.cost).toBeCloseTo(0.85 * 3 + 0.78 * 5);
    expect(sheet.served).toBe(1);
    expect(sheet.ready).toBe(0);
  });

  it('uses the latest recommendation only', () => {
    const old = makeApproved({
      id: 'old',
      animalId: 'a3',
      createdAt: '2026-08-01T10:00:00.000Z',
      ration: { ...makeRecommendation().ration!, forageKg: 9, concentrateKg: 0, dmiKg: 9 },
    });
    const recent = makeApproved({
      id: 'new',
      animalId: 'a3',
      createdAt: '2026-08-02T10:00:00.000Z',
    });
    const sheet = buildRationSheet([animals[2]!], [old, recent], feed);
    expect(sheet.forageKg).toBeCloseTo(0.85);
  });

  it('returns an empty sheet for no active animal', () => {
    const sheet = buildRationSheet([], [], []);
    expect(sheet).toMatchObject({
      groups: [],
      forageKg: 0,
      total: 0,
      covered: 0,
      blocked: 0,
      ready: 0,
      served: 0,
    });
  });

  it('is a derived view: the source document is untouched', () => {
    const document = makeDocument({ animals, feedLots: feed });
    const snapshot = JSON.stringify(document);
    buildRationSheet(document.animals, document.recommendations, document.feedLots);
    expect(JSON.stringify(document)).toBe(snapshot);
  });
});
