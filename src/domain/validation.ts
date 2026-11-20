import { z } from 'zod';

import type { MessageDescriptor } from './messages';
import { FEED_KINDS, HEALTH_EVENT_TYPES, SEXES, STAGES, message } from './types';

export const MAX_WEIGHT_KG = 1000;
export const MIN_BCS = 1;
export const MAX_BCS = 5;
export const MAX_NOTE_LENGTH = 500;
export const MAX_NAME_LENGTH = 120;

/**
 * Sized to import a 5,000-head flock with one year of records (measured
 * 108,259,448 bytes / 256,026 records). See D-0061 for the byte-per-record
 * measurements and the rationale for each ceiling.
 */
export const IMPORT_LIMITS = {
  maxFileBytes: 128 * 1024 * 1024,
  maxArrayLength: 200_000,
  maxTotalRecords: 320_000,
  maxCodeLength: 32,
  maxRfidLength: 64,
} as const;

export function isWeight(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0 && value <= MAX_WEIGHT_KG;
}

export function isBcs(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value >= MIN_BCS && value <= MAX_BCS;
}

/** Weight input accepts the empty string (absent) or a numeric string/number. */
export const weightInputSchema = z
  .union([z.literal(''), z.string().trim(), z.number()])
  .transform((value, ctx) => {
    if (value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_WEIGHT_KG) {
      ctx.addIssue({ code: 'custom', message: 'domain.error.invalidWeight' });
      return z.NEVER;
    }
    return parsed;
  });

/** Body condition score accepts the empty string (absent) or 1–5. */
export const bcsInputSchema = z
  .union([z.literal(''), z.string().trim(), z.number()])
  .transform((value, ctx) => {
    if (value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < MIN_BCS || parsed > MAX_BCS) {
      ctx.addIssue({ code: 'custom', message: 'domain.error.invalidBcs' });
      return z.NEVER;
    }
    return parsed;
  });

export const newAnimalInputSchema = z.object({
  rfid: z.string().trim().max(IMPORT_LIMITS.maxRfidLength),
  code: z.string().trim().min(1).max(IMPORT_LIMITS.maxCodeLength),
  sex: z.enum(SEXES),
  breed: z.string().trim().min(1).max(80),
  birthDate: z.iso.date(),
  stage: z.enum(STAGES),
  pen: z.string().trim().min(1).max(64),
  weight: weightInputSchema,
  bcs: bcsInputSchema,
  notes: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
});
export type NewAnimalInput = z.input<typeof newAnimalInputSchema>;
export type NewAnimalPayload = z.output<typeof newAnimalInputSchema>;

export const weightRecordInputSchema = z.object({
  animalId: z.string().min(1),
  weight: weightInputSchema,
  bcs: bcsInputSchema,
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
});
export type WeightRecordInput = z.input<typeof weightRecordInputSchema>;
export type WeightRecordPayload = z.output<typeof weightRecordInputSchema>;

export const healthEventInputSchema = z.object({
  animalId: z.string().min(1),
  type: z.enum(HEALTH_EVENT_TYPES),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
  severity: z.enum(['info', 'suivi', 'alerte']).default('info'),
});
export type HealthEventInput = z.input<typeof healthEventInputSchema>;
export type HealthEventPayload = z.output<typeof healthEventInputSchema>;

export const feedLotInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  kind: z.enum(FEED_KINDS),
  stockKg: z.number().finite().nonnegative(),
  costPerKg: z.number().finite().nonnegative(),
  available: z.boolean(),
  origin: z.string().trim().max(MAX_NAME_LENGTH).optional(),
});
export type FeedLotInput = z.input<typeof feedLotInputSchema>;
export type FeedLotPayload = z.output<typeof feedLotInputSchema>;

export const signoffInputSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  specialty: z.enum(['nutrition', 'elevage']),
  protocol: z.string().trim().min(1).max(2000),
  notes: z.string().trim().max(2000).optional(),
  passed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  caseIds: z.array(z.string().min(1)).max(100),
});
export type SignoffInput = z.input<typeof signoffInputSchema>;

/**
 * Import guards. Returns a descriptor to surface when the payload is too big;
 * `null` means the payload is within every documented limit.
 */
export interface ImportLimitsInput {
  bytes: number;
  arrayLengths: readonly number[];
}

export function checkImportLimits(input: ImportLimitsInput): MessageDescriptor | null {
  if (!Number.isFinite(input.bytes) || input.bytes > IMPORT_LIMITS.maxFileBytes) {
    return message('domain.error.importSize', { limit: IMPORT_LIMITS.maxFileBytes });
  }
  let total = 0;
  for (const length of input.arrayLengths) {
    if (!Number.isFinite(length) || length < 0) return message('domain.error.malformed');
    if (length > IMPORT_LIMITS.maxArrayLength) {
      return message('domain.error.importSize', { limit: IMPORT_LIMITS.maxArrayLength });
    }
    total += length;
  }
  if (total > IMPORT_LIMITS.maxTotalRecords) {
    return message('domain.error.importSize', { limit: IMPORT_LIMITS.maxTotalRecords });
  }
  return null;
}
