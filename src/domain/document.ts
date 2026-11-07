import type { MessageDescriptor } from './messages';
import {
  CURRENT_SCHEMA_VERSION,
  ENGINE_ID,
  ENGINE_VERSION,
  type FarmDocument,
  type FarmSettings,
  type OperatorProfile,
} from './types';

export interface NewDocumentInput {
  farmId: string;
  createdAt: string;
  settings: FarmSettings;
  operator: OperatorProfile;
}

/** Empty, valid farm document. The caller supplies every human-readable value. */
export function createEmptyDocument(input: NewDocumentInput): FarmDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    farmId: input.farmId,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    settings: { ...input.settings, pens: [...input.settings.pens] },
    operator: { ...input.operator },
    animals: [],
    weights: [],
    healthEvents: [],
    recommendations: [],
    feedLots: [],
    auditEvents: [],
    signoffs: [],
  };
}

export function defaultEngineSettings(
  base: Omit<FarmSettings, 'engineId' | 'engineVersion'>,
): FarmSettings {
  return { ...base, engineId: ENGINE_ID, engineVersion: ENGINE_VERSION };
}

export function touchDocument(document: FarmDocument, at: string): FarmDocument {
  return { ...document, updatedAt: at };
}

export interface DocumentInvariantIssue {
  code: string;
  key: MessageDescriptor['key'];
  entityId: string | null;
}

/**
 * Cross-record invariants that Zod cannot express (uniqueness, referential
 * integrity, lifecycle consistency). The repository and import boundary call
 * this before accepting a document.
 */
export function validateDocumentInvariants(
  document: FarmDocument,
  now?: Date,
): DocumentInvariantIssue[] {
  const issues: DocumentInvariantIssue[] = [];
  const animalIds = new Set(document.animals.map((animal) => animal.id));

  const codes = new Map<string, string>();
  const rfids = new Map<string, string>();
  for (const animal of document.animals) {
    const code = animal.code.trim().toUpperCase();
    const rfid = animal.rfid.trim().toUpperCase();
    if (codes.has(code)) {
      issues.push({
        code: 'duplicate-code',
        key: 'domain.invariant.duplicateCode',
        entityId: animal.id,
      });
    } else {
      codes.set(code, animal.id);
    }
    if (rfid !== '') {
      if (rfids.has(rfid)) {
        issues.push({
          code: 'duplicate-rfid',
          key: 'domain.invariant.duplicateRfid',
          entityId: animal.id,
        });
      } else {
        rfids.set(rfid, animal.id);
      }
    }
    if (now && Number.isFinite(new Date(animal.birthDate).getTime())) {
      if (new Date(`${animal.birthDate}T00:00:00.000Z`).getTime() > now.getTime()) {
        issues.push({
          code: 'future-birth-date',
          key: 'domain.invariant.futureBirthDate',
          entityId: animal.id,
        });
      }
    }
  }

  for (const record of document.weights) {
    if (!animalIds.has(record.animalId)) {
      issues.push({
        code: 'orphan-weight',
        key: 'domain.invariant.orphanRecord',
        entityId: record.id,
      });
    }
  }
  for (const event of document.healthEvents) {
    if (!animalIds.has(event.animalId)) {
      issues.push({
        code: 'orphan-health',
        key: 'domain.invariant.orphanRecord',
        entityId: event.id,
      });
    }
  }
  for (const rec of document.recommendations) {
    if (!animalIds.has(rec.animalId)) {
      issues.push({
        code: 'orphan-recommendation',
        key: 'domain.invariant.orphanRecord',
        entityId: rec.id,
      });
    }
    if (rec.servedAt !== null && (rec.approvedBy === null || !rec.stocksDeducted)) {
      issues.push({
        code: 'served-without-approval',
        key: 'domain.invariant.servedWithoutApproval',
        entityId: rec.id,
      });
    }
  }
  for (const lot of document.feedLots) {
    if (lot.stockKg < 0) {
      issues.push({
        code: 'negative-stock',
        key: 'domain.invariant.negativeStock',
        entityId: lot.id,
      });
    }
  }

  return issues;
}
