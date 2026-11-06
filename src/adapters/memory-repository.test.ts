import { describe, expect, it } from 'vitest';

import { FARM_SCHEMA_VERSION, type FarmDocument } from '@/domain/types';

import { MemoryFarmRepository } from './memory-repository';

const document: FarmDocument = {
  schemaVersion: FARM_SCHEMA_VERSION,
  updatedAt: '2026-11-06T00:00:00.000Z',
};

describe('MemoryFarmRepository', () => {
  it('starts empty', async () => {
    const repository = new MemoryFarmRepository();
    await expect(repository.load()).resolves.toBeNull();
  });

  it('round-trips a farm document', async () => {
    const repository = new MemoryFarmRepository();
    await repository.save(document);
    await expect(repository.load()).resolves.toEqual(document);
  });

  it('returns defensive copies', async () => {
    const repository = new MemoryFarmRepository();
    const source = { ...document };
    await repository.save(source);
    source.updatedAt = '2020-01-01T00:00:00.000Z';

    const loaded = await repository.load();
    expect(loaded?.updatedAt).toBe(document.updatedAt);

    if (loaded) loaded.updatedAt = '2021-01-01T00:00:00.000Z';
    await expect(repository.load()).resolves.toEqual(document);
  });

  it('clears the document', async () => {
    const repository = new MemoryFarmRepository();
    await repository.save(document);
    await repository.clear();
    await expect(repository.load()).resolves.toBeNull();
  });
});
