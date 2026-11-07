import type { Animal, FeedLot, NutritionRec } from './types';
import { concentratePrice, foragePrice, forageStock } from './feed';
import { isStale } from './time';

/** Latest recommendation per animal, by creation time. */
export function latestRecommendationByAnimal(
  recommendations: readonly NutritionRec[],
): Map<string, NutritionRec> {
  const map = new Map<string, NutritionRec>();
  for (const rec of recommendations) {
    const previous = map.get(rec.animalId);
    if (!previous || previous.createdAt < rec.createdAt) map.set(rec.animalId, rec);
  }
  return map;
}

export interface FarmKpiInput {
  animals: readonly Animal[];
  recommendations: readonly NutritionRec[];
  feedLots: readonly FeedLot[];
  now: Date;
  pending?: number;
  scanStaleDays?: number;
}

export interface FarmKpis {
  activeCount: number;
  identifiedPct: number;
  meanWeightKg: number;
  meanAdgKg: number;
  recOk: number;
  recBlock: number;
  dataDrivenPct: number;
  forageNeedKg: number;
  concentrateNeedKg: number;
  rationCost: number;
  forageStockKg: number;
  coverDays: number | null;
  missingWeightCount: number;
  lowBcsCount: number;
  staleScanCount: number;
  pending: number;
}

/** All KPIs are derived on read; nothing here is persisted. */
export function computeFarmKpis({
  animals,
  recommendations,
  feedLots,
  now,
  pending = 0,
  scanStaleDays = 3,
}: FarmKpiInput): FarmKpis {
  const active = animals.filter((animal) => animal.status === 'actif');
  const withWeight = active.filter((animal) => animal.weightKg != null);
  const withAdg = active.filter((animal) => animal.adgKg != null);

  const identifiedPct = Math.round(
    (active.filter((animal) => animal.rfid.trim() !== '').length / Math.max(1, active.length)) *
      100,
  );
  const meanWeightKg =
    withWeight.reduce((sum, animal) => sum + (animal.weightKg ?? 0), 0) /
    Math.max(1, withWeight.length);
  const meanAdgKg =
    withAdg.reduce((sum, animal) => sum + (animal.adgKg ?? 0), 0) / Math.max(1, withAdg.length);

  const recOk = recommendations.filter((rec) => rec.ration !== null).length;
  const recBlock = recommendations.filter((rec) => rec.ration === null).length;
  const dataDrivenPct = Math.round((recOk / Math.max(1, recOk + recBlock)) * 100);

  const latest = latestRecommendationByAnimal(recommendations);
  const forageUnitPrice = foragePrice([...feedLots]);
  const concentrateUnitPrice = concentratePrice([...feedLots]);

  let forageNeedKg = 0;
  let concentrateNeedKg = 0;
  let rationCost = 0;
  for (const animal of active) {
    const ration = latest.get(animal.id)?.ration;
    if (!ration) continue;
    forageNeedKg += ration.forageKg;
    concentrateNeedKg += ration.concentrateKg;
    rationCost += ration.forageKg * forageUnitPrice + ration.concentrateKg * concentrateUnitPrice;
  }

  const stock = forageStock([...feedLots]);
  const coverDays = forageNeedKg > 0 ? stock / forageNeedKg : null;

  return {
    activeCount: active.length,
    identifiedPct,
    meanWeightKg,
    meanAdgKg,
    recOk,
    recBlock,
    dataDrivenPct,
    forageNeedKg,
    concentrateNeedKg,
    rationCost,
    forageStockKg: stock,
    coverDays,
    missingWeightCount: active.filter((animal) => animal.weightKg == null).length,
    lowBcsCount: active.filter((animal) => animal.bcs != null && animal.bcs < 2.5).length,
    staleScanCount: active.filter((animal) => isStale(animal.lastScanAt, now, scanStaleDays))
      .length,
    pending,
  };
}
