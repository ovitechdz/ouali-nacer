import { describe, expect, it, vi } from 'vitest';

import type { FarmDocument } from '@/domain/types';
import type { FarmRepository } from '@/ports/repository';
import { makeDocument } from '@/test/factories';

import { MemoryFarmRepository } from './memory-repository';
import { ResilientFarmRepository } from './resilient-repository';

function quotaError(): Error {
  const error = new Error('quota');
  error.name = 'QuotaExceededError';
  return error;
}

function failingRepository(error: Error): FarmRepository {
  return {
    load: vi.fn(async () => {
      throw error;
    }),
    save: vi.fn(async () => {
      throw error;
    }),
    clear: vi.fn(async () => {
      throw error;
    }),
  };
}

describe('ResilientFarmRepository', () => {
  it('uses IndexedDB when the primary works', async () => {
    const primary = new MemoryFarmRepository();
    const repository = new ResilientFarmRepository(primary, new MemoryFarmRepository());
    const document = makeDocument({ farmId: 'primary' });
    await repository.save(document);
    expect(repository.mode).toBe('indexeddb');
    expect(repository.storageIssue).toBeNull();
    expect(await repository.load()).toEqual(document);
  });

  it('keeps working in memory and flags a quota failure', async () => {
    const fallback = new MemoryFarmRepository();
    const repository = new ResilientFarmRepository(failingRepository(quotaError()), fallback);
    const document = makeDocument({ farmId: 'quota' });

    await expect(repository.save(document)).resolves.toBeUndefined();
    expect(repository.mode).toBe('memory');
    expect(repository.storageIssue).toBe('quota');
    expect(await fallback.load()).toEqual(document);
    expect(await repository.load()).toEqual(document);
  });

  it('marks a generic platform failure as unavailable, not quota', async () => {
    const repository = new ResilientFarmRepository(
      failingRepository(new Error('IndexedDB is unavailable')),
      new MemoryFarmRepository(),
    );
    await repository.save(makeDocument());
    expect(repository.mode).toBe('memory');
    expect(repository.storageIssue).toBe('unavailable');
  });

  it('falls back on load and clear', async () => {
    const repository = new ResilientFarmRepository(
      failingRepository(new Error('blocked')),
      new MemoryFarmRepository(),
    );
    const document: FarmDocument = makeDocument();
    await repository.save(document);
    expect(await repository.load()).toEqual(document);
    await repository.clear();
    expect(await repository.load()).toBeNull();
  });
});
