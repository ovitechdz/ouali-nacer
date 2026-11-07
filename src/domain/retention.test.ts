import { describe, expect, it } from 'vitest';

import {
  makeAudit,
  makeContext,
  makeDocument,
  makeRecommendation,
  makeWeight,
} from '@/test/factories';

import { RETENTION_CAPS, archiveOldest, retentionReport, type RetentionKind } from './retention';
import type { HealthEvent } from './types';

const customCaps = (overrides: Partial<Record<RetentionKind, number>>) =>
  ({ ...RETENTION_CAPS, ...overrides }) as typeof RETENTION_CAPS;

function makeHealthEvent(id: string, at: string): HealthEvent {
  return {
    id,
    animalId: 'an-1',
    type: 'observation',
    at,
    by: 'op-1',
    note: '',
    severity: 'info',
    createdAt: at,
  };
}

describe('retentionReport', () => {
  it('reports every collection under its cap', () => {
    const report = retentionReport(makeDocument(), customCaps({ weights: 2 }));
    expect(report.map((item) => item.kind)).toEqual([
      'animals',
      'auditEvents',
      'healthEvents',
      'recommendations',
      'weights',
    ]);
    for (const item of report) {
      expect(item.overBy).toBe(0);
      expect(item.requiresExport).toBe(false);
      expect(item.promptKey).toBe('domain.retention.prompt');
    }
  });

  it('flags the collections that exceed their cap without deleting anything', () => {
    const document = makeDocument({
      weights: [makeWeight({ id: 'w1' }), makeWeight({ id: 'w2' }), makeWeight({ id: 'w3' })],
    });
    const snapshot = JSON.stringify(document);
    const report = retentionReport(document, customCaps({ weights: 2 }));
    const weights = report.find((item) => item.kind === 'weights')!;
    expect(weights.count).toBe(3);
    expect(weights.cap).toBe(2);
    expect(weights.overBy).toBe(1);
    expect(weights.requiresExport).toBe(true);
    expect(JSON.stringify(document)).toBe(snapshot);
  });

  it('uses the documented caps by default', () => {
    const report = retentionReport(makeDocument());
    expect(report.find((item) => item.kind === 'animals')!.cap).toBe(10_000);
    expect(report.find((item) => item.kind === 'recommendations')!.cap).toBe(2_000);
    expect(report.find((item) => item.kind === 'auditEvents')!.cap).toBe(5_000);
  });
});

describe('archiveOldest', () => {
  it('rejects a non-integer or negative keep count', () => {
    const document = makeDocument();
    expect(archiveOldest(document, 'weights', -1, 'op-1', makeContext())).toEqual({
      ok: false,
      error: { key: 'domain.error.invalid', params: { field: 'retention' } },
    });
    expect(archiveOldest(document, 'weights', 1.5, 'op-1', makeContext()).ok).toBe(false);
  });

  it('requires an export before archiving at or above the cap', () => {
    const result = archiveOldest(
      makeDocument(),
      'weights',
      RETENTION_CAPS.weights,
      'op-1',
      makeContext(),
    );
    expect(result).toEqual({
      ok: false,
      error: { key: 'domain.retention.exportFirst', params: { cap: RETENTION_CAPS.weights } },
    });
  });

  it('archives the oldest audit events and audits the action', () => {
    const document = makeDocument({
      auditEvents: [
        makeAudit({ id: 'a-old', at: '2026-08-01T10:00:00.000Z' }),
        makeAudit({ id: 'a-mid', at: '2026-08-02T10:00:00.000Z' }),
        makeAudit({ id: 'a-new', at: '2026-08-03T10:00:00.000Z' }),
      ],
    });
    const result = archiveOldest(document, 'auditEvents', 2, 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.archived).toEqual(['a-old']);
    expect(result.document.auditEvents.map((event) => event.id)).toEqual([
      'a-new',
      'a-mid',
      'id-1',
    ]);
    expect(result.document.auditEvents[2]!.type).toBe('archivage');
    expect(result.document.auditEvents[2]!.severity).toBe('warn');
    expect(result.document.auditEvents[2]!.summary.key).toBe('domain.audit.archive');
  });

  it('archives the oldest health events', () => {
    const document = makeDocument({
      healthEvents: [
        makeHealthEvent('h-old', '2026-08-01T10:00:00.000Z'),
        makeHealthEvent('h-new', '2026-08-02T10:00:00.000Z'),
      ],
    });
    const result = archiveOldest(document, 'healthEvents', 1, 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.archived).toEqual(['h-old']);
    expect(result.document.healthEvents.map((event) => event.id)).toEqual(['h-new']);
  });

  it('archives the oldest recommendations and weights', () => {
    const document = makeDocument({
      recommendations: [
        makeRecommendation({ id: 'r-old', createdAt: '2026-08-01T10:00:00.000Z' }),
        makeRecommendation({ id: 'r-new', createdAt: '2026-08-02T10:00:00.000Z' }),
      ],
      weights: [
        makeWeight({ id: 'w-old', at: '2026-08-01T10:00:00.000Z' }),
        makeWeight({ id: 'w-new', at: '2026-08-02T10:00:00.000Z' }),
      ],
    });
    const recs = archiveOldest(document, 'recommendations', 1, 'op-1', makeContext());
    expect(recs.ok).toBe(true);
    if (!recs.ok) return;
    expect(recs.result.archived).toEqual(['r-old']);

    const weights = archiveOldest(document, 'weights', 1, 'op-1', makeContext());
    expect(weights.ok).toBe(true);
    if (!weights.ok) return;
    expect(weights.result.archived).toEqual(['w-old']);
  });

  it('is a no-op when nothing needs archiving', () => {
    const document = makeDocument({ weights: [makeWeight({ id: 'w1' })] });
    const result = archiveOldest(document, 'weights', 5, 'op-1', makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.archived).toEqual([]);
    expect(result.document).toBe(document);
  });
});
