import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router';

import { RouteError } from '@/app/error-boundary';
import { AppShell } from '@/app/shell/AppShell';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Every non-home route is its own lazy chunk. The shell keeps the entry bundle
 * small and the Suspense boundary in AppShell shows the page skeleton.
 */
const JourneePage = lazyRouteComponent(() => import('@/pages/JourneePage'), 'Journee');
const ScanPage = lazyRouteComponent(() => import('@/pages/ScanPage'), 'ScanPage');
const HerdPage = lazyRouteComponent(() => import('@/pages/HerdPage'), 'HerdPage');
const AnimalPage = lazyRouteComponent(() => import('@/pages/AnimalPage'), 'AnimalPage');
const HealthPage = lazyRouteComponent(() => import('@/pages/HealthPage'), 'HealthPage');
const NutritionPage = lazyRouteComponent(() => import('@/pages/NutritionPage'), 'NutritionPage');
const RationPage = lazyRouteComponent(() => import('@/pages/RationPage'), 'RationPage');
const FeedPage = lazyRouteComponent(() => import('@/pages/FeedPage'), 'FeedPage');
const EnergyPage = lazyRouteComponent(() => import('@/pages/EnergyPage'), 'EnergyPage');
const KpiPage = lazyRouteComponent(() => import('@/pages/KpiPage'), 'KpiPage');
const JournalPage = lazyRouteComponent(() => import('@/pages/JournalPage'), 'JournalPage');
const SyncPage = lazyRouteComponent(() => import('@/pages/SyncPage'), 'SyncPage');
const ProofPage = lazyRouteComponent(() => import('@/pages/ProofPage'), 'ProofPage');
const VerificationPage = lazyRouteComponent(
  () => import('@/pages/VerificationPage'),
  'VerificationPage',
);
const EcosystemHubPage = lazyRouteComponent(
  () => import('@/pages/ecosystem/EcosystemPages'),
  'EcosystemHubPage',
);
const CamerasPage = lazyRouteComponent(
  () => import('@/pages/ecosystem/EcosystemPages'),
  'CamerasPage',
);
const GatesPage = lazyRouteComponent(() => import('@/pages/ecosystem/EcosystemPages'), 'GatesPage');
const ScalePage = lazyRouteComponent(() => import('@/pages/ecosystem/EcosystemPages'), 'ScalePage');
const IotPage = lazyRouteComponent(() => import('@/pages/ecosystem/EcosystemPages'), 'IotPage');
const VisionPage = lazyRouteComponent(() => import('@/pages/VisionPage'), 'VisionPage');
const InvestorsPage = lazyRouteComponent(() => import('@/pages/InvestorsPage'), 'InvestorsPage');
const LabelPage = lazyRouteComponent(() => import('@/pages/LabelPage'), 'LabelPage');
const TeamPage = lazyRouteComponent(() => import('@/pages/TeamPage'), 'TeamPage');
const StatusPage = lazyRouteComponent(() => import('@/pages/StatusPage'), 'StatusPage');
const OfflinePage = lazyRouteComponent(() => import('@/pages/OfflinePage'), 'OfflinePage');

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteError,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const journeeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journee',
  component: JourneePage,
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scan',
  component: ScanPage,
});

const herdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/troupeau',
  component: HerdPage,
});

const animalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/troupeau/$id',
  component: AnimalPage,
});

const healthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sante',
  component: HealthPage,
});

const nutritionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nutrition',
  component: NutritionPage,
});

const rationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ration',
  component: RationPage,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fourrage',
  component: FeedPage,
});

const energyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/energie',
  component: EnergyPage,
});

const kpiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/indicateurs',
  component: KpiPage,
});

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journal',
  component: JournalPage,
});

const syncRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sync',
  component: SyncPage,
});

// Phase 2 decision M-4 named the local data page `/donnees`; `/sync` stays as
// the historical alias so existing links keep working.
const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/donnees',
  component: SyncPage,
});

const proofRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/preuve',
  component: ProofPage,
});

const verificationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verification',
  component: VerificationPage,
});

const ecosystemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ecosysteme',
  component: EcosystemHubPage,
});

const camerasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ecosysteme/cameras',
  component: CamerasPage,
});

const gatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ecosysteme/portails',
  component: GatesPage,
});

const scaleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ecosysteme/balance',
  component: ScalePage,
});

const iotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ecosysteme/iot',
  component: IotPage,
});

const visionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vision',
  component: VisionPage,
});

const investorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/investisseurs',
  component: InvestorsPage,
});

const labelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/label',
  component: LabelPage,
});

/** Primary team route, matching the style site. */
const equipeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/equipe',
  component: TeamPage,
});

/** Approved alias: both URLs render the same implementation. */
const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/team',
  component: TeamPage,
});

const statusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/etat',
  component: StatusPage,
});

const offlineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/offline',
  component: OfflinePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  journeeRoute,
  scanRoute,
  herdRoute,
  animalRoute,
  healthRoute,
  nutritionRoute,
  rationRoute,
  feedRoute,
  energyRoute,
  kpiRoute,
  journalRoute,
  syncRoute,
  dataRoute,
  proofRoute,
  verificationRoute,
  ecosystemRoute,
  camerasRoute,
  gatesRoute,
  scaleRoute,
  iotRoute,
  visionRoute,
  investorsRoute,
  labelRoute,
  equipeRoute,
  teamRoute,
  statusRoute,
  offlineRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
