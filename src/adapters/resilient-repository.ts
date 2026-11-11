import type { FarmDocument } from '@/domain/types';
import type { FarmRepository } from '@/ports/repository';

export type StorageMode = 'indexeddb' | 'memory';

/**
 * Prefers IndexedDB and degrades to memory when the platform refuses it
 * (private mode, blocked upgrade, disabled storage). A successful read is kept
 * in memory so a later write failure does not lose the session's data. The
 * active mode is exposed so the UI can tell the operator that data will not
 * survive a reload.
 */
export class ResilientFarmRepository implements FarmRepository {
  private degraded = false;
  private last: FarmDocument | null = null;

  constructor(
    private readonly primary: FarmRepository,
    private readonly fallback: FarmRepository,
  ) {}

  get mode(): StorageMode {
    return this.degraded ? 'memory' : 'indexeddb';
  }

  async load(): Promise<FarmDocument | null> {
    if (!this.degraded) {
      try {
        const document = await this.primary.load();
        this.last = document;
        return document;
      } catch {
        this.degrade();
      }
    }
    const document = await this.fallback.load();
    return document ?? this.last;
  }

  async save(document: FarmDocument): Promise<void> {
    if (!this.degraded) {
      try {
        await this.primary.save(document);
        this.last = document;
        return;
      } catch {
        this.degrade(document);
      }
    }
    await this.fallback.save(document);
    this.last = document;
  }

  async clear(): Promise<void> {
    this.last = null;
    if (!this.degraded) {
      try {
        await this.primary.clear();
        return;
      } catch {
        this.degrade();
      }
    }
    await this.fallback.clear();
  }

  private degrade(document: FarmDocument | null = this.last): void {
    this.degraded = true;
    this.last = document;
    if (document) void this.fallback.save(document);
  }
}
