import { describe, expect, it } from 'vitest';

import { NOW, makeAnimal } from '@/test/factories';

import {
  ADG_TARGET,
  CONC_ME,
  CONC_CP,
  FORAGE_CP,
  FORAGE_ME,
  ME_MAINT_COEFF,
  ME_PER_KG_GAIN,
  ME_PER_KG_MILK,
  MILK_KG_DEFAULT,
  computeRecommendation,
} from './nutrition';
import { STAGES } from './types';

const fullFeed = { forageAvailable: true, concentrateAvailable: true };

describe('DDNE constants', () => {
  it('match the frozen reference coefficients', () => {
    expect(ME_MAINT_COEFF).toBe(0.4);
    expect(ME_PER_KG_GAIN).toBe(23);
    expect(ME_PER_KG_MILK).toBe(5);
    expect(MILK_KG_DEFAULT).toBe(1.1);
    expect(FORAGE_ME).toBe(8.5);
    expect(CONC_ME).toBe(12.5);
    expect(FORAGE_CP).toBe(12);
    expect(CONC_CP).toBe(18);
    expect(ADG_TARGET.agneau).toBe(0.22);
    expect(ADG_TARGET.croissance).toBe(0.18);
    expect(ADG_TARGET.engraissement).toBe(0.24);
    expect(ADG_TARGET.brebis_gestation).toBe(0.04);
    expect(ADG_TARGET.belier).toBe(0);
  });
});

describe('refusal contract', () => {
  it('refuses a missing weight', () => {
    const rec = computeRecommendation(makeAnimal({ weightKg: null }), fullFeed, NOW);
    expect(rec.ration).toBeNull();
    expect(rec.confidence).toBe('insuffisante');
    expect(rec.missingInputs.map((entry) => entry.key)).toEqual(['domain.missing.weight']);
    expect(rec.notes.map((entry) => entry.key)).toContain('domain.note.refusalTitle');
    expect(rec.evidence.map((entry) => entry.key)).toContain('domain.evidence.engine');
  });

  it('refuses a missing body condition score', () => {
    const rec = computeRecommendation(makeAnimal({ bcs: null }), fullFeed, NOW);
    expect(rec.ration).toBeNull();
    expect(rec.missingInputs.map((entry) => entry.key)).toEqual(['domain.missing.bcs']);
  });

  it('refuses when no feed lot is available', () => {
    const rec = computeRecommendation(
      makeAnimal(),
      {
        forageAvailable: false,
        concentrateAvailable: false,
      },
      NOW,
    );
    expect(rec.ration).toBeNull();
    expect(rec.missingInputs.map((entry) => entry.key)).toEqual(['domain.missing.feed']);
  });

  it('lists every missing input at once', () => {
    const rec = computeRecommendation(
      makeAnimal({ weightKg: null, bcs: null }),
      { forageAvailable: false, concentrateAvailable: false },
      NOW,
    );
    expect(rec.missingInputs).toHaveLength(3);
  });

  it('refuses a non-finite or zero weight', () => {
    expect(computeRecommendation(makeAnimal({ weightKg: 0 }), fullFeed, NOW).ration).toBeNull();
    expect(
      computeRecommendation(makeAnimal({ weightKg: Number.POSITIVE_INFINITY }), fullFeed, NOW)
        .ration,
    ).toBeNull();
  });
});

describe('emitted rations', () => {
  it('emits a finite ration for every stage', () => {
    for (const stage of STAGES) {
      const rec = computeRecommendation(
        makeAnimal({ stage, adgKg: 0.2, weightKg: 50, bcs: 3 }),
        fullFeed,
        NOW,
      );
      expect(rec.ration, stage).not.toBeNull();
      const ration = rec.ration!;
      for (const value of Object.values(ration)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      expect(ration.forageKg + ration.concentrateKg).toBeCloseTo(ration.dmiKg, 1);
    }
  });

  it('uses a high concentrate share for fattening and a low one for maintenance', () => {
    const fattening = computeRecommendation(
      makeAnimal({ stage: 'engraissement', weightKg: 45, bcs: 3 }),
      fullFeed,
      NOW,
    ).ration!;
    const maintenance = computeRecommendation(
      makeAnimal({ stage: 'brebis_entretien', weightKg: 45, bcs: 3 }),
      fullFeed,
      NOW,
    ).ration!;
    expect(fattening.concentrateKg / fattening.dmiKg).toBeGreaterThan(
      maintenance.concentrateKg / maintenance.dmiKg,
    );
  });

  it('raises water and energy for a lactating ewe', () => {
    const rec = computeRecommendation(
      makeAnimal({ stage: 'brebis_lactation', weightKg: 60, bcs: 3, sex: 'F' }),
      fullFeed,
      NOW,
    );
    expect(rec.ration!.waterL).toBeGreaterThanOrEqual(7);
    expect(rec.evidence.map((entry) => entry.key)).toContain('domain.evidence.lactation');
  });

  it('adds energy and a note for a low BCS', () => {
    const rec = computeRecommendation(makeAnimal({ weightKg: 40, bcs: 2 }), fullFeed, NOW);
    expect(rec.notes.map((entry) => entry.key)).toContain('domain.note.lowBcs');
    expect(rec.evidence.map((entry) => entry.key)).toContain('domain.evidence.bcsAdjust');
  });

  it('reduces the ration and notes a high BCS', () => {
    const rec = computeRecommendation(makeAnimal({ weightKg: 45, bcs: 4.5 }), fullFeed, NOW);
    expect(rec.notes.map((entry) => entry.key)).toContain('domain.note.highBcs');
    expect(
      rec.evidence.find((entry) => entry.key === 'domain.evidence.bcsAdjust')?.params?.value,
    ).toMatch(/^-/);
  });

  it('falls back to a forage-only ration when concentrate is unavailable', () => {
    const rec = computeRecommendation(
      makeAnimal({ weightKg: 45, bcs: 3 }),
      { forageAvailable: true, concentrateAvailable: false },
      NOW,
    );
    expect(rec.ration!.concentrateKg).toBe(0);
    expect(rec.notes.map((entry) => entry.key)).toContain('domain.note.noConcentrate');
    expect(rec.notes.map((entry) => entry.key)).toContain('domain.note.humanExecution');
  });

  it('notes the absence of forage without refusing', () => {
    const rec = computeRecommendation(
      makeAnimal({ weightKg: 45, bcs: 3 }),
      { forageAvailable: false, concentrateAvailable: true },
      NOW,
    );
    expect(rec.ration).not.toBeNull();
    expect(rec.notes.map((entry) => entry.key)).toContain('domain.note.noForage');
  });

  it('marks confidence by the presence of daily gain', () => {
    const withAdg = computeRecommendation(makeAnimal({ adgKg: 0.2 }), fullFeed, NOW);
    const withoutAdg = computeRecommendation(makeAnimal({ adgKg: null }), fullFeed, NOW);
    expect(withAdg.confidence).toBe('haute');
    expect(withoutAdg.confidence).toBe('moyenne');
    expect(withoutAdg.notes.map((entry) => entry.key)).toContain('domain.note.mediumConfidence');
  });

  it('warns when daily gain is below target', () => {
    const rec = computeRecommendation(
      makeAnimal({ stage: 'engraissement', adgKg: 0.1 }),
      fullFeed,
      NOW,
    );
    expect(rec.notes.map((entry) => entry.key)).toContain('domain.note.lowAdg');
  });

  it('uses the young dry-matter ceiling below twelve months', () => {
    const young = computeRecommendation(
      makeAnimal({ birthDate: '2026-03-01', weightKg: 45, stage: 'brebis_entretien' }),
      fullFeed,
      NOW,
    );
    const adult = computeRecommendation(
      makeAnimal({ birthDate: '2020-03-01', weightKg: 45, stage: 'brebis_entretien' }),
      fullFeed,
      NOW,
    );
    expect(young.ration!.dmiKg).toBeGreaterThanOrEqual(adult.ration!.dmiKg);
    expect(
      young.evidence.find((entry) => entry.key === 'domain.evidence.dmi')?.params?.percent,
    ).toBe(3.8);
    expect(
      adult.evidence.find((entry) => entry.key === 'domain.evidence.dmi')?.params?.percent,
    ).toBe(3.2);
  });

  it('keeps engine identity and a stable input hash', () => {
    const animal = makeAnimal();
    const first = computeRecommendation(animal, fullFeed, NOW);
    const second = computeRecommendation(animal, fullFeed, NOW);
    expect(first.engineId).toBe('DDNE');
    expect(first.engineVersion).toBe('DDNE-REF-1.0');
    expect(first.inputsHash).toBe(second.inputsHash);
    expect(first.inputsHash).not.toBe(
      computeRecommendation({ ...animal, weightKg: 46 }, fullFeed, NOW).inputsHash,
    );
  });

  it('emits evidence for weight, maintenance and the final ration', () => {
    const rec = computeRecommendation(makeAnimal(), fullFeed, NOW);
    const keys = rec.evidence.map((entry) => entry.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'domain.evidence.identity',
        'domain.evidence.stageBreed',
        'domain.evidence.engine',
        'domain.evidence.weightBcsAge',
        'domain.evidence.maintenance',
        'domain.evidence.total',
        'domain.evidence.dmi',
        'domain.evidence.ration',
      ]),
    );
  });
});
