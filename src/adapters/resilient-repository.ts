import type { FarmDocument } from '@/domain/types';
import type { FarmRepository } from '@/ports/repository';

export type StorageMode = 'indexeddb' | 'memory';
export type StorageIssue = 'quota' | 'unavailable';

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: unknown }).name;
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

/**
 * Prefers IndexedDB and degrades to memory when the platform refuses it
 * (private mode, blocked upgrade, disabled storage). A successful read is kept
 * in memory so a later write failure does not lose the session's data. The
 * active mode is exposed so the UI can tell the operator that data will not
 * survive a reload.
 *
 * A quota failure is distinguished from a generic unavailability: the write
 * still succeeds in memory, but the UI must offer the backup/free-space path
 * instead of silently pretending the data is durable.
 */
export class ResilientFarmRepository implements FarmRepository {
  private degraded = false;
  private issue: StorageIssue | null = null;
  private last: FarmDocument | null = null;

  constructor(
    private readonly primary: FarmRepository,
    private readonly fallback: FarmRepository,
  ) {}

  get mode(): StorageMode {
    return this.degraded ? 'memory' : 'indexeddb';
  }

  get storageIssue(): StorageIssue | null {
    return this.issue;
  }

  async load(): Promise<FarmDocument | null> {
    if (!this.degraded) {
      try {
        const document = await this.primary.load();
        this.last = document;
        return document;
      } catch {
        this.degrade('unavailable');
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
      } catch (error) {
        this.degrade(isQuotaError(error) ? 'quota' : 'unavailable', document);
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
        this.degrade('unavailable');
      }
    }
    await this.fallback.clear();
  }

  private degrade(issue: StorageIssue, document: FarmDocument | null = this.last): void {
    this.degraded = true;
    this.issue = issue;
    this.last = document;
    if (document) void this.fallback.save(document);
  }
}
