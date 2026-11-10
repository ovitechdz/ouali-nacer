import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ComponentType } from 'react';

import { buildDemoDocument } from '@/app/seed-demo';
import { services } from '@/app/services';
import { AppShell } from '@/app/shell/AppShell';
import { ToastProvider } from '@/components/ui/toast';
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
import { NotFoundPage } from '@/pages/NotFoundPage';
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
import { useFarmStore } from '@/store/farm-store';

const demo = buildDemoDocument(services.clock.now());
const animalId = demo.animals[0]?.id ?? 'missing';

interface RouteCase {
  path: string;
  /** Route pattern when the visited URL contains a dynamic segment. */
  routePath?: string;
  page: ComponentType;
}

const ROUTES: readonly RouteCase[] = [
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

/** Boot a real router on a single route and render the full shell. */
async function renderRoute(testCase: RouteCase): Promise<void> {
  const rootRoute = createRootRoute({
    component: AppShell,
    notFoundComponent: NotFoundPage,
  });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: testCase.routePath ?? testCase.path,
    component: testCase.page,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: [testCase.path] }),
  });
  await router.load();
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  useFarmStore.setState({
    status: 'ready',
    document: demo,
    storage: 'memory',
    busy: false,
    failure: null,
  });
});

describe('every reconstructed route renders inside the shell', () => {
  it.each(ROUTES)('$path', async (testCase) => {
    await renderRoute(testCase);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
