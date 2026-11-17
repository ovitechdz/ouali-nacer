/**
 * One place to ask the browser whether motion is welcome (D-0051, D-0054).
 *
 * Returns false when `matchMedia` is missing, so jsdom and very old browsers get
 * the static page instead of a half-applied animation.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
