import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { NAV_ITEMS } from '@/app/shell/nav-items';
import { cn } from '@/lib/cn';

export interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-xl p-1">
        <img
          src="/logo.jpeg"
          alt=""
          aria-hidden="true"
          className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-border"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-fg-strong">{t('app.name')}</span>
          <span className="block truncate text-[11px] text-fg-muted">{t('app.phase')}</span>
        </span>
      </Link>

      <nav aria-label={t('common.menu')} className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.to === '/'
              ? pathname === '/'
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto rounded-xl border border-border bg-surface-3/60 p-3 text-[11px] leading-relaxed text-fg-muted">
        {t('footer.phase')}
      </p>
    </div>
  );
}
