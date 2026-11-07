import { describe, expect, it } from 'vitest';

import {
  NOW,
  defaultOperator,
  defaultSettings,
  makeAnimal,
  makeDocument,
  makeFeedLot,
  makeRecommendation,
  makeWeight,
} from '@/test/factories';

import {
  createEmptyDocument,
  defaultEngineSettings,
  touchDocument,
  validateDocumentInvariants,
} from './document';

describe('createEmptyDocument', () => {
  it('creates a versioned empty document from explicit values', () => {
    const document = createEmptyDocument({
      farmId: 'farm-1',
      createdAt: NOW.toISOString(),
      settings: defaultSettings,
      operator: defaultOperator,
    });
    expect(document.schemaVersion).toBe(5);
    expect(document.farmId).toBe('farm-1');
    expect(document.updatedAt).toBe(NOW.toISOString());
    expect(document.animals).toEqual([]);
    expect(document.auditEvents).toEqual([]);
  });

  it('copies mutable settings arrays', () => {
    const pens = ['P1'];
    const document = createEmptyDocument({
      farmId: 'farm-1',
      createdAt: NOW.toISOString(),
      settings: { ...defaultSettings, pens },
      operator: defaultOperator,
    });
    pens.push('P2');
    expect(document.settings.pens).toEqual(['P1']);
  });

  it('stamps the frozen engine identity', () => {
    const settings = defaultEngineSettings({
      farmName: 'Farm',
      region: '',
      flockLabel: '',
      locale: 'ar',
      demoMode: false,
      scanStaleDays: 3,
      pens: [],
    });
    expect(settings.engineId).toBe('DDNE');
    expect(settings.engineVersion).toBe('DDNE-REF-1.0');
  });

  it('touches only the updated timestamp', () => {
    const document = makeDocument();
    const next = touchDocument(document, '2026-09-01T00:00:00.000Z');
    expect(next.updatedAt).toBe('2026-09-01T00:00:00.000Z');
    expect(next.createdAt).toBe(document.createdAt);
    expect(next).not.toBe(document);
  });
});

describe('validateDocumentInvariants', () => {
  it('accepts a clean document', () => {
    const document = makeDocument({
      animals: [makeAnimal()],
      weights: [makeWeight()],
      recommendations: [makeRecommendation()],
      feedLots: [makeFeedLot()],
    });
    expect(validateDocumentInvariants(document, NOW)).toEqual([]);
  });

  it('detects duplicate codes and RFID tags case-insensitively', () => {
    const document = makeDocument({
      animals: [
        makeAnimal({ id: 'a', code: 'OV-1', rfid: 'RFID-1' }),
        makeAnimal({ id: 'b', code: 'ov-1', rfid: 'rfid-1' }),
      ],
    });
    const codes = validateDocumentInvariants(document).filter(
      (issue) => issue.code === 'duplicate-code',
    );
    const rfids = validateDocumentInvariants(document).filter(
      (issue) => issue.code === 'duplicate-rfid',
    );
    expect(codes).toHaveLength(1);
    expect(codes[0]!.key).toBe('domain.invariant.duplicateCode');
    expect(rfids).toHaveLength(1);
    expect(rfids[0]!.key).toBe('domain.invariant.duplicateRfid');
  });

  it('allows several animals without an RFID tag', () => {
    const document = makeDocument({
      animals: [
        makeAnimal({ id: 'a', code: 'OV-1', rfid: '' }),
        makeAnimal({ id: 'b', code: 'OV-2', rfid: '' }),
      ],
    });
    expect(validateDocumentInvariants(document)).toEqual([]);
  });

  it('detects orphan records', () => {
    const document = makeDocument({
      weights: [makeWeight({ animalId: 'missing' })],
      recommendations: [makeRecommendation({ animalId: 'missing' })],
    });
    const issues = validateDocumentInvariants(document);
    expect(issues.filter((issue) => issue.code === 'orphan-weight')).toHaveLength(1);
    expect(issues.filter((issue) => issue.code === 'orphan-recommendation')).toHaveLength(1);
    expect(issues[0]!.key).toBe('domain.invariant.orphanRecord');
  });

  it('detects a served recommendation without approval', () => {
    const document = makeDocument({
      animals: [makeAnimal()],
      recommendations: [
        makeRecommendation({
          servedAt: NOW.toISOString(),
          stocksDeducted: false,
        }),
      ],
    });
    const issue = validateDocumentInvariants(document).find(
      (entry) => entry.code === 'served-without-approval',
    );
    expect(issue?.key).toBe('domain.invariant.servedWithoutApproval');
  });

  it('detects negative stock and future birth dates', () => {
    const document = makeDocument({
      animals: [makeAnimal({ birthDate: '2027-01-01' })],
      feedLots: [makeFeedLot({ stockKg: -1 })],
    });
    const issues = validateDocumentInvariants(document, NOW);
    expect(issues.map((issue) => issue.key)).toEqual(
      expect.arrayContaining([
        'domain.invariant.negativeStock',
        'domain.invariant.futureBirthDate',
      ]),
    );
  });
});
