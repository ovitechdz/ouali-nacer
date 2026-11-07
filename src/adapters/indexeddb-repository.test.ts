import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { makeDocument } from '@/test/factories';
import { createFakeIndexedDb } from '@/test/fake-indexeddb';
import { describeRepositoryContract } from '@/test/repository-contract';

import {
  DB_VERSION,
  IndexedDbFarmRepository,
  META_STORE,
  OUTBOX_STORE,
  PHOTOS_STORE,
  STATE_STORE,
} from './indexeddb-repository';

const FIXTURES = path.resolve('src/data/fixtures/migrations');

function v4Fixture(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, 'v4.json'), 'utf8'));
}

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const store of [STATE_STORE, META_STORE, PHOTOS_STORE, OUTBOX_STORE]) {
        if (!database.objectStoreNames.contains(store)) database.createObjectStore(store);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Writes a raw payload as if a previous application version had left it there. */
async function seedRaw(factory: IDBFactory, name: string, value: unknown): Promise<void> {
  const database = await openDatabase(factory, name);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE, 'readwrite');
    transaction.objectStore(STATE_STORE).put(value, 'current');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

function createRepository(name = 'ovitech-test'): IndexedDbFarmRepository {
  return new IndexedDbFarmRepository(createFakeIndexedDb(), name);
}

describeRepositoryContract('IndexedDbFarmRepository', () => createRepository());

describe('IndexedDbFarmRepository', () => {
  it('migrates a v4 document found on the device and persists the upgrade', async () => {
    const factory = createFakeIndexedDb();
    await seedRaw(factory, 'migrating', JSON.stringify(v4Fixture()));
    const repository = new IndexedDbFarmRepository(factory, 'migrating');

    const document = await repository.load();
    expect(document?.schemaVersion).toBe(5);
    expect(document?.recommendations[0]!.approvedBy).not.toBeNull();
    await expect(repository.load()).resolves.toEqual(document);
    await repository.close();
  });

  it('accepts an already-parsed stored object', async () => {
    const factory = createFakeIndexedDb();
    await seedRaw(factory, 'object', v4Fixture());
    const repository = new IndexedDbFarmRepository(factory, 'object');
    const document = await repository.load();
    expect(document?.schemaVersion).toBe(5);
    await repository.close();
  });

  it('rejects a stored string that is not valid JSON', async () => {
    const factory = createFakeIndexedDb();
    await seedRaw(factory, 'corrupt', '{not json');
    const repository = new IndexedDbFarmRepository(factory, 'corrupt');
    await expect(repository.load()).rejects.toThrow('Stored farm document is not valid JSON');
    await repository.close();
  });

  it('refuses to persist an invalid document', async () => {
    const repository = createRepository('invalid');
    await expect(repository.save({ ...makeDocument(), farmId: '' })).rejects.toThrow(
      'Refusing to persist an invalid farm document',
    );
    await expect(repository.load()).resolves.toBeNull();
    await repository.close();
  });

  it('reopens after close', async () => {
    const repository = createRepository('reopen');
    await repository.save(makeDocument({ farmId: 'farm-reopen' }));
    await repository.close();
    await expect(repository.load()).resolves.toMatchObject({ farmId: 'farm-reopen' });
    await repository.close();
  });

  it('shares state between two connections to the same database', async () => {
    const factory = createFakeIndexedDb();
    const first = new IndexedDbFarmRepository(factory, 'shared');
    const second = new IndexedDbFarmRepository(factory, 'shared');
    await first.save(makeDocument({ farmId: 'farm-shared' }));
    await expect(second.load()).resolves.toMatchObject({ farmId: 'farm-shared' });
    await first.close();
    await second.close();
  });
});
