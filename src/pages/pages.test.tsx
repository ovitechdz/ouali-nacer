import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import { usePwaStore } from '@/pwa/pwa-store';
import { renderApp } from '@/test/render-app';
import { OfflinePage } from './OfflinePage';
import { StatusPage } from './StatusPage';
import { TeamPage } from './TeamPage';

afterEach(() => {
  usePwaStore.setState({ needRefresh: false, offlineReady: false, registrationFailed: false });
});

describe('phase-5 pages', () => {
  it('renders the real home dashboard in Arabic', async () => {
    // The page links into the router, so it must render inside the real shell.
    await renderApp('/');
    expect(
      screen.getByRole('heading', { level: 1, name: 'قرارات القطيع، حتى دون شبكة' }),
    ).toBeInTheDocument();
    expect(screen.getByText('كيف يعمل')).toBeInTheDocument();
  });

  it('renders the archived team page without inventing members', () => {
    render(<TeamPage />);
    // The archive keeps its French title and member names in every locale.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Équipe de travail' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ouali Nacer')).toBeInTheDocument();
    expect(screen.getByText('Sebaï Salah')).toBeInTheDocument();
  });

  it('lists what actually works on the status page', () => {
    render(<StatusPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'حالة النظام' })).toBeInTheDocument();
    expect(screen.getByText('سجل القدرات')).toBeInTheDocument();
    expect(screen.getAllByText('محاكاة').length).toBeGreaterThan(0);
  });

  it('reports the service-worker state and offers the Chromium install prompt', async () => {
    usePwaStore.setState({ needRefresh: true, offlineReady: false, registrationFailed: false });
    render(<StatusPage />);
    expect(screen.getByText(i18n.t('status.swPending'))).toBeInTheDocument();

    act(() => {
      usePwaStore.setState({ needRefresh: false, offlineReady: true });
    });
    expect(screen.getByText(i18n.t('status.swActive'))).toBeInTheDocument();

    // Chromium fires this event once the app is installable; the page must then
    // call its prompt instead of only printing the iOS instructions.
    const prompt = vi.fn(async () => undefined);
    const installEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>;
    };
    installEvent.prompt = prompt;
    installEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    act(() => {
      window.dispatchEvent(installEvent);
    });

    fireEvent.click(screen.getByRole('button', { name: i18n.t('pwa.installNow') }));
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
  });

  it('says the service worker is inactive when registration failed', () => {
    usePwaStore.setState({ needRefresh: false, offlineReady: true, registrationFailed: true });
    render(<StatusPage />);
    expect(screen.getByText(i18n.t('status.swInactive'))).toBeInTheDocument();
  });

  it('renders the offline placeholder', () => {
    render(<OfflinePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'أنت غير متصل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('offline.action') })).toBeInTheDocument();
  });
});
