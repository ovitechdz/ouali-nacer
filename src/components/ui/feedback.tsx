import { FlaskConical, Info, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function SimulationBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-warn/40 bg-warn/10 px-2 py-1 text-[11px] font-semibold text-warn',
        className,
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-surface-2/60 p-6',
        className,
      )}
    >
      {Icon ? (
        <span className="grid size-10 place-items-center rounded-xl bg-surface-3 text-fg-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-fg-strong">{title}</p>
        {body ? <p className="mt-1 max-w-prose text-sm text-fg-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-surface-3', className)} aria-hidden="true" />
  );
}

export interface NoticeProps {
  tone?: 'info' | 'warn' | 'danger';
  title?: string;
  children: ReactNode;
  className?: string;
}

const NOTICE: Record<NonNullable<NoticeProps['tone']>, { box: string; icon: LucideIcon }> = {
  info: { box: 'border-info/40 bg-info/10 text-info', icon: Info },
  warn: { box: 'border-warn/40 bg-warn/10 text-warn', icon: TriangleAlert },
  danger: { box: 'border-danger/40 bg-danger/10 text-danger', icon: OctagonAlert },
};

export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  const config = NOTICE[tone];
  const Icon = config.icon;
  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4', config.box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn('text-fg-muted', title && 'mt-1')}>{children}</div>
      </div>
    </div>
  );
}
