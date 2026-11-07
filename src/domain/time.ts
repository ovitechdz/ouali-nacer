/** Calendar helpers. Every function receives the current time explicitly. */

export const SHEEP_GESTATION_DAYS = 150;

/** Whole months between a `YYYY-MM-DD` birth date and the reference instant. */
export function ageMonths(birthDate: string, now: Date): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return 0;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || year < 1970) return 0;

  const months = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - month);
  return Math.max(0, months);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000);
}

/** Whole days remaining until an ISO date, or null when absent/invalid. */
export function daysUntil(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.ceil((target - now.getTime()) / 86_400_000);
}

/** True when an ISO timestamp is older than `days`, or missing. */
export function isStale(iso: string | null, now: Date, days: number): boolean {
  if (!iso) return true;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return true;
  return now.getTime() - time > days * 86_400_000;
}
