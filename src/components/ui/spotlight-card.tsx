import { useRef, type HTMLAttributes, type PointerEvent } from 'react';

import { cn } from '@/lib/cn';

/**
 * Tier 3 motion, adapted from the MIT-licensed React Bits `SpotlightCard`.
 * Only the pointer position is tracked, and the highlight fades with opacity,
 * so nothing animates layout and reduced-motion users get a plain card.
 * Attribution: https://reactbits.dev/components/spotlight-card (MIT).
 */
export function SpotlightCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const node = ref.current;
    if (!node) return;
    if (typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--ov-spot-x', `${event.clientX - rect.left}px`);
    node.style.setProperty('--ov-spot-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={cn(
        'group/spot relative isolate overflow-hidden rounded-2xl border border-border bg-surface-2 p-5',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-[var(--duration-quick)] ease-out group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(220px circle at var(--ov-spot-x, 50%) var(--ov-spot-y, 50%), rgb(0 212 146 / 0.14), transparent 70%)',
        }}
      />
      {children}
    </div>
  );
}
