import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OnboardingDraft } from '@/domain';
import { i18n } from '@/i18n';
import { useFarmStore } from '@/store/farm-store';
import { FarmGate } from './farm-gate';

const pristine = useFarmStore.getState();

beforeEach(() => {
  useFarmStore.setState(pristine, true);
});

afterEach(() => {
  // The tree is still mounted when this hook runs, so the reset goes through act.
  act(() => {
    useFarmStore.setState(pristine, true);
  });
});

function byId(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing #${id}`);
  return element as HTMLInputElement;
}

describe('FarmGate', () => {
  it('shows the splash and asks for the document on the first paint', () => {
    const initialize = vi.fn(async () => undefined);
    useFarmStore.setState({ status: 'loading', initialize });

    render(
      <FarmGate>
        <p>application</p>
      </FarmGate>,
    );

    expect(screen.getByText(i18n.t('common.loading'))).toBeInTheDocument();
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('renders the application once a document is loaded', () => {
    useFarmStore.setState({ status: 'ready' });

    render(
      <FarmGate>
        <p>application</p>
      </FarmGate>,
    );

    expect(screen.getByText('application')).toBeInTheDocument();
  });

  it('offers a reload, not a retry, when the chunk itself failed', () => {
    useFarmStore.setState({ status: 'error', errorKind: 'chunk', document: null });

    render(
      <FarmGate>
        <p>application</p>
      </FarmGate>,
    );

    expect(screen.getByText(i18n.t('error.chunkBody'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('common.reloadPage') })).toBeInTheDocument();
  });

  it('retries a storage failure in place', () => {
    const initialize = vi.fn(async () => undefined);
    useFarmStore.setState({ status: 'error', errorKind: 'storage', document: null, initialize });

    render(
      <FarmGate>
        <p>application</p>
      </FarmGate>,
    );

    expect(screen.getByText(i18n.t('error.body'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.retry') }));

    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('shows the command failure the store kept from the last attempt', () => {
    useFarmStore.setState({ status: 'empty', failure: { key: 'domain.error.malformed' } });

    render(
      <FarmGate>
        <p>application</p>
      </FarmGate>,
    );

    expect(screen.getByText(i18n.t('domain.error.malformed'))).toBeInTheDocument();
  });

  it('refuses an empty onboarding, then passes the trimmed draft and opens the app', async () => {
    const onboard = vi.fn(async (_draft: OnboardingDraft) => {
      useFarmStore.setState({ status: 'ready' });
      return true;
    });
    useFarmStore.setState({ status: 'empty', onboard, busy: false, failure: null });

    render(
      <FarmGate>
        <p>application</p>
      </FarmGate>,
    );

    fireEvent.click(screen.getByRole('button', { name: i18n.t('onboarding.submit') }));
    expect(screen.getByText(i18n.t('onboarding.required'))).toBeInTheDocument();
    expect(onboard).not.toHaveBeenCalled();

    fireEvent.change(byId('onboarding-farm'), { target: { value: '  Ferme Ouled  ' } });
    fireEvent.change(byId('onboarding-operator'), { target: { value: ' Nacer ' } });
    fireEvent.change(byId('onboarding-authority'), { target: { value: 'field' } });
    fireEvent.change(byId('onboarding-region'), { target: { value: ' Djelfa ' } });
    fireEvent.change(byId('onboarding-pens'), { target: { value: 'A1, , B2 ' } });
    fireEvent.click(screen.getByRole('button', { name: i18n.t('onboarding.submit') }));

    await waitFor(() => expect(onboard).toHaveBeenCalledTimes(1));
    expect(onboard.mock.calls.at(0)?.at(0)).toEqual({
      farmName: 'Ferme Ouled',
      operatorName: 'Nacer',
      authority: 'field',
      locale: i18n.resolvedLanguage ?? 'ar',
      region: 'Djelfa',
      pens: ['A1', 'B2'],
    });
    expect(await screen.findByText('application')).toBeInTheDocument();
  });
});
