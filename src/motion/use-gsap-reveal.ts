import { useEffect, useRef, type RefObject } from 'react';

/**
 * Tier 2 motion: a short, transform/opacity-only entrance for the four
 * data-heavy routes (home, herd, analytics, energy). GSAP is imported only
 * when a route actually mounts and the user has not asked for reduced motion,
 * so it stays out of the entry bundle and out of every other route.
 */
export interface GsapRevealOptions {
  /** CSS selector inside the scope; defaults to `[data-reveal]`. */
  selector?: string;
  /** Vertical offset in pixels. Vertical motion is direction-agnostic in RTL. */
  offsetY?: number;
  stagger?: number;
  duration?: number;
  /** Re-run the entrance when this value changes (e.g. the active filter). */
  watch?: unknown;
}

export function useGsapReveal<T extends HTMLElement>(
  options: GsapRevealOptions = {},
): RefObject<T | null> {
  const {
    selector = '[data-reveal]',
    offsetY = 14,
    stagger = 0.05,
    duration = 0.38,
    watch,
  } = options;
  const scope = useRef<T>(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    if (typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = root.querySelectorAll<HTMLElement>(selector);
    if (targets.length === 0) return;

    // Hide before the chunk resolves so a slow import never shows the content
    // twice; reduced-motion users returned above and always see it.
    for (const target of targets) {
      target.style.opacity = '0';
      target.style.transform = `translate3d(0, ${offsetY}px, 0)`;
    }

    const restore = (): void => {
      for (const target of targets) {
        target.style.removeProperty('opacity');
        target.style.removeProperty('transform');
      }
    };

    let cancelled = false;
    let revert: (() => void) | undefined;

    void import('gsap')
      .then(({ gsap }) => {
        if (cancelled) {
          restore();
          return;
        }
        const context = gsap.context(() => {
          gsap.fromTo(
            targets,
            { opacity: 0, y: offsetY },
            {
              opacity: 1,
              y: 0,
              duration,
              stagger,
              ease: 'power2.out',
              clearProps: 'opacity,transform',
            },
          );
        }, root);
        revert = () => context.revert();
      })
      .catch(() => {
        // A failed chunk load must leave the page in its static, visible state.
        restore();
      });

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [selector, offsetY, stagger, duration, watch]);

  return scope;
}
