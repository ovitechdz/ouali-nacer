import type { MessageDescriptor } from './messages';
import type { Authority, NutritionRec } from './types';
import { message } from './types';
import { canServe } from './ration';

export type AuthorityAction =
  | 'approve'
  | 'serve'
  | 'serve-pen'
  | 'manage-feed'
  | 'register-animal'
  | 'record-weight'
  | 'run-engine'
  | 'archive'
  | 'change-settings'
  | 'sign-protocol';

/**
 * The authority matrix, tested cell by cell. Authority is a local UX boundary,
 * not a security boundary: there is no server and no account.
 */
export const AUTHORITY_MATRIX: Record<AuthorityAction, readonly Authority[]> = {
  approve: ['production'],
  serve: ['field', 'production'],
  'serve-pen': ['field', 'production'],
  'manage-feed': ['field', 'production'],
  'register-animal': ['field', 'production'],
  'record-weight': ['field', 'production'],
  'run-engine': ['field', 'production'],
  archive: ['production'],
  'change-settings': ['production'],
  'sign-protocol': ['production'],
};

export type Decision = { allowed: true } | { allowed: false; reason: MessageDescriptor };

export function authorize(action: AuthorityAction, authority: Authority): Decision {
  if (AUTHORITY_MATRIX[action].includes(authority)) return { allowed: true };
  if (action === 'approve') {
    return { allowed: false, reason: message('domain.ration.requiresProduction') };
  }
  return { allowed: false, reason: message('domain.error.forbidden', { action }) };
}

/** Approval gate: production authority, an emitted ration, not already approved. */
export function canApprove(rec: NutritionRec | null | undefined, authority: Authority): Decision {
  const gate = authorize('approve', authority);
  if (!gate.allowed) return gate;
  if (!rec) return { allowed: false, reason: message('domain.ration.noRation') };
  if (rec.ration === null) return { allowed: false, reason: message('domain.error.refused') };
  if (rec.approvedBy !== null) {
    return { allowed: false, reason: message('domain.error.alreadyApproved') };
  }
  return { allowed: true };
}

/** Serving gate: authority, approval, coverage and not-already-served. */
export function canServeWithAuthority(
  rec: NutritionRec | null | undefined,
  authority: Authority,
): Decision {
  const gate = authorize('serve', authority);
  if (!gate.allowed) return gate;
  const serve = canServe(rec);
  return serve.ok ? { allowed: true } : { allowed: false, reason: serve.reason! };
}
