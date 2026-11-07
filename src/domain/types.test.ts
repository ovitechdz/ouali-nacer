import { describe, expect, it } from 'vitest';

import {
  makeAnimal,
  makeDocument,
  makeFeedLot,
  makeRecommendation,
  makeWeight,
} from '@/test/factories';

import {
  CURRENT_SCHEMA_VERSION,
  ENGINE_ID,
  ENGINE_VERSION,
  farmDocumentSchema,
  nutritionRecSchema,
} from './types';

describe('farmDocumentSchema', () => {
  it('accepts the current schema version', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(5);
    expect(farmDocumentSchema.safeParse(makeDocument()).success).toBe(true);
  });

  it('pins the frozen engine identity', () => {
    expect(ENGINE_ID).toBe('DDNE');
    expect(ENGINE_VERSION).toBe('DDNE-REF-1.0');
  });

  it('rejects an unknown schema version', () => {
    const result = farmDocumentSchema.safeParse({ ...makeDocument(), schemaVersion: 999 });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed timestamp', () => {
    const result = farmDocumentSchema.safeParse({
      ...makeDocument(),
      updatedAt: 'yesterday',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a document with an invalid entity', () => {
    const document = makeDocument({
      animals: [{ ...makeAnimal(), weightKg: -5 }],
    });
    expect(farmDocumentSchema.safeParse(document).success).toBe(false);
  });

  it('accepts a complete document with every collection', () => {
    const document = makeDocument({
      animals: [makeAnimal()],
      weights: [makeWeight()],
      recommendations: [makeRecommendation()],
      feedLots: [makeFeedLot()],
    });
    expect(farmDocumentSchema.safeParse(document).success).toBe(true);
  });
});

describe('nutritionRecSchema refinements', () => {
  it('requires missing inputs when no ration is emitted', () => {
    const rec = makeRecommendation({ ration: null, missingInputs: [] });
    expect(nutritionRecSchema.safeParse(rec).success).toBe(false);
  });

  it('forbids missing inputs when a ration is emitted', () => {
    const rec = makeRecommendation({
      missingInputs: [{ key: 'domain.missing.weight' }],
    });
    expect(nutritionRecSchema.safeParse(rec).success).toBe(false);
  });

  it('requires approval and stock deduction for a served recommendation', () => {
    const unapproved = makeRecommendation({
      servedAt: '2026-08-28T10:00:00.000Z',
      stocksDeducted: true,
    });
    expect(nutritionRecSchema.safeParse(unapproved).success).toBe(false);

    const notDeducted = makeRecommendation({
      approvedBy: {
        id: 'op-1',
        name: 'Operator',
        authority: 'production',
        at: '2026-08-28T10:00:00.000Z',
      },
      servedAt: '2026-08-28T10:00:00.000Z',
      stocksDeducted: false,
    });
    expect(nutritionRecSchema.safeParse(notDeducted).success).toBe(false);
  });

  it('accepts a served, approved and deducted recommendation', () => {
    const rec = makeRecommendation({
      approvedBy: {
        id: 'op-1',
        name: 'Operator',
        authority: 'production',
        at: '2026-08-28T10:00:00.000Z',
      },
      servedAt: '2026-08-28T10:00:00.000Z',
      servedBy: { id: 'op-1', name: 'Operator' },
      stocksDeducted: true,
    });
    expect(nutritionRecSchema.safeParse(rec).success).toBe(true);
  });
});
