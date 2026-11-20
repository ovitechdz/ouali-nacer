import type { RouteComponent } from '@tanstack/react-router';

import { buildDemoDocument } from '@/app/seed-demo';
import { services } from '@/app/services';
import { AnimalPage } from '@/pages/AnimalPage';
import { EnergyPage } from '@/pages/EnergyPage';
import { FeedPage } from '@/pages/FeedPage';
import { HealthPage } from '@/pages/HealthPage';
import { HerdPage } from '@/pages/HerdPage';
import { HomePage } from '@/pages/HomePage';
import { InvestorsPage } from '@/pages/InvestorsPage';
import { JournalPage } from '@/pages/JournalPage';
import { Journee } from '@/pages/JourneePage';
import { KpiPage } from '@/pages/KpiPage';
import { LabelPage } from '@/pages/LabelPage';
import { NutritionPage } from '@/pages/NutritionPage';
import { ProofPage } from '@/pages/ProofPage';
import { RationPage } from '@/pages/RationPage';
import { ScanPage } from '@/pages/ScanPage';
import { SyncPage } from '@/pages/SyncPage';
import { TeamPage } from '@/pages/TeamPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { VisionPage } from '@/pages/VisionPage';
import {
  CamerasPage,
  EcosystemHubPage,
  GatesPage,
  IotPage,
  ScalePage,
} from '@/pages/ecosystem/EcosystemPages';

/** Deterministic demo built once, shared by the route smoke and axe suites. */
export const demoDocument = buildDemoDocument(services.clock.now());
const animalId = demoDocument.animals[0]?.id ?? 'missing';

export interface RouteCase {
  path: string;
  /** Route pattern when the visited URL contains a dynamic segment. */
  routePath?: string;
  page: RouteComponent;
}

export const ROUTES: readonly RouteCase[] = [
  { path: '/', page: HomePage },
  { path: '/journee', page: Journee },
  { path: '/scan', page: ScanPage },
  { path: '/troupeau', page: HerdPage },
  { path: `/troupeau/${animalId}`, routePath: '/troupeau/$id', page: AnimalPage },
  { path: '/sante', page: HealthPage },
  { path: '/nutrition', page: NutritionPage },
  { path: '/ration', page: RationPage },
  { path: '/fourrage', page: FeedPage },
  { path: '/energie', page: EnergyPage },
  { path: '/indicateurs', page: KpiPage },
  { path: '/journal', page: JournalPage },
  { path: '/sync', page: SyncPage },
  { path: '/preuve', page: ProofPage },
  { path: '/verification', page: VerificationPage },
  { path: '/ecosysteme', page: EcosystemHubPage },
  { path: '/ecosysteme/cameras', page: CamerasPage },
  { path: '/ecosysteme/portails', page: GatesPage },
  { path: '/ecosysteme/balance', page: ScalePage },
  { path: '/ecosysteme/iot', page: IotPage },
  { path: '/vision', page: VisionPage },
  { path: '/investisseurs', page: InvestorsPage },
  { path: '/label', page: LabelPage },
  { path: '/equipe', page: TeamPage },
];
