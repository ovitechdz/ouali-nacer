import { Link, useRouterState } from '@tanstack/react-router';
import { Menu, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NAV_GROUPS, NAV_HOME } from '@/app/shell/nav-items';
import { LanguageSwitcher } from '@/app/shell/LanguageSwitcher';
import { useOnlineStatus } from '@/app/shell/use-online';
import { middleTruncate } from '@/lib/format';
import { useFarmStore } from '@/store/farm-store';

export interface HeaderProps {
  drawerOpen: boolean;
  onOpenMenu: () => void;
}

function usePageLabel(): string {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === '/') return t(NAV_HOME.labelKey);
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return t(item.labelKey);
    }
  }
  return '';
}

export function Header({ drawerOpen, onOpenMenu }: HeaderProps) {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const label = usePageLabel();
  const storage = useFarmStore((state) => state.storage);
  const document = useFarmStore((state) => state.document);
  const farmName = document?.settings.farmName ?? t('app.tagline');

  return (
    <header className="border-b border-border bg-surface-header-solid">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('common.menu')}
          aria-expanded={drawerOpen}
          aria-controls="app-drawer"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-fg-muted transition-colors duration-[var(--duration-quick)] ease-out hover:bg-surface-3 hover:text-fg lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2.5 lg:hidden">
          <img
            src="/logo.jpeg"
            alt=""
            aria-hidden="true"
            className="size-9 rounded-lg object-cover ring-1 ring-border"
          />
          <span className="text-sm font-bold text-fg-strong">{t('app.name')}</span>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg-strong">{label}</p>
          <p className="truncate text-[11px] text-fg-muted" title={farmName}>
            {middleTruncate(farmName, 34)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={
              online
                ? 'hidden items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-success sm:inline-flex'
                : 'hidden items-center gap-1.5 rounded-lg border border-warn/40 bg-warn/10 px-2 py-1 text-[11px] font-semibold text-warn sm:inline-flex'
            }
            title={online ? t('common.online') : t('common.offline')}
          >
            {online ? (
              <Wifi className="size-3.5" aria-hidden="true" />
            ) : (
              <WifiOff className="size-3.5" aria-hidden="true" />
            )}
            {online ? t('common.online') : t('common.offline')}
          </span>

          {storage === 'memory' ? (
            <span className="hidden rounded-lg border border-danger/40 bg-danger/10 px-2 py-1 text-[11px] font-semibold text-danger md:inline">
              {t('common.memoryOnly')}
            </span>
          ) : null}

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
