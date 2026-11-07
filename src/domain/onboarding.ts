import { z } from 'zod';

import type { MessageDescriptor } from './messages';
import type { Authority, FarmDocument } from './types';
import { message } from './types';
import { defaultEngineSettings, createEmptyDocument } from './document';

export const onboardingDraftSchema = z.object({
  farmName: z.string().trim().min(1).max(120),
  operatorName: z.string().trim().min(1).max(120),
  authority: z.enum(['field', 'production']),
  locale: z.enum(['ar', 'fr', 'en']),
  region: z.string().trim().max(120).optional(),
  flockLabel: z.string().trim().max(120).optional(),
  pens: z.array(z.string().trim().min(1).max(64)).max(200).optional(),
  scanStaleDays: z.number().int().min(1).max(30).optional(),
});
export type OnboardingDraft = z.input<typeof onboardingDraftSchema>;

export interface OnboardingContext {
  farmId: string;
  operatorId: string;
  now: Date;
  nextId: () => string;
}

export type OnboardingResult =
  { ok: true; document: FarmDocument } | { ok: false; error: MessageDescriptor };

/**
 * First-run onboarding: no seeded farm, no invented history. The operator
 * chooses the farm name, display name and local authority explicitly.
 */
export function completeOnboarding(
  draft: OnboardingDraft,
  context: OnboardingContext,
): OnboardingResult {
  const parsed = onboardingDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { ok: false, error: message('domain.error.invalid', { field: 'onboarding' }) };
  }
  const value = parsed.data;
  const at = context.now.toISOString();
  const pens = [...new Set((value.pens ?? []).map((pen) => pen.trim()).filter(Boolean))];

  const settings = defaultEngineSettings({
    farmName: value.farmName,
    region: value.region ?? '',
    flockLabel: value.flockLabel ?? '',
    locale: value.locale,
    demoMode: false,
    scanStaleDays: value.scanStaleDays ?? 3,
    pens,
  });

  const document = createEmptyDocument({
    farmId: context.farmId,
    createdAt: at,
    settings,
    operator: {
      id: context.operatorId,
      displayName: value.operatorName,
      authority: value.authority as Authority,
      createdAt: at,
      updatedAt: at,
    },
  });

  return {
    ok: true,
    document: {
      ...document,
      auditEvents: [
        {
          id: context.nextId(),
          type: 'settings',
          at,
          by: context.operatorId,
          entityType: 'document',
          entityId: document.farmId,
          summary: message('domain.audit.documentCreated', { farm: value.farmName }),
          severity: 'info',
        },
      ],
    },
  };
}
