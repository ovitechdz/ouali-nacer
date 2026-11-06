import type { FarmDocument } from '@/domain/types';
import type { FarmRepository } from '@/ports/repository';

/** Deterministic in-memory adapter used by tests and phase-3 wiring. */
export class MemoryFarmRepository implements FarmRepository {
  private document: FarmDocument | null = null;

  async load(): Promise<FarmDocument | null> {
    return this.document === null ? null : structuredClone(this.document);
  }

  async save(document: FarmDocument): Promise<void> {
    this.document = structuredClone(document);
  }

  async clear(): Promise<void> {
    this.document = null;
  }
}
