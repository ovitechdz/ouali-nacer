import type { Animal } from './types';

export type ScanOutcome =
  | { kind: 'ok'; animal: Animal }
  | { kind: 'unknown'; query: string }
  | { kind: 'unreadable'; query: string };

/** Uppercase, trimmed, separator-free identity used for comparisons. */
export function normalizeIdentity(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Deterministic scan resolution: exact RFID, exact code, then separator-free
 * equality and a suffix match for truncated handheld reads. Ambiguity is never
 * resolved silently: an unreadable or unknown tag returns an explicit outcome.
 */
export function resolveScan(query: string, animals: readonly Animal[]): ScanOutcome {
  const raw = query.trim();
  const normalized = normalizeIdentity(raw);
  if (normalized === '' || /[?]/.test(raw) || normalized === 'ERR' || normalized === 'ERROR') {
    return { kind: 'unreadable', query: raw };
  }

  const exact = animals.find(
    (animal) =>
      normalizeIdentity(animal.rfid) === normalized ||
      normalizeIdentity(animal.code) === normalized,
  );
  if (exact) return { kind: 'ok', animal: exact };

  const suffixMatches = animals.filter((animal) => {
    const rfid = normalizeIdentity(animal.rfid);
    const code = normalizeIdentity(animal.code);
    return (
      (rfid !== '' && (rfid.endsWith(normalized) || normalized.endsWith(rfid))) ||
      (code !== '' && (code.endsWith(normalized) || normalized.endsWith(code)))
    );
  });
  const match = suffixMatches[0];
  if (suffixMatches.length === 1 && match) return { kind: 'ok', animal: match };

  return { kind: 'unknown', query: raw };
}
