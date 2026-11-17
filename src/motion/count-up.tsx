import { useLayoutEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { prefersReducedMotion } from '@/motion/reduced-motion';

/**
 * Batch 4, the one number effect CSS cannot express: a KPI value that counts up
 * once, in 550 ms. GSAP is imported only when a counter actually mounts, the
 * value is worth counting (a positive finite number) and the user has not asked
 * for reduced motion, so it stays out of the entry bundle.
 *
 * Accessibility contract (D-0054):
 * - the settled value is in the DOM on the first paint inside `.sr-only`, so a
 *   screen reader reads one number and never hears the intermediate frames;
 * - both visual copies are `aria-hidden`: an invisible sizer that already holds
 *   the final width (the counter can never reflow its neighbours) and the
 *   animated copy stacked on top of it;
 * - reduced motion, a zero/absent value and a failed chunk load all render the
 *   settled value immediately, with no GSAP import at all;
 * - a printout paints the settled value too: `beforeprint` kills the tween and
 *   the print stylesheet shows `.sr-only` while hiding both visual copies
 *   (A-3, D-0055).
 *
 * Only the text of the animated copy changes: no transform, no opacity, no
 * layout property, and `tabular-nums` keeps the glyph advance constant.
 */
const DURATION = 0.55; // seconds; the brief caps the effect at 600 ms

export interface CountUpProps {
  /** The settled value. Non-finite or non-positive values render statically. */
  value: number;
  /** The active `resolvedLanguage`, so Intl matches every other number on the page. */
  locale: string;
  className?: string;
}

export function CountUp({ value, locale, className }: CountUpProps) {
  const finalText = formatNumber(value, locale);
  const copy = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const target = copy.current;
    if (!target) return;

    const settle = (): void => {
      target.textContent = finalText;
    };

    if (!Number.isFinite(value) || value <= 0 || prefersReducedMotion()) {
      settle();
      return;
    }

    // The first frame is "0" and the tween fills in from there. The copy is
    // aria-hidden, so this never reaches the accessibility tree.
    target.textContent = formatNumber(0, locale);

    let cancelled = false;
    let printed = false;
    let revert: (() => void) | undefined;
    let tween: { kill: () => void } | undefined;

    // A printout must show the settled value even when it happens mid-count or
    // before the GSAP chunk has resolved (D-0055, A-3). Killing the tween and
    // painting the final text needs no GSAP at print time; the print stylesheet
    // hides both visual copies and reveals `.sr-only` as a second fallback.
    const onPrint = (): void => {
      printed = true;
      tween?.kill();
      settle();
    };
    window.addEventListener('beforeprint', onPrint);

    void import('gsap')
      .then(({ gsap }) => {
        if (cancelled || printed) {
          settle();
          return;
        }
        const context = gsap.context(() => {
          const state = { v: 0 };
          tween = gsap.to(state, {
            v: value,
            duration: DURATION,
            ease: 'power2.out',
            onUpdate: () => {
              target.textContent = formatNumber(state.v, locale);
            },
            onComplete: settle,
          });
        });
        revert = () => context.revert();
      })
      .catch(() => {
        // A failed chunk load must leave the settled value on screen.
        settle();
      });

    return () => {
      cancelled = true;
      window.removeEventListener('beforeprint', onPrint);
      tween?.kill();
      revert?.();
      settle();
    };
  }, [value, locale, finalText]);

  return (
    <span data-count-up="" className={cn('relative inline-block tabular-nums', className)}>
      <span className="sr-only">{finalText}</span>
      <span aria-hidden="true" className="invisible">
        {finalText}
      </span>
      <span ref={copy} aria-hidden="true" className="absolute inset-0" />
    </span>
  );
}
