import { describe, expect, it } from 'vitest';

import { NOW, defaultOperator, makeDocument, makeRecommendation } from '@/test/factories';
import type { FarmDocument } from '@/domain/types';
import type { Clock } from '@/ports/clock';
import type { IdGenerator } from '@/ports/ids';
import type { FarmRepository } from '@/ports/repository';

import { FarmService } from './farm-service';

class CountingRepository implements FarmRepository {
  saves = 0;
  clears = 0;
  readonly inner = new MemoryStore();

  async load(): Promise<FarmDocument | null> {
    return this.inner.load();
  }

  async save(document: FarmDocument): Promise<void> {
    this.saves += 1;
    await this.inner.save(document);
  }

  async clear(): Promise<void> {
    this.clears += 1;
    await this.inner.clear();
  }
}

class MemoryStore implements FarmRepository {
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

function setup() {
  const repository = new CountingRepository();
  let counter = 0;
  const ids: IdGenerator = { next: () => `id-${(counter += 1)}` };
  const clock: Clock = { now: () => NOW };
  return { repository, ids, clock, service: new FarmService({ repository, clock, ids }) };
}

const DRAFT = {
  farmName: 'Farm',
  operatorName: 'Nacer',
  authority: 'production' as const,
  locale: 'ar' as const,
  pens: ['P1'],
};

const ANIMAL_INPUT = {
  rfid: 'RFID-1',
  code: 'OV-1',
  sex: 'M' as const,
  breed: 'Ouled Djellal',
  birthDate: '2026-03-01',
  stage: 'engraissement' as const,
  pen: 'P1',
  weight: '45',
  bcs: '3',
};

describe('lifecycle', () => {
  it('loads once and caches the result', async () => {
    const { service, repository } = setup();
    await expect(service.load()).resolves.toBeNull();
    await expect(service.load()).resolves.toBeNull();
    expect(repository.saves).toBe(0);
  });

  it('reloads from the repository on demand', async () => {
    const { service, repository } = setup();
    await service.initialize(DRAFT);
    await repository.inner.save(makeDocument({ farmId: 'external' }));
    await service.reload();
    await expect(service.current()).resolves.toMatchObject({ farmId: 'external' });
  });

  it('requires onboarding before reading the current document', async () => {
    const { service } = setup();
    await expect(service.current()).rejects.toThrow('onboarding is required');
  });

  it('creates the document during onboarding and persists it once', async () => {
    const { service, repository } = setup();
    const result = await service.initialize(DRAFT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(true);
    expect(result.document.settings.farmName).toBe('Farm');
    expect(result.document.operator.displayName).toBe('Nacer');
    expect(repository.saves).toBe(1);
    await expect(repository.inner.load()).resolves.toEqual(result.document);
  });

  it('does not recreate an existing document', async () => {
    const { service, repository } = setup();
    await service.initialize(DRAFT);
    const second = await service.initialize({ ...DRAFT, farmName: 'Other' });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.created).toBe(false);
    expect(second.document.settings.farmName).toBe('Farm');
    expect(repository.saves).toBe(1);
  });

  it('surfaces an invalid onboarding draft without saving', async () => {
    const { service, repository } = setup();
    const result = await service.initialize({ ...DRAFT, farmName: ' ' });
    expect(result.ok).toBe(false);
    expect(repository.saves).toBe(0);
    await expect(service.load()).resolves.toBeNull();
  });

  it('replaces and resets the document', async () => {
    const { service, repository } = setup();
    const replacement = makeDocument({ farmId: 'replacement' });
    await expect(service.replace(replacement)).resolves.toBe(replacement);
    await expect(service.current()).resolves.toBe(replacement);
    await service.reset();
    expect(repository.clears).toBe(1);
    await expect(service.load()).resolves.toBeNull();
  });
});

describe('commands through the service', () => {
  async function onboarded() {
    const context = setup();
    await context.service.initialize(DRAFT);
    return context;
  }

  it('persists each successful command', async () => {
    const { service, repository } = await onboarded();
    const before = repository.saves;
    const registered = await service.registerAnimal(ANIMAL_INPUT);
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;
    expect(repository.saves).toBe(before + 1);

    const weighed = await service.recordWeight({
      animalId: registered.result.id,
      weight: '48',
      bcs: '',
    });
    expect(weighed.ok).toBe(true);
    expect(repository.saves).toBe(before + 2);

    await expect(repository.inner.load()).resolves.toMatchObject({
      animals: [{ weightKg: 48 }],
    });
  });

  it('rejects an invalid weight before touching the repository', async () => {
    const { service, repository } = await onboarded();
    const registered = await service.registerAnimal(ANIMAL_INPUT);
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;
    const before = repository.saves;
    const result = await service.recordWeight({
      animalId: registered.result.id,
      weight: '0',
      bcs: '',
    });
    expect(result).toEqual({ ok: false, error: { key: 'domain.error.invalidWeight' } });
    expect(repository.saves).toBe(before);
  });

  it('runs the engine, approves and serves in order', async () => {
    const { service, repository } = await onboarded();
    await service.saveFeedLot({
      name: 'Forage',
      kind: 'fourrage',
      stockKg: 100,
      costPerKg: 3,
      available: true,
    });
    await service.saveFeedLot({
      name: 'Concentrate',
      kind: 'concentre',
      stockKg: 100,
      costPerKg: 5,
      available: true,
    });
    const registered = await service.registerAnimal(ANIMAL_INPUT);
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;

    const engine = await service.runEngine(registered.result.id);
    expect(engine.ok).toBe(true);
    if (!engine.ok) return;

    const approval = await service.approve(engine.result.id);
    expect(approval.ok).toBe(true);
    if (!approval.ok) return;

    const before = repository.saves;
    const served = await service.serve(engine.result.id);
    expect(served.ok).toBe(true);
    if (!served.ok) return;
    expect(served.result).toEqual({ served: true, alreadyServed: false });
    expect(repository.saves).toBe(before + 1);

    const persisted = await repository.inner.load();
    expect(persisted?.recommendations[0]!.servedAt).not.toBeNull();
    expect(persisted?.feedLots[0]!.stockKg).toBeLessThan(100);
  });

  it('does not persist a denied approval', async () => {
    const { service, repository } = await onboarded();
    const field = defaultOperator.authority;
    expect(field).toBe('production');
    const document = await service.current();
    const fieldService = new FarmService({
      repository,
      clock: { now: () => NOW },
      ids: { next: () => 'id-x' },
    });
    await fieldService.replace({
      ...document,
      operator: { ...document.operator, authority: 'field' },
      recommendations: [makeRecommendation()],
    });
    const before = repository.saves;
    const result = await fieldService.approve('rec-1');
    expect(result.ok).toBe(false);
    expect(repository.saves).toBe(before);
  });

  it('delegates the remaining commands', async () => {
    const { service, repository } = await onboarded();
    await service.registerAnimal(ANIMAL_INPUT);
    const animals = (await service.current()).animals;
    const animalId = animals[0]!.id;

    await expect(service.moveAnimal(animalId, 'P2')).resolves.toMatchObject({ ok: true });
    await expect(service.recordScan(animalId)).resolves.toMatchObject({ ok: true });
    await expect(service.logScanFailure('UNKNOWN')).resolves.toMatchObject({ ok: true });
    await expect(
      service.recordHealthEvent({ animalId, type: 'observation' }),
    ).resolves.toMatchObject({ ok: true });
    await expect(service.changeOperator({ displayName: 'New' })).resolves.toMatchObject({
      ok: true,
    });
    await expect(
      service.signProtocol({
        name: 'Expert',
        specialty: 'nutrition',
        protocol: 'verification',
        passed: 8,
        total: 8,
        caseIds: ['TC-01'],
      }),
    ).resolves.toMatchObject({ ok: true });

    const feed = await service.saveFeedLot({
      name: 'Hay',
      kind: 'fourrage',
      stockKg: 10,
      costPerKg: 2,
      available: true,
    });
    expect(feed.ok).toBe(true);
    if (!feed.ok) return;
    await expect(service.adjustFeedStock(feed.result.id, -2)).resolves.toMatchObject({ ok: true });

    const engine = await service.runEngine(animalId);
    expect(engine.ok).toBe(true);
    if (!engine.ok) return;
    await service.approve(engine.result.id);
    await expect(service.servePen('P2')).resolves.toMatchObject({ ok: true });
    await expect(service.archive('auditEvents', 1)).resolves.toMatchObject({ ok: true });

    const persisted = await repository.inner.load();
    expect(persisted?.signoffs).toHaveLength(1);
    expect(persisted?.auditEvents.length).toBeGreaterThan(1);
  });
});

describe('document shape', () => {
  it('keeps a valid document in the repository after a full session', async () => {
    const { service, repository } = await onboardedService();
    const document = await repository.inner.load();
    expect(document).not.toBeNull();
    const { farmDocumentSchema } = await import('@/domain/types');
    expect(farmDocumentSchema.safeParse(document).success).toBe(true);
    expect(await service.current()).toEqual(document);
  });
});

async function onboardedService() {
  const context = setup();
  await context.service.initialize(DRAFT);
  await context.service.registerAnimal(ANIMAL_INPUT);
  return context;
}
