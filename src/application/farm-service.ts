import {
  adjustFeedStock,
  approveRecommendation,
  archiveOldest,
  changeOperator,
  completeOnboarding,
  logScanFailure,
  moveAnimal,
  recordHealthEvent,
  recordScan,
  recordWeight,
  registerAnimal,
  runEngine,
  saveFeedLot,
  servePen,
  serveRecommendation,
  signProtocol,
  weightRecordInputSchema,
  type ArchivableKind,
  type CommandContext,
  type CommandResult,
  type NewAnimalInput,
  type OnboardingDraft,
  type OnboardingResult,
  type SignoffInput,
  type WeightRecordInput,
} from '@/domain';
import type { FarmDocument } from '@/domain/types';
import type { Clock } from '@/ports/clock';
import type { IdGenerator } from '@/ports/ids';
import type { FarmRepository } from '@/ports/repository';

export interface FarmServiceDeps {
  repository: FarmRepository;
  clock: Clock;
  ids: IdGenerator;
}

/**
 * Application boundary: it owns the load → command → save cycle. A failed
 * command never writes; a successful one persists before returning, so the UI
 * never shows an optimistic state that was not committed.
 */
export class FarmService {
  private cached: FarmDocument | null | undefined;

  constructor(private readonly deps: FarmServiceDeps) {}

  async load(): Promise<FarmDocument | null> {
    if (this.cached !== undefined) return this.cached;
    this.cached = await this.deps.repository.load();
    return this.cached;
  }

  async reload(): Promise<FarmDocument | null> {
    this.cached = undefined;
    return this.load();
  }

  async current(): Promise<FarmDocument> {
    const document = await this.load();
    if (!document) throw new Error('No farm document: onboarding is required');
    return document;
  }

  async initialize(draft: OnboardingDraft): Promise<OnboardingResult & { created?: boolean }> {
    const existing = await this.load();
    if (existing) return { ok: true, document: existing, created: false };

    const result = completeOnboarding(draft, {
      farmId: this.deps.ids.next(),
      operatorId: this.deps.ids.next(),
      now: this.deps.clock.now(),
      nextId: () => this.deps.ids.next(),
    });
    if (!result.ok) return result;
    await this.deps.repository.save(result.document);
    this.cached = result.document;
    return { ...result, created: true };
  }

  async replace(document: FarmDocument): Promise<FarmDocument> {
    await this.deps.repository.save(document);
    this.cached = document;
    return document;
  }

  async reset(): Promise<void> {
    await this.deps.repository.clear();
    this.cached = null;
  }

  private context(): CommandContext {
    return { now: this.deps.clock.now(), nextId: () => this.deps.ids.next() };
  }

  private async apply<T>(
    command: (document: FarmDocument, context: CommandContext) => CommandResult<T>,
  ): Promise<CommandResult<T>> {
    const document = await this.current();
    const result = command(document, this.context());
    if (result.ok) {
      await this.deps.repository.save(result.document);
      this.cached = result.document;
    }
    return result;
  }

  registerAnimal(input: NewAnimalInput) {
    return this.apply((document, context) =>
      registerAnimal(document, input, document.operator.id, context),
    );
  }

  recordWeight(input: WeightRecordInput) {
    if (!weightRecordInputSchema.safeParse(input).success) {
      return Promise.resolve({
        ok: false as const,
        error: { key: 'domain.error.invalidWeight' as const },
      });
    }
    return this.apply((document, context) =>
      recordWeight(document, input, document.operator.id, context),
    );
  }

  moveAnimal(animalId: string, pen: string) {
    return this.apply((document, context) =>
      moveAnimal(document, animalId, pen, document.operator.id, context),
    );
  }

  runEngine(animalId: string) {
    return this.apply((document, context) =>
      runEngine(document, animalId, document.operator.id, context),
    );
  }

  approve(recId: string) {
    return this.apply((document, context) =>
      approveRecommendation(document, recId, document.operator, context),
    );
  }

  serve(recId: string) {
    return this.apply((document, context) =>
      serveRecommendation(document, recId, document.operator, context),
    );
  }

  servePen(pen: string) {
    return this.apply((document, context) => servePen(document, pen, document.operator, context));
  }

  adjustFeedStock(lotId: string, deltaKg: number) {
    return this.apply((document, context) =>
      adjustFeedStock(document, lotId, deltaKg, document.operator.id, context),
    );
  }

  saveFeedLot(input: Parameters<typeof saveFeedLot>[1]) {
    return this.apply((document, context) =>
      saveFeedLot(document, input, document.operator.id, context),
    );
  }

  recordHealthEvent(input: Parameters<typeof recordHealthEvent>[1]) {
    return this.apply((document, context) =>
      recordHealthEvent(document, input, document.operator.id, context),
    );
  }

  changeOperator(patch: Parameters<typeof changeOperator>[1]) {
    return this.apply((document, context) =>
      changeOperator(document, patch, document.operator.id, context),
    );
  }

  signProtocol(input: SignoffInput) {
    return this.apply((document, context) =>
      signProtocol(document, input, document.operator.id, context),
    );
  }

  recordScan(animalId: string) {
    return this.apply((document, context) =>
      recordScan(document, animalId, document.operator.id, context),
    );
  }

  logScanFailure(query: string) {
    return this.apply((document, context) =>
      logScanFailure(document, query, document.operator.id, context),
    );
  }

  archive(kind: ArchivableKind, keep: number) {
    return this.apply((document, context) =>
      archiveOldest(document, kind, keep, document.operator.id, context),
    );
  }
}
