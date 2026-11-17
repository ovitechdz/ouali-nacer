import { afterEach, describe, expect, it } from 'vitest';

import { installPrintSafety, settleForPrint } from './print-safety';

const PRINTING = 'data-printing';

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(PRINTING);
});

describe('print safety', () => {
  it('paints the settled counter value in the animated copy', () => {
    document.body.innerHTML = `
      <span data-count-up>
        <span class="sr-only">8.750</span>
        <span aria-hidden="true" class="invisible">8.750</span>
        <span aria-hidden="true" class="absolute inset-0">4.2</span>
      </span>`;

    settleForPrint();

    expect(
      document.querySelector('[data-count-up] [aria-hidden="true"].absolute')?.textContent,
    ).toBe('8.750');
    expect(document.querySelector('[data-count-up] .sr-only')?.textContent).toBe('8.750');
  });

  it('clears a half-drawn chart back to its stylesheet state', () => {
    document.body.innerHTML = `
      <svg>
        <path data-chart-line style="opacity: 0; stroke-dasharray: 420; stroke-dashoffset: 260"></path>
        <path data-chart-area class="opacity-15" style="opacity: 0.04"></path>
      </svg>`;
    const line = document.querySelector('[data-chart-line]') as SVGElement;
    const area = document.querySelector('[data-chart-area]') as SVGElement;

    settleForPrint();

    expect(line.getAttribute('style') ?? '').toBe('');
    expect(area.getAttribute('style') ?? '').toBe('');
  });

  it('shows blocks that were waiting for a scroll', () => {
    document.body.innerHTML = `
      <main>
        <div data-reveal style="opacity: 0; transform: translate3d(0, 14px, 0)"></div>
        <table><tbody><tr style="opacity: 0; transform: translate3d(0, 8px, 0)"></tr></tbody></table>
      </main>`;
    const card = document.querySelector('[data-reveal]') as HTMLElement;
    const row = document.querySelector('tbody tr') as HTMLElement;

    settleForPrint();

    expect(card.getAttribute('style') ?? '').toBe('');
    expect(row.getAttribute('style') ?? '').toBe('');
  });

  it('marks the document for the duration of the print and removes itself', () => {
    const dispose = installPrintSafety();

    window.dispatchEvent(new Event('beforeprint'));
    expect(document.documentElement.getAttribute(PRINTING)).toBe('');

    window.dispatchEvent(new Event('afterprint'));
    expect(document.documentElement.getAttribute(PRINTING)).toBeNull();

    dispose();
    window.dispatchEvent(new Event('beforeprint'));
    expect(document.documentElement.getAttribute(PRINTING)).toBeNull();
  });
});
