import type { ReactNode } from 'react';

export interface PageHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ kicker, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {kicker ? <p className="ov-micro mb-1.5 text-accent">{kicker}</p> : null}
        <h1 className="text-2xl font-bold text-fg-strong sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
}

export function SectionHeader({ title, description, action, id }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-bold text-fg-strong">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
