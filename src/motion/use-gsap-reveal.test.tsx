import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useGsapReveal, type GsapRevealOptions } from './use-gsap-reveal';

const originalMatchMedia = window.matchMedia;

function stubReducedMotion(reduce: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function Reveal(props: GsapRevealOptions) {
  const scope = useGsapReveal<HTMLDivElement>(props);
  return (
    <div ref={scope}>
      <p data-reveal>premier bloc</p>
      <p data-reveal>deuxième bloc</p>
    </div>
  );
}

function cards(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-reveal]'));
}

function card(container: HTMLElement, index: number): HTMLElement {
  const element = cards(container)[index];
  if (!element) throw new Error(`missing reveal block ${index}`);
  return element;
}

function styleOf(element: HTMLElement | undefined): string {
  return element?.getAttribute('style') ?? '';
}

describe('useGsapReveal', () => {
  it('leaves the blocks untouched under reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<Reveal />);

    for (const card of cards(container)) expect(styleOf(card)).toBe('');
  });

  it('hides the blocks before the lazy chunk resolves, then plays them once', async () => {
    stubReducedMotion(false);
    const { container } = render(<Reveal />);
    const first = card(container, 0);

    // Hidden synchronously, so a slow import never flashes the finished layout.
    expect(first.style.opacity).toBe('0');
    expect(first.style.transform).toContain('14px');

    // The entrance clears the inline state the CSS class expects to own.
    await waitFor(() => expect(first.style.opacity).toBe(''), { timeout: 5000 });
    expect(first.style.transform).toBe('');
    expect(styleOf(first)).toBe('');
  });

  it('restores the blocks when the component unmounts before the chunk arrives', async () => {
    stubReducedMotion(false);
    const { container, unmount } = render(<Reveal />);
    const first = card(container, 0);
    expect(first.style.opacity).toBe('0');

    unmount();
    expect(styleOf(first)).toBe('');

    // The late chunk must not re-hide a page that is already gone.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(styleOf(first)).toBe('');
  });

  it('keeps every block visible when the page is printed before the chunk arrives', async () => {
    stubReducedMotion(false);
    const { container } = render(<Reveal />);
    const first = card(container, 0);
    const second = card(container, 1);
    expect(first.style.opacity).toBe('0');

    fireEvent(window, new Event('beforeprint'));

    expect(styleOf(first)).toBe('');
    expect(styleOf(second)).toBe('');

    // A chunk that lands after the print event settles instead of animating.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(styleOf(first)).toBe('');
    expect(styleOf(second)).toBe('');
  });
});
