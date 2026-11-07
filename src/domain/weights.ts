import type { WeightRecord } from './types';
import { DAY_MS, round3 } from './numeric';

/**
 * Average daily gain between the two most recent weighings of one animal.
 * Returns null when history is too short or the two records are less than
 * half a day apart (a same-day capture cannot produce a daily rate).
 */
export function adgFromHistory(records: readonly WeightRecord[], animalId: string): number | null {
  const history = records
    .filter((record) => record.animalId === animalId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const latest = history[0];
  const previous = history[1];
  if (!latest || !previous) return null;

  const days = (new Date(latest.at).getTime() - new Date(previous.at).getTime()) / DAY_MS;
  if (!Number.isFinite(days) || days < 0.5) return null;
  return round3((latest.kg - previous.kg) / days);
}
