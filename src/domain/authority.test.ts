import { describe, expect, it } from 'vitest';

import { makeApproved, makeRecommendation } from '@/test/factories';

import {
  AUTHORITY_MATRIX,
  authorize,
  canApprove,
  canServeWithAuthority,
  type AuthorityAction,
  type Decision,
} from './authority';
import { AUTHORITIES, type Authority } from './types';

const ACTIONS = Object.keys(AUTHORITY_MATRIX) as AuthorityAction[];

function denial(decision: Decision) {
  if (decision.allowed) throw new Error('expected the action to be denied');
  return decision.reason;
}

describe('authority matrix', () => {
  it('is tested cell by cell', () => {
    for (const action of ACTIONS) {
      for (const authority of AUTHORITIES) {
        const expected = AUTHORITY_MATRIX[action].includes(authority);
        expect(authorize(action, authority).allowed, `${action}/${authority}`).toBe(expected);
      }
    }
  });

  it('allows only production to approve', () => {
    expect(authorize('approve', 'production')).toEqual({ allowed: true });
    expect(denial(authorize('approve', 'field'))).toEqual({
      key: 'domain.ration.requiresProduction',
    });
  });

  it('allows both authorities to serve and record field work', () => {
    for (const action of ['serve', 'serve-pen', 'record-weight', 'run-engine'] as const) {
      expect(authorize(action, 'field').allowed).toBe(true);
      expect(authorize(action, 'production').allowed).toBe(true);
    }
  });

  it('restricts archival and settings to production', () => {
    expect(authorize('archive', 'production').allowed).toBe(true);
    expect(authorize('change-settings', 'production').allowed).toBe(true);
    expect(denial(authorize('archive', 'field')).key).toBe('domain.error.forbidden');
    expect(denial(authorize('change-settings', 'field')).key).toBe('domain.error.forbidden');
  });
});

describe('canApprove', () => {
  it('approves a fresh emitted recommendation with production authority', () => {
    expect(canApprove(makeRecommendation(), 'production')).toEqual({ allowed: true });
  });

  it('rejects a field operator', () => {
    expect(canApprove(makeRecommendation(), 'field').allowed).toBe(false);
  });

  it('rejects an absent or refused recommendation', () => {
    expect(denial(canApprove(undefined, 'production')).key).toBe('domain.ration.noRation');
    expect(denial(canApprove(makeRecommendation({ ration: null }), 'production')).key).toBe(
      'domain.error.refused',
    );
  });

  it('rejects an already approved recommendation', () => {
    expect(denial(canApprove(makeApproved(), 'production')).key).toBe(
      'domain.error.alreadyApproved',
    );
  });
});

describe('canServeWithAuthority', () => {
  const authorities: Authority[] = ['field', 'production'];

  it('lets both authorities serve an approved ration', () => {
    for (const authority of authorities) {
      expect(canServeWithAuthority(makeApproved(), authority)).toEqual({ allowed: true });
    }
  });

  it('requires approval before serving', () => {
    expect(denial(canServeWithAuthority(makeRecommendation(), 'production')).key).toBe(
      'domain.ration.approvalRequired',
    );
  });

  it('rejects a refused or served recommendation', () => {
    expect(denial(canServeWithAuthority(makeRecommendation({ ration: null }), 'field')).key).toBe(
      'domain.ration.refused',
    );
    expect(
      denial(
        canServeWithAuthority(
          makeApproved({ servedAt: '2026-08-28T10:00:00.000Z', stocksDeducted: true }),
          'field',
        ),
      ).key,
    ).toBe('domain.ration.alreadyServed');
  });
});
