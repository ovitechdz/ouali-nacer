import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatNumber } from '@/lib/format';
import { CountUp } from './count-up';

/** jsdom has no `matchMedia`; the hook must survive both a stub and its absence. */
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

function parts(container: HTMLElement): { srOnly: string; sizer: string; copy: string } {
  const srOnly = container.querySelector('.sr-only');
  const copy = container.querySelector('[aria-hidden="true"].absolute');
  const sizer = container.querySelector('[aria-hidden="true"].invisible');
  return {
    srOnly: srOnly?.textContent ?? '',
    sizer: sizer?.textContent ?? '',
    copy: copy?.textContent ?? '',
  };
}

describe('CountUp', () => {
  it('puts the settled value in the accessibility tree from the first render', () => {
    stubReducedMotion(false);
    const { container } = render(<CountUp value={1200} locale="fr" />);
    const { srOnly, sizer } = parts(container);
    expect(srOnly).toBe(formatNumber(1200, 'fr'));
    // The hidden sizer already has the final width, so the count cannot reflow.
    expect(sizer).toBe(formatNumber(1200, 'fr'));
    // Persian narrow spaces aside, French groups with a space and Latin digits.
    expect(srOnly.replace(/[\u00a0\u202f]/g, ' ')).toBe('1 200');
  });

  it('marks both visual copies aria-hidden so no intermediate number is announced', () => {
    stubReducedMotion(false);
    const { container } = render(<CountUp value={42} locale="ar" />);
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly).not.toBeNull();
    expect(srOnly?.getAttribute('aria-hidden')).toBeNull();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(2);
  });

  it('formats exactly like the static numbers in AR, FR and EN', () => {
    stubReducedMotion(true);
    for (const locale of ['ar', 'fr', 'en'] as const) {
      const { container, unmount } = render(<CountUp value={1040} locale={locale} />);
      expect(parts(container).srOnly).toBe(formatNumber(1040, locale));
      unmount();
    }
  });

  it('shows the settled value immediately under prefers-reduced-motion', () => {
    stubReducedMotion(true);
    const { container } = render(<CountUp value={37} locale="fr" />);
    const { srOnly, copy } = parts(container);
    expect(srOnly).toBe('37');
    expect(copy).toBe('37');
  });

  it('renders zero statically and starts a positive count at zero', () => {
    stubReducedMotion(false);
    const zero = render(<CountUp value={0} locale="fr" />);
    expect(parts(zero.container).copy).toBe('0');
    zero.unmount();

    const counting = render(<CountUp value={9} locale="fr" />);
    expect(parts(counting.container).copy).toBe('0');
    expect(parts(counting.container).srOnly).toBe('9');
  });

  it('counts up through the lazy GSAP chunk and lands on the settled value', async () => {
    // The chunk resolves on its own schedule, so the tween body only runs when
    // the test actually waits for it. Without this wait, function coverage of
    // count-up.tsx depended on whether the import won the race that run.
    stubReducedMotion(false);
    const { container } = render(<CountUp value={9} locale="fr" />);
    await waitFor(() => expect(parts(container).copy).toBe(formatNumber(9, 'fr')), {
      timeout: 3000,
    });
    expect(parts(container).srOnly).toBe(formatNumber(9, 'fr'));
  });

  it('still exposes the settled value when matchMedia does not exist', () => {
    // @ts-expect-error - simulating an environment without matchMedia
    delete window.matchMedia;
    const { container } = render(<CountUp value={12} locale="en" />);
    expect(parts(container).srOnly).toBe('12');
  });
});
