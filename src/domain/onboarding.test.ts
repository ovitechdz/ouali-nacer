import { describe, expect, it } from 'vitest';

import { NOW } from '@/test/factories';

import { completeOnboarding } from './onboarding';

function context() {
  let counter = 0;
  return {
    farmId: 'farm-1',
    operatorId: 'op-1',
    now: NOW,
    nextId: () => `id-${(counter += 1)}`,
  };
}

describe('completeOnboarding', () => {
  it('creates an empty, valid Arabic-first document with one audit event', () => {
    const result = completeOnboarding(
      {
        farmName: 'My Farm',
        operatorName: 'Nacer',
        authority: 'field',
        locale: 'ar',
        region: 'Sidi Bel Abbes',
        flockLabel: 'Flock A',
        pens: ['P1', 'P1', 'P2'],
        scanStaleDays: 4,
      },
      context(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const document = result.document;
    expect(document.schemaVersion).toBe(5);
    expect(document.settings).toMatchObject({
      farmName: 'My Farm',
      region: 'Sidi Bel Abbes',
      flockLabel: 'Flock A',
      locale: 'ar',
      demoMode: false,
      scanStaleDays: 4,
      engineId: 'DDNE',
      engineVersion: 'DDNE-REF-1.0',
      pens: ['P1', 'P2'],
    });
    expect(document.operator).toMatchObject({
      id: 'op-1',
      displayName: 'Nacer',
      authority: 'field',
    });
    expect(document.auditEvents).toHaveLength(1);
    expect(document.auditEvents[0]!.summary.key).toBe('domain.audit.documentCreated');
    expect(document.animals).toEqual([]);
  });

  it('defaults optional settings', () => {
    const result = completeOnboarding(
      { farmName: 'Farm', operatorName: 'Op', authority: 'production', locale: 'fr' },
      context(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.settings).toMatchObject({
      region: '',
      flockLabel: '',
      scanStaleDays: 3,
      pens: [],
    });
    expect(result.document.operator.authority).toBe('production');
  });

  it('rejects an empty farm or operator name', () => {
    const emptyFarm = completeOnboarding(
      { farmName: ' ', operatorName: 'Op', authority: 'field', locale: 'ar' },
      context(),
    );
    const emptyOperator = completeOnboarding(
      { farmName: 'Farm', operatorName: '', authority: 'field', locale: 'ar' },
      context(),
    );
    expect(emptyFarm).toEqual({
      ok: false,
      error: { key: 'domain.error.invalid', params: { field: 'onboarding' } },
    });
    expect(emptyOperator.ok).toBe(false);
  });

  it('rejects an unknown authority or locale', () => {
    const result = completeOnboarding(
      // @ts-expect-error deliberately invalid input
      { farmName: 'Farm', operatorName: 'Op', authority: 'admin', locale: 'de' },
      context(),
    );
    expect(result.ok).toBe(false);
  });
});
