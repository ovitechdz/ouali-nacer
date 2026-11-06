import type { FarmDocument } from '@/domain/types';

export const BACKUP_FORMAT = 'ovitech-backup';
export const BACKUP_VERSION = 2;

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  schemaVersion: number;
  engineVersion: string;
  exportedAt: string;
  app: { name: string; build: string };
  checksum: string;
  encryption: null | { algorithm: 'AES-256-GCM'; kdf: 'PBKDF2-SHA-256' };
  state: FarmDocument;
}

/**
 * Serialises and validates backups. No implementation ships in phase 3; the
 * contract is frozen now so the persistence format does not drift later.
 */
export interface BackupCodec {
  encode(document: FarmDocument): Promise<string>;
  decode(raw: string): Promise<FarmDocument>;
}
