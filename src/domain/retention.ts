import type { FarmDocument } from './types';
import { message } from './types';
import type { CommandContext, CommandResult } from './commands';

export const RETENTION_CAPS = {
  animals: 10_000,
  auditEvents: 5_000,
  healthEvents: 5_000,
  recommendations: 2_000,
  weights: 10_000,
} as const;

export type RetentionKind = keyof typeof RETENTION_CAPS;
export type ArchivableKind = Exclude<RetentionKind, 'animals'>;

export interface RetentionItem {
  kind: RetentionKind;
  count: number;
  cap: number;
  overBy: number;
  requiresExport: boolean;
  promptKey: 'domain.retention.prompt';
}

/** Never deletes anything: it only reports which collections need an export. */
export function retentionReport(
  document: FarmDocument,
  caps: typeof RETENTION_CAPS = RETENTION_CAPS,
): RetentionItem[] {
  const counts: Record<RetentionKind, number> = {
    animals: document.animals.length,
    auditEvents: document.auditEvents.length,
    healthEvents: document.healthEvents.length,
    recommendations: document.recommendations.length,
    weights: document.weights.length,
  };

  return (Object.keys(caps) as RetentionKind[]).map((kind) => {
    const count = counts[kind];
    const cap = caps[kind];
    return {
      kind,
      count,
      cap,
      overBy: Math.max(0, count - cap),
      requiresExport: count > cap,
      promptKey: 'domain.retention.prompt',
    };
  });
}

function newestFirst<T>(items: readonly T[], at: (item: T) => string): T[] {
  return [...items].sort((a, b) => new Date(at(b)).getTime() - new Date(at(a)).getTime());
}

/**
 * Explicit archival, called only after the operator has exported. The oldest
 * records beyond `keep` are removed and the action is audited; nothing is
 * trimmed during a normal save.
 */
export function archiveOldest(
  document: FarmDocument,
  kind: ArchivableKind,
  keep: number,
  operatorId: string,
  context: CommandContext,
): CommandResult<{ archived: string[] }> {
  if (!Number.isInteger(keep) || keep < 0) {
    return { ok: false, error: message('domain.error.invalid', { field: 'retention' }) };
  }
  if (keep >= RETENTION_CAPS[kind]) {
    return {
      ok: false,
      error: message('domain.retention.exportFirst', { cap: RETENTION_CAPS[kind] }),
    };
  }

  const at = context.now.toISOString();
  let kept: Array<{ id: string }>;
  let archived: string[];
  let patch: Partial<FarmDocument>;

  if (kind === 'auditEvents') {
    const ordered = newestFirst(document.auditEvents, (event) => event.at);
    kept = ordered.slice(0, keep);
    archived = ordered.slice(keep).map((event) => event.id);
    patch = { auditEvents: kept as FarmDocument['auditEvents'] };
  } else if (kind === 'healthEvents') {
    const ordered = newestFirst(document.healthEvents, (event) => event.at);
    kept = ordered.slice(0, keep);
    archived = ordered.slice(keep).map((event) => event.id);
    patch = { healthEvents: kept as FarmDocument['healthEvents'] };
  } else if (kind === 'recommendations') {
    const ordered = newestFirst(document.recommendations, (rec) => rec.createdAt);
    kept = ordered.slice(0, keep);
    archived = ordered.slice(keep).map((rec) => rec.id);
    patch = { recommendations: kept as FarmDocument['recommendations'] };
  } else {
    const ordered = newestFirst(document.weights, (record) => record.at);
    kept = ordered.slice(0, keep);
    archived = ordered.slice(keep).map((record) => record.id);
    patch = { weights: kept as FarmDocument['weights'] };
  }

  if (archived.length === 0) {
    return { ok: true, document, result: { archived } };
  }

  const audit = {
    id: context.nextId(),
    type: 'archivage' as const,
    at,
    by: operatorId,
    entityType: 'document' as const,
    entityId: document.farmId,
    summary: message('domain.audit.archive', { kind, count: archived.length }),
    severity: 'warn' as const,
  };

  const auditEvents =
    kind === 'auditEvents'
      ? [...(patch.auditEvents ?? []), audit]
      : [audit, ...document.auditEvents];

  return {
    ok: true,
    result: { archived },
    document: {
      ...document,
      ...patch,
      auditEvents,
      updatedAt: at,
    },
  };
}
