import type { MessageDescriptor } from './messages';
import {
  ENGINE_VERSION,
  type Animal,
  type AuditEvent,
  type AuditEventType,
  type ExpertSignoff,
  type FarmDocument,
  type FeedLot,
  type HealthEvent,
  type NutritionRec,
  type OperatorProfile,
  type WeightRecord,
  message,
} from './types';
import { computeRecommendation } from './nutrition';
import { deductFeed, feedAvailability, feedCovers } from './feed';
import { adgFromHistory } from './weights';
import { canApprove, canServeWithAuthority } from './authority';
import { latestRecommendationByAnimal } from './kpis';
import { normalizeIdentity } from './identity';
import {
  feedLotInputSchema,
  healthEventInputSchema,
  newAnimalInputSchema,
  signoffInputSchema,
  weightRecordInputSchema,
  type FeedLotInput,
  type HealthEventInput,
  type NewAnimalInput,
  type SignoffInput,
  type WeightRecordInput,
} from './validation';

export interface CommandContext {
  now: Date;
  nextId: () => string;
}

export type CommandResult<T> =
  { ok: true; document: FarmDocument; result: T } | { ok: false; error: MessageDescriptor };

function fail<T>(
  key: MessageDescriptor['key'],
  params?: MessageDescriptor['params'],
): CommandResult<T> {
  return { ok: false, error: params ? { key, params } : { key } };
}

interface AuditInput {
  type: AuditEventType;
  by: string;
  entityType: AuditEvent['entityType'];
  entityId: string | null;
  summary: MessageDescriptor;
  severity?: AuditEvent['severity'];
}

function buildAudit(input: AuditInput, context: CommandContext): AuditEvent {
  return {
    id: context.nextId(),
    type: input.type,
    at: context.now.toISOString(),
    by: input.by,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    severity: input.severity ?? 'info',
  };
}

function commit(
  document: FarmDocument,
  audit: AuditEvent,
  patch: Partial<FarmDocument>,
  at: string,
): FarmDocument {
  return {
    ...document,
    ...patch,
    auditEvents: [audit, ...document.auditEvents],
    updatedAt: at,
  };
}

export function registerAnimal(
  document: FarmDocument,
  input: NewAnimalInput,
  operatorId: string,
  context: CommandContext,
): CommandResult<Animal> {
  const parsed = newAnimalInputSchema.safeParse(input);
  if (!parsed.success) return fail('domain.error.invalid', { field: 'animal' });
  const value = parsed.data;

  const code = value.code.trim().toUpperCase();
  const rfid = value.rfid.trim().toUpperCase();
  const today = context.now.toISOString().slice(0, 10);
  if (value.birthDate > today) return fail('domain.error.futureDate', { field: 'birthDate' });
  if (
    document.animals.some((animal) => normalizeIdentity(animal.code) === normalizeIdentity(code))
  ) {
    return fail('domain.error.duplicateCode', { code });
  }
  if (
    rfid !== '' &&
    document.animals.some((animal) => normalizeIdentity(animal.rfid) === normalizeIdentity(rfid))
  ) {
    return fail('domain.error.duplicateRfid', { rfid });
  }

  const at = context.now.toISOString();
  const animal: Animal = {
    id: context.nextId(),
    farmId: document.farmId,
    code,
    rfid,
    sex: value.sex,
    breed: value.breed,
    birthDate: value.birthDate,
    weightKg: value.weight,
    bcs: value.bcs,
    stage: value.stage,
    pen: value.pen,
    status: 'actif',
    lastScanAt: at,
    adgKg: null,
    expectedLambingAt: null,
    damId: null,
    sireId: null,
    notes: value.notes ?? '',
    createdAt: at,
    updatedAt: at,
  };

  const weightRecord: WeightRecord | null =
    value.weight === null
      ? null
      : {
          id: context.nextId(),
          animalId: animal.id,
          kg: value.weight,
          bcs: value.bcs,
          at,
          source: 'field',
          note: '',
          createdAt: at,
        };

  const weights = weightRecord ? [...document.weights, weightRecord] : document.weights;
  if (weightRecord) animal.adgKg = adgFromHistory(weights, animal.id);

  const audit = buildAudit(
    {
      type: 'identite',
      by: operatorId,
      entityType: 'animal',
      entityId: animal.id,
      summary: message('domain.audit.animalRegistered', { code: animal.code }),
    },
    context,
  );

  const pens = document.settings.pens.includes(animal.pen)
    ? document.settings.pens
    : [...document.settings.pens, animal.pen];

  return {
    ok: true,
    result: animal,
    document: commit(
      document,
      audit,
      {
        animals: [...document.animals, animal],
        weights,
        settings: { ...document.settings, pens },
      },
      at,
    ),
  };
}

export function recordWeight(
  document: FarmDocument,
  input: WeightRecordInput,
  operatorId: string,
  context: CommandContext,
): CommandResult<WeightRecord> {
  const parsed = weightRecordInputSchema.safeParse(input);
  if (!parsed.success) return fail('domain.error.invalidWeight');
  const value = parsed.data;
  if (value.weight === null) return fail('domain.error.invalidWeight');

  const animal = document.animals.find((entry) => entry.id === value.animalId);
  if (!animal) return fail('domain.error.notFound', { entity: 'animal' });

  const at = context.now.toISOString();
  const record: WeightRecord = {
    id: context.nextId(),
    animalId: animal.id,
    kg: value.weight,
    bcs: value.bcs,
    at,
    source: 'field',
    note: value.note ?? '',
    createdAt: at,
  };
  const weights = [...document.weights, record];
  const updated: Animal = {
    ...animal,
    weightKg: record.kg,
    bcs: record.bcs ?? animal.bcs,
    adgKg: adgFromHistory(weights, animal.id),
    updatedAt: at,
  };

  const audit = buildAudit(
    {
      type: 'saisie',
      by: operatorId,
      entityType: 'weight',
      entityId: record.id,
      summary: message('domain.audit.weightRecorded', { code: animal.code, kg: record.kg }),
    },
    context,
  );

  return {
    ok: true,
    result: record,
    document: commit(
      document,
      audit,
      {
        animals: document.animals.map((entry) => (entry.id === animal.id ? updated : entry)),
        weights,
      },
      at,
    ),
  };
}

export function moveAnimal(
  document: FarmDocument,
  animalId: string,
  pen: string,
  operatorId: string,
  context: CommandContext,
): CommandResult<Animal> {
  const animal = document.animals.find((entry) => entry.id === animalId);
  if (!animal) return fail('domain.error.notFound', { entity: 'animal' });
  const target = pen.trim();
  if (target === '') return fail('domain.error.invalid', { field: 'pen' });
  if (animal.pen === target) return { ok: true, document, result: animal };

  const at = context.now.toISOString();
  const updated: Animal = { ...animal, pen: target, updatedAt: at };
  const audit = buildAudit(
    {
      type: 'transfert',
      by: operatorId,
      entityType: 'animal',
      entityId: animal.id,
      summary: message('domain.audit.animalMoved', { code: animal.code, pen: target }),
    },
    context,
  );
  const pens = document.settings.pens.includes(target)
    ? document.settings.pens
    : [...document.settings.pens, target];

  return {
    ok: true,
    result: updated,
    document: commit(
      document,
      audit,
      {
        animals: document.animals.map((entry) => (entry.id === animal.id ? updated : entry)),
        settings: { ...document.settings, pens },
      },
      at,
    ),
  };
}

export function runEngine(
  document: FarmDocument,
  animalId: string,
  operatorId: string,
  context: CommandContext,
): CommandResult<NutritionRec> {
  const animal = document.animals.find((entry) => entry.id === animalId);
  if (!animal) return fail('domain.error.notFound', { entity: 'animal' });

  const draft = computeRecommendation(animal, feedAvailability(document.feedLots), context.now);
  const at = context.now.toISOString();
  const rec: NutritionRec = {
    id: context.nextId(),
    animalId: animal.id,
    engineId: draft.engineId,
    engineVersion: draft.engineVersion,
    createdAt: at,
    inputsHash: draft.inputsHash,
    ration: draft.ration,
    notes: draft.notes,
    confidence: draft.confidence,
    missingInputs: draft.missingInputs,
    evidence: draft.evidence,
    approvedBy: null,
    servedAt: null,
    servedBy: null,
    stocksDeducted: false,
  };

  const audit = buildAudit(
    {
      type: rec.ration ? 'recommandation' : 'erreur',
      by: operatorId,
      entityType: 'recommendation',
      entityId: rec.id,
      summary: message(
        rec.ration ? 'domain.audit.recommendationCreated' : 'domain.audit.recommendationRefused',
        { code: animal.code },
      ),
      severity: rec.ration ? 'info' : 'warn',
    },
    context,
  );

  return {
    ok: true,
    result: rec,
    document: commit(document, audit, { recommendations: [rec, ...document.recommendations] }, at),
  };
}

export function approveRecommendation(
  document: FarmDocument,
  recId: string,
  operator: OperatorProfile,
  context: CommandContext,
): CommandResult<NutritionRec> {
  const rec = document.recommendations.find((entry) => entry.id === recId);
  if (!rec) return fail('domain.error.notFound', { entity: 'recommendation' });

  const gate = canApprove(rec, operator.authority);
  if (!gate.allowed) return { ok: false, error: gate.reason };

  const at = context.now.toISOString();
  const approved: NutritionRec = {
    ...rec,
    approvedBy: {
      id: operator.id,
      name: operator.displayName,
      authority: operator.authority,
      at,
    },
  };
  const animal = document.animals.find((entry) => entry.id === rec.animalId);
  const audit = buildAudit(
    {
      type: 'approbation',
      by: operator.id,
      entityType: 'recommendation',
      entityId: rec.id,
      summary: message('domain.audit.recommendationApproved', {
        code: animal?.code ?? rec.animalId,
      }),
    },
    context,
  );

  return {
    ok: true,
    result: approved,
    document: commit(
      document,
      audit,
      {
        recommendations: document.recommendations.map((entry) =>
          entry.id === rec.id ? approved : entry,
        ),
      },
      at,
    ),
  };
}

export interface ServeOutcome {
  served: boolean;
  alreadyServed: boolean;
}

export function serveRecommendation(
  document: FarmDocument,
  recId: string,
  operator: OperatorProfile,
  context: CommandContext,
): CommandResult<ServeOutcome> {
  const rec = document.recommendations.find((entry) => entry.id === recId);
  if (!rec) return fail('domain.error.notFound', { entity: 'recommendation' });

  if (rec.servedAt !== null) {
    return { ok: true, document, result: { served: false, alreadyServed: true } };
  }

  const gate = canServeWithAuthority(rec, operator.authority);
  if (!gate.allowed) return { ok: false, error: gate.reason };
  if (rec.ration === null) return fail('domain.error.refused');

  if (!feedCovers(document.feedLots, rec.ration.forageKg, rec.ration.concentrateKg)) {
    return fail('domain.error.insufficientStock');
  }

  const at = context.now.toISOString();
  const feedLots = deductFeed(document.feedLots, rec.ration.forageKg, rec.ration.concentrateKg);
  const served: NutritionRec = {
    ...rec,
    servedAt: at,
    servedBy: { id: operator.id, name: operator.displayName },
    stocksDeducted: true,
  };
  const animal = document.animals.find((entry) => entry.id === rec.animalId);
  const audit = buildAudit(
    {
      type: 'distribution',
      by: operator.id,
      entityType: 'recommendation',
      entityId: rec.id,
      summary: message('domain.audit.recommendationServed', {
        code: animal?.code ?? rec.animalId,
      }),
    },
    context,
  );

  return {
    ok: true,
    result: { served: true, alreadyServed: false },
    document: commit(
      document,
      audit,
      {
        feedLots,
        recommendations: document.recommendations.map((entry) =>
          entry.id === rec.id ? served : entry,
        ),
      },
      at,
    ),
  };
}

export interface ServePenOutcome {
  served: string[];
  skipped: number;
}

export function servePen(
  document: FarmDocument,
  pen: string,
  operator: OperatorProfile,
  context: CommandContext,
): CommandResult<ServePenOutcome> {
  const activeIds = new Set(
    document.animals
      .filter((animal) => animal.pen === pen && animal.status === 'actif')
      .map((animal) => animal.id),
  );
  if (activeIds.size === 0) {
    return { ok: true, document, result: { served: [], skipped: 0 } };
  }

  const latest = latestRecommendationByAnimal(document.recommendations);
  const candidates = [...latest.values()].filter((rec) => activeIds.has(rec.animalId));
  const selected: NutritionRec[] = [];
  let simulated = document.feedLots;

  for (const rec of candidates) {
    const gate = canServeWithAuthority(rec, operator.authority);
    if (!gate.allowed || rec.ration === null) continue;
    if (!feedCovers(simulated, rec.ration.forageKg, rec.ration.concentrateKg)) continue;
    simulated = deductFeed(simulated, rec.ration.forageKg, rec.ration.concentrateKg);
    selected.push(rec);
  }

  if (selected.length === 0) {
    return {
      ok: true,
      document,
      result: { served: [], skipped: candidates.length },
    };
  }

  const at = context.now.toISOString();
  const ids = new Set(selected.map((rec) => rec.id));
  const recommendations = document.recommendations.map((entry) =>
    ids.has(entry.id)
      ? {
          ...entry,
          servedAt: at,
          servedBy: { id: operator.id, name: operator.displayName },
          stocksDeducted: true,
        }
      : entry,
  );
  const auditEvents = selected.map((rec) =>
    buildAudit(
      {
        type: 'distribution',
        by: operator.id,
        entityType: 'recommendation',
        entityId: rec.id,
        summary: message('domain.audit.recommendationServed', {
          code: document.animals.find((animal) => animal.id === rec.animalId)?.code ?? rec.animalId,
        }),
      },
      context,
    ),
  );

  return {
    ok: true,
    result: {
      served: selected.map((rec) => rec.id),
      skipped: candidates.length - selected.length,
    },
    document: {
      ...document,
      feedLots: simulated,
      recommendations,
      auditEvents: [...auditEvents, ...document.auditEvents],
      updatedAt: at,
    },
  };
}

export function adjustFeedStock(
  document: FarmDocument,
  lotId: string,
  deltaKg: number,
  operatorId: string,
  context: CommandContext,
): CommandResult<FeedLot> {
  const lot = document.feedLots.find((entry) => entry.id === lotId);
  if (!lot) return fail('domain.error.notFound', { entity: 'feed' });
  if (!Number.isFinite(deltaKg)) return fail('domain.error.invalid', { field: 'stockKg' });

  const stockKg = Math.round((lot.stockKg + deltaKg) * 10) / 10;
  if (stockKg < 0) return fail('domain.error.insufficientStock', { lot: lot.name });

  const at = context.now.toISOString();
  const updated: FeedLot = { ...lot, stockKg, updatedAt: at };
  const audit = buildAudit(
    {
      type: 'saisie',
      by: operatorId,
      entityType: 'feed',
      entityId: lot.id,
      summary: message('domain.audit.stockAdjusted', { lot: lot.name, stock: stockKg }),
    },
    context,
  );

  return {
    ok: true,
    result: updated,
    document: commit(
      document,
      audit,
      {
        feedLots: document.feedLots.map((entry) => (entry.id === lot.id ? updated : entry)),
      },
      at,
    ),
  };
}

export function saveFeedLot(
  document: FarmDocument,
  input: FeedLotInput,
  operatorId: string,
  context: CommandContext,
): CommandResult<FeedLot> {
  const parsed = feedLotInputSchema.safeParse(input);
  if (!parsed.success) return fail('domain.error.invalid', { field: 'feed' });
  const value = parsed.data;
  const at = context.now.toISOString();
  const existing = value.id ? document.feedLots.find((entry) => entry.id === value.id) : undefined;

  const lot: FeedLot = {
    id: existing?.id ?? context.nextId(),
    name: value.name,
    kind: value.kind,
    stockKg: value.stockKg,
    costPerKg: value.costPerKg,
    available: value.available,
    origin: value.origin ?? existing?.origin ?? '',
    updatedAt: at,
  };

  const audit = buildAudit(
    {
      type: 'saisie',
      by: operatorId,
      entityType: 'feed',
      entityId: lot.id,
      summary: message('domain.audit.feedLotSaved', { lot: lot.name }),
    },
    context,
  );

  return {
    ok: true,
    result: lot,
    document: commit(
      document,
      audit,
      {
        feedLots: existing
          ? document.feedLots.map((entry) => (entry.id === lot.id ? lot : entry))
          : [...document.feedLots, lot],
      },
      at,
    ),
  };
}

export function recordHealthEvent(
  document: FarmDocument,
  input: HealthEventInput,
  operatorId: string,
  context: CommandContext,
): CommandResult<HealthEvent> {
  const parsed = healthEventInputSchema.safeParse(input);
  if (!parsed.success) return fail('domain.error.invalid', { field: 'health' });
  const value = parsed.data;
  const animal = document.animals.find((entry) => entry.id === value.animalId);
  if (!animal) return fail('domain.error.notFound', { entity: 'animal' });

  const at = context.now.toISOString();
  const event: HealthEvent = {
    id: context.nextId(),
    animalId: animal.id,
    type: value.type,
    at,
    by: operatorId,
    note: value.note ?? '',
    severity: value.severity,
    createdAt: at,
  };
  const audit = buildAudit(
    {
      type: 'saisie',
      by: operatorId,
      entityType: 'health',
      entityId: event.id,
      summary: message('domain.audit.healthRecorded', { code: animal.code, type: value.type }),
    },
    context,
  );

  return {
    ok: true,
    result: event,
    document: commit(document, audit, { healthEvents: [event, ...document.healthEvents] }, at),
  };
}

export function changeOperator(
  document: FarmDocument,
  patch: { displayName?: string; authority?: OperatorProfile['authority'] },
  actorId: string,
  context: CommandContext,
): CommandResult<OperatorProfile> {
  const displayName = patch.displayName?.trim() ?? document.operator.displayName;
  const authority = patch.authority ?? document.operator.authority;
  if (displayName === '' || displayName.length > 120) {
    return fail('domain.error.invalid', { field: 'displayName' });
  }
  if (displayName === document.operator.displayName && authority === document.operator.authority) {
    return { ok: true, document, result: document.operator };
  }

  const at = context.now.toISOString();
  const operator: OperatorProfile = {
    ...document.operator,
    displayName,
    authority,
    updatedAt: at,
  };
  const audit = buildAudit(
    {
      type: 'settings',
      by: actorId,
      entityType: 'settings',
      entityId: operator.id,
      summary: message('domain.audit.operatorChanged', { name: displayName }),
    },
    context,
  );

  return {
    ok: true,
    result: operator,
    document: commit(document, audit, { operator }, at),
  };
}

export function signProtocol(
  document: FarmDocument,
  input: SignoffInput,
  operatorId: string,
  context: CommandContext,
): CommandResult<ExpertSignoff> {
  const parsed = signoffInputSchema.safeParse(input);
  if (!parsed.success) return fail('domain.error.invalid', { field: 'signoff' });
  const value = parsed.data;
  if (value.passed > value.total) return fail('domain.error.invalid', { field: 'signoff' });

  const at = context.now.toISOString();
  const signoff: ExpertSignoff = {
    id: context.nextId(),
    name: value.name,
    specialty: value.specialty,
    signedAt: at,
    protocol: value.protocol,
    notes: value.notes ?? '',
    engineVersion: ENGINE_VERSION,
    passed: value.passed,
    total: value.total,
    caseIds: value.caseIds,
  };
  const audit = buildAudit(
    {
      type: 'saisie',
      by: operatorId,
      entityType: 'document',
      entityId: signoff.id,
      summary: message('domain.audit.signoffRecorded', { name: signoff.name }),
    },
    context,
  );

  return {
    ok: true,
    result: signoff,
    document: commit(document, audit, { signoffs: [signoff, ...document.signoffs] }, at),
  };
}

export function recordScan(
  document: FarmDocument,
  animalId: string,
  operatorId: string,
  context: CommandContext,
): CommandResult<Animal> {
  const animal = document.animals.find((entry) => entry.id === animalId);
  if (!animal) return fail('domain.error.notFound', { entity: 'animal' });
  const at = context.now.toISOString();
  const updated: Animal = { ...animal, lastScanAt: at, updatedAt: at };
  const audit = buildAudit(
    {
      type: 'scan',
      by: operatorId,
      entityType: 'animal',
      entityId: animal.id,
      summary: message('domain.audit.scanRecorded', { code: animal.code }),
    },
    context,
  );
  return {
    ok: true,
    result: updated,
    document: commit(
      document,
      audit,
      {
        animals: document.animals.map((entry) => (entry.id === animal.id ? updated : entry)),
      },
      at,
    ),
  };
}

export function logScanFailure(
  document: FarmDocument,
  query: string,
  operatorId: string,
  context: CommandContext,
): CommandResult<AuditEvent> {
  const audit = buildAudit(
    {
      type: 'erreur',
      by: operatorId,
      entityType: null,
      entityId: null,
      summary: message('domain.audit.scanFailed', { query }),
      severity: 'warn',
    },
    context,
  );
  return {
    ok: true,
    result: audit,
    document: { ...document, auditEvents: [audit, ...document.auditEvents], updatedAt: audit.at },
  };
}
