import type { FarmDocument } from '@/domain/types';

export const BACKUP_FORMAT = 'ovitech-backup';
export const BACKUP_VERSION = 2;

export interface BackupEncryption {
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  schemaVersion: number;
  engineVersion: string;
  exportedAt: string;
  app: { name: string; build: string };
  checksum: string;
  encryption: BackupEncryption | null;
  state: FarmDocument | null;
}

export interface BackupCounts {
  animals: number;
  weights: number;
  healthEvents: number;
  recommendations: number;
  feedLots: number;
  auditEvents: number;
  signoffs: number;
}

export interface BackupPreview {
  schemaVersion: number;
  engineVersion: string;
  exportedAt: string;
  encrypted: boolean;
  counts: BackupCounts;
  dateRange: { from: string | null; to: string | null };
  engineVersions: string[];
  diff: BackupCounts | null;
}

export interface BackupOptions {
  passphrase?: string;
  exportedAt?: string;
  app?: { name: string; build: string };
}

export interface BackupPreviewOptions extends BackupOptions {
  current?: FarmDocument | null;
}

/**
 * Serialises and validates backups. v1 files (reference format) are accepted
 * and migrated; v2 files carry a schema gate, a SHA-256 checksum and optional
 * passphrase encryption.
 */
export interface BackupCodec {
  encode(document: FarmDocument, options?: BackupOptions): Promise<string>;
  decode(raw: string, options?: BackupOptions): Promise<FarmDocument>;
  preview(raw: string, options?: BackupPreviewOptions): Promise<BackupPreview>;
}
