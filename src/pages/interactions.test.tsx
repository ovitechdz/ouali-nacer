import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type RouteComponent,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// This file renders full pages (router + i18n + large lists) in jsdom, so a single
// test costs 2-9 s. Setup cost was reduced first (demo document built once); the
// remaining budget is render-dominated. 30 s headroom for the heaviest CI worker.
vi.setConfig({ testTimeout: 30_000 });

import { buildDemoDocument } from '@/app/seed-demo';
import { services } from '@/app/services';
import { AppShell } from '@/app/shell/AppShell';
import { ToastProvider } from '@/components/ui/toast';
import { changeLanguage } from '@/i18n';
import { AnimalPage } from '@/pages/AnimalPage';
import { FeedPage } from '@/pages/FeedPage';
import { HealthPage } from '@/pages/HealthPage';
import { HerdPage } from '@/pages/HerdPage';
import { InvestorsPage } from '@/pages/InvestorsPage';
import { JournalPage } from '@/pages/JournalPage';
import { NutritionPage } from '@/pages/NutritionPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProofPage } from '@/pages/ProofPage';
import { RationPage } from '@/pages/RationPage';
import { ScanPage } from '@/pages/ScanPage';
import { SyncPage } from '@/pages/SyncPage';
import { TeamPage } from '@/pages/TeamPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { useFarmStore } from '@/store/farm-store';

let demo = buildDemoDocument(services.clock.now());
let baseDemo = demo;
let animalId = demo.animals[0]?.id ?? 'missing';

async function renderPage(path: string, page: RouteComponent, routePath?: string): Promise<void> {
  const rootRoute = createRootRoute({ component: AppShell, notFoundComponent: NotFoundPage });
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
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

function panel(): HTMLElement {
  return screen.getByRole('dialog');
}

function setValue(label: RegExp, value: string, scope: HTMLElement | null = null): void {
  const root = scope ?? document.body;
  fireEvent.change(within(root).getByLabelText(label), { target: { value } });
}

async function expectDialogClosed(): Promise<void> {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

beforeAll(async () => {
  // Use the app helper so the English bundle is actually loaded.
  await changeLanguage('en');
  // Build the demo document once: it is deterministic and each test only needs
  // an isolated copy. Rebuilding it in every beforeEach cost ~4 s across the file.
  baseDemo = buildDemoDocument(services.clock.now());
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

beforeEach(async () => {
  demo = structuredClone(baseDemo);
  animalId = demo.animals[0]?.id ?? 'missing';
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

describe('scan page', () => {
  it('reads a known identifier, refuses an unknown one and creates a record', async () => {
    const animal = demo.animals[0]!;
    await renderPage('/scan', ScanPage);

    const input = screen.getByLabelText(/Chip number or animal code/);
    fireEvent.change(input, { target: { value: animal.code } });
    fireEvent.click(screen.getByRole('button', { name: 'Read' }));
    expect(await screen.findByText('Animal found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear field' }));
    fireEvent.change(input, { target: { value: 'ZZ-UNKNOWN-0001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Read' }));
    expect(await screen.findByText('Unknown read')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create animal' }));
    const dialog = panel();
    setValue(/Animal code/, 'SCAN-NEW-1', dialog);
    setValue(/Breed/, 'Ouled Djellal', dialog);
    setValue(/Initial weight/, '42', dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Register animal' }));
    await expectDialogClosed();
  });
});

describe('herd page', () => {
  it('searches, filters and registers an animal', async () => {
    await renderPage('/troupeau', HerdPage);

    const search = screen.getByLabelText('Search by code, chip or pen');
    fireEvent.change(search, { target: { value: 'demo' } });
    fireEvent.change(search, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /^Alert/ }));
    fireEvent.click(screen.getByRole('button', { name: /^All/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Add animal' }));
    const dialog = panel();
    setValue(/Animal code/, 'HERD-NEW-1', dialog);
    setValue(/Chip number/, '985000000000001', dialog);
    setValue(/Breed/, 'Rumbi', dialog);
    setValue(/Initial weight/, '38', dialog);
    setValue(/Initial body condition/, '3', dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Register animal' }));
    await expectDialogClosed();
  });
});

describe('animal page', () => {
  it('records weight, moves, records health, issues and approves a recommendation', async () => {
    await renderPage(`/troupeau/${animalId}`, AnimalPage, '/troupeau/$id');
    const animal = demo.animals[0]!;

    fireEvent.click(screen.getByRole('button', { name: 'Record weight' }));
    let dialog = panel();
    setValue(/Weight \(kg\)/, '51', dialog);
    setValue(/Body condition/, '3', dialog);
    setValue(/Note/, 'Contrôle hebdomadaire', dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save weight' }));
    await expectDialogClosed();

    fireEvent.click(screen.getByRole('button', { name: 'Move pen' }));
    dialog = panel();
    const penSelect = within(dialog).getByLabelText(/Target pen/) as HTMLSelectElement;
    const target = Array.from(penSelect.options).find(
      (option) => option.value !== '' && option.value !== animal.pen,
    );
    if (target) fireEvent.change(penSelect, { target: { value: target.value } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Move' }));
    await expectDialogClosed();

    fireEvent.click(screen.getByRole('button', { name: 'Record health event' }));
    dialog = panel();
    setValue(/Event type/, 'traitement', dialog);
    setValue(/Severity/, 'suivi', dialog);
    setValue(/Note/, 'Suivi vétérinaire', dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save event' }));
    await expectDialogClosed();

    fireEvent.click(screen.getByRole('button', { name: 'Issue a recommendation' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Record service' }));
    dialog = panel();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await expectDialogClosed();
  });
});

describe('health page', () => {
  it('records an event and filters by type', async () => {
    await renderPage('/sante', HealthPage);

    fireEvent.click(screen.getByRole('button', { name: 'Record event' }));
    const dialog = panel();
    setValue(/^Type$/, 'vaccination', dialog);
    setValue(/Severity/, 'info', dialog);
    setValue(/Note/, 'Rappel vaccinal', dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save event' }));
    await expectDialogClosed();

    fireEvent.click(screen.getByRole('button', { name: 'Vaccination' }));
    fireEvent.click(screen.getByRole('button', { name: 'All types' }));
  });
});

describe('nutrition page', () => {
  it('filters, approves a pending ration and serves a ready one', async () => {
    await renderPage('/nutrition', NutritionPage);

    for (const label of ['Pending', 'Ready', 'Blocked', 'Served', 'All']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
    }

    const approveCount = screen.queryAllByRole('button', { name: 'Approve' }).length;
    const approve = screen.queryAllByRole('button', { name: 'Approve' })[0];
    if (approve) {
      fireEvent.click(approve);
      await waitFor(() =>
        expect(screen.queryAllByRole('button', { name: 'Approve' }).length).toBeLessThan(
          approveCount,
        ),
      );
    }

    const serve = screen.queryAllByRole('button', { name: 'Serve' })[0];
    if (serve) {
      fireEvent.click(serve);
      const dialog = panel();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
      await expectDialogClosed();
    }
  }, 45_000); // longer than the global 20 s default. // Rendering all 24 demo rations under full-suite parallel load can take
});

describe('ration page', () => {
  it('prints the sheet and serves a pen', async () => {
    await renderPage('/ration', RationPage);
    fireEvent.click(screen.getByRole('button', { name: 'Print sheet' }));
    expect(window.print).toHaveBeenCalled();

    const serve = screen.queryAllByRole('button', { name: 'Serve pen' })[0];
    if (serve) {
      fireEvent.click(serve);
      const dialog = panel();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
      await expectDialogClosed();
    }
  });
});

describe('feed page', () => {
  it('adds a lot and adjusts an existing stock', async () => {
    await renderPage('/fourrage', FeedPage);

    fireEvent.click(screen.getByRole('button', { name: 'Add lot' }));
    let dialog = panel();
    setValue(/Lot name/, 'Lot test', dialog);
    setValue(/Stock \(kg\)/, '1200', dialog);
    setValue(/Cost per kilo/, '45', dialog);
    setValue(/Origin/, 'Sidi Bel Abbès', dialog);
    fireEvent.click(within(dialog).getByLabelText(/Available for rations/));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save lot' }));
    await expectDialogClosed();

    const adjust = screen.queryAllByRole('button', { name: 'Adjust stock' })[0];
    if (adjust) {
      fireEvent.click(adjust);
      dialog = panel();
      setValue(/New stock/, '900', dialog);
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save stocktake' }));
      await expectDialogClosed();
    }
  });
});

describe('journal page', () => {
  it('filters by type, severity and free text', async () => {
    await renderPage('/journal', JournalPage);

    fireEvent.click(screen.getByRole('button', { name: 'Read' }));
    fireEvent.click(screen.getByRole('button', { name: 'All types' }));
    fireEvent.click(screen.getByRole('button', { name: 'Warning' }));
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Error' })
        .find((button) => button.hasAttribute('aria-pressed'))!,
    );
    fireEvent.click(screen.getByRole('button', { name: 'All levels' }));
    const search = screen.getByLabelText('Search the summary');
    fireEvent.change(search, { target: { value: 'demo' } });
    fireEvent.change(search, { target: { value: '' } });
  });
});

describe('sync page', () => {
  it('prints, copies and resets the local document', async () => {
    await renderPage('/sync', SyncPage);

    fireEvent.click(screen.getByRole('button', { name: 'Print the document' }));
    expect(window.print).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Copy document data' }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Reset document' }));
    const dialog = panel();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('proof page', () => {
  it('prints and records an expert signoff', async () => {
    await renderPage('/preuve', ProofPage);
    fireEvent.click(screen.getByRole('button', { name: 'Print pack' }));
    expect(window.print).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Record a signoff' }));
    const dialog = panel();
    setValue(/Expert name/, 'Dr Test', dialog);
    setValue(/Case identifiers/, 'OV-1, OV-2', dialog);
    setValue(/Protocol/, 'Protocole de validation', dialog);
    setValue(/Passed cases/, '2', dialog);
    setValue(/Total cases/, '2', dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save signoff' }));
    await expectDialogClosed();
  });
});

describe('verification page', () => {
  it('re-runs the integrity checks', async () => {
    await renderPage('/verification', VerificationPage);
    fireEvent.click(screen.getByRole('button', { name: 'Re-run checks' }));
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});

describe('team page', () => {
  it('filters departments, opens a member record and adds a session member', async () => {
    await renderPage('/equipe', TeamPage);

    fireEvent.click(screen.getByRole('button', { name: 'Direction' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    fireEvent.click(screen.getByRole('button', { name: /Ouali Nacer/ }));
    expect(await screen.findByText('Member record')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: 'Add a member' })[0]!);
    const dialog = panel();
    setValue(/Full name/, 'Membre Test', dialog);
    setValue(/Role/, 'Observateur', dialog);
    setValue(/Email/, 'test@example.dz', dialog);
    setValue(/Phone/, '+213 500 00 00 00', dialog);
    setValue(/Bio/, 'Ajout de session.', dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expectDialogClosed();
    expect(await screen.findByText('Membre Test')).toBeInTheDocument();
  });
});

describe('investors page', () => {
  it('prints the page', async () => {
    await renderPage('/investisseurs', InvestorsPage);
    fireEvent.click(screen.getByRole('button', { name: 'Print page' }));
    expect(window.print).toHaveBeenCalled();
  });
});
