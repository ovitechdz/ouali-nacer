import { beforeAll, describe, expect, it } from 'vitest';

import { buildDemoDocument } from '@/app/seed-demo';
import { services } from '@/app/services';
import { AUDIT_EVENT_TYPES, CONFIDENCES, FEED_KINDS, HEALTH_LEVELS, STAGES } from '@/domain';
import ar from '@/i18n/locales/ar.json';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';

/**
 * Pages resolve some message keys dynamically from domain values (engine
 * missing inputs, evidence, audit summaries, stages, health statuses, feed
 * kinds). A typo would only surface at runtime in one locale, so this test
 * proves every key reachable from a real demo document exists in all three
 * catalogues.
 */
const LOCALES = { ar, en, fr } as const;
const has = (key: string): boolean =>
  Object.values(LOCALES).every((catalogue) => key in (catalogue as Record<string, string>));

/** Mirrors the page mapping; the second test guards against silent drift. */
const ENTITY_KEYS = {
  animal: 'journal.entityAnimal',
  recommendation: 'journal.entityRecommendation',
  feedLot: 'journal.entityFeed',
  document: 'journal.entityDocument',
  operator: 'journal.entityOperator',
  signoff: 'journal.entitySignoff',
} as const;

const DYNAMIC_STATIC_KEYS = [
  ...Object.values(FEED_KINDS).map(
    (kind) => `feed.kind${kind.charAt(0).toUpperCase()}${kind.slice(1)}`,
  ),
  ...AUDIT_EVENT_TYPES.map((type) => `journal.type${type.charAt(0).toUpperCase()}${type.slice(1)}`),
  ...HEALTH_LEVELS.map((status) => `domain.health.${status}`),
  ...STAGES.map((stage) => `domain.stage.${stage}`),
  ...Object.values(ENTITY_KEYS),
  ...CONFIDENCES.map((confidence) => `domain.confidence.${confidence}`),
];

describe('dynamic message keys', () => {
  let dynamicKeys: string[];

  beforeAll(() => {
    const document = buildDemoDocument(services.clock.now());
    dynamicKeys = [
      ...DYNAMIC_STATIC_KEYS,
      ...document.recommendations.flatMap((rec) => [
        ...rec.missingInputs.map((input) => input.key),
        ...rec.evidence.map((item) => item.key),
      ]),
      ...document.auditEvents.map((event) => event.summary.key),
    ];
  });

  it('resolves every dynamic key in ar, fr and en', () => {
    const missing = [...new Set(dynamicKeys)].filter((key) => !has(key));
    expect(missing).toEqual([]);
  });

  it('has an explicit entity label for every audit entity type', () => {
    const document = buildDemoDocument(services.clock.now());
    const entities = new Set(
      document.auditEvents.flatMap((event) =>
        event.entityType === null ? [] : [event.entityType],
      ),
    );
    for (const entity of entities) {
      const key = ENTITY_KEYS[entity as keyof typeof ENTITY_KEYS];
      expect(key, `no explicit entity label for ${entity}`).toBeDefined();
      expect(has(key), `missing ${key} for entity ${entity}`).toBe(true);
    }
  });
});
