import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppShell } from '@/app/shell/AppShell';
import { ToastProvider } from '@/components/ui/toast';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { demoDocument, ROUTES, type RouteCase } from '@/test/routes';
import { useFarmStore } from '@/store/farm-store';

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
    document: demoDocument,
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
