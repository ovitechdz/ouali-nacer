/**
 * Print safety for the Batch 4 effects (A-3, D-0055).
 *
 * Reports use `window.print()`, and a page can be printed before the reader has
 * scrolled: count-ups may be mid-count, the chart may be undiscovered, and the
 * scroll-linked blocks may still be hidden. The print stylesheet already paints
 * the final state with no JavaScript; this handler makes the DOM agree, so the
 * numbers a printout shows are the settled ones and no inline animation state
 * survives the sheet.
 *
 * It needs no GSAP: the components' own `beforeprint` listeners kill their
 * tweens, and this sweep clears whatever they left behind even if a component
 * never mounted.
 */
const PRINTING_ATTRIBUTE = 'data-printing';

const CHART_PROPERTIES = ['opacity', 'stroke-dasharray', 'stroke-dashoffset'];

function settleCounters(): void {
  for (const counter of document.querySelectorAll('[data-count-up]')) {
    const settled = counter.querySelector('.sr-only')?.textContent ?? '';
    const copy = counter.querySelector('[aria-hidden="true"].absolute');
    if (copy && copy.textContent !== settled) copy.textContent = settled;
  }
}

function settleCharts(): void {
  for (const node of document.querySelectorAll<SVGElement>('[data-chart-line]')) {
    for (const property of CHART_PROPERTIES) node.style.removeProperty(property);
  }
  for (const node of document.querySelectorAll<SVGElement>('[data-chart-area]')) {
    node.style.removeProperty('opacity');
  }
}

function settleReveals(): void {
  for (const node of document.querySelectorAll<HTMLElement>('[data-reveal], main table tbody tr')) {
    node.style.removeProperty('opacity');
    node.style.removeProperty('transform');
  }
}

/** Show the finished page in the DOM. Safe to call more than once. */
export function settleForPrint(): void {
  document.documentElement.setAttribute(PRINTING_ATTRIBUTE, '');
  settleCounters();
  settleCharts();
  settleReveals();
}

function clearPrintState(): void {
  document.documentElement.removeAttribute(PRINTING_ATTRIBUTE);
}

/**
 * Installs the global print listeners once. Returns the disposer (used by tests
 * and by a hot reload) so listeners never stack.
 */
export function installPrintSafety(): () => void {
  window.addEventListener('beforeprint', settleForPrint);
  window.addEventListener('afterprint', clearPrintState);
  return () => {
    window.removeEventListener('beforeprint', settleForPrint);
    window.removeEventListener('afterprint', clearPrintState);
    clearPrintState();
  };
}
