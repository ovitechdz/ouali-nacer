/**
 * Minimal IndexedDB double for adapter tests. It implements only the subset the
 * repository uses: open/upgrade, one transaction, get/put/delete and completion
 * events, all scheduled through microtasks like the real API.
 */

type Handler = ((event: unknown) => void) | null;

class FakeRequest<T> {
  result!: T;
  error: DOMException | null = null;
  onsuccess: Handler = null;
  onerror: Handler = null;
  onblocked: Handler = null;
  onupgradeneeded: ((event: { oldVersion: number; newVersion: number | null }) => void) | null =
    null;
}

class FakeTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  error: DOMException | null = null;

  private pending = 0;
  private finished = false;

  constructor(private readonly stores: Map<string, Map<IDBValidKey, unknown>>) {}

  objectStore(name: string): FakeObjectStore {
    const data = this.stores.get(name);
    if (!data) throw new DOMException(`Store ${name} not found`, 'NotFoundError');
    return new FakeObjectStore(data, this);
  }

  track<T>(run: () => T): FakeRequest<T> {
    const request = new FakeRequest<T>();
    this.pending += 1;
    queueMicrotask(() => {
      try {
        request.result = run();
        request.onsuccess?.({ target: request });
      } catch (error) {
        request.error =
          error instanceof DOMException ? error : new DOMException(String(error), 'UnknownError');
        request.onerror?.({ target: request });
      } finally {
        this.pending -= 1;
        this.completeIfIdle();
      }
    });
    return request;
  }

  private completeIfIdle(): void {
    if (this.pending === 0 && !this.finished) {
      this.finished = true;
      queueMicrotask(() => this.oncomplete?.());
    }
  }
}

class FakeObjectStore {
  constructor(
    private readonly data: Map<IDBValidKey, unknown>,
    private readonly transaction: FakeTransaction,
  ) {}

  get(key: IDBValidKey): IDBRequest<unknown> {
    return this.transaction.track(() => this.data.get(key)) as unknown as IDBRequest<unknown>;
  }

  put(value: unknown, key: IDBValidKey): IDBRequest<IDBValidKey> {
    return this.transaction.track(() => {
      this.data.set(key, structuredClone(value));
      return key;
    }) as unknown as IDBRequest<IDBValidKey>;
  }

  delete(key: IDBValidKey): IDBRequest<undefined> {
    return this.transaction.track(() => {
      this.data.delete(key);
      return undefined;
    }) as unknown as IDBRequest<undefined>;
  }
}

class FakeDatabase {
  readonly stores = new Map<string, Map<IDBValidKey, unknown>>();
  readonly objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
    get length() {
      return 0;
    },
    item: () => null,
  };

  createObjectStore(name: string): void {
    if (!this.stores.has(name)) this.stores.set(name, new Map());
  }

  transaction(names: string | string[]): IDBTransaction {
    const selected = new Map<string, Map<IDBValidKey, unknown>>();
    for (const name of Array.isArray(names) ? names : [names]) {
      const store = this.stores.get(name);
      if (!store) throw new DOMException(`Store ${name} not found`, 'NotFoundError');
      selected.set(name, store);
    }
    return new FakeTransaction(selected) as unknown as IDBTransaction;
  }

  close(): void {
    // Nothing to release in the double.
  }
}

export class FakeIndexedDbFactory {
  private readonly databases = new Map<string, { database: FakeDatabase; version: number }>();

  open(name: string, version?: number): IDBOpenDBRequest {
    const request = new FakeRequest<FakeDatabase>();
    queueMicrotask(() => {
      const existing = this.databases.get(name);
      const oldVersion = existing?.version ?? 0;
      const nextVersion = version ?? (oldVersion === 0 ? 1 : oldVersion);
      if (nextVersion < oldVersion) {
        request.error = new DOMException('Version error', 'VersionError');
        request.onerror?.({ target: request });
        return;
      }

      const database = existing?.database ?? new FakeDatabase();
      if (!existing) this.databases.set(name, { database, version: nextVersion });
      request.result = database;

      if (nextVersion > oldVersion) {
        const entry = this.databases.get(name);
        if (entry) entry.version = nextVersion;
        request.onupgradeneeded?.({ oldVersion, newVersion: nextVersion });
      }
      request.onsuccess?.({ target: request });
    });
    return request as unknown as IDBOpenDBRequest;
  }

  deleteDatabase(name: string): IDBOpenDBRequest {
    const request = new FakeRequest<undefined>();
    queueMicrotask(() => {
      this.databases.delete(name);
      request.onsuccess?.({ target: request });
    });
    return request as unknown as IDBOpenDBRequest;
  }
}

export function createFakeIndexedDb(): IDBFactory {
  return new FakeIndexedDbFactory() as unknown as IDBFactory;
}
