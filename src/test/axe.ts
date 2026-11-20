import axe, { type Result, type RunOptions } from 'axe-core';

/**
 * Axe runner for the jsdom page-interaction harness.
 *
 * jsdom has no layout, paint or canvas engine, so a small set of axe rules
 * cannot be evaluated truthfully here. They are disabled **per run** (never in
 * the app, never globally in CI) and each is justified below. Real-browser
 * coverage of those rules belongs to the playwright-cli audit, and contrast is
 * verified deterministically from the token source in `src/styles/tokens.test.ts`.
 */
export const JSDOM_DISABLED_RULES: Readonly<Record<string, string>> = {
  // jsdom cannot blend computed colours or draw to canvas; the token contrast
  // guard covers every declared foreground/background pair in the design system.
  'color-contrast': 'no colour blending in jsdom; covered by src/styles/tokens.test.ts',
  'color-contrast-enhanced': 'AAA variant needs real computed colours; same token guard',
  // jsdom always reports scrollHeight/clientWidth as 0, so no element is ever
  // detected as a scrollable region; the rule must stay enabled in a real browser.
  'scrollable-region-focusable': 'jsdom has no scroll dimensions; verified in browser audit',
  // Hit-area checks need getBoundingClientRect(), which jsdom always returns as
  // zeros; verified in the real browser audit.
  'target-size': 'jsdom getBoundingClientRect() is always zero; verified in browser audit',
};

export interface AxeRunSummary {
  violations: Result[];
}

/** axe-core is a singleton: never let two runs overlap, even after a timed-out test. */
let pending: Promise<unknown> = Promise.resolve();

/** Run axe on one rendered container, disabling only the rules listed above. */
export async function runAxe(container: Element): Promise<AxeRunSummary> {
  const options: RunOptions = {
    rules: Object.fromEntries(
      Object.keys(JSDOM_DISABLED_RULES).map((id) => [id, { enabled: false }]),
    ),
  };
  const run = pending.then(async () => {
    const result = await axe.run(container, options);
    return { violations: result.violations };
  });
  // A rejected or timed-out test must not block every later route in the matrix.
  pending = run.catch(() => undefined);
  return run;
}

/** Actionable, one-line-per-node description used in a failed assertion. */
export function describeViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const wcag = violation.tags.filter((tag) => tag.startsWith('wcag')).join(',');
      const nodes = violation.nodes.map((node) => {
        const why = node.failureSummary?.replace(/\s*\n\s*/g, ' ').trim() ?? '';
        return `    ${node.target.join(' ')} — ${why}`;
      });
      return `${violation.id} (${violation.impact ?? 'unknown'})${wcag ? ` [${wcag}]` : ''}\n${nodes.join('\n')}`;
    })
    .join('\n');
}
