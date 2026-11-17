import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InvestorsPage } from '@/pages/InvestorsPage';
import { ProofPage } from '@/pages/ProofPage';
import { TeamPage } from '@/pages/TeamPage';
import { VerificationPage } from '@/pages/VerificationPage';
import {
  expectDialogClosed,
  panel,
  renderPage,
  setValue,
  registerFixture,
} from '@/test/interactions-harness';

registerFixture({ animals: 6, auditEvents: 6 });

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
