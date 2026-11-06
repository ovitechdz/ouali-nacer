import { describe, expect, it } from 'vitest';

import { FARM_SCHEMA_VERSION, farmDocumentSchema } from './types';

describe('farmDocumentSchema', () => {
  it('accepts the current schema', () => {
    const result = farmDocumentSchema.safeParse({
      schemaVersion: FARM_SCHEMA_VERSION,
      updatedAt: '2026-11-06T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown schema version', () => {
    const result = farmDocumentSchema.safeParse({
      schemaVersion: 999,
      updatedAt: '2026-11-06T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed timestamp', () => {
    const result = farmDocumentSchema.safeParse({
      schemaVersion: FARM_SCHEMA_VERSION,
      updatedAt: 'yesterday',
    });
    expect(result.success).toBe(false);
  });
});
