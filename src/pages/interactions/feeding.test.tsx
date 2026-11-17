import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FeedPage } from '@/pages/FeedPage';
import { NutritionPage } from '@/pages/NutritionPage';
import { RationPage } from '@/pages/RationPage';
import {
  expectDialogClosed,
  panel,
  renderPage,
  setValue,
  registerFixture,
} from '@/test/interactions-harness';

registerFixture({ animals: 6 });

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
  });
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
