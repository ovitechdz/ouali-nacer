import { describe, expect, it } from 'vitest';

import { makeFeedLot } from '@/test/factories';

import {
  concentratePrice,
  concentrateStock,
  deductFeed,
  feedAvailability,
  feedCovers,
  foragePrice,
  forageStock,
} from './feed';

const forage = makeFeedLot({ id: 'f', kind: 'fourrage', stockKg: 10, costPerKg: 3 });
const cheapForage = makeFeedLot({ id: 'f2', kind: 'fourrage', stockKg: 5, costPerKg: 2 });
const concentrate = makeFeedLot({
  id: 'c',
  kind: 'concentre',
  stockKg: 4,
  costPerKg: 6,
});
const hybrid = makeFeedLot({ id: 'h', kind: 'hybride', stockKg: 7, costPerKg: 4 });

describe('feed pricing and stock', () => {
  it('uses the cheapest available compatible lot', () => {
    expect(foragePrice([forage, cheapForage])).toBe(2);
    expect(concentratePrice([concentrate])).toBe(6);
    expect(foragePrice([])).toBe(0);
  });

  it('falls back to an available hybrid lot', () => {
    expect(foragePrice([hybrid])).toBe(4);
    expect(concentratePrice([hybrid])).toBe(4);
  });

  it('ignores unavailable lots', () => {
    expect(foragePrice([{ ...cheapForage, available: false }])).toBe(0);
    expect(forageStock([{ ...forage, available: false }])).toBe(0);
    expect(concentratePrice([{ ...hybrid, available: false }])).toBe(0);
  });

  it('sums compatible stock including hybrid', () => {
    expect(forageStock([forage, cheapForage, hybrid])).toBe(22);
    expect(concentrateStock([concentrate, hybrid])).toBe(11);
  });
});

describe('feed availability', () => {
  it('requires an enabled lot with positive stock', () => {
    expect(feedAvailability([forage, concentrate])).toEqual({
      forageAvailable: true,
      concentrateAvailable: true,
    });
    expect(feedAvailability([{ ...forage, stockKg: 0 }])).toEqual({
      forageAvailable: false,
      concentrateAvailable: false,
    });
  });
});

describe('feed coverage and deduction', () => {
  it('covers an exact demand', () => {
    expect(feedCovers([forage, concentrate], 10, 4)).toBe(true);
    expect(feedCovers([forage, concentrate], 10.1, 4)).toBe(false);
    expect(feedCovers([forage, concentrate], 10, 4.1)).toBe(false);
  });

  it('does not mutate the input when deducting', () => {
    const source = [forage, concentrate];
    const result = deductFeed(source, 4, 2);
    expect(source[0]!.stockKg).toBe(10);
    expect(source[1]!.stockKg).toBe(4);
    expect(result[0]!.stockKg).toBe(6);
    expect(result[1]!.stockKg).toBe(2);
  });

  it('uses hybrid stock for forage first, then concentrate', () => {
    const result = deductFeed([hybrid], 5, 1);
    expect(result[0]!.stockKg).toBe(1);
    expect(feedCovers([hybrid], 7, 0)).toBe(true);
    expect(feedCovers([hybrid], 8, 0)).toBe(false);
  });

  it('never produces a negative stock', () => {
    const result = deductFeed([forage], 50, 0);
    expect(result[0]!.stockKg).toBe(0);
    expect(feedCovers([forage], 50, 0)).toBe(false);
  });

  it('leaves unavailable and empty lots untouched', () => {
    const disabled = { ...forage, available: false };
    const result = deductFeed([disabled], 1, 0);
    expect(result[0]).toEqual(disabled);
  });
});
