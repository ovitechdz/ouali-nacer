import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/cn';

/**
 * An animal code used as a link. The bare text was a 17 px tall target in the
 * herd table (55-63 px wide), below the 24 px minimum for a touch target, so the
 * hit area is padded with `min-h-6` and 6 px of inline padding. The negative
 * inline margin cancels the padding visually, so the code still lines up with
 * its column while the row only grows to the minimum.
 */
export function AnimalCodeLink({
  id,
  code,
  className,
}: {
  id: string;
  code: string;
  className?: string;
}) {
  return (
    <Link
      to="/troupeau/$id"
      params={{ id }}
      className={cn(
        'inline-flex min-h-6 items-center rounded-md px-1.5 -mx-1.5 transition-colors duration-[var(--duration-quick)] ease-out',
        className,
      )}
    >
      {code}
    </Link>
  );
}
