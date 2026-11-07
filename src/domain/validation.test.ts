import { describe, expect, it } from 'vitest';

import {
  MAX_WEIGHT_KG,
  bcsInputSchema,
  checkImportLimits,
  feedLotInputSchema,
  isBcs,
  isWeight,
  newAnimalInputSchema,
  weightInputSchema,
} from './validation';

describe('weight and BCS validation', () => {
  it('accepts numeric strings, numbers and the empty string', () => {
    expect(weightInputSchema.parse('45')).toBe(45);
    expect(weightInputSchema.parse(45)).toBe(45);
    expect(weightInputSchema.parse('')).toBeNull();
    expect(bcsInputSchema.parse('3.5')).toBe(3.5);
    expect(bcsInputSchema.parse('')).toBeNull();
  });

  it('rejects non-finite and out-of-range weights', () => {
    for (const value of ['0', '-1', 'abc', String(MAX_WEIGHT_KG + 1), Number.POSITIVE_INFINITY]) {
      expect(weightInputSchema.safeParse(value).success).toBe(false);
    }
  });

  it('rejects BCS outside 1–5', () => {
    expect(bcsInputSchema.safeParse('0.9').success).toBe(false);
    expect(bcsInputSchema.safeParse('5.1').success).toBe(false);
  });

  it('exposes typed guards', () => {
    expect(isWeight(45)).toBe(true);
    expect(isWeight(0)).toBe(false);
    expect(isWeight(null)).toBe(false);
    expect(isBcs(1)).toBe(true);
    expect(isBcs(5)).toBe(true);
    expect(isBcs(5.1)).toBe(false);
  });
});

describe('newAnimalInputSchema', () => {
  const valid = {
    rfid: 'RFID-1',
    code: 'OV-2401',
    sex: 'M',
    breed: 'Ouled Djellal',
    birthDate: '2026-03-01',
    stage: 'engraissement',
    pen: 'P1',
    weight: '45',
    bcs: '3',
  };

  it('parses a complete animal payload', () => {
    const parsed = newAnimalInputSchema.parse(valid);
    expect(parsed.weight).toBe(45);
    expect(parsed.bcs).toBe(3);
    expect(parsed.notes).toBeUndefined();
  });

  it('rejects missing code, wrong date and unknown stage', () => {
    expect(newAnimalInputSchema.safeParse({ ...valid, code: '' }).success).toBe(false);
    expect(newAnimalInputSchema.safeParse({ ...valid, birthDate: '01/01/2026' }).success).toBe(
      false,
    );
    expect(newAnimalInputSchema.safeParse({ ...valid, stage: 'adulte' }).success).toBe(false);
  });
});

describe('feed lot validation', () => {
  it('rejects negative stock and cost', () => {
    const base = {
      name: 'Forage',
      kind: 'fourrage',
      stockKg: 10,
      costPerKg: 3,
      available: true,
    };
    expect(feedLotInputSchema.safeParse(base).success).toBe(true);
    expect(feedLotInputSchema.safeParse({ ...base, stockKg: -1 }).success).toBe(false);
    expect(feedLotInputSchema.safeParse({ ...base, costPerKg: -1 }).success).toBe(false);
    expect(feedLotInputSchema.safeParse({ ...base, kind: 'grain' }).success).toBe(false);
  });
});

describe('import limits', () => {
  it('accepts a normal payload', () => {
    expect(checkImportLimits({ bytes: 1024, arrayLengths: [10, 20] })).toBeNull();
  });

  it('rejects oversized files, arrays and totals', () => {
    expect(checkImportLimits({ bytes: 26 * 1024 * 1024, arrayLengths: [] })?.key).toBe(
      'domain.error.importSize',
    );
    expect(checkImportLimits({ bytes: 1, arrayLengths: [50_001] })?.key).toBe(
      'domain.error.importSize',
    );
    expect(
      checkImportLimits({ bytes: 1, arrayLengths: [50_000, 50_000, 50_000, 50_000, 1] })?.key,
    ).toBe('domain.error.importSize');
  });

  it('rejects malformed lengths', () => {
    expect(checkImportLimits({ bytes: 1, arrayLengths: [-1] })?.key).toBe('domain.error.malformed');
  });
});
