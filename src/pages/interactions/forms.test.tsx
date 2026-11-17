import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnimalPage } from '@/pages/AnimalPage';
import { HealthPage } from '@/pages/HealthPage';
import { HerdPage } from '@/pages/HerdPage';
import { ScanPage } from '@/pages/ScanPage';
import {
  demo,
  expectDialogClosed,
  firstAnimalId,
  panel,
  renderPage,
  setValue,
  registerFixture,
} from '@/test/interactions-harness';

registerFixture({ animals: 6, auditEvents: 6 });

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
    // The read is an async command; the 1 s default timed out under coverage.
    expect(await screen.findByText('Unknown read', {}, { timeout: 3000 })).toBeInTheDocument();

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
    const animalId = firstAnimalId();
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
