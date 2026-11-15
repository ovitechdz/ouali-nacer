import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { NAV_GROUPS, NAV_HOME, NAV_SCAN, type NavItem } from '@/app/shell/nav-items';
import { useFarmStore } from '@/store/farm-store';
import { cn } from '@/lib/cn';

export interface SidebarContentProps {
  onNavigate?: () => void;
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/';
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const document = useFarmStore((state) => state.document);

  const itemClass = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors duration-[var(--duration-quick)] ease-out',
      active ? 'bg-accent/10 text-accent' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
    );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-xl p-1">
        <img
          src="/logo.jpeg"
          alt=""
          aria-hidden="true"
          className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-border"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-fg-strong">{t('app.name')}</span>
          <span className="block truncate text-xs text-fg-muted">
            {document?.settings.farmName ?? t('app.tagline')}
          </span>
        </span>
      </Link>

      <Link
        to="/scan"
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded-xl bg-accent-strong px-3 py-2.5 text-sm font-semibold text-accent-contrast shadow-accent transition-colors duration-[var(--duration-quick)] ease-out hover:bg-accent"
      >
        <NAV_SCAN.icon className="size-4" aria-hidden="true" />
        {t('nav.scan')}
      </Link>

      <nav aria-label={t('common.menu')} className="flex flex-col gap-4">
        <Link
          to="/"
          onClick={onNavigate}
          aria-current={pathname === '/' ? 'page' : undefined}
          className={itemClass(pathname === '/')}
        >
          <NAV_HOME.icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{t(NAV_HOME.labelKey)}</span>
        </Link>

        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <p className="ov-micro px-3 text-fg-subtle">{t(group.labelKey)}</p>
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={itemClass(active)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <p className="mt-auto rounded-xl border border-border bg-surface-3/60 p-3 text-xs leading-relaxed text-fg-muted">
        {t('footer.phase')}
      </p>
    </div>
  );
}
