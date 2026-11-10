import {
  computeAnimalHealth,
  computeFarmKpis,
  latestRecommendationByAnimal,
  type Animal,
  type AnimalHealth,
  type FarmDocument,
  type FarmKpis,
  type NutritionRec,
} from '@/domain';

export interface HerdRow {
  animal: Animal;
  rec: NutritionRec | null;
  health: AnimalHealth;
}

/** Derived view used by the herd list, triage and dashboard. */
export function herdRows(document: FarmDocument, now: Date): HerdRow[] {
  const latest = latestRecommendationByAnimal(document.recommendations);
  return document.animals.map((animal) => ({
    animal,
    rec: latest.get(animal.id) ?? null,
    health: computeAnimalHealth({
      animal,
      weights: document.weights,
      latestRecommendation: latest.get(animal.id),
      now,
      scanStaleDays: document.settings.scanStaleDays,
    }),
  }));
}

export function farmKpis(document: FarmDocument, now: Date): FarmKpis {
  return computeFarmKpis({
    animals: document.animals,
    recommendations: document.recommendations,
    feedLots: document.feedLots,
    now,
    scanStaleDays: document.settings.scanStaleDays,
  });
}

export function latestRec(document: FarmDocument, animalId: string): NutritionRec | null {
  return latestRecommendationByAnimal(document.recommendations).get(animalId) ?? null;
}

export function animalById(document: FarmDocument, animalId: string): Animal | undefined {
  return document.animals.find((animal) => animal.id === animalId);
}

export function countByStatus(rows: readonly HerdRow[]): {
  alerte: number;
  suivi: number;
  ok: number;
} {
  const counts = { alerte: 0, suivi: 0, ok: 0 };
  for (const row of rows) counts[row.health.status] += 1;
  return counts;
}
