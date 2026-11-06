import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';

import { AppShell } from '@/app/shell/AppShell';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OfflinePage } from '@/pages/OfflinePage';
import { StatusPage } from '@/pages/StatusPage';
import { TeamPage } from '@/pages/TeamPage';

/** Render the real shell and routes on an in-memory history. */
export async function renderApp(path = '/') {
  const rootRoute = createRootRoute({
    component: AppShell,
    notFoundComponent: NotFoundPage,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
  });
  const equipeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/equipe',
    component: TeamPage,
  });
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

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      equipeRoute,
      teamRoute,
      statusRoute,
      offlineRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
}
