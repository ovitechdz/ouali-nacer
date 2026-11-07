import type { FeedLot } from './types';
import { round1 } from './numeric';

function isForageCompatible(lot: FeedLot): boolean {
  return lot.kind === 'fourrage' || lot.kind === 'hybride';
}

function isConcentrateCompatible(lot: FeedLot): boolean {
  return lot.kind === 'concentre' || lot.kind === 'hybride';
}

function cheapestPrice(lots: readonly FeedLot[], compatible: (lot: FeedLot) => boolean): number {
  const available = lots.filter((lot) => compatible(lot) && lot.available);
  if (available.length === 0) return 0;
  return Math.min(...available.map((lot) => lot.costPerKg));
}

/** Unit price: cheapest available compatible lot. Zero when none is available. */
export function foragePrice(lots: readonly FeedLot[]): number {
  return cheapestPrice(lots, isForageCompatible);
}

export function concentratePrice(lots: readonly FeedLot[]): number {
  return cheapestPrice(lots, isConcentrateCompatible);
}

export function forageStock(lots: readonly FeedLot[]): number {
  return lots
    .filter((lot) => isForageCompatible(lot) && lot.available)
    .reduce((sum, lot) => sum + lot.stockKg, 0);
}

export function concentrateStock(lots: readonly FeedLot[]): number {
  return lots
    .filter((lot) => isConcentrateCompatible(lot) && lot.available)
    .reduce((sum, lot) => sum + lot.stockKg, 0);
}

export interface FeedAvailability {
  forageAvailable: boolean;
  concentrateAvailable: boolean;
}

/** Availability for the engine: a compatible, enabled lot with stock left. */
export function feedAvailability(lots: readonly FeedLot[]): FeedAvailability {
  return {
    forageAvailable: lots.some(
      (lot) => isForageCompatible(lot) && lot.available && lot.stockKg > 0,
    ),
    concentrateAvailable: lots.some(
      (lot) => isConcentrateCompatible(lot) && lot.available && lot.stockKg > 0,
    ),
  };
}

function coverage(
  lots: readonly FeedLot[],
  forageKg: number,
  concentrateKg: number,
  consume: boolean,
): { covered: boolean; lots: FeedLot[] } {
  let forageLeft = forageKg;
  let concentrateLeft = concentrateKg;

  const next = lots.map((lot) => {
    if (!lot.available || lot.stockKg <= 0) return lot;

    let remaining = lot.stockKg;
    let changed = false;

    if (isForageCompatible(lot) && forageLeft > 0) {
      const take = Math.min(remaining, forageLeft);
      forageLeft -= take;
      remaining -= take;
      changed = true;
    }

    if (isConcentrateCompatible(lot) && concentrateLeft > 0) {
      const take = Math.min(remaining, concentrateLeft);
      concentrateLeft -= take;
      remaining -= take;
      changed = true;
    }

    return consume && changed ? { ...lot, stockKg: round1(remaining) } : lot;
  });

  return { covered: forageLeft <= 1e-9 && concentrateLeft <= 1e-9, lots: next };
}

/** True when current stock covers the demand; nothing is consumed. */
export function feedCovers(
  lots: readonly FeedLot[],
  forageKg: number,
  concentrateKg: number,
): boolean {
  return coverage(lots, forageKg, concentrateKg, false).covered;
}

/** New feed array with the demand deducted. Never mutates the input. */
export function deductFeed(
  lots: readonly FeedLot[],
  forageKg: number,
  concentrateKg: number,
): FeedLot[] {
  return coverage(lots, forageKg, concentrateKg, true).lots;
}
