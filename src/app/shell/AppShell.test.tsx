import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render-app';

describe('application shell', () => {
  it('renders the sidebar, header, skip link, main and footer', async () => {
    await renderApp('/');

    expect(screen.getByRole('link', { name: 'تخطَّ إلى المحتوى' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'قرارات القطيع، حتى دون شبكة' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('قيد التطوير — مكوّنات واجهة مشتركة وإعادة بناء الصفحات.').length,
    ).toBeGreaterThan(0);
  });

  it('marks the current route in the sidebar', async () => {
    await renderApp('/equipe');
    // The archived team page keeps its French title in every locale.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Équipe de travail' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'الفريق' })).toHaveAttribute('aria-current', 'page');
  });

  it('serves the approved /team alias with the same page', async () => {
    await renderApp('/team');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Équipe de travail' }),
    ).toBeInTheDocument();
  });

  it('opens the mobile drawer and closes it with Escape', async () => {
    await renderApp('/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'القائمة' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renders the not-found page for an unknown route', async () => {
    await renderApp('/inconnu');
    expect(
      screen.getByRole('heading', { level: 1, name: 'الصفحة غير موجودة' }),
    ).toBeInTheDocument();
  });
});
