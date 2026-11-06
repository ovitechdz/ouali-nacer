import type { FarmDocument } from '@/domain/types';

/**
 * The single persistence boundary. The MVP ships an in-memory adapter for
 * tests and exercises; IndexedDB arrives in phase 4 behind the same contract.
 */
export interface FarmRepository {
  load(): Promise<FarmDocument | null>;
  save(document: FarmDocument): Promise<void>;
  clear(): Promise<void>;
}
