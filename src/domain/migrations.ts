import type { MessageDescriptor } from './messages';
import {
  CURRENT_SCHEMA_VERSION,
  ENGINE_ID,
  ENGINE_VERSION,
  STAGES,
  farmDocumentSchema,
  type AuditEvent,
  type FarmDocument,
  type Ration,
} from './types';
import { stableHash } from './numeric';

export class MigrationError extends Error {
  readonly code: 'newer-schema' | 'malformed' | 'invalid';
  readonly key: MessageDescriptor['key'];

  constructor(code: MigrationError['code'], key: MessageDescriptor['key'], detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'MigrationError';
    this.code = code;
    this.key = key;
  }
}

export interface MigrationResult {
  document: FarmDocument;
  applied: string[];
  warnings: string[];
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function timestamp(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(value).toISOString() : fallback;
}

function nullableNumber(value: unknown, min = 0, max = Number.POSITIVE_INFINITY): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function nullableTimestamp(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(value).toISOString() : null;
}

function descriptor(
  key: MessageDescriptor['key'],
  params?: MessageDescriptor['params'],
): MessageDescriptor {
  return params ? { key, params } : { key };
}

const LEGACY_NOTE_MAP: Array<[RegExp, MessageDescriptor['key']]> = [
  [/nec\s*basse/i, 'domain.note.lowBcs'],
  [/nec\s*(\u00e9lev\u00e9e|elevee|haute)/i, 'domain.note.highBcs'],
  [/concentr/i, 'domain.note.noConcentrate'],
  [/fourrag/i, 'domain.note.noForage'],
  [/ration distribu/i, 'domain.note.humanExecution'],
  [/engraissement/i, 'domain.note.finishing'],
];

function stringToDescriptor(value: unknown): MessageDescriptor | null {
  if (value !== null && typeof value === 'object') {
    const candidate = record(value);
    if (typeof candidate.key === 'string') {
      return candidate.params !== undefined && candidate.params !== null
        ? {
            key: candidate.key as MessageDescriptor['key'],
            params: record(candidate.params) as MessageDescriptor['params'],
          }
        : { key: candidate.key as MessageDescriptor['key'] };
    }
  }
  if (typeof value !== 'string' || value.trim() === '') return null;
  for (const [pattern, key] of LEGACY_NOTE_MAP) {
    if (pattern.test(value)) return descriptor(key);
  }
  return descriptor('domain.note.legacy', { text: value });
}

function missingToDescriptor(value: unknown): MessageDescriptor {
  const raw = typeof value === 'string' ? value.toLowerCase() : '';
  if (raw.includes('poids') || raw.includes('weight')) return descriptor('domain.missing.weight');
  if (raw.includes('nec') || raw.includes('bcs')) return descriptor('domain.missing.bcs');
  if (raw.includes('fourrag') || raw.includes('feed') || raw.includes('lot')) {
    return descriptor('domain.missing.feed');
  }
  return stringToDescriptor(value) ?? descriptor('domain.note.legacy', { text: 'unknown' });
}

function mapAnimal(value: UnknownRecord, farmId: string, at: string): UnknownRecord {
  const birthDate = text(value.birthDate);
  const stage = text(value.stage, 'brebis_entretien');
  return {
    id: text(value.id, `legacy-animal-${stableHash(JSON.stringify(value))}`),
    farmId,
    code: text(value.code, 'OV-0').toUpperCase().slice(0, 32),
    rfid: text(value.rfid).toUpperCase().slice(0, 64),
    sex: value.sex === 'M' ? 'M' : 'F',
    breed: text(value.breed, 'legacy').slice(0, 80),
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : at.slice(0, 10),
    weightKg: nullableNumber(value.weightKg, 0.01, 1000),
    bcs: nullableNumber(value.bcs, 1, 5),
    stage: (STAGES as readonly string[]).includes(stage) ? stage : 'brebis_entretien',
    pen: text(value.pen, 'P1').slice(0, 64),
    status: ['actif', 'vendu', 'mort'].includes(text(value.status)) ? text(value.status) : 'actif',
    lastScanAt: nullableTimestamp(value.lastScanAt),
    adgKg: nullableNumber(value.adgKg),
    expectedLambingAt: nullableTimestamp(value.expectedLambingAt),
    damId: typeof value.damId === 'string' ? value.damId : null,
    sireId: typeof value.sireId === 'string' ? value.sireId : null,
    notes: text(value.notes).slice(0, 500),
    createdAt: at,
    updatedAt: at,
  };
}

function mapRation(value: unknown): Ration | null {
  if (value === null || typeof value !== 'object') return null;
  const source = record(value);
  return {
    forageKg: numberValue(source.forageKg),
    concentrateKg: numberValue(source.concentrateKg),
    mineralG: numberValue(source.mineralG),
    waterL: numberValue(source.waterL),
    cpPercent: numberValue(source.cpPercent),
    meMj: numberValue(source.meMj),
    dmiKg: numberValue(source.dmiKg),
  };
}

function mapRecommendation(value: UnknownRecord, at: string): UnknownRecord {
  const ration = mapRation(value.ration);
  const rawMissing = Array.isArray(value.missingInputs) ? value.missingInputs : [];
  const missingInputs = rawMissing.map(missingToDescriptor);
  if (ration === null && missingInputs.length === 0) {
    missingInputs.push(descriptor('domain.note.legacy', { text: 'unavailable' }));
  }
  const notes = (Array.isArray(value.notes) ? value.notes : [])
    .map(stringToDescriptor)
    .filter((entry): entry is MessageDescriptor => entry !== null);
  const evidence = (Array.isArray(value.evidence) ? value.evidence : [])
    .map(stringToDescriptor)
    .filter((entry): entry is MessageDescriptor => entry !== null);

  return {
    id: text(value.id, `legacy-rec-${stableHash(JSON.stringify(value))}`),
    animalId: text(value.animalId),
    engineId: text(value.engineId, ENGINE_ID),
    engineVersion: text(value.engineVersion, 'DDNE-REF-0.9'),
    createdAt: timestamp(value.createdAt, at),
    inputsHash: text(value.inputsHash),
    ration,
    notes,
    confidence: ['haute', 'moyenne', 'insuffisante'].includes(text(value.confidence))
      ? text(value.confidence)
      : 'insuffisante',
    missingInputs,
    evidence,
    approvedBy: null,
    servedAt: nullableTimestamp(value.servedAt),
    servedBy: null,
    stocksDeducted: false,
    legacyApprovedBy: typeof value.approvedBy === 'string' ? value.approvedBy : null,
    legacyServedBy: typeof value.servedBy === 'string' ? value.servedBy : null,
  };
}

function mapFeed(value: UnknownRecord, at: string): UnknownRecord {
  return {
    id: text(value.id, `legacy-feed-${stableHash(JSON.stringify(value))}`),
    name: text(value.name, 'feed'),
    kind: ['fourrage', 'concentre', 'hybride', 'mineral'].includes(text(value.kind))
      ? text(value.kind)
      : 'fourrage',
    stockKg: Math.max(0, numberValue(value.stockKg)),
    costPerKg: Math.max(0, numberValue(value.costPerKg)),
    available: value.available !== false,
    origin: text(value.origin).slice(0, 120),
    updatedAt: at,
  };
}

function mapEventType(value: unknown): AuditEvent['type'] {
  const candidate = text(value);
  if (
    [
      'scan',
      'saisie',
      'recommandation',
      'approbation',
      'distribution',
      'transfert',
      'identite',
      'erreur',
      'import',
      'export',
      'settings',
      'archivage',
    ].includes(candidate)
  ) {
    return candidate as AuditEvent['type'];
  }
  return 'saisie';
}

function auditEntityType(type: AuditEvent['type']): AuditEvent['entityType'] {
  if (type === 'recommandation' || type === 'approbation' || type === 'distribution') {
    return 'recommendation';
  }
  if (type === 'settings') return 'settings';
  if (type === 'import' || type === 'export' || type === 'archivage') return 'document';
  if (type === 'saisie' || type === 'transfert' || type === 'identite' || type === 'scan') {
    return 'animal';
  }
  return null;
}

/** m001 - import the reference's legacy farm state (backup v1). */
export function m001ImportLegacy(input: unknown, now: Date): UnknownRecord {
  const source = record(input);
  const at = now.toISOString();
  const farmId = text(source.currentFarmId, text(source.farmId, 'farm-local'));
  const createdAt = timestamp(source.lastSyncedAt, at);

  return {
    schemaVersion: 1,
    farmId,
    createdAt,
    updatedAt: createdAt,
    role: text(source.role, 'field'),
    legacyEvents: records(source.events),
    animals: records(source.animals).map((animal) => mapAnimal(animal, farmId, at)),
    weights: records(source.weights)
      .filter((weight) => text(weight.animalId) !== '')
      .map((weight) => ({
        id: text(weight.id, `legacy-weight-${stableHash(JSON.stringify(weight))}`),
        animalId: text(weight.animalId),
        kg: Math.max(0.01, numberValue(weight.kg, 0.01)),
        bcs: nullableNumber(weight.bcs, 1, 5),
        at: timestamp(weight.at, at),
        source: text(weight.source) === 'seed' ? 'seed' : 'field',
        note: '',
        createdAt: timestamp(weight.at, at),
      })),
    healthEvents: records(source.healthEvents)
      .filter((event) => text(event.animalId) !== '')
      .map((event) => ({
        id: text(event.id, `legacy-health-${stableHash(JSON.stringify(event))}`),
        animalId: text(event.animalId),
        type: ['examen', 'traitement', 'vaccination', 'naissance', 'observation'].includes(
          text(event.type),
        )
          ? text(event.type)
          : 'observation',
        at: timestamp(event.at, at),
        by: text(event.by, 'legacy'),
        note: text(event.note).slice(0, 500),
        severity: 'info',
        createdAt: timestamp(event.at, at),
      })),
    recommendations: records(source.recs ?? source.recommendations)
      .filter((rec) => text(rec.animalId) !== '')
      .map((rec) => mapRecommendation(rec, at)),
    feedLots: records(source.feed ?? source.feedLots).map((feed) => mapFeed(feed, at)),
    signoffs: records(source.signoffs).map((signoff) => ({
      id: text(signoff.id, `legacy-signoff-${stableHash(JSON.stringify(signoff))}`),
      name: text(signoff.name, 'Expert'),
      specialty: text(signoff.specialty) === 'elevage' ? 'elevage' : 'nutrition',
      signedAt: timestamp(signoff.signedAt, at),
      protocol: text(signoff.protocol, 'legacy'),
      notes: text(signoff.notes).slice(0, 2000),
      engineVersion: text(signoff.engineVersion, 'DDNE-REF-0.9'),
      passed: Math.max(0, numberValue(signoff.passed)),
      total: Math.max(0, numberValue(signoff.total)),
      caseIds: Array.isArray(signoff.caseIds)
        ? signoff.caseIds.filter((id): id is string => typeof id === 'string')
        : [],
    })),
  };
}

/** m002 - add operator, settings and the expected lambing date. */
export function m002Operator(input: unknown, now: Date): UnknownRecord {
  const source = record(input);
  const at = now.toISOString();
  const createdAt = timestamp(source.createdAt, at);
  const role = text(source.role, 'field');
  const animals = records(source.animals);

  return {
    ...source,
    schemaVersion: 2,
    settings: {
      farmName: text(record(source.settings).farmName, 'Farm'),
      region: text(record(source.settings).region),
      flockLabel: text(record(source.settings).flockLabel),
      locale: 'ar',
      demoMode: false,
      scanStaleDays: 3,
      engineId: ENGINE_ID,
      engineVersion: ENGINE_VERSION,
      pens: [...new Set(animals.map((animal) => text(animal.pen, 'P1')).filter(Boolean))],
    },
    operator: {
      id: 'op-legacy',
      displayName: text(record(source.operator).displayName, 'Operator'),
      authority: role === 'production' ? 'production' : 'field',
      createdAt,
      updatedAt: createdAt,
    },
    animals: animals.map((animal) => ({
      ...animal,
      expectedLambingAt: nullableTimestamp(animal.expectedLambingAt),
    })),
  };
}

/** m003 - derive the append-only audit log from the legacy event list. */
export function m003Audit(input: unknown, now: Date): UnknownRecord {
  const source = record(input);
  const at = now.toISOString();
  const legacyEvents = records(source.legacyEvents);
  const existing = records(source.auditEvents);
  const derived: UnknownRecord[] = legacyEvents.map((event, index) => {
    const type = mapEventType(event.type);
    const label = text(event.label, text(event.detail, type));
    return {
      id: text(event.id, `legacy-event-${index}`),
      type,
      at: timestamp(event.at, at),
      by: text(record(source.operator).id, 'op-legacy'),
      entityType: auditEntityType(type),
      entityId: typeof event.animalId === 'string' ? event.animalId : null,
      summary: descriptor('domain.note.legacy', { text: label }),
      severity: type === 'erreur' ? 'error' : 'info',
    };
  });

  const rest: UnknownRecord = { ...source };
  delete rest.legacyEvents;
  delete rest.events;

  return {
    ...rest,
    schemaVersion: 3,
    auditEvents: [...existing, ...derived],
  };
}

/** m004 - convert legacy free-text notes and evidence to descriptors. */
export function m004MessageKeys(input: unknown): UnknownRecord {
  const source = record(input);
  return {
    ...source,
    schemaVersion: 4,
    recommendations: records(source.recommendations).map((rec) => ({
      ...rec,
      notes: (Array.isArray(rec.notes) ? rec.notes : [])
        .map(stringToDescriptor)
        .filter((entry): entry is MessageDescriptor => entry !== null),
      missingInputs: (Array.isArray(rec.missingInputs) ? rec.missingInputs : []).map(
        missingToDescriptor,
      ),
      evidence: (Array.isArray(rec.evidence) ? rec.evidence : [])
        .map(stringToDescriptor)
        .filter((entry): entry is MessageDescriptor => entry !== null),
      legacyApprovedBy:
        typeof rec.legacyApprovedBy === 'string'
          ? rec.legacyApprovedBy
          : typeof rec.approvedBy === 'string'
            ? rec.approvedBy
            : null,
      legacyServedBy:
        typeof rec.legacyServedBy === 'string'
          ? rec.legacyServedBy
          : typeof rec.servedBy === 'string'
            ? rec.servedBy
            : null,
    })),
  };
}

/** m005 - freeze engine identity and lifecycle fields on every recommendation. */
export function m005EngineVersion(
  input: unknown,
  now: Date,
): {
  document: UnknownRecord;
  warnings: string[];
} {
  const source = record(input);
  const warnings: string[] = [];

  const recommendations = records(source.recommendations).map((rec) => {
    const id = text(rec.id);
    const createdAt = timestamp(rec.createdAt, now.toISOString());
    const servedAt = nullableTimestamp(rec.servedAt);
    const legacyApprovedBy = text(rec.legacyApprovedBy);
    let approvedBy: {
      id: string;
      name: string;
      authority: 'field' | 'production';
      at: string;
    } | null = null;
    if (legacyApprovedBy !== '') {
      approvedBy = {
        id: 'legacy',
        name: legacyApprovedBy,
        authority: 'production',
        at: createdAt,
      };
    } else if (servedAt !== null) {
      approvedBy = {
        id: 'legacy',
        name: 'Operator',
        authority: 'production',
        at: createdAt,
      };
      warnings.push(`recommendation ${id} was served without a recorded approval`);
    }

    const legacyServedBy = text(rec.legacyServedBy);
    const servedBy =
      legacyServedBy !== ''
        ? { id: 'legacy', name: legacyServedBy }
        : servedAt !== null
          ? { id: 'legacy', name: 'Operator' }
          : null;

    const rest: UnknownRecord = { ...rec };
    delete rest.legacyApprovedBy;
    delete rest.legacyServedBy;

    const ration = mapRation(rec.ration);
    const rawMissing = Array.isArray(rec.missingInputs) ? rec.missingInputs : [];
    let missingInputs = rawMissing
      .map(stringToDescriptor)
      .filter((entry): entry is MessageDescriptor => entry !== null);
    if (ration === null && missingInputs.length === 0) {
      missingInputs = [descriptor('domain.note.legacy', { text: 'unavailable' })];
    }
    if (ration !== null && missingInputs.length > 0) {
      missingInputs = [];
      warnings.push(`recommendation ${id} had both a ration and missing inputs`);
    }

    const engineId = text(rec.engineId);
    const engineVersion = text(rec.engineVersion);
    const inputsHash = text(rec.inputsHash);

    return {
      ...rest,
      id,
      engineId: engineId !== '' ? engineId : ENGINE_ID,
      engineVersion: engineVersion !== '' ? engineVersion : ENGINE_VERSION,
      inputsHash: inputsHash !== '' ? inputsHash : stableHash(id),
      ration,
      notes: (Array.isArray(rec.notes) ? rec.notes : [])
        .map(stringToDescriptor)
        .filter((entry): entry is MessageDescriptor => entry !== null),
      missingInputs,
      evidence: (Array.isArray(rec.evidence) ? rec.evidence : [])
        .map(stringToDescriptor)
        .filter((entry): entry is MessageDescriptor => entry !== null),
      approvedBy,
      servedAt,
      servedBy,
      stocksDeducted: servedAt !== null,
    };
  });

  const document = {
    ...source,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    recommendations,
    weights: records(source.weights),
    healthEvents: records(source.healthEvents),
    animals: records(source.animals),
    feedLots: records(source.feedLots),
    signoffs: records(source.signoffs),
    auditEvents: records(source.auditEvents),
    updatedAt: now.toISOString(),
  };

  if (warnings.length > 0) {
    const recovered: AuditEvent = {
      id: `recovered-${stableHash(warnings.join('|'))}`,
      type: 'erreur',
      at: now.toISOString(),
      by: 'migration',
      entityType: 'document',
      entityId: typeof source.farmId === 'string' ? source.farmId : null,
      summary: descriptor('domain.audit.schemaRecovered', { count: warnings.length }),
      severity: 'warn',
    };
    document.auditEvents = [recovered, ...records(source.auditEvents)];
  }

  return { document, warnings };
}

function isLegacyState(value: UnknownRecord): boolean {
  return (
    !('schemaVersion' in value) &&
    Array.isArray(value.animals) &&
    ('role' in value || 'network' in value || 'recs' in value || 'feed' in value)
  );
}

/** Runs the whole chain, rejects newer schemas, validates the final document. */
export function migrateDocument(input: unknown, now: Date): MigrationResult {
  let source = record(input);
  if (source.format === 'ovitech-backup') {
    const version = numberValue(source.version, 0);
    if (version > 2) {
      throw new MigrationError('newer-schema', 'domain.backup.version');
    }
    source = record(source.state);
  }

  const applied: string[] = [];
  const warnings: string[] = [];
  let working: unknown = source;

  const version = numberValue(source.schemaVersion, 0);
  if ('schemaVersion' in source && version > CURRENT_SCHEMA_VERSION) {
    throw new MigrationError('newer-schema', 'domain.error.newerSchema');
  }

  if (version === 0 && isLegacyState(source)) {
    working = m001ImportLegacy(source, now);
    applied.push('m001_import_v1');
    working = m002Operator(working, now);
    applied.push('m002_operator');
    working = m003Audit(working, now);
    applied.push('m003_audit');
    working = m004MessageKeys(working);
    applied.push('m004_message_keys');
    const final = m005EngineVersion(working, now);
    working = final.document;
    warnings.push(...final.warnings);
    applied.push('m005_engine_version');
  } else if (version >= 1 && version < CURRENT_SCHEMA_VERSION) {
    if (version < 2) {
      working = m002Operator(working, now);
      applied.push('m002_operator');
    }
    if (version < 3) {
      working = m003Audit(working, now);
      applied.push('m003_audit');
    }
    if (version < 4) {
      working = m004MessageKeys(working);
      applied.push('m004_message_keys');
    }
    const final = m005EngineVersion(working, now);
    working = final.document;
    warnings.push(...final.warnings);
    applied.push('m005_engine_version');
  } else if (version !== CURRENT_SCHEMA_VERSION) {
    throw new MigrationError('malformed', 'domain.error.malformed');
  }

  const parsed = farmDocumentSchema.safeParse(working);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new MigrationError('invalid', 'domain.error.invalidDocument', detail);
  }

  return { document: parsed.data, applied, warnings };
}
