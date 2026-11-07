import { describe, expect, it } from 'vitest';

import type { FarmRepository } from '@/ports/repository';

import { makeAnimal, makeDocument, makeWeight } from './factories';

/**
 * Shared persistence contract: every adapter must satisfy it identically.
 * Call it from an adapter test; it creates a fresh store per case.
 */
export function describeRepositoryContract(name: string, create: () => FarmRepository): void {
  describe(`${name} contract`, () => {
    it('starts empty', async () => {
      const repository = create();
      await expect(repository.load()).resolves.toBeNull();
    });

    it('round-trips a complete farm document', async () => {
      const repository = create();
      const document = makeDocument({
        animals: [makeAnimal()],
        weights: [makeWeight()],
      });
      await repository.save(document);
      await expect(repository.load()).resolves.toEqual(document);
    });

    it('overwrites the previous document atomically', async () => {
      const repository = create();
      await repository.save(makeDocument({ farmId: 'farm-1' }));
      const next = makeDocument({ farmId: 'farm-2', updatedAt: '2026-09-01T00:00:00.000Z' });
      await repository.save(next);
      await expect(repository.load()).resolves.toEqual(next);
    });

    it('returns a defensive copy', async () => {
      const repository = create();
      const document = makeDocument({ animals: [makeAnimal()] });
      await repository.save(document);
      document.animals[0]!.code = 'MUTATED';

      const loaded = await repository.load();
      expect(loaded?.animals[0]!.code).toBe('OV-2401');

      if (loaded) loaded.animals[0]!.code = 'MUTATED-TOO';
      await expect(repository.load()).resolves.toEqual(makeDocument({ animals: [makeAnimal()] }));
    });

    it('clears the document', async () => {
      const repository = create();
      await repository.save(makeDocument());
      await repository.clear();
      await expect(repository.load()).resolves.toBeNull();
    });

    it('can clear an empty store', async () => {
      const repository = create();
      await expect(repository.clear()).resolves.toBeUndefined();
      await expect(repository.load()).resolves.toBeNull();
    });
  });
}
