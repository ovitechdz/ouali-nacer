import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface DisclosureProps {
  summary: string;
  children: ReactNode;
  className?: string;
  open?: boolean;
}

export function Disclosure({ summary, children, className, open }: DisclosureProps) {
  return (
    <details
      open={open}
      className={cn('group rounded-2xl border border-border bg-surface-2', className)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-fg transition-colors duration-150 hover:text-fg-strong [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <ChevronDown
          className="size-4 shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border px-4 py-3 text-sm text-fg-muted">{children}</div>
    </details>
  );
}
