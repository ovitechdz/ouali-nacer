import type { FarmDocument } from '@/domain/types';
import { CURRENT_SCHEMA_VERSION, ENGINE_VERSION, farmDocumentSchema } from '@/domain/types';
import { MigrationError, migrateDocument } from '@/domain/migrations';
import type { MessageDescriptor } from '@/domain/messages';
import type {
  BackupCodec,
  BackupCounts,
  BackupEnvelope,
  BackupOptions,
  BackupPreview,
  BackupPreviewOptions,
} from '@/ports/backup';
import { BACKUP_FORMAT, BACKUP_VERSION } from '@/ports/backup';

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();
const DEFAULT_APP = { name: 'OVITECH', build: '0.1.0' };
const PBKDF2_ITERATIONS = 210_000;

export type BackupErrorCode =
  'format' | 'version' | 'checksum' | 'structure' | 'newer-schema' | 'encrypted' | 'passphrase';

export class BackupError extends Error {
  readonly code: BackupErrorCode;
  readonly key: MessageDescriptor['key'];

  constructor(code: BackupErrorCode, key: MessageDescriptor['key'], detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'BackupError';
    this.code = code;
    this.key = key;
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array {
  if (value.length % 2 !== 0 || /[^0-9a-f]/i.test(value)) {
    throw new BackupError('structure', 'domain.error.malformed');
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', ENCODER.encode(input));
  return toHex(new Uint8Array(digest));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await globalThis.crypto.subtle.importKey(
    'raw',
    ENCODER.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function canonical(document: FarmDocument): string {
  return JSON.stringify(document);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function migrate(raw: unknown, now: Date): FarmDocument {
  try {
    return migrateDocument(raw, now).document;
  } catch (error) {
    if (error instanceof MigrationError) {
      if (error.code === 'newer-schema') {
        throw new BackupError('newer-schema', 'domain.backup.schemaNewer');
      }
      throw new BackupError('structure', error.key);
    }
    throw error;
  }
}

async function decodeLegacyV1(payload: Record<string, unknown>, now: Date): Promise<FarmDocument> {
  if (!isRecord(payload.state)) {
    throw new BackupError('structure', 'domain.error.malformed');
  }
  if (typeof payload.checksum === 'string' && payload.checksum !== '') {
    const expected = await sha256Hex(JSON.stringify(payload.state));
    if (expected !== payload.checksum) {
      throw new BackupError('checksum', 'domain.backup.checksum');
    }
  }
  return migrate(payload.state, now);
}

/** v2 codec: deterministic envelope, checksum, schema gate, optional AES-GCM. */
export class JsonBackupCodec implements BackupCodec {
  async encode(document: FarmDocument, options: BackupOptions = {}): Promise<string> {
    const parsed = farmDocumentSchema.safeParse(document);
    if (!parsed.success) {
      throw new BackupError('structure', 'domain.error.invalidDocument');
    }
    const state = parsed.data;
    const serialized = canonical(state);
    const checksum = await sha256Hex(serialized);
    const exportedAt = options.exportedAt ?? new Date().toISOString();
    const app = options.app ?? DEFAULT_APP;

    let encryption: BackupEnvelope['encryption'] = null;
    let payload: FarmDocument | null = state;

    if (options.passphrase !== undefined && options.passphrase !== '') {
      const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
      const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(options.passphrase, salt);
      const cipher = await globalThis.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        ENCODER.encode(serialized),
      );
      encryption = {
        algorithm: 'AES-256-GCM',
        kdf: 'PBKDF2-SHA-256',
        iterations: PBKDF2_ITERATIONS,
        salt: toHex(salt),
        iv: toHex(iv),
        data: toHex(new Uint8Array(cipher)),
      };
      payload = null;
    }

    const envelope: BackupEnvelope = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      exportedAt,
      app,
      checksum,
      encryption,
      state: payload,
    };
    return JSON.stringify(envelope, null, 2);
  }

  async decode(raw: string, options: BackupOptions = {}): Promise<FarmDocument> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BackupError('structure', 'domain.error.malformed');
    }
    if (!isRecord(parsed)) throw new BackupError('structure', 'domain.error.malformed');
    if (parsed.format !== BACKUP_FORMAT) throw new BackupError('format', 'domain.backup.format');

    const now = new Date();
    if (parsed.version === 1) return decodeLegacyV1(parsed, now);
    if (parsed.version !== BACKUP_VERSION) {
      throw new BackupError('version', 'domain.backup.version');
    }

    const schemaVersion = parsed.schemaVersion;
    if (typeof schemaVersion === 'number' && schemaVersion > CURRENT_SCHEMA_VERSION) {
      throw new BackupError('newer-schema', 'domain.backup.schemaNewer');
    }
    if (typeof parsed.checksum !== 'string' || parsed.checksum === '') {
      throw new BackupError('checksum', 'domain.backup.checksum');
    }

    const encryption = parsed.encryption;
    let state: unknown;
    if (encryption !== null && encryption !== undefined) {
      if (options.passphrase === undefined || options.passphrase === '') {
        throw new BackupError('passphrase', 'domain.backup.passphraseRequired');
      }
      if (!isRecord(encryption) || typeof encryption.data !== 'string') {
        throw new BackupError('structure', 'domain.error.malformed');
      }
      const key = await deriveKey(options.passphrase, fromHex(String(encryption.salt)));
      let plain: ArrayBuffer;
      try {
        plain = await globalThis.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: fromHex(String(encryption.iv)) as unknown as BufferSource },
          key,
          fromHex(encryption.data) as unknown as BufferSource,
        );
      } catch {
        throw new BackupError('passphrase', 'domain.backup.passphraseRequired');
      }
      const serialized = DECODER.decode(plain);
      if ((await sha256Hex(serialized)) !== parsed.checksum) {
        throw new BackupError('checksum', 'domain.backup.checksum');
      }
      try {
        state = JSON.parse(serialized);
      } catch {
        throw new BackupError('structure', 'domain.error.malformed');
      }
    } else {
      if (!isRecord(parsed.state)) {
        throw new BackupError('structure', 'domain.error.malformed');
      }
      if ((await sha256Hex(JSON.stringify(parsed.state))) !== parsed.checksum) {
        throw new BackupError('checksum', 'domain.backup.checksum');
      }
      state = parsed.state;
    }

    return migrate(state, now);
  }

  async preview(raw: string, options: BackupPreviewOptions = {}): Promise<BackupPreview> {
    const document = await this.decode(raw, options);
    let header: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(raw);
      if (isRecord(parsed)) header = parsed;
    } catch {
      header = {};
    }
    const counts = countDocument(document);
    const dates = [
      ...document.weights.map((record) => record.at),
      ...document.healthEvents.map((event) => event.at),
      ...document.recommendations.map((rec) => rec.createdAt),
      ...document.auditEvents.map((event) => event.at),
    ].sort();

    let diff: BackupCounts | null = null;
    if (options.current) {
      const current = countDocument(options.current);
      diff = {
        animals: counts.animals - current.animals,
        weights: counts.weights - current.weights,
        healthEvents: counts.healthEvents - current.healthEvents,
        recommendations: counts.recommendations - current.recommendations,
        feedLots: counts.feedLots - current.feedLots,
        auditEvents: counts.auditEvents - current.auditEvents,
        signoffs: counts.signoffs - current.signoffs,
      };
    }

    return {
      schemaVersion:
        typeof header.schemaVersion === 'number' ? header.schemaVersion : document.schemaVersion,
      engineVersion: document.settings.engineVersion,
      exportedAt: typeof header.exportedAt === 'string' ? header.exportedAt : '',
      encrypted: header.encryption !== null && header.encryption !== undefined,
      counts,
      dateRange: { from: dates[0] ?? null, to: dates[dates.length - 1] ?? null },
      engineVersions: [...new Set(document.recommendations.map((rec) => rec.engineVersion))].sort(),
      diff,
    };
  }
}

export function countDocument(document: FarmDocument): BackupCounts {
  return {
    animals: document.animals.length,
    weights: document.weights.length,
    healthEvents: document.healthEvents.length,
    recommendations: document.recommendations.length,
    feedLots: document.feedLots.length,
    auditEvents: document.auditEvents.length,
    signoffs: document.signoffs.length,
  };
}
