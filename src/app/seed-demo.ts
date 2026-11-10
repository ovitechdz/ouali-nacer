/**
 * __OVITECH_SEED__ — development-only demonstration dataset.
 *
 * This module is never imported in a production build: `farm-store.ts` loads it
 * behind `import.meta.env.DEV`. Every value is generated locally from the frozen
 * DDNE engine; nothing is fetched. The document carries `demoMode: true`, which
 * makes the shell show an unmissable demonstration banner.
 */
import {
  computeRecommendation,
  createEmptyDocument,
  defaultEngineSettings,
  feedAvailability,
  adgFromHistory,
  message,
  type Animal,
  type AuditEvent,
  type FarmDocument,
  type FeedLot,
  type HealthEvent,
  type NutritionRec,
  type Stage,
  type WeightRecord,
} from '@/domain';

const DAY = 86_400_000;

interface SeedAnimal {
  code: string;
  rfid: string;
  sex: 'F' | 'M';
  stage: Stage;
  pen: string;
  birthDate: string;
  weight: number | null;
  bcs: number | null;
  scanAgeDays: number;
  notes?: string;
}

/** Herd composition mirrors the reference's Ouled Djellal flock, not real animals. */
const SEED_ANIMALS: SeedAnimal[] = [
  {
    code: 'OV-2401',
    rfid: 'E280-1160-0001',
    sex: 'F',
    stage: 'brebis_lactation',
    pen: 'A1',
    birthDate: '2022-03-12',
    weight: 58.4,
    bcs: 3.0,
    scanAgeDays: 1,
  },
  {
    code: 'OV-2402',
    rfid: 'E280-1160-0002',
    sex: 'F',
    stage: 'brebis_gestation',
    pen: 'A1',
    birthDate: '2021-11-03',
    weight: 61.2,
    bcs: 3.2,
    scanAgeDays: 2,
  },
  {
    code: 'OV-2403',
    rfid: 'E280-1160-0003',
    sex: 'F',
    stage: 'brebis_entretien',
    pen: 'A1',
    birthDate: '2020-09-21',
    weight: 54.8,
    bcs: 2.8,
    scanAgeDays: 6,
  },
  {
    code: 'OV-2404',
    rfid: 'E280-1160-0004',
    sex: 'F',
    stage: 'brebis_lactation',
    pen: 'A2',
    birthDate: '2022-01-18',
    weight: 59.6,
    bcs: 2.4,
    scanAgeDays: 1,
  },
  {
    code: 'OV-2405',
    rfid: 'E280-1160-0005',
    sex: 'F',
    stage: 'brebis_gestation',
    pen: 'A2',
    birthDate: '2021-06-30',
    weight: 63.1,
    bcs: 3.4,
    scanAgeDays: 4,
  },
  {
    code: 'OV-2406',
    rfid: 'E280-1160-0006',
    sex: 'F',
    stage: 'brebis_entretien',
    pen: 'A2',
    birthDate: '2019-12-05',
    weight: 51.9,
    bcs: 2.2,
    scanAgeDays: 9,
  },
  {
    code: 'OV-2407',
    rfid: 'E280-1160-0007',
    sex: 'M',
    stage: 'belier',
    pen: 'B1',
    birthDate: '2021-04-14',
    weight: 82.3,
    bcs: 3.6,
    scanAgeDays: 2,
  },
  {
    code: 'OV-2408',
    rfid: 'E280-1160-0008',
    sex: 'F',
    stage: 'brebis_lactation',
    pen: 'B1',
    birthDate: '2022-05-02',
    weight: 57.1,
    bcs: 2.9,
    scanAgeDays: 3,
  },
  {
    code: 'OV-2409',
    rfid: 'E280-1160-0009',
    sex: 'F',
    stage: 'brebis_entretien',
    pen: 'B1',
    birthDate: '2020-02-19',
    weight: 53.4,
    bcs: 2.6,
    scanAgeDays: 1,
  },
  {
    code: 'OV-2410',
    rfid: 'E280-1160-0010',
    sex: 'M',
    stage: 'croissance',
    pen: 'B2',
    birthDate: '2025-10-08',
    weight: null,
    bcs: null,
    scanAgeDays: 12,
    notes: 'Pesée manquante',
  },
  {
    code: 'OV-2411',
    rfid: 'E280-1160-0011',
    sex: 'M',
    stage: 'engraissement',
    pen: 'B2',
    birthDate: '2025-05-27',
    weight: 38.7,
    bcs: 2.7,
    scanAgeDays: 1,
  },
  {
    code: 'OV-2412',
    rfid: 'E280-1160-0012',
    sex: 'M',
    stage: 'engraissement',
    pen: 'B2',
    birthDate: '2025-06-11',
    weight: 36.2,
    bcs: 2.5,
    scanAgeDays: 2,
  },
  {
    code: 'OV-2413',
    rfid: 'E280-1160-0013',
    sex: 'F',
    stage: 'agneau',
    pen: 'C1',
    birthDate: '2026-07-19',
    weight: 16.4,
    bcs: 2.4,
    scanAgeDays: 1,
  },
  {
    code: 'OV-2414',
    rfid: 'E280-1160-0014',
    sex: 'F',
    stage: 'agneau',
    pen: 'C1',
    birthDate: '2026-07-19',
    weight: 15.1,
    bcs: 2.3,
    scanAgeDays: 1,
  },
  {
    code: 'OV-2415',
    rfid: 'E280-1160-0015',
    sex: 'M',
    stage: 'agneau',
    pen: 'C1',
    birthDate: '2026-08-02',
    weight: 14.8,
    bcs: 2.5,
    scanAgeDays: 5,
  },
  {
    code: 'OV-2416',
    rfid: 'E280-1160-0016',
    sex: 'F',
    stage: 'croissance',
    pen: 'C2',
    birthDate: '2026-02-14',
    weight: 29.6,
    bcs: 2.1,
    scanAgeDays: 8,
  },
  {
    code: 'OV-2417',
    rfid: 'E280-1160-0017',
    sex: 'F',
    stage: 'brebis_entretien',
    pen: 'C2',
    birthDate: '2018-10-01',
    weight: 48.2,
    bcs: 1.8,
    scanAgeDays: 2,
    notes: 'حالة جسم منخفضة — متابعة',
  },
  {
    code: 'OV-2418',
    rfid: 'E280-1160-0018',
    sex: 'M',
    stage: 'croissance',
    pen: 'C2',
    birthDate: '2025-11-23',
    weight: 34.3,
    bcs: 2.8,
    scanAgeDays: 3,
  },
];

const SEED_LOTS = [
  {
    name: 'تبن الشعير',
    kind: 'fourrage' as const,
    stockKg: 4200,
    costPerKg: 18,
    origin: 'سيدي بلعباس',
  },
  {
    name: 'سيلاج الذرة',
    kind: 'fourrage' as const,
    stockKg: 2600,
    costPerKg: 22,
    origin: 'مستغانم',
  },
  {
    name: 'علف مركز',
    kind: 'concentre' as const,
    stockKg: 1800,
    costPerKg: 46,
    origin: 'وحدة الخلط',
  },
  {
    name: 'مكمل معدني',
    kind: 'mineral' as const,
    stockKg: 150,
    costPerKg: 120,
    origin: 'مورد محلي',
  },
];

export function buildDemoDocument(now: Date): FarmDocument {
  const settings = defaultEngineSettings({
    farmName: 'مزرعة العرض — سيدي بلعباس',
    region: 'سيدي بلعباس',
    flockLabel: 'قطيع أولاد جلال',
    locale: 'ar',
    demoMode: true,
    scanStaleDays: 3,
    pens: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  });

  const createdAt = new Date(now.getTime() - 120 * DAY).toISOString();
  const base = createEmptyDocument({
    farmId: 'demo-farm',
    createdAt,
    settings,
    operator: {
      id: 'demo-operator',
      displayName: 'مسؤول الإنتاج',
      authority: 'production',
      createdAt,
      updatedAt: createdAt,
    },
  });

  const feedLots: FeedLot[] = SEED_LOTS.map((lot, index) => ({
    id: `demo-feed-${index + 1}`,
    name: lot.name,
    kind: lot.kind,
    stockKg: lot.stockKg,
    costPerKg: lot.costPerKg,
    available: true,
    origin: lot.origin,
    updatedAt: new Date(now.getTime() - 2 * DAY).toISOString(),
  }));

  const animals: Animal[] = [];
  const weights: WeightRecord[] = [];
  const auditEvents: AuditEvent[] = [];

  SEED_ANIMALS.forEach((seed, index) => {
    const lastScanAt = new Date(now.getTime() - seed.scanAgeDays * DAY).toISOString();
    const animal: Animal = {
      id: `demo-animal-${index + 1}`,
      farmId: base.farmId,
      code: seed.code,
      rfid: seed.rfid,
      sex: seed.sex,
      breed: 'أولاد جلال',
      birthDate: seed.birthDate,
      weightKg: seed.weight,
      bcs: seed.bcs,
      stage: seed.stage,
      pen: seed.pen,
      status: 'actif',
      lastScanAt,
      adgKg: null,
      expectedLambingAt:
        seed.stage === 'brebis_gestation' ? new Date(now.getTime() + 35 * DAY).toISOString() : null,
      damId: null,
      sireId: null,
      notes: seed.notes ?? '',
      createdAt: new Date(now.getTime() - 90 * DAY).toISOString(),
      updatedAt: lastScanAt,
    };

    if (seed.weight !== null) {
      const latest = seed.weight;
      const previous = Math.round((latest - 1.8) * 10) / 10;
      const earlier = Math.round((latest - 3.1) * 10) / 10;
      const records = [
        { kg: earlier, days: 30 },
        { kg: previous, days: 14 },
        { kg: latest, days: 1 },
      ];
      for (const [recordIndex, record] of records.entries()) {
        weights.push({
          id: `demo-weight-${index + 1}-${recordIndex + 1}`,
          animalId: animal.id,
          kg: record.kg,
          bcs: seed.bcs,
          at: new Date(now.getTime() - record.days * DAY).toISOString(),
          source: 'seed',
          note: '',
          createdAt: new Date(now.getTime() - record.days * DAY).toISOString(),
        });
      }
      animal.adgKg = adgFromHistory(weights, animal.id);
    }

    animals.push(animal);

    auditEvents.push({
      id: `demo-audit-register-${index + 1}`,
      type: 'identite',
      at: animal.createdAt,
      by: base.operator.id,
      entityType: 'animal',
      entityId: animal.id,
      summary: message('domain.audit.animalRegistered', { code: animal.code }),
      severity: 'info',
    });
  });

  const healthEvents: HealthEvent[] = [
    {
      id: 'demo-health-1',
      animalId: 'demo-animal-17',
      type: 'examen',
      at: new Date(now.getTime() - 3 * DAY).toISOString(),
      by: base.operator.id,
      note: 'فقدان وزن ملحوظ — تعديل الحصة ومتابعة أسبوعية',
      severity: 'alerte',
      createdAt: new Date(now.getTime() - 3 * DAY).toISOString(),
    },
    {
      id: 'demo-health-2',
      animalId: 'demo-animal-5',
      type: 'vaccination',
      at: new Date(now.getTime() - 20 * DAY).toISOString(),
      by: base.operator.id,
      note: 'تحصين دوري حسب البروتوكول البيطري',
      severity: 'info',
      createdAt: new Date(now.getTime() - 20 * DAY).toISOString(),
    },
    {
      id: 'demo-health-3',
      animalId: 'demo-animal-12',
      type: 'observation',
      at: new Date(now.getTime() - 8 * DAY).toISOString(),
      by: base.operator.id,
      note: 'شهية جيدة — لا علامات سريرية',
      severity: 'info',
      createdAt: new Date(now.getTime() - 8 * DAY).toISOString(),
    },
  ];

  const availability = feedAvailability(feedLots);
  const recommendations: NutritionRec[] = [];

  for (const animal of animals) {
    const draft = computeRecommendation(animal, availability, now);
    const createdAtRec = new Date(now.getTime() - 2 * DAY).toISOString();
    const rec: NutritionRec = {
      id: `demo-rec-${animal.id}`,
      animalId: animal.id,
      engineId: draft.engineId,
      engineVersion: draft.engineVersion,
      createdAt: createdAtRec,
      inputsHash: draft.inputsHash,
      ration: draft.ration,
      notes: draft.notes,
      confidence: draft.confidence,
      missingInputs: draft.missingInputs,
      evidence: draft.evidence,
      approvedBy: null,
      servedAt: null,
      servedBy: null,
      stocksDeducted: false,
    };

    // A few already-approved rations exercise the serve gate without pretending
    // that anything was distributed to real animals.
    if (
      rec.ration !== null &&
      ['demo-animal-1', 'demo-animal-2', 'demo-animal-4'].includes(animal.id)
    ) {
      rec.approvedBy = {
        id: base.operator.id,
        name: base.operator.displayName,
        authority: 'production',
        at: createdAtRec,
      };
    }

    recommendations.push(rec);
  }

  return {
    ...base,
    updatedAt: now.toISOString(),
    animals,
    weights,
    healthEvents,
    recommendations,
    feedLots,
    auditEvents,
    signoffs: [],
  };
}
