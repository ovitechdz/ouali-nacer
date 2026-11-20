import { describe, expect, it } from 'vitest';

import { FarmService } from '@/application/farm-service';
import { CURRENT_SCHEMA_VERSION, ENGINE_VERSION, type FarmDocument } from '@/domain/types';
import { BACKUP_FORMAT, BACKUP_VERSION } from '@/ports/backup';
import { NOW, makeAnimal, makeDocument } from '@/test/factories';

import { BackupError, JsonBackupCodec, sha256Hex } from './backup-codec';
import { MemoryFarmRepository } from './memory-repository';
import { SystemClock } from './system-clock';
import { UlidGenerator } from './ulid-ids';

const codec = new JsonBackupCodec();

async function envelopeFor(state: unknown): Promise<string> {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    exportedAt: NOW.toISOString(),
    app: { name: 'OVITECH', build: '0.1.0' },
    checksum: await sha256Hex(JSON.stringify(state)),
    encryption: null,
    state,
  });
}

async function expectRejected(raw: string, passphrase?: string): Promise<BackupError> {
  try {
    await codec.decode(raw, { passphrase });
  } catch (error) {
    expect(error).toBeInstanceOf(BackupError);
    return error as BackupError;
  }
  throw new Error('expected a BackupError');
}

describe('backup import hardening', () => {
  it('rejects malformed JSON without changing the document', async () => {
    await expectRejected('{');
  });

  // These two cases build 100+ MB payloads; under the full CI coverage run
  // they can exceed Vitest's 20 s default even though they pass in isolation.
  it('rejects an oversized file before reading its state', async () => {
    const valid = JSON.parse(await codec.encode(makeDocument(), { exportedAt: NOW.toISOString() }));
    const oversized = JSON.stringify({
      ...valid,
      padding: 'x'.repeat(129 * 1024 * 1024),
    });
    const error = await expectRejected(oversized);
    expect(error.key).toBe('domain.error.importSize');
    expect(error.params).toEqual({ limit: 128 * 1024 * 1024 });
  }, 90_000);

  it('rejects an enormous array of animals', async () => {
    const animals = Array.from({ length: 200_001 }, (_, index) =>
      makeAnimal({ id: `an-${index}`, code: `OV-${index}` }),
    );
    const raw = await codec.encode(makeDocument({ animals }), { exportedAt: NOW.toISOString() });
    const error = await expectRejected(raw);
    expect(error.key).toBe('domain.error.importSize');
    expect(error.params).toEqual({ limit: 200_000 });
  }, 90_000);

  it('rejects a wrong schema version', async () => {
    const valid = JSON.parse(await codec.encode(makeDocument(), { exportedAt: NOW.toISOString() }));
    await expectRejected(JSON.stringify({ ...valid, schemaVersion: 99 }));
  });

  it('rejects a checksum mismatch', async () => {
    const valid = JSON.parse(await codec.encode(makeDocument(), { exportedAt: NOW.toISOString() }));
    const error = await expectRejected(
      JSON.stringify({ ...valid, state: { ...valid.state, farmId: 'other' } }),
    );
    expect(error.code).toBe('checksum');
  });

  it('rejects an AES-GCM wrong key', async () => {
    const raw = await codec.encode(makeDocument(), {
      passphrase: 'correct key',
      exportedAt: NOW.toISOString(),
    });
    await expectRejected(raw, 'wrong key');
  });

  it('rejects tampered ciphertext', async () => {
    const raw = await codec.encode(makeDocument(), {
      passphrase: 'correct key',
      exportedAt: NOW.toISOString(),
    });
    const envelope = JSON.parse(raw);
    const data = envelope.encryption.data as string;
    const flipped = data.startsWith('a') ? `b${data.slice(1)}` : `a${data.slice(1)}`;
    const error = await expectRejected(
      JSON.stringify({ ...envelope, encryption: { ...envelope.encryption, data: flipped } }),
      'correct key',
    );
    expect(error.code).toBe('passphrase');
  });

  it('does not let __proto__ or constructor keys pollute the prototype', async () => {
    const polluted = JSON.parse(
      JSON.stringify(makeDocument()).replace(
        '"schemaVersion":',
        '"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted":"yes"}},"schemaVersion":',
      ),
    ) as FarmDocument;
    const document = await codec.decode(await envelopeFor(polluted));
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(document).not.toHaveProperty('polluted');
    expect(document).not.toHaveProperty('constructor');
    expect(document.animals).toHaveLength(0);
  });

  it('rejects duplicated ids', async () => {
    const document = makeDocument({
      animals: [makeAnimal({ id: 'same-id' }), makeAnimal({ id: 'same-id', code: 'OV-2' })],
    });
    const error = await expectRejected(
      await codec.encode(document, { exportedAt: NOW.toISOString() }),
    );
    expect(error.code).toBe('structure');
    expect(error.key).toBe('domain.error.duplicate');
  });
});

describe('failed restore keeps the previous document', () => {
  it('never writes when decoding fails', async () => {
    const original = makeDocument({ animals: [makeAnimal()] });
    const repository = new MemoryFarmRepository();
    await repository.save(original);
    const farm = new FarmService({
      repository,
      clock: new SystemClock(),
      ids: new UlidGenerator(),
    });

    const valid = JSON.parse(await codec.encode(original, { exportedAt: NOW.toISOString() }));
    const duplicated = await codec.encode(
      makeDocument({
        animals: [makeAnimal({ id: 'dup' }), makeAnimal({ id: 'dup', code: 'OV-2' })],
      }),
      { exportedAt: NOW.toISOString() },
    );
    const badPayloads: Array<[string, string]> = [
      ['malformed JSON', '{'],
      ['oversized file', JSON.stringify({ ...valid, padding: 'x'.repeat(129 * 1024 * 1024) })],
      ['duplicated ids', duplicated],
    ];

    for (const [label, raw] of badPayloads) {
      await expect(codec.decode(raw)).rejects.toBeInstanceOf(BackupError);
      expect(await repository.load(), label).toEqual(original);
      expect(await farm.load(), label).toEqual(original);
    }
  });
});
