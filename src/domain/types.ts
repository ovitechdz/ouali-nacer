import { z } from 'zod';

import type { MessageDescriptor } from './messages';

/** Internal document schema written by this build. See `migrations.ts`. */
export const CURRENT_SCHEMA_VERSION = 5;

export const ENGINE_ID = 'DDNE';
/** Frozen engine definition. Changing any coefficient must bump this string. */
export const ENGINE_VERSION = 'DDNE-REF-1.0';

export const STAGES = [
  'agneau',
  'croissance',
  'engraissement',
  'brebis_entretien',
  'brebis_gestation',
  'brebis_lactation',
  'belier',
] as const;
export type Stage = (typeof STAGES)[number];

export const SEXES = ['F', 'M'] as const;
export type Sex = (typeof SEXES)[number];

export const ANIMAL_STATUSES = ['actif', 'vendu', 'mort'] as const;
export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

export const AUTHORITIES = ['field', 'production'] as const;
export type Authority = (typeof AUTHORITIES)[number];

export const CONFIDENCES = ['haute', 'moyenne', 'insuffisante'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export const HEALTH_LEVELS = ['ok', 'suivi', 'alerte'] as const;
export type HealthLevel = (typeof HEALTH_LEVELS)[number];

export const HEALTH_SIGNAL_IDS = ['poids', 'nec', 'scan', 'gestation', 'refus'] as const;
export type HealthSignalId = (typeof HEALTH_SIGNAL_IDS)[number];

export const AUDIT_EVENT_TYPES = [
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
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export const HEALTH_EVENT_TYPES = [
  'examen',
  'traitement',
  'vaccination',
  'naissance',
  'observation',
] as const;
export type HealthEventType = (typeof HEALTH_EVENT_TYPES)[number];

export const FEED_KINDS = ['fourrage', 'concentre', 'hybride', 'mineral'] as const;
export type FeedKind = (typeof FEED_KINDS)[number];

export const messageDescriptorSchema = z.object({
  key: z.string().min(1),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export const operatorProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).max(120),
  authority: z.enum(AUTHORITIES),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type OperatorProfile = z.infer<typeof operatorProfileSchema>;

export const farmSettingsSchema = z.object({
  farmName: z.string().min(1).max(120),
  region: z.string().max(120),
  flockLabel: z.string().max(120),
  locale: z.enum(['ar', 'fr', 'en']),
  demoMode: z.boolean(),
  scanStaleDays: z.number().int().min(1).max(30),
  engineId: z.string().min(1),
  engineVersion: z.string().min(1),
  pens: z.array(z.string().min(1)).max(200),
});
export type FarmSettings = z.infer<typeof farmSettingsSchema>;

export const animalSchema = z.object({
  id: z.string().min(1),
  farmId: z.string().min(1),
  code: z.string().min(1).max(32),
  rfid: z.string().max(64),
  sex: z.enum(SEXES),
  breed: z.string().min(1).max(80),
  birthDate: z.iso.date(),
  weightKg: z.number().finite().positive().max(1000).nullable(),
  bcs: z.number().finite().min(1).max(5).nullable(),
  stage: z.enum(STAGES),
  pen: z.string().min(1).max(64),
  status: z.enum(ANIMAL_STATUSES),
  lastScanAt: z.iso.datetime().nullable(),
  adgKg: z.number().finite().nullable(),
  expectedLambingAt: z.iso.datetime().nullable(),
  damId: z.string().min(1).nullable(),
  sireId: z.string().min(1).nullable(),
  notes: z.string().max(500),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Animal = z.infer<typeof animalSchema>;

export const weightRecordSchema = z.object({
  id: z.string().min(1),
  animalId: z.string().min(1),
  kg: z.number().finite().positive().max(1000),
  bcs: z.number().finite().min(1).max(5).nullable(),
  at: z.iso.datetime(),
  source: z.enum(['seed', 'field', 'import']),
  note: z.string().max(500),
  createdAt: z.iso.datetime(),
});
export type WeightRecord = z.infer<typeof weightRecordSchema>;

export const healthEventSchema = z.object({
  id: z.string().min(1),
  animalId: z.string().min(1),
  type: z.enum(HEALTH_EVENT_TYPES),
  at: z.iso.datetime(),
  by: z.string().min(1),
  note: z.string().max(500),
  severity: z.enum(['info', 'suivi', 'alerte']),
  createdAt: z.iso.datetime(),
});
export type HealthEvent = z.infer<typeof healthEventSchema>;

export const rationSchema = z.object({
  forageKg: z.number().finite().nonnegative(),
  concentrateKg: z.number().finite().nonnegative(),
  mineralG: z.number().finite().nonnegative(),
  waterL: z.number().finite().nonnegative(),
  cpPercent: z.number().finite().nonnegative(),
  meMj: z.number().finite().nonnegative(),
  dmiKg: z.number().finite().nonnegative(),
});
export type Ration = z.infer<typeof rationSchema>;

export const approvalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  authority: z.enum(AUTHORITIES),
  at: z.iso.datetime(),
});
export type Approval = z.infer<typeof approvalSchema>;

export const nutritionRecSchema = z
  .object({
    id: z.string().min(1),
    animalId: z.string().min(1),
    engineId: z.string().min(1),
    engineVersion: z.string().min(1),
    createdAt: z.iso.datetime(),
    inputsHash: z.string().min(1),
    ration: rationSchema.nullable(),
    notes: z.array(messageDescriptorSchema),
    confidence: z.enum(CONFIDENCES),
    missingInputs: z.array(messageDescriptorSchema),
    evidence: z.array(messageDescriptorSchema),
    approvedBy: approvalSchema.nullable(),
    servedAt: z.iso.datetime().nullable(),
    servedBy: z.object({ id: z.string().min(1), name: z.string().min(1) }).nullable(),
    stocksDeducted: z.boolean(),
  })
  .superRefine((rec, ctx) => {
    if (rec.ration === null && rec.missingInputs.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'A refused recommendation must list its missing inputs',
        path: ['missingInputs'],
      });
    }
    if (rec.ration !== null && rec.missingInputs.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'An emitted recommendation cannot list missing inputs',
        path: ['missingInputs'],
      });
    }
    if (rec.servedAt !== null && (rec.approvedBy === null || !rec.stocksDeducted)) {
      ctx.addIssue({
        code: 'custom',
        message: 'A served recommendation must be approved and its stock deducted',
        path: ['servedAt'],
      });
    }
  });
export type NutritionRec = z.infer<typeof nutritionRecSchema>;

export const feedLotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  kind: z.enum(FEED_KINDS),
  stockKg: z.number().finite().nonnegative(),
  costPerKg: z.number().finite().nonnegative(),
  available: z.boolean(),
  origin: z.string().max(120),
  updatedAt: z.iso.datetime(),
});
export type FeedLot = z.infer<typeof feedLotSchema>;

export const auditEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(AUDIT_EVENT_TYPES),
  at: z.iso.datetime(),
  by: z.string().min(1),
  entityType: z
    .enum(['animal', 'weight', 'health', 'recommendation', 'feed', 'settings', 'document'])
    .nullable(),
  entityId: z.string().min(1).nullable(),
  summary: messageDescriptorSchema,
  severity: z.enum(['info', 'warn', 'error']),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const expertSignoffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  specialty: z.enum(['nutrition', 'elevage']),
  signedAt: z.iso.datetime(),
  protocol: z.string().min(1),
  notes: z.string().max(2000),
  engineVersion: z.string().min(1),
  passed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  caseIds: z.array(z.string().min(1)),
});
export type ExpertSignoff = z.infer<typeof expertSignoffSchema>;

export const farmDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  farmId: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  settings: farmSettingsSchema,
  operator: operatorProfileSchema,
  animals: z.array(animalSchema),
  weights: z.array(weightRecordSchema),
  healthEvents: z.array(healthEventSchema),
  recommendations: z.array(nutritionRecSchema),
  feedLots: z.array(feedLotSchema),
  auditEvents: z.array(auditEventSchema),
  signoffs: z.array(expertSignoffSchema),
});
export type FarmDocument = z.infer<typeof farmDocumentSchema>;

/** Descriptor helper: keeps call sites short and typed. */
export function message(
  key: MessageDescriptor['key'],
  params?: MessageDescriptor['params'],
): MessageDescriptor {
  return params === undefined ? { key } : { key, params };
}
