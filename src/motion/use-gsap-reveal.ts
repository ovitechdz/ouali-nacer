import { useEffect, useRef, type RefObject } from 'react';

import { prefersReducedMotion } from './reduced-motion';

/**
 * Tier 2 motion: a short, transform/opacity-only entrance. GSAP is imported only
 * when a route actually mounts and the user has not asked for reduced motion, so
 * it stays out of the entry bundle.
 *
 * Batch 4 adds `scroll`: targets below the first screen wait for ScrollTrigger
 * (loaded lazily next to GSAP) and play once when the reader reaches them, while
 * targets already on screen keep the immediate entrance. No element is ever
 * animated by two mechanisms (D-0051).
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
  /** Defer below-the-fold targets to a scroll-linked batch. */
  scroll?: boolean;
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
    scroll = false,
  } = options;
  const scope = useRef<T>(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    if (typeof window.matchMedia !== 'function') return;
    if (prefersReducedMotion()) return;

    const all = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (all.length === 0) return;

    // Read every box first, then write: one layout pass instead of one per node.
    const viewport = window.innerHeight;
    const onScreen = scroll
      ? all.filter((node) => node.getBoundingClientRect().top < viewport)
      : all;
    const below = scroll ? all.filter((node) => !onScreen.includes(node)) : [];

    // Hide before the chunk resolves so a slow import never shows the content
    // twice; reduced-motion users returned above and always see it.
    for (const target of all) {
      target.style.opacity = '0';
      target.style.transform = `translate3d(0, ${offsetY}px, 0)`;
    }

    const restore = (): void => {
      for (const target of all) {
        target.style.removeProperty('opacity');
        target.style.removeProperty('transform');
      }
    };

    let cancelled = false;
    let revert: (() => void) | undefined;
    let batches: { kill: () => void }[] = [];

    void Promise.all([
      import('gsap'),
      below.length > 0 ? import('gsap/ScrollTrigger') : Promise.resolve(null),
    ])
      .then(([{ gsap }, plugin]) => {
        if (cancelled) {
          // The cleanup already restored the DOM (unmount), or the next effect
          // run owns it (React StrictMode). Restoring here would wipe the newer
          // hidden state and leave the page visible before its scroll trigger.
          return;
        }
        const context = gsap.context(() => {
          if (onScreen.length > 0) {
            gsap.fromTo(
              onScreen,
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
          }
          if (below.length > 0 && plugin) {
            const { ScrollTrigger } = plugin;
            gsap.registerPlugin(ScrollTrigger);
            // One batch, one stagger: a screenful of cards arrives together
            // instead of as a burst of independent tweens.
            batches = ScrollTrigger.batch(below, {
              start: 'top 88%',
              once: true,
              onEnter: (targets) => {
                gsap.to(targets, {
                  opacity: 1,
                  y: 0,
                  duration,
                  stagger,
                  ease: 'power2.out',
                  clearProps: 'opacity,transform',
                });
              },
            });
          }
        }, root);
        revert = () => context.revert();
      })
      .catch(() => {
        // A failed chunk load must leave the page in its static, visible state.
        restore();
      });

    return () => {
      cancelled = true;
      for (const trigger of batches) trigger.kill();
      batches = [];
      revert?.();
      restore();
    };
  }, [selector, offsetY, stagger, duration, watch, scroll]);

  return scope;
}
