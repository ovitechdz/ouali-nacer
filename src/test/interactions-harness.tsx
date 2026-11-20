import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type RouteComponent,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';

import { buildDemoDocument } from '@/app/seed-demo';
import { services } from '@/app/services';
import { ToastProvider } from '@/components/ui/toast';
import { changeLanguage } from '@/i18n';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useFarmStore } from '@/store/farm-store';
import type { FarmDocument } from '@/domain';

/**
 * Shared fixture for the page-interaction suites (split from the old
 * `interactions.test.tsx`, which rendered the full shell in every test).
 *
 * Each file builds the deterministic demo document once, then each test gets an
 * isolated clone. The harness renders the page under test inside a minimal
 * `<main>` host instead of the full AppShell: no sidebar, header, footer,
 * notices or drawer are needed by these assertions, and dropping them removes
 * the largest repeatable cost per test.
 */

/** The current per-test clone; reassigned by the beforeEach hook. */
export let demo: FarmDocument;

let baseDemo: FarmDocument;

export interface FixtureOptions {
  /** Keep only the first N animals and the records that belong to them. */
  animals?: number;
  /** Keep only the first N audit events. */
  auditEvents?: number;
}

function trimDemo(document: FarmDocument, options: FixtureOptions): FarmDocument {
  const kept =
    options.animals && options.animals < document.animals.length
      ? document.animals.slice(0, options.animals)
      : document.animals;
  const ids = new Set(kept.map((animal) => animal.id));
  return {
    ...document,
    animals: kept,
    weights: document.weights.filter((row) => ids.has(row.animalId)),
    healthEvents: document.healthEvents.filter((row) => ids.has(row.animalId)),
    recommendations: document.recommendations.filter((row) => ids.has(row.animalId)),
    auditEvents:
      options.auditEvents && options.auditEvents < document.auditEvents.length
        ? document.auditEvents.slice(0, options.auditEvents)
        : document.auditEvents,
  };
}

function PageHost() {
  return (
    <main id="main-content">
      <Outlet />
    </main>
  );
}

/** Register the per-file fixture hooks. Call once at the top of a test file. */
export function registerFixture(options: FixtureOptions = {}): void {
  // The old single file gave all thirteen flows a 30 s ceiling. The split keeps
  // that ceiling per file so a loaded worker cannot fail a flow it never failed
  // before; the rest of the suite keeps the 20 s global default. A ceiling is
  // not a wait: nothing here sleeps.
  vi.setConfig({ testTimeout: 30_000 });

  beforeAll(async () => {
    // Use the app helper so the English bundle is actually loaded.
    await changeLanguage('en');
    baseDemo = trimDemo(buildDemoDocument(services.clock.now()), options);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  beforeEach(async () => {
    demo = structuredClone(baseDemo);
    await services.farm.replace(demo);
    useFarmStore.setState({
      status: 'ready',
      document: demo,
      storage: 'memory',
      busy: false,
      failure: null,
    });
    vi.spyOn(window, 'print').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

/** The first demo animal's id, for the animal route. */
export function firstAnimalId(): string {
  return demo.animals[0]?.id ?? 'missing';
}

/** Render one page behind the router, with no shell around it. */
export async function renderPage(
  path: string,
  page: RouteComponent,
  routePath?: string,
): Promise<HTMLElement> {
  const rootRoute = createRootRoute({ component: PageHost, notFoundComponent: NotFoundPage });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: routePath ?? path,
    component: page,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  const { container } = render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  return container;
}

export function panel(): HTMLElement {
  return screen.getByRole('dialog');
}

export function setValue(label: RegExp, value: string, scope: HTMLElement | null = null): void {
  const root = scope ?? document.body;
  fireEvent.change(within(root).getByLabelText(label), { target: { value } });
}

export async function expectDialogClosed(): Promise<void> {
  // A dialog closes only after an async command has written the document and
  // the page has re-rendered. v8 coverage on a loaded worker pushed that past
  // the 1 s polling default (the original flake); 3 s still fails on a real
  // regression and does not mask one.
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
    timeout: 3000,
  });
}
