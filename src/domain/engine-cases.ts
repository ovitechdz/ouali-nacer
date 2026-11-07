import type { MessageDescriptor } from './messages';
import type { Animal, FarmDocument, NutritionRec } from './types';
import type { FeedAvailability } from './feed';
import { computeRecommendation, type RecommendationDraft } from './nutrition';

export interface EngineCase {
  id: string;
  animalCode: string;
  feed: FeedAvailability;
  expect: {
    emits: boolean;
    missingKey?: MessageDescriptor['key'];
    noteKey?: MessageDescriptor['key'];
    confidence?: NutritionRec['confidence'];
    minWater?: number;
    concentrateShareMin?: number;
  };
}

export interface EngineCaseResult {
  id: string;
  code: string;
  ok: boolean;
  failures: string[];
  rec: RecommendationDraft | null;
}

/** Verification cases TC-01…TC-08, executed in CI against a fixed fixture. */
export function referenceCases(): EngineCase[] {
  return [
    {
      id: 'TC-01',
      animalCode: 'OV-2401',
      feed: { forageAvailable: true, concentrateAvailable: true },
      expect: { emits: true, concentrateShareMin: 0.4, confidence: 'haute' },
    },
    {
      id: 'TC-02',
      animalCode: 'OV-2410',
      feed: { forageAvailable: true, concentrateAvailable: true },
      expect: { emits: false, missingKey: 'domain.missing.weight', confidence: 'insuffisante' },
    },
    {
      id: 'TC-03',
      animalCode: 'OV-2403',
      feed: { forageAvailable: true, concentrateAvailable: true },
      expect: { emits: true, minWater: 7 },
    },
    {
      id: 'TC-04',
      animalCode: 'OV-2408',
      feed: { forageAvailable: true, concentrateAvailable: true },
      expect: { emits: true, noteKey: 'domain.note.lowBcs' },
    },
    {
      id: 'TC-05',
      animalCode: 'OV-2411',
      feed: { forageAvailable: true, concentrateAvailable: true },
      expect: { emits: true, noteKey: 'domain.note.highBcs' },
    },
    {
      id: 'TC-06',
      animalCode: 'OV-2401',
      feed: { forageAvailable: false, concentrateAvailable: false },
      expect: { emits: false, missingKey: 'domain.missing.feed' },
    },
    {
      id: 'TC-07',
      animalCode: 'OV-2401',
      feed: { forageAvailable: true, concentrateAvailable: false },
      expect: { emits: true, noteKey: 'domain.note.noConcentrate' },
    },
    {
      id: 'TC-08',
      animalCode: 'OV-2412',
      feed: { forageAvailable: true, concentrateAvailable: true },
      expect: { emits: false, missingKey: 'domain.missing.bcs' },
    },
  ];
}

export function runEngineCase(
  testCase: EngineCase,
  animals: readonly Animal[],
  now: Date,
): EngineCaseResult {
  const animal = animals.find(
    (entry) => entry.code.toUpperCase() === testCase.animalCode.toUpperCase(),
  );
  if (!animal) {
    return {
      id: testCase.id,
      code: testCase.animalCode,
      ok: false,
      failures: ['missing-animal'],
      rec: null,
    };
  }

  const rec = computeRecommendation(animal, testCase.feed, now);
  const failures: string[] = [];
  const { expect } = testCase;

  if (expect.emits && rec.ration === null) failures.push('expected-ration');
  if (!expect.emits && rec.ration !== null) failures.push('unexpected-ration');
  if (expect.missingKey && !rec.missingInputs.some((entry) => entry.key === expect.missingKey)) {
    failures.push('missing-input');
  }
  if (expect.noteKey && !rec.notes.some((entry) => entry.key === expect.noteKey)) {
    failures.push('note');
  }
  if (expect.confidence && rec.confidence !== expect.confidence) failures.push('confidence');
  if (expect.minWater !== undefined && (rec.ration?.waterL ?? 0) < expect.minWater) {
    failures.push('min-water');
  }
  if (expect.concentrateShareMin !== undefined && rec.ration) {
    const share = rec.ration.concentrateKg / Math.max(rec.ration.dmiKg, 0.01);
    if (share < expect.concentrateShareMin) failures.push('concentrate-share');
  }

  return { id: testCase.id, code: animal.code, ok: failures.length === 0, failures, rec };
}

export function runAllCases(document: FarmDocument, now: Date): EngineCaseResult[] {
  return referenceCases().map((testCase) => runEngineCase(testCase, document.animals, now));
}
