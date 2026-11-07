import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { NOW, makeAnimal, makeDocument, makeRecommendation, makeWeight } from '@/test/factories';
import type { FarmDocument } from '@/domain/types';

import { BackupError, JsonBackupCodec, countDocument, sha256Hex } from './backup-codec';

const FIXTURES = path.resolve('src/data/fixtures/migrations');
const codec = new JsonBackupCodec();

function fixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8');
}

async function expectBackupError(run: () => Promise<unknown>, code: string) {
  try {
    await run();
  } catch (error) {
    expect(error).toBeInstanceOf(BackupError);
    expect((error as BackupError).code).toBe(code);
    return error as BackupError;
  }
  throw new Error('expected a BackupError');
}

function richDocument(): FarmDocument {
  return makeDocument({
    animals: [makeAnimal()],
    weights: [makeWeight()],
    recommendations: [makeRecommendation()],
  });
}

describe('v2 envelope', () => {
  it('round-trips a document byte for byte with a fixed export date', async () => {
    const document = richDocument();
    const options = {
      exportedAt: NOW.toISOString(),
      app: { name: 'OVITECH', build: '0.1.0' },
    };
    const first = await codec.encode(document, options);
    const second = await codec.encode(document, options);
    expect(first).toBe(second);

    const envelope = JSON.parse(first);
    expect(envelope).toMatchObject({
      format: 'ovitech-backup',
      version: 2,
      schemaVersion: 5,
      engineVersion: 'DDNE-REF-1.0',
      exportedAt: NOW.toISOString(),
      encryption: null,
    });
    expect(envelope.checksum).toBe(await sha256Hex(JSON.stringify(document)));

    await expect(codec.decode(first)).resolves.toEqual(document);
  });

  it('rejects an invalid source document', async () => {
    await expectBackupError(() => codec.encode({ ...makeDocument(), farmId: '' }), 'structure');
  });

  it('rejects malformed JSON and an unknown format', async () => {
    await expectBackupError(() => codec.decode('{'), 'structure');
    await expectBackupError(() => codec.decode('[]'), 'structure');
    await expectBackupError(
      () => codec.decode(JSON.stringify({ format: 'other', version: 2 })),
      'format',
    );
  });

  it('rejects an unsupported envelope version', async () => {
    await expectBackupError(
      () => codec.decode(JSON.stringify({ format: 'ovitech-backup', version: 9 })),
      'version',
    );
  });

  it('rejects a newer schema before checking the checksum', async () => {
    const envelope = JSON.parse(
      await codec.encode(makeDocument(), { exportedAt: NOW.toISOString() }),
    );
    const error = await expectBackupError(
      () => codec.decode(JSON.stringify({ ...envelope, schemaVersion: 6 })),
      'newer-schema',
    );
    expect(error.key).toBe('domain.backup.schemaNewer');
  });

  it('rejects a missing, tampered or missing-state payload', async () => {
    const envelope = JSON.parse(
      await codec.encode(makeDocument(), { exportedAt: NOW.toISOString() }),
    );
    await expectBackupError(
      () => codec.decode(JSON.stringify({ ...envelope, checksum: '' })),
      'checksum',
    );

    const tampered = {
      ...envelope,
      state: { ...envelope.state, farmId: 'other-farm' },
    };
    const error = await expectBackupError(() => codec.decode(JSON.stringify(tampered)), 'checksum');
    expect(error.key).toBe('domain.backup.checksum');

    await expectBackupError(
      () => codec.decode(JSON.stringify({ ...envelope, state: null })),
      'structure',
    );
  });

  it('migrates an older schema carried by a v2 envelope', async () => {
    const legacy = JSON.parse(fixture('v4'));
    const envelope = {
      format: 'ovitech-backup',
      version: 2,
      schemaVersion: 4,
      engineVersion: 'DDNE-REF-0.9',
      exportedAt: NOW.toISOString(),
      app: { name: 'OVITECH', build: '0.1.0' },
      checksum: await sha256Hex(JSON.stringify(legacy)),
      encryption: null,
      state: legacy,
    };
    const document = await codec.decode(JSON.stringify(envelope));
    expect(document.schemaVersion).toBe(5);
    expect(document.recommendations[0]!.approvedBy).not.toBeNull();
  });

  it('returns a structure error for an invalid inner document', async () => {
    const invalid = { schemaVersion: 5, farmId: '' };
    const envelope = {
      format: 'ovitech-backup',
      version: 2,
      schemaVersion: 5,
      engineVersion: 'DDNE-REF-1.0',
      exportedAt: NOW.toISOString(),
      app: { name: 'OVITECH', build: '0.1.0' },
      checksum: await sha256Hex(JSON.stringify(invalid)),
      encryption: null,
      state: invalid,
    };
    const error = await expectBackupError(
      () => codec.decode(JSON.stringify(envelope)),
      'structure',
    );
    expect(error.key).toBe('domain.error.invalidDocument');
  });
});

describe('v1 legacy backups', () => {
  it('imports the reference v1 envelope', async () => {
    const document = await codec.decode(fixture('backup-v1'));
    expect(document.schemaVersion).toBe(5);
    expect(document.farmId).toBe('farm-legacy');
  });

  it('rejects a tampered legacy checksum', async () => {
    const envelope = JSON.parse(fixture('backup-v1'));
    const error = await expectBackupError(
      () => codec.decode(JSON.stringify({ ...envelope, checksum: 'deadbeef' })),
      'checksum',
    );
    expect(error.key).toBe('domain.backup.checksum');
  });

  it('rejects a legacy envelope without state', async () => {
    await expectBackupError(
      () => codec.decode(JSON.stringify({ format: 'ovitech-backup', version: 1, state: null })),
      'structure',
    );
  });
});

describe('encryption', () => {
  it('encrypts with AES-GCM and decrypts with the passphrase', async () => {
    const document = richDocument();
    const raw = await codec.encode(document, {
      passphrase: 'correct horse battery staple',
      exportedAt: NOW.toISOString(),
    });
    const envelope = JSON.parse(raw);
    expect(envelope.state).toBeNull();
    expect(envelope.encryption).toMatchObject({
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA-256',
      iterations: 210_000,
    });
    expect(envelope.encryption.data.length).toBeGreaterThan(0);

    await expect(
      codec.decode(raw, { passphrase: 'correct horse battery staple' }),
    ).resolves.toEqual(document);
  });

  it('requires the passphrase and rejects a wrong one', async () => {
    const raw = await codec.encode(richDocument(), { passphrase: 'secret' });
    expect((await expectBackupError(() => codec.decode(raw), 'passphrase')).key).toBe(
      'domain.backup.passphraseRequired',
    );
    await expectBackupError(() => codec.decode(raw, { passphrase: 'wrong' }), 'passphrase');
  });

  it('rejects malformed encryption metadata', async () => {
    const raw = await codec.encode(richDocument(), { passphrase: 'secret' });
    const envelope = JSON.parse(raw);
    await expectBackupError(
      () =>
        codec.decode(
          JSON.stringify({ ...envelope, encryption: { ...envelope.encryption, salt: 'zz' } }),
          { passphrase: 'secret' },
        ),
      'structure',
    );
  });
});

describe('preview', () => {
  it('summarises counts, date range and engine versions', async () => {
    const document = makeDocument({
      animals: [makeAnimal()],
      weights: [makeWeight({ at: '2026-08-02T10:00:00.000Z' })],
      recommendations: [makeRecommendation({ createdAt: '2026-08-03T10:00:00.000Z' })],
    });
    const raw = await codec.encode(document, { exportedAt: NOW.toISOString() });
    const preview = await codec.preview(raw);
    expect(preview).toMatchObject({
      schemaVersion: 5,
      engineVersion: 'DDNE-REF-1.0',
      exportedAt: NOW.toISOString(),
      encrypted: false,
      counts: {
        animals: 1,
        weights: 1,
        recommendations: 1,
        feedLots: 0,
        healthEvents: 0,
        auditEvents: 0,
        signoffs: 0,
      },
      dateRange: { from: '2026-08-02T10:00:00.000Z', to: '2026-08-03T10:00:00.000Z' },
      engineVersions: ['DDNE-REF-1.0'],
      diff: null,
    });
  });

  it('returns an empty date range for an empty document', async () => {
    const raw = await codec.encode(makeDocument(), { exportedAt: NOW.toISOString() });
    const preview = await codec.preview(raw);
    expect(preview.dateRange).toEqual({ from: null, to: null });
    expect(preview.engineVersions).toEqual([]);
  });

  it('diffs the backup against the current document', async () => {
    const backup = makeDocument({
      animals: [makeAnimal(), makeAnimal({ id: 'an-2', code: 'OV-2', rfid: '' })],
      weights: [makeWeight()],
    });
    const current = makeDocument({ animals: [makeAnimal()] });
    const raw = await codec.encode(backup, { exportedAt: NOW.toISOString() });
    const preview = await codec.preview(raw, { current });
    expect(preview.diff).toMatchObject({ animals: 1, weights: 1, recommendations: 0 });
  });

  it('reports an encrypted backup as encrypted', async () => {
    const raw = await codec.encode(richDocument(), { passphrase: 'secret' });
    const preview = await codec.preview(raw, { passphrase: 'secret' });
    expect(preview.encrypted).toBe(true);
    expect(preview.counts.animals).toBe(1);
  });
});

describe('countDocument', () => {
  it('counts every collection', () => {
    expect(countDocument(richDocument())).toEqual({
      animals: 1,
      weights: 1,
      healthEvents: 0,
      recommendations: 1,
      feedLots: 0,
      auditEvents: 0,
      signoffs: 0,
    });
  });
});
