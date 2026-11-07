import type { Animal, HealthLevel, HealthSignalId, NutritionRec, WeightRecord } from './types';
import { isStale, daysUntil } from './time';

export const HEALTH_SCAN_STALE_DAYS = 3;
export const HEALTH_WEIGHT_LOSS_RATIO = 0.06;
export const HEALTH_LOW_NEC_ALERT = 2.0;
export const HEALTH_LOW_NEC_WATCH = 2.5;
export const HEALTH_LAMBING_WINDOW_DAYS = 10;

export interface HealthSignal {
  id: HealthSignalId;
  level: HealthLevel;
}

export interface AnimalHealth {
  status: HealthLevel;
  signals: HealthSignal[];
  vetReview: boolean;
}

export interface AnimalHealthInput {
  animal: Animal;
  weights: readonly WeightRecord[];
  latestRecommendation: NutritionRec | undefined;
  now: Date;
  scanStaleDays?: number;
}

const RANK: Record<HealthLevel, number> = { ok: 0, suivi: 1, alerte: 2 };

/**
 * Health triage, not diagnosis. Every rule is deterministic and explainable;
 * the decision and any veterinary review stay human.
 */
export function computeAnimalHealth({
  animal,
  weights,
  latestRecommendation,
  now,
  scanStaleDays = HEALTH_SCAN_STALE_DAYS,
}: AnimalHealthInput): AnimalHealth {
  const signals: HealthSignal[] = [];

  const history = weights
    .filter((record) => record.animalId === animal.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (history.length >= 2) {
    const latest = history[0];
    const previous = history[1];
    if (latest && previous) {
      const lostEnough =
        latest.kg < previous.kg && latest.kg <= previous.kg * (1 - HEALTH_WEIGHT_LOSS_RATIO);
      if (lostEnough) signals.push({ id: 'poids', level: 'alerte' });
    }
  }

  if (animal.bcs != null && animal.bcs < HEALTH_LOW_NEC_WATCH) {
    signals.push({
      id: 'nec',
      level: animal.bcs < HEALTH_LOW_NEC_ALERT ? 'alerte' : 'suivi',
    });
  }

  if (isStale(animal.lastScanAt, now, scanStaleDays)) {
    signals.push({ id: 'scan', level: 'suivi' });
  }

  const remaining = daysUntil(animal.expectedLambingAt, now);
  if (
    animal.stage === 'brebis_gestation' &&
    remaining !== null &&
    remaining <= HEALTH_LAMBING_WINDOW_DAYS
  ) {
    signals.push({ id: 'gestation', level: 'suivi' });
  }

  if (latestRecommendation && latestRecommendation.ration === null) {
    signals.push({ id: 'refus', level: 'alerte' });
  }

  let status: HealthLevel = 'ok';
  for (const signal of signals) {
    if (RANK[signal.level] > RANK[status]) status = signal.level;
  }

  return {
    status,
    signals,
    vetReview: signals.some((signal) => signal.level === 'alerte'),
  };
}
