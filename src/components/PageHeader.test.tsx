import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader, SectionHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the kicker, subtitle and actions when the page provides them', () => {
    render(
      <PageHeader
        kicker="Phase 5b"
        title="Troupeau"
        subtitle="6 animaux actifs"
        actions={
          <button type="button" onClick={() => undefined}>
            Ajouter
          </button>
        }
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Troupeau' })).toBeInTheDocument();
    expect(screen.getByText('Phase 5b')).toBeInTheDocument();
    expect(screen.getByText('6 animaux actifs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
  });

  it('omits the optional parts so a bare title keeps its spacing', () => {
    const { container } = render(<PageHeader title="Journal" />);

    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(container.querySelector('h1')?.textContent).toBe('Journal');
  });
});

describe('SectionHeader', () => {
  it('anchors the section so a link can scroll to it', () => {
    const { container } = render(
      <SectionHeader
        id="kpis"
        title="Indicateurs"
        description="Sept derniers jours"
        action={<a href="/preuve">Preuve</a>}
      />,
    );

    const heading = container.querySelector('h2');
    expect(heading?.id).toBe('kpis');
    expect(heading?.textContent).toBe('Indicateurs');
    expect(screen.getByText('Sept derniers jours')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Preuve' })).toBeInTheDocument();
  });

  it('renders a plain heading when only a title is given', () => {
    const { container } = render(<SectionHeader title="Reproduction" />);

    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(container.querySelector('h2')?.textContent).toBe('Reproduction');
  });
});
