import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { NOW } from '@/test/factories';

import { MigrationError, migrateDocument } from './migrations';
import { CURRENT_SCHEMA_VERSION, farmDocumentSchema } from './types';

const FIXTURES = path.resolve('src/data/fixtures/migrations');

function fixture(name: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8')) as Record<
    string,
    unknown
  >;
}

function expectMigrationError(run: () => unknown, code: MigrationError['code']) {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(MigrationError);
    expect((error as MigrationError).code).toBe(code);
    return;
  }
  throw new Error('expected a MigrationError');
}

describe('migration chain', () => {
  it('imports the reference legacy v0 state through m001…m005', () => {
    const result = migrateDocument(fixture('v0-legacy'), NOW);
    expect(result.applied).toEqual([
      'm001_import_v1',
      'm002_operator',
      'm003_audit',
      'm004_message_keys',
      'm005_engine_version',
    ]);
    expect(result.document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(farmDocumentSchema.safeParse(result.document).success).toBe(true);
    expect(result.document.farmId).toBe('farm-legacy');
    expect(result.document.settings.pens).toEqual(['P1', 'P2']);
    expect(result.document.operator.authority).toBe('production');
    expect(result.document.animals).toHaveLength(2);
    expect(result.document.animals[0]!.code).toBe('OV-2401');
    expect(result.document.animals[1]!.weightKg).toBeNull();
    expect(result.document.weights).toHaveLength(1);
    expect(result.document.healthEvents).toHaveLength(1);
    expect(result.document.feedLots).toHaveLength(1);
    expect(result.document.signoffs).toHaveLength(1);
    expect(result.document.auditEvents).toHaveLength(1);
    expect(result.document.auditEvents[0]!.summary.key).toBe('domain.note.legacy');
  });

  it('converts legacy recommendation text into descriptors', () => {
    const { document } = migrateDocument(fixture('v0-legacy'), NOW);
    const emitted = document.recommendations.find((rec) => rec.id === 'rec-1')!;
    expect(emitted.notes.map((entry) => entry.key)).toContain('domain.note.lowBcs');
    expect(emitted.evidence[0]!.key).toBe('domain.note.legacy');
    expect(emitted.approvedBy).toMatchObject({
      id: 'legacy',
      name: 'Chef de production',
      authority: 'production',
    });

    const refused = document.recommendations.find((rec) => rec.id === 'rec-2')!;
    expect(refused.ration).toBeNull();
    expect(refused.missingInputs.map((entry) => entry.key)).toEqual(['domain.missing.weight']);
    expect(refused.confidence).toBe('insuffisante');
  });

  it('upgrades a v1 document with m002…m005', () => {
    const result = migrateDocument(fixture('v1'), NOW);
    expect(result.applied).toEqual([
      'm002_operator',
      'm003_audit',
      'm004_message_keys',
      'm005_engine_version',
    ]);
    expect(result.document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.document.operator.authority).toBe('field');
    expect(result.document.settings.farmName).toBe('Farm');
  });

  it('upgrades v2, v3 and v4 documents with only the remaining steps', () => {
    expect(migrateDocument(fixture('v2'), NOW).applied).toEqual([
      'm003_audit',
      'm004_message_keys',
      'm005_engine_version',
    ]);
    expect(migrateDocument(fixture('v3'), NOW).applied).toEqual([
      'm004_message_keys',
      'm005_engine_version',
    ]);
    const v4 = migrateDocument(fixture('v4'), NOW);
    expect(v4.applied).toEqual(['m005_engine_version']);
    expect(v4.document.recommendations[0]!.approvedBy).toMatchObject({
      name: 'Chef de production',
      authority: 'production',
    });
  });

  it('is idempotent: a migrated document needs no further work', () => {
    const first = migrateDocument(fixture('v0-legacy'), NOW);
    const second = migrateDocument(first.document, NOW);
    expect(second.applied).toEqual([]);
    expect(second.warnings).toEqual([]);
    expect(second.document).toEqual(first.document);
  });

  it('imports a v1 backup envelope by unwrapping its state', () => {
    const result = migrateDocument(fixture('backup-v1'), NOW);
    expect(result.applied[0]).toBe('m001_import_v1');
    expect(result.document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.document.animals).toHaveLength(2);
  });
});

describe('migration guards', () => {
  it('rejects a schema newer than this build', () => {
    expectMigrationError(
      () => migrateDocument({ ...fixture('v4'), schemaVersion: CURRENT_SCHEMA_VERSION + 1 }, NOW),
      'newer-schema',
    );
  });

  it('rejects a backup envelope newer than v2', () => {
    expectMigrationError(
      () => migrateDocument({ format: 'ovitech-backup', version: 3, state: {} }, NOW),
      'newer-schema',
    );
  });

  it('rejects an unknown schema version', () => {
    expectMigrationError(
      () => migrateDocument({ schemaVersion: 0, animals: [] }, NOW),
      'malformed',
    );
  });

  it('rejects a structurally invalid current document', () => {
    expectMigrationError(
      () => migrateDocument({ schemaVersion: CURRENT_SCHEMA_VERSION, farmId: '' }, NOW),
      'invalid',
    );
  });
});

describe('recovery warnings', () => {
  const base = {
    schemaVersion: 4,
    farmId: 'farm-1',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    settings: {
      farmName: 'Farm',
      region: '',
      flockLabel: '',
      locale: 'ar',
      demoMode: false,
      scanStaleDays: 3,
      engineId: 'DDNE',
      engineVersion: 'DDNE-REF-1.0',
      pens: ['P1'],
    },
    operator: {
      id: 'op-1',
      displayName: 'Operator',
      authority: 'production',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    },
    animals: [],
    weights: [],
    healthEvents: [],
    feedLots: [],
    auditEvents: [],
    signoffs: [],
  };

  it('flags a legacy ration served without approval and invents a recovery audit', () => {
    const result = migrateDocument(
      {
        ...base,
        recommendations: [
          {
            id: 'rec-served',
            animalId: 'an-1',
            engineId: 'DDNE',
            engineVersion: 'DDNE-REF-0.9',
            createdAt: NOW.toISOString(),
            inputsHash: 'hash',
            ration: {
              forageKg: 1,
              concentrateKg: 0.5,
              mineralG: 10,
              waterL: 4,
              cpPercent: 14,
              meMj: 16,
              dmiKg: 1.5,
            },
            notes: [],
            confidence: 'haute',
            missingInputs: [],
            evidence: [],
            servedAt: NOW.toISOString(),
            servedBy: null,
            approvedBy: null,
          },
        ],
      },
      NOW,
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.document.auditEvents[0]!.summary.key).toBe('domain.audit.schemaRecovered');
    expect(result.document.recommendations[0]!.approvedBy).not.toBeNull();
    expect(result.document.recommendations[0]!.stocksDeducted).toBe(true);
  });

  it('clears missing inputs when a ration exists and flags the conflict', () => {
    const result = migrateDocument(
      {
        ...base,
        recommendations: [
          {
            id: 'rec-conflict',
            animalId: 'an-1',
            engineId: 'DDNE',
            engineVersion: 'DDNE-REF-0.9',
            createdAt: NOW.toISOString(),
            inputsHash: 'hash',
            ration: {
              forageKg: 1,
              concentrateKg: 0,
              mineralG: 10,
              waterL: 4,
              cpPercent: 12,
              meMj: 8,
              dmiKg: 1,
            },
            notes: [],
            confidence: 'haute',
            missingInputs: ['poids vif'],
            evidence: [],
            approvedBy: null,
            servedAt: null,
            servedBy: null,
          },
        ],
      },
      NOW,
    );
    expect(result.warnings[0]).toContain('both a ration and missing inputs');
    expect(result.document.recommendations[0]!.missingInputs).toEqual([]);
  });

  it('gives a refusal without missing inputs a recoverable descriptor', () => {
    const result = migrateDocument(
      {
        ...base,
        recommendations: [
          {
            id: 'rec-refused',
            animalId: 'an-1',
            createdAt: NOW.toISOString(),
            ration: null,
            notes: ['Refus moteur'],
            confidence: 'insuffisante',
            missingInputs: [],
            evidence: [],
          },
        ],
      },
      NOW,
    );
    const rec = result.document.recommendations[0]!;
    expect(rec.ration).toBeNull();
    expect(rec.missingInputs.length).toBeGreaterThan(0);
    expect(farmDocumentSchema.safeParse(result.document).success).toBe(true);
  });
});
