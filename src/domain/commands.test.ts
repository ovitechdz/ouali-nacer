import { describe, expect, it } from 'vitest';

import {
  NOW,
  defaultOperator,
  makeAnimal,
  makeApproved,
  makeContext,
  makeDocument,
  makeFeedLot,
  makeRecommendation,
} from '@/test/factories';

import {
  adjustFeedStock,
  approveRecommendation,
  changeOperator,
  logScanFailure,
  moveAnimal,
  recordHealthEvent,
  recordScan,
  recordWeight,
  registerAnimal,
  runEngine,
  saveFeedLot,
  servePen,
  serveRecommendation,
  signProtocol,
} from './commands';
import type { FeedLot } from './types';

const ANIMAL_INPUT = {
  rfid: 'rfid-100',
  code: 'ov-100',
  sex: 'M' as const,
  breed: 'Ouled Djellal',
  birthDate: '2026-03-01',
  stage: 'engraissement' as const,
  pen: 'P1',
  weight: '45',
  bcs: '3',
};

const fieldOperator = { ...defaultOperator, authority: 'field' as const };

function withFeeds(stockKg = 100): FeedLot[] {
  return [
    makeFeedLot({ id: 'forage', kind: 'fourrage', stockKg, costPerKg: 3 }),
    makeFeedLot({ id: 'concentrate', kind: 'concentre', stockKg, costPerKg: 5 }),
  ];
}

describe('registerAnimal', () => {
  it('normalises identity, records the first weight and audits the action', () => {
    const document = makeDocument();
    const result = registerAnimal(document, ANIMAL_INPUT, 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.result.code).toBe('OV-100');
    expect(result.result.rfid).toBe('RFID-100');
    expect(result.result.status).toBe('actif');
    expect(result.document.animals).toHaveLength(1);
    expect(result.document.weights).toHaveLength(1);
    expect(result.document.auditEvents).toHaveLength(1);
    expect(result.document.auditEvents[0]!.type).toBe('identite');
    expect(result.document.updatedAt).toBe(NOW.toISOString());
  });

  it('registers an animal without a weight and without a weight record', () => {
    const result = registerAnimal(
      makeDocument(),
      { ...ANIMAL_INPUT, weight: '', bcs: '' },
      'op-1',
      makeContext(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.weightKg).toBeNull();
    expect(result.document.weights).toHaveLength(0);
  });

  it('adds a new pen to the settings', () => {
    const result = registerAnimal(
      makeDocument(),
      { ...ANIMAL_INPUT, pen: 'P9' },
      'op-1',
      makeContext(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.settings.pens).toContain('P9');
  });

  it('rejects an invalid payload, a future birth date and duplicates', () => {
    const document = makeDocument({ animals: [makeAnimal({ code: 'OV-100', rfid: 'RFID-100' })] });
    expect(registerAnimal(document, { ...ANIMAL_INPUT, code: '' }, 'op-1', makeContext()).ok).toBe(
      false,
    );
    expect(
      registerAnimal(
        makeDocument(),
        { ...ANIMAL_INPUT, birthDate: '2030-01-01' },
        'op-1',
        makeContext(),
      ),
    ).toEqual({
      ok: false,
      error: { key: 'domain.error.futureDate', params: { field: 'birthDate' } },
    });
    expect(registerAnimal(document, ANIMAL_INPUT, 'op-1', makeContext())).toEqual({
      ok: false,
      error: { key: 'domain.error.duplicateCode', params: { code: 'OV-100' } },
    });
    expect(
      registerAnimal(
        makeDocument({ animals: [makeAnimal({ code: 'OV-200', rfid: 'RFID-100' })] }),
        ANIMAL_INPUT,
        'op-1',
        makeContext(),
      ),
    ).toEqual({
      ok: false,
      error: { key: 'domain.error.duplicateRfid', params: { rfid: 'RFID-100' } },
    });
  });

  it('allows several animals without an RFID tag', () => {
    const document = makeDocument({ animals: [makeAnimal({ rfid: '' })] });
    const result = registerAnimal(document, { ...ANIMAL_INPUT, rfid: '' }, 'op-1', makeContext());
    expect(result.ok).toBe(true);
  });
});

describe('recordWeight', () => {
  it('appends the weight, updates the animal and audits it', () => {
    const document = makeDocument({ animals: [makeAnimal({ weightKg: 40, adgKg: null })] });
    const result = recordWeight(
      document,
      { animalId: 'an-1', weight: '47', bcs: '3.5' },
      'op-1',
      makeContext(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.kg).toBe(47);
    expect(result.document.weights).toHaveLength(1);
    expect(result.document.animals[0]!.weightKg).toBe(47);
    expect(result.document.animals[0]!.bcs).toBe(3.5);
    expect(result.document.auditEvents[0]!.type).toBe('saisie');
  });

  it('rejects a missing weight, a bad value and an unknown animal', () => {
    const document = makeDocument({ animals: [makeAnimal()] });
    expect(
      recordWeight(document, { animalId: 'an-1', weight: '', bcs: '' }, 'op-1', makeContext()).ok,
    ).toBe(false);
    expect(
      recordWeight(document, { animalId: 'an-1', weight: '0', bcs: '' }, 'op-1', makeContext()).ok,
    ).toBe(false);
    expect(
      recordWeight(document, { animalId: 'missing', weight: '45', bcs: '' }, 'op-1', makeContext()),
    ).toEqual({ ok: false, error: { key: 'domain.error.notFound', params: { entity: 'animal' } } });
  });
});

describe('moveAnimal', () => {
  it('moves an animal and extends the pens list', () => {
    const document = makeDocument({ animals: [makeAnimal({ pen: 'P1' })] });
    const result = moveAnimal(document, 'an-1', 'P5', 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.pen).toBe('P5');
    expect(result.document.settings.pens).toContain('P5');
    expect(result.document.auditEvents[0]!.type).toBe('transfert');
  });

  it('is a no-op when the pen is unchanged', () => {
    const document = makeDocument({ animals: [makeAnimal({ pen: 'P1' })] });
    const result = moveAnimal(document, 'an-1', 'P1', 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document).toBe(document);
  });

  it('rejects an unknown animal and an empty pen', () => {
    const document = makeDocument({ animals: [makeAnimal()] });
    expect(moveAnimal(document, 'missing', 'P2', 'op-1', makeContext()).ok).toBe(false);
    expect(moveAnimal(document, 'an-1', '  ', 'op-1', makeContext()).ok).toBe(false);
  });
});

describe('runEngine', () => {
  it('emits a recommendation with the frozen engine identity', () => {
    const document = makeDocument({ animals: [makeAnimal()], feedLots: withFeeds() });
    const result = runEngine(document, 'an-1', 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.ration).not.toBeNull();
    expect(result.result.engineId).toBe('DDNE');
    expect(result.result.engineVersion).toBe('DDNE-REF-1.0');
    expect(result.result.approvedBy).toBeNull();
    expect(result.document.auditEvents[0]!.type).toBe('recommandation');
  });

  it('records a refusal when inputs are missing', () => {
    const document = makeDocument({
      animals: [makeAnimal({ weightKg: null })],
      feedLots: withFeeds(),
    });
    const result = runEngine(document, 'an-1', 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.ration).toBeNull();
    expect(result.result.confidence).toBe('insuffisante');
    expect(result.document.auditEvents[0]!.type).toBe('erreur');
  });

  it('rejects an unknown animal', () => {
    expect(runEngine(makeDocument(), 'missing', 'op-1', makeContext())).toEqual({
      ok: false,
      error: { key: 'domain.error.notFound', params: { entity: 'animal' } },
    });
  });
});

describe('approveRecommendation', () => {
  it('approves with production authority', () => {
    const document = makeDocument({
      animals: [makeAnimal()],
      recommendations: [makeRecommendation()],
    });
    const result = approveRecommendation(document, 'rec-1', defaultOperator, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.approvedBy).toMatchObject({
      id: 'op-1',
      name: 'Operator',
      authority: 'production',
    });
    expect(result.document.auditEvents[0]!.type).toBe('approbation');
  });

  it('enforces production authority', () => {
    const document = makeDocument({ recommendations: [makeRecommendation()] });
    expect(approveRecommendation(document, 'rec-1', fieldOperator, makeContext())).toEqual({
      ok: false,
      error: { key: 'domain.ration.requiresProduction' },
    });
  });

  it('rejects a refused, unknown or already approved recommendation', () => {
    const refused = makeDocument({
      recommendations: [makeRecommendation({ ration: null })],
    });
    expect(approveRecommendation(refused, 'rec-1', defaultOperator, makeContext()).ok).toBe(false);
    expect(
      approveRecommendation(makeDocument(), 'missing', defaultOperator, makeContext()).ok,
    ).toBe(false);
    expect(
      approveRecommendation(
        makeDocument({ recommendations: [makeApproved()] }),
        'rec-1',
        defaultOperator,
        makeContext(),
      ).ok,
    ).toBe(false);
  });
});

describe('serveRecommendation', () => {
  function approvedDocument() {
    return makeDocument({
      animals: [makeAnimal()],
      feedLots: withFeeds(),
      recommendations: [makeApproved()],
    });
  }

  it('deducts the feed and marks the ration served', () => {
    const result = serveRecommendation(approvedDocument(), 'rec-1', defaultOperator, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toEqual({ served: true, alreadyServed: false });
    const rec = result.document.recommendations[0]!;
    expect(rec.servedAt).toBe(NOW.toISOString());
    expect(rec.stocksDeducted).toBe(true);
    expect(rec.servedBy).toMatchObject({ id: 'op-1' });
    expect(result.document.feedLots[0]!.stockKg).toBeLessThan(100);
    expect(result.document.feedLots[0]!.stockKg).toBeGreaterThanOrEqual(0);
    expect(result.document.auditEvents[0]!.type).toBe('distribution');
  });

  it('is idempotent and never deducts twice', () => {
    const first = serveRecommendation(approvedDocument(), 'rec-1', defaultOperator, makeContext());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = serveRecommendation(first.document, 'rec-1', defaultOperator, makeContext());
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.result).toEqual({ served: false, alreadyServed: true });
    expect(second.document).toBe(first.document);
    expect(second.document.feedLots).toEqual(first.document.feedLots);
  });

  it('requires approval and refuses a refused ration', () => {
    const unapproved = makeDocument({
      animals: [makeAnimal()],
      feedLots: withFeeds(),
      recommendations: [makeRecommendation()],
    });
    expect(serveRecommendation(unapproved, 'rec-1', defaultOperator, makeContext())).toEqual({
      ok: false,
      error: { key: 'domain.ration.approvalRequired' },
    });

    const refused = makeDocument({
      recommendations: [makeApproved({ ration: null })],
    });
    expect(serveRecommendation(refused, 'rec-1', defaultOperator, makeContext())).toEqual({
      ok: false,
      error: { key: 'domain.ration.refused' },
    });
  });

  it('blocks a ration the stock cannot cover and never goes negative', () => {
    const document = makeDocument({
      animals: [makeAnimal()],
      feedLots: [makeFeedLot({ id: 'forage', kind: 'fourrage', stockKg: 0.1 })],
      recommendations: [makeApproved()],
    });
    const result = serveRecommendation(document, 'rec-1', defaultOperator, makeContext());
    expect(result).toEqual({ ok: false, error: { key: 'domain.error.insufficientStock' } });
  });
});

describe('servePen', () => {
  it('serves every approved animal in the pen and skips the rest', () => {
    const document = makeDocument({
      animals: [
        makeAnimal({ id: 'a1', pen: 'P1' }),
        makeAnimal({ id: 'a2', pen: 'P1' }),
        makeAnimal({ id: 'a3', pen: 'P2' }),
      ],
      feedLots: withFeeds(100),
      recommendations: [
        makeApproved({ id: 'r1', animalId: 'a1' }),
        makeRecommendation({ id: 'r2', animalId: 'a2' }),
        makeApproved({ id: 'r3', animalId: 'a3' }),
      ],
    });
    const result = servePen(document, 'P1', defaultOperator, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.served).toEqual(['r1']);
    expect(result.result.skipped).toBe(1);
    expect(result.document.auditEvents).toHaveLength(1);
  });

  it('returns an empty outcome for an empty pen', () => {
    const document = makeDocument();
    const result = servePen(document, 'P9', defaultOperator, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toEqual({ served: [], skipped: 0 });
    expect(result.document).toBe(document);
  });

  it('skips everything when stock runs out', () => {
    const document = makeDocument({
      animals: [makeAnimal({ id: 'a1', pen: 'P1' })],
      feedLots: [makeFeedLot({ id: 'forage', kind: 'fourrage', stockKg: 0.1 })],
      recommendations: [makeApproved({ id: 'r1', animalId: 'a1' })],
    });
    const result = servePen(document, 'P1', defaultOperator, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toEqual({ served: [], skipped: 1 });
  });
});

describe('feed commands', () => {
  it('adjusts stock and rounds to one decimal', () => {
    const document = makeDocument({ feedLots: withFeeds(10) });
    const result = adjustFeedStock(document, 'forage', -2.55, 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.stockKg).toBe(7.5);
  });

  it('rejects an unknown lot, a non-finite delta and an impossible deduction', () => {
    const document = makeDocument({ feedLots: withFeeds(10) });
    expect(adjustFeedStock(document, 'missing', 1, 'op-1', makeContext()).ok).toBe(false);
    expect(adjustFeedStock(document, 'forage', Number.NaN, 'op-1', makeContext()).ok).toBe(false);
    expect(adjustFeedStock(document, 'forage', -11, 'op-1', makeContext())).toEqual({
      ok: false,
      error: { key: 'domain.error.insufficientStock', params: { lot: 'Forage' } },
    });
  });

  it('creates and updates a feed lot without duplicating it', () => {
    const created = saveFeedLot(
      makeDocument(),
      { name: 'Hay', kind: 'fourrage', stockKg: 50, costPerKg: 2, available: true },
      'op-1',
      makeContext(),
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.document.feedLots).toHaveLength(1);

    const updated = saveFeedLot(
      created.document,
      {
        id: created.result.id,
        name: 'Hay',
        kind: 'fourrage',
        stockKg: 40,
        costPerKg: 2,
        available: true,
        origin: 'local',
      },
      'op-1',
      makeContext(),
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.document.feedLots).toHaveLength(1);
    expect(updated.document.feedLots[0]!.stockKg).toBe(40);
    expect(updated.document.feedLots[0]!.origin).toBe('local');
  });

  it('rejects an invalid feed lot', () => {
    expect(
      saveFeedLot(
        makeDocument(),
        { name: '', kind: 'fourrage', stockKg: 10, costPerKg: 2, available: true },
        'op-1',
        makeContext(),
      ).ok,
    ).toBe(false);
  });
});

describe('health, operator and protocol commands', () => {
  it('records a health event for a known animal', () => {
    const document = makeDocument({ animals: [makeAnimal()] });
    const result = recordHealthEvent(
      document,
      { animalId: 'an-1', type: 'vaccination', note: 'Annual' },
      'op-1',
      makeContext(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.severity).toBe('info');
    expect(result.document.healthEvents).toHaveLength(1);
    expect(result.document.auditEvents[0]!.summary.key).toBe('domain.audit.healthRecorded');
  });

  it('rejects an invalid or orphan health event', () => {
    const document = makeDocument({ animals: [makeAnimal()] });
    expect(
      recordHealthEvent(
        document,
        { animalId: 'an-1', type: 'operation' as never },
        'op-1',
        makeContext(),
      ).ok,
    ).toBe(false);
    expect(
      recordHealthEvent(
        document,
        { animalId: 'missing', type: 'observation' },
        'op-1',
        makeContext(),
      ).ok,
    ).toBe(false);
  });

  it('changes the operator, audits it and ignores a no-op', () => {
    const document = makeDocument();
    const same = changeOperator(document, { displayName: 'Operator' }, 'op-1', makeContext());
    expect(same.ok).toBe(true);
    if (!same.ok) return;
    expect(same.document).toBe(document);

    const changed = changeOperator(
      document,
      { displayName: 'Nacer', authority: 'field' },
      'op-1',
      makeContext(),
    );
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    expect(changed.result).toMatchObject({ displayName: 'Nacer', authority: 'field' });
    expect(changed.document.auditEvents[0]!.summary.key).toBe('domain.audit.operatorChanged');
  });

  it('rejects an empty operator name', () => {
    expect(changeOperator(makeDocument(), { displayName: '   ' }, 'op-1', makeContext()).ok).toBe(
      false,
    );
  });

  it('signs the verification protocol', () => {
    const result = signProtocol(
      makeDocument(),
      {
        name: 'Dr. Expert',
        specialty: 'nutrition',
        protocol: 'verification',
        passed: 8,
        total: 8,
        caseIds: ['TC-01', 'TC-02'],
      },
      'op-1',
      makeContext(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.engineVersion).toBe('DDNE-REF-1.0');
    expect(result.document.signoffs).toHaveLength(1);
  });

  it('rejects an impossible signoff', () => {
    const input = {
      name: 'Dr. Expert',
      specialty: 'nutrition' as const,
      protocol: 'verification',
      passed: 9,
      total: 8,
      caseIds: [],
    };
    expect(signProtocol(makeDocument(), input, 'op-1', makeContext()).ok).toBe(false);
    expect(signProtocol(makeDocument(), { ...input, name: '' }, 'op-1', makeContext()).ok).toBe(
      false,
    );
  });

  it('records a confirmed or failed scan', () => {
    const document = makeDocument({ animals: [makeAnimal({ lastScanAt: null })] });
    const scanned = recordScan(document, 'an-1', 'op-1', makeContext());
    expect(scanned.ok).toBe(true);
    if (!scanned.ok) return;
    expect(scanned.result.lastScanAt).toBe(NOW.toISOString());
    expect(scanned.document.auditEvents[0]!.type).toBe('scan');
    expect(recordScan(document, 'missing', 'op-1', makeContext()).ok).toBe(false);

    const failed = logScanFailure(document, 'UNKNOWN', 'op-1', makeContext());
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.result.severity).toBe('warn');
    expect(failed.document.auditEvents[0]!.summary.key).toBe('domain.audit.scanFailed');
  });
});

describe('audit trail', () => {
  it('appends one event per successful command and never mutates the source', () => {
    const original = makeDocument({ animals: [makeAnimal()], feedLots: withFeeds() });
    const snapshot = JSON.stringify(original);
    const registered = registerAnimal(original, ANIMAL_INPUT, 'op-1', makeContext());
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;
    expect(original.auditEvents).toHaveLength(0);
    expect(registered.document.auditEvents).toHaveLength(1);
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it('does not write anything when a command fails', () => {
    const document = makeDocument();
    const result = moveAnimal(document, 'missing', 'P2', 'op-1', makeContext());
    expect(result.ok).toBe(false);
    expect(document.auditEvents).toHaveLength(0);
  });
});
