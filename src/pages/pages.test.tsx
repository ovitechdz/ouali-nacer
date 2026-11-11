import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render-app';
import { OfflinePage } from './OfflinePage';
import { StatusPage } from './StatusPage';
import { TeamPage } from './TeamPage';

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

  it('renders the offline placeholder', () => {
    render(<OfflinePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'أنت غير متصل' })).toBeInTheDocument();
  });
});
