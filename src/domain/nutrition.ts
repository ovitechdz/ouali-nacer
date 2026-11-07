import type { MessageDescriptor } from './messages';
import {
  ENGINE_ID,
  ENGINE_VERSION,
  type Animal,
  type Confidence,
  type Ration,
  type Stage,
  message,
} from './types';
import type { FeedAvailability } from './feed';
import { ageMonths } from './time';
import { round0, round1, stableHash } from './numeric';

export const ME_MAINT_COEFF = 0.4;
export const ME_PER_KG_GAIN = 23;
export const ME_PER_KG_MILK = 5;
export const MILK_KG_DEFAULT = 1.1;
export const FORAGE_ME = 8.5;
export const CONC_ME = 12.5;
export const FORAGE_CP = 12;
export const CONC_CP = 18;

export const ADG_TARGET: Record<Stage, number> = {
  agneau: 0.22,
  croissance: 0.18,
  engraissement: 0.24,
  brebis_entretien: 0,
  brebis_gestation: 0.04,
  brebis_lactation: 0,
  belier: 0,
};

export interface RecommendationDraft {
  animalId: string;
  engineId: string;
  engineVersion: string;
  inputsHash: string;
  ration: Ration | null;
  notes: MessageDescriptor[];
  confidence: Confidence;
  missingInputs: MessageDescriptor[];
  evidence: MessageDescriptor[];
}

/**
 * DDNE — deterministic nutrition engine, frozen as DDNE-REF-1.0.
 *
 * It is NOT a machine-learning model. It computes metabolisable energy needs
 * from live weight, body condition, stage and feed availability, and refuses
 * to emit a ration when a required input is missing. Every emitted ration
 * carries its inputs as evidence.
 */
export function computeRecommendation(
  animal: Animal,
  availability: FeedAvailability,
  now: Date,
): RecommendationDraft {
  const weight = animal.weightKg;
  const bcs = animal.bcs;
  const age = ageMonths(animal.birthDate, now);

  const missing: MessageDescriptor[] = [];
  if (weight == null || !Number.isFinite(weight) || weight <= 0) {
    missing.push(message('domain.missing.weight'));
  }
  if (bcs == null || !Number.isFinite(bcs)) {
    missing.push(message('domain.missing.bcs'));
  }
  if (!availability.forageAvailable && !availability.concentrateAvailable) {
    missing.push(message('domain.missing.feed'));
  }

  const evidence: MessageDescriptor[] = [
    message('domain.evidence.identity', {
      code: animal.code,
      rfid: animal.rfid || '—',
    }),
    message('domain.evidence.stageBreed', {
      stage: `domain.stage.${animal.stage}`,
      breed: animal.breed,
    }),
    message('domain.evidence.engine', { engineVersion: ENGINE_VERSION }),
  ];

  const inputsHash = stableHash(
    [
      animal.id,
      weight ?? 'null',
      bcs ?? 'null',
      animal.stage,
      animal.adgKg ?? 'null',
      age,
      availability.forageAvailable ? 'f1' : 'f0',
      availability.concentrateAvailable ? 'c1' : 'c0',
    ].join('|'),
  );

  if (missing.length > 0) {
    return {
      animalId: animal.id,
      engineId: ENGINE_ID,
      engineVersion: ENGINE_VERSION,
      inputsHash,
      ration: null,
      notes: [message('domain.note.refusalTitle'), message('domain.note.refusalBody')],
      confidence: 'insuffisante',
      missingInputs: missing,
      evidence,
    };
  }

  const w = weight as number;
  const condition = bcs as number;
  const notes: MessageDescriptor[] = [];

  evidence.push(
    message('domain.evidence.weightBcsAge', {
      weight: w.toFixed(1),
      bcs: condition.toFixed(1),
      age,
    }),
  );

  const maintenance = ME_MAINT_COEFF * Math.pow(w, 0.75);
  evidence.push(
    message('domain.evidence.maintenance', {
      weight: w,
      value: maintenance.toFixed(2),
    }),
  );

  let extra = 0;
  const adgTarget = ADG_TARGET[animal.stage];
  if (adgTarget > 0) {
    extra += adgTarget * ME_PER_KG_GAIN;
    evidence.push(
      message('domain.evidence.growth', {
        adg: adgTarget,
        value: (adgTarget * ME_PER_KG_GAIN).toFixed(1),
      }),
    );
  }
  if (animal.stage === 'brebis_lactation') {
    extra += MILK_KG_DEFAULT * ME_PER_KG_MILK;
    evidence.push(
      message('domain.evidence.lactation', {
        milk: MILK_KG_DEFAULT,
        value: (MILK_KG_DEFAULT * ME_PER_KG_MILK).toFixed(1),
      }),
    );
  }

  let bcsAdjust = 0;
  if (condition < 2.5) {
    bcsAdjust = maintenance * 0.12;
    notes.push(message('domain.note.lowBcs'));
    evidence.push(message('domain.evidence.bcsAdjust', { value: `+${bcsAdjust.toFixed(2)}` }));
  } else if (condition > 4) {
    bcsAdjust = -maintenance * 0.08;
    notes.push(message('domain.note.highBcs'));
    evidence.push(message('domain.evidence.bcsAdjust', { value: bcsAdjust.toFixed(2) }));
  }

  const meNeed = Math.max(maintenance * 0.85, maintenance + extra + bcsAdjust);
  evidence.push(message('domain.evidence.total', { value: meNeed.toFixed(1) }));

  const young =
    age < 12 ||
    animal.stage === 'agneau' ||
    animal.stage === 'croissance' ||
    animal.stage === 'engraissement';
  const dmiMax = w * (young ? 0.038 : 0.032);
  evidence.push(
    message('domain.evidence.dmi', {
      percent: young ? 3.8 : 3.2,
      value: dmiMax.toFixed(2),
    }),
  );

  let concentrateShare = 0.28;
  if (animal.stage === 'engraissement' || animal.stage === 'agneau') concentrateShare = 0.48;
  if (animal.stage === 'brebis_lactation') concentrateShare = 0.38;
  if (animal.stage === 'brebis_entretien' || animal.stage === 'belier') concentrateShare = 0.18;
  if (!availability.concentrateAvailable) {
    concentrateShare = 0;
    notes.push(message('domain.note.noConcentrate'));
  }
  if (!availability.forageAvailable) {
    concentrateShare = Math.min(0.7, concentrateShare + 0.25);
    notes.push(message('domain.note.noForage'));
  }

  let dmi = Math.min(
    dmiMax,
    meNeed / (concentrateShare * CONC_ME + (1 - concentrateShare) * FORAGE_ME),
  );
  dmi = Math.min(dmiMax, Math.max(0.6, dmi));

  const concentrateKg = round1(dmi * concentrateShare);
  const forageKg = round1(dmi - concentrateKg);
  const mineralG = round0(w * 0.35 + (animal.stage === 'brebis_lactation' ? 8 : 0));
  const waterL = round1(w * 0.09 + (animal.stage === 'brebis_lactation' ? 2.5 : 0.8));
  const meMj = round1(forageKg * FORAGE_ME + concentrateKg * CONC_ME);
  const cpPercent = round1((forageKg * FORAGE_CP + concentrateKg * CONC_CP) / Math.max(dmi, 0.1));

  const ration: Ration = {
    forageKg,
    concentrateKg,
    mineralG,
    waterL,
    cpPercent,
    meMj,
    dmiKg: round1(dmi),
  };

  notes.push(message('domain.note.humanExecution'));
  if (animal.stage === 'engraissement') notes.push(message('domain.note.finishing'));
  if (animal.adgKg != null && adgTarget > 0 && animal.adgKg < adgTarget * 0.7) {
    notes.push(message('domain.note.lowAdg'));
  }

  const confidence: Confidence = animal.adgKg == null ? 'moyenne' : 'haute';
  if (confidence === 'moyenne') notes.push(message('domain.note.mediumConfidence'));

  evidence.push(
    message('domain.evidence.ration', {
      forage: forageKg,
      concentrate: concentrateKg,
      energy: meMj,
      protein: cpPercent,
    }),
  );

  return {
    animalId: animal.id,
    engineId: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    inputsHash,
    ration,
    notes,
    confidence,
    missingInputs: [],
    evidence,
  };
}
