import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import { RouteError } from '@/app/error-boundary';
import { AppShell } from '@/app/shell/AppShell';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OfflinePage } from '@/pages/OfflinePage';
import { StatusPage } from '@/pages/StatusPage';
import { TeamPage } from '@/pages/TeamPage';

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
