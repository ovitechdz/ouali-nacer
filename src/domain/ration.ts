import type { MessageDescriptor } from './messages';
import type { Animal, FeedLot, NutritionRec } from './types';
import { message } from './types';
import { concentratePrice, foragePrice } from './feed';
import { latestRecommendationByAnimal } from './kpis';

export interface ServeGate {
  ok: boolean;
  reason?: MessageDescriptor;
}

/** Whether a recommendation may be served right now. */
export function canServe(rec: NutritionRec | null | undefined): ServeGate {
  if (!rec) return { ok: false, reason: message('domain.ration.noRation') };
  if (rec.ration === null) return { ok: false, reason: message('domain.ration.refused') };
  if (rec.approvedBy === null) {
    return { ok: false, reason: message('domain.ration.approvalRequired') };
  }
  if (rec.servedAt !== null) {
    return { ok: false, reason: message('domain.ration.alreadyServed') };
  }
  return { ok: true };
}

export interface RationRow {
  animal: Animal;
  rec: NutritionRec | null;
  forageKg: number;
  concentrateKg: number;
  mineralG: number;
  waterL: number;
  cost: number;
  blocked: boolean;
  approved: boolean;
  served: boolean;
}

export interface PenRationGroup {
  pen: string;
  rows: RationRow[];
  forageKg: number;
  concentrateKg: number;
  cost: number;
  blocked: number;
  ready: number;
  served: number;
}

export interface RationSheet {
  groups: PenRationGroup[];
  forageKg: number;
  concentrateKg: number;
  mineralG: number;
  waterL: number;
  cost: number;
  covered: number;
  blocked: number;
  ready: number;
  served: number;
  total: number;
}

/**
 * Per-pen ration sheet. Costs use the cheapest available compatible lot, so a
 * sheet never silently prices with an unavailable or deleted lot.
 */
export function buildRationSheet(
  animals: readonly Animal[],
  recommendations: readonly NutritionRec[],
  feedLots: readonly FeedLot[],
): RationSheet {
  const latest = latestRecommendationByAnimal(recommendations);
  const forageUnitPrice = foragePrice(feedLots);
  const concentrateUnitPrice = concentratePrice(feedLots);

  const active = animals.filter((animal) => animal.status === 'actif');
  const byPen = new Map<string, RationRow[]>();

  for (const animal of active) {
    const rec = latest.get(animal.id) ?? null;
    const ration = rec?.ration ?? null;
    const forageKg = ration?.forageKg ?? 0;
    const concentrateKg = ration?.concentrateKg ?? 0;
    const row: RationRow = {
      animal,
      rec,
      forageKg,
      concentrateKg,
      mineralG: ration?.mineralG ?? 0,
      waterL: ration?.waterL ?? 0,
      cost: forageKg * forageUnitPrice + concentrateKg * concentrateUnitPrice,
      blocked: ration === null,
      approved: rec?.approvedBy != null,
      served: rec?.servedAt != null,
    };
    const list = byPen.get(animal.pen) ?? [];
    list.push(row);
    byPen.set(animal.pen, list);
  }

  const groups: PenRationGroup[] = [...byPen.entries()]
    .map(([pen, rows]) => {
      const ordered = rows.sort((a, b) => a.animal.code.localeCompare(b.animal.code));
      return {
        pen,
        rows: ordered,
        forageKg: ordered.reduce((sum, row) => sum + row.forageKg, 0),
        concentrateKg: ordered.reduce((sum, row) => sum + row.concentrateKg, 0),
        cost: ordered.reduce((sum, row) => sum + row.cost, 0),
        blocked: ordered.filter((row) => row.blocked).length,
        ready: ordered.filter((row) => row.approved && !row.served && !row.blocked).length,
        served: ordered.filter((row) => row.served).length,
      };
    })
    .sort((a, b) => a.pen.localeCompare(b.pen));

  return {
    groups,
    forageKg: groups.reduce((sum, group) => sum + group.forageKg, 0),
    concentrateKg: groups.reduce((sum, group) => sum + group.concentrateKg, 0),
    mineralG: groups.reduce(
      (sum, group) => sum + group.rows.reduce((rowSum, row) => rowSum + row.mineralG, 0),
      0,
    ),
    waterL: groups.reduce(
      (sum, group) => sum + group.rows.reduce((rowSum, row) => rowSum + row.waterL, 0),
      0,
    ),
    cost: groups.reduce((sum, group) => sum + group.cost, 0),
    covered: active.filter((animal) => latest.get(animal.id)?.ration != null).length,
    blocked: active.filter((animal) => latest.get(animal.id)?.ration == null).length,
    ready: groups.reduce((sum, group) => sum + group.ready, 0),
    served: groups.reduce((sum, group) => sum + group.served, 0),
    total: active.length,
  };
}
