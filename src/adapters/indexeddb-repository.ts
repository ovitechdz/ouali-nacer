import { CURRENT_SCHEMA_VERSION, farmDocumentSchema, type FarmDocument } from '@/domain/types';
import { migrateDocument } from '@/domain/migrations';
import type { FarmRepository } from '@/ports/repository';

export const DB_NAME = 'ovitech';
export const DB_VERSION = 3;
export const STATE_STORE = 'state';
export const META_STORE = 'meta';
export const PHOTOS_STORE = 'photos';
export const OUTBOX_STORE = 'outbox';
const CURRENT_KEY = 'current';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

/**
 * IndexedDB adapter over a single `FarmDocument`. Writes are transactional and
 * every read runs the migration chain, so an older on-device document upgrades
 * on first load instead of failing.
 */
export class IndexedDbFarmRepository implements FarmRepository {
  private database: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly factory?: IDBFactory,
    private readonly databaseName: string = DB_NAME,
  ) {}

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    const factory = this.factory ?? globalThis.indexedDB;
    if (!factory) return Promise.reject(new Error('IndexedDB is unavailable'));

    this.database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(this.databaseName, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        for (const store of [STATE_STORE, META_STORE, PHOTOS_STORE, OUTBOX_STORE]) {
          if (!database.objectStoreNames.contains(store)) database.createObjectStore(store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
      request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));
    });
    return this.database;
  }

  async load(): Promise<FarmDocument | null> {
    const database = await this.open();
    const transaction = database.transaction(STATE_STORE, 'readonly');
    const read = transaction.objectStore(STATE_STORE).get(CURRENT_KEY);
    const [value] = await Promise.all([requestResult(read), transactionDone(transaction)]);
    if (value === undefined || value === null) return null;

    let raw: unknown = value;
    if (typeof value === 'string') {
      try {
        raw = JSON.parse(value);
      } catch {
        throw new Error('Stored farm document is not valid JSON');
      }
    }

    const migration = migrateDocument(raw, new Date());
    if (migration.applied.length > 0) await this.save(migration.document);
    return migration.document;
  }

  async save(document: FarmDocument): Promise<void> {
    const parsed = farmDocumentSchema.safeParse(document);
    if (!parsed.success) throw new Error('Refusing to persist an invalid farm document');

    const database = await this.open();
    const transaction = database.transaction([STATE_STORE, META_STORE], 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(STATE_STORE).put(JSON.stringify(parsed.data), CURRENT_KEY);
    transaction
      .objectStore(META_STORE)
      .put({ value: String(CURRENT_SCHEMA_VERSION), updatedAt: parsed.data.updatedAt }, 'schema');
    await done;
  }

  async clear(): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction([STATE_STORE, META_STORE], 'readwrite');
    const done = transactionDone(transaction);
    transaction.objectStore(STATE_STORE).delete(CURRENT_KEY);
    transaction.objectStore(META_STORE).delete('schema');
    await done;
  }

  async close(): Promise<void> {
    if (!this.database) return;
    const database = await this.database;
    database.close();
    this.database = null;
  }
}
