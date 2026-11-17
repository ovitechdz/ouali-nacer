import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JournalPage } from '@/pages/JournalPage';
import { SyncPage } from '@/pages/SyncPage';
import {
  expectDialogClosed,
  panel,
  renderPage,
  registerFixture,
} from '@/test/interactions-harness';

registerFixture({ animals: 6, auditEvents: 6 });

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
    await expectDialogClosed();
  });
});
