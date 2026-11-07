import type {
  Animal,
  AuditEvent,
  CommandContext,
  FarmDocument,
  FeedLot,
  NutritionRec,
  OperatorProfile,
  Ration,
  WeightRecord,
} from '@/domain';

export const ISO = '2026-08-28T10:00:00.000Z';
export const NOW = new Date(ISO);

export const defaultSettings: FarmDocument['settings'] = {
  farmName: 'Test Farm',
  region: '',
  flockLabel: '',
  locale: 'ar',
  demoMode: true,
  scanStaleDays: 3,
  engineId: 'DDNE',
  engineVersion: 'DDNE-REF-1.0',
  pens: ['P1'],
};

export const defaultOperator: OperatorProfile = {
  id: 'op-1',
  displayName: 'Operator',
  authority: 'production',
  createdAt: ISO,
  updatedAt: ISO,
};

export function makeDocument(overrides: Partial<FarmDocument> = {}): FarmDocument {
  return {
    schemaVersion: 5,
    farmId: 'farm-1',
    createdAt: ISO,
    updatedAt: ISO,
    settings: { ...defaultSettings, pens: [...defaultSettings.pens] },
    operator: { ...defaultOperator },
    animals: [],
    weights: [],
    healthEvents: [],
    recommendations: [],
    feedLots: [],
    auditEvents: [],
    signoffs: [],
    ...overrides,
  };
}

export function makeAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    id: 'an-1',
    farmId: 'farm-1',
    code: 'OV-2401',
    rfid: 'RFID-1',
    sex: 'M',
    breed: 'Ouled Djellal',
    birthDate: '2026-03-01',
    weightKg: 45,
    bcs: 3,
    stage: 'engraissement',
    pen: 'P1',
    status: 'actif',
    lastScanAt: ISO,
    adgKg: 0.25,
    expectedLambingAt: null,
    damId: null,
    sireId: null,
    notes: '',
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  };
}

export const defaultRation: Ration = {
  forageKg: 0.85,
  concentrateKg: 0.78,
  mineralG: 16,
  waterL: 4.9,
  cpPercent: 15,
  meMj: 17,
  dmiKg: 1.63,
};

export function makeRecommendation(overrides: Partial<NutritionRec> = {}): NutritionRec {
  const ration = overrides.ration === undefined ? defaultRation : overrides.ration;
  return {
    id: 'rec-1',
    animalId: 'an-1',
    engineId: 'DDNE',
    engineVersion: 'DDNE-REF-1.0',
    createdAt: ISO,
    inputsHash: 'hash',
    ration,
    notes: [],
    confidence: 'haute',
    missingInputs: ration === null ? [{ key: 'domain.missing.weight' }] : [],
    evidence: [],
    approvedBy: null,
    servedAt: null,
    servedBy: null,
    stocksDeducted: false,
    ...overrides,
  };
}

export function makeApproved(
  overrides: Partial<NutritionRec> = {},
  authority: OperatorProfile['authority'] = 'production',
): NutritionRec {
  return makeRecommendation({
    approvedBy: { id: 'op-1', name: 'Operator', authority, at: ISO },
    ...overrides,
  });
}

export function makeFeedLot(overrides: Partial<FeedLot> = {}): FeedLot {
  return {
    id: 'feed-1',
    name: 'Forage',
    kind: 'fourrage',
    stockKg: 100,
    costPerKg: 3,
    available: true,
    origin: 'local',
    updatedAt: ISO,
    ...overrides,
  };
}

export function makeWeight(overrides: Partial<WeightRecord> = {}): WeightRecord {
  return {
    id: 'w-1',
    animalId: 'an-1',
    kg: 45,
    bcs: 3,
    at: ISO,
    source: 'field',
    note: '',
    createdAt: ISO,
    ...overrides,
  };
}

export function makeAudit(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: 'a-1',
    type: 'saisie',
    at: ISO,
    by: 'op-1',
    entityType: 'animal',
    entityId: 'an-1',
    summary: { key: 'domain.audit.weightRecorded', params: { code: 'OV-2401', kg: 45 } },
    severity: 'info',
    ...overrides,
  };
}

export function makeContext(): CommandContext {
  let counter = 0;
  return { now: NOW, nextId: () => `id-${(counter += 1)}` };
}

/** Animals that exercise every engine case TC-01…TC-08. */
export function engineAnimals(): Animal[] {
  return [
    makeAnimal({ id: 'an-2401', code: 'OV-2401', rfid: 'R-2401', weightKg: 45, bcs: 3 }),
    makeAnimal({
      id: 'an-2410',
      code: 'OV-2410',
      rfid: 'R-2410',
      weightKg: null,
      bcs: 3,
    }),
    makeAnimal({
      id: 'an-2403',
      code: 'OV-2403',
      rfid: 'R-2403',
      weightKg: 60,
      bcs: 3,
      sex: 'F',
      stage: 'brebis_lactation',
      birthDate: '2024-01-01',
    }),
    makeAnimal({
      id: 'an-2408',
      code: 'OV-2408',
      rfid: 'R-2408',
      weightKg: 40,
      bcs: 2,
      stage: 'croissance',
    }),
    makeAnimal({
      id: 'an-2411',
      code: 'OV-2411',
      rfid: 'R-2411',
      weightKg: 45,
      bcs: 4.5,
    }),
    makeAnimal({
      id: 'an-2412',
      code: 'OV-2412',
      rfid: 'R-2412',
      weightKg: 50,
      bcs: null,
    }),
  ];
}

export function engineFeed(): FeedLot[] {
  return [
    makeFeedLot({ id: 'feed-forage', name: 'Forage', kind: 'fourrage', stockKg: 1000 }),
    makeFeedLot({
      id: 'feed-conc',
      name: 'Concentrate',
      kind: 'concentre',
      stockKg: 1000,
      costPerKg: 5,
    }),
  ];
}
