/** Numeric helpers shared by the deterministic domain rules. */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Round to an integer, tolerating floating-point noise. */
export function round0(value: number): number {
  return Math.round(value + Number.EPSILON);
}

/** Round to one decimal, tolerating floating-point noise. */
export function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/** Round to three decimals, used by average daily gain. */
export function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Deterministic 32-bit FNV-1a hash, used to fingerprint engine inputs.
 * Not a security primitive: it only detects input drift between runs.
 */
export function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
