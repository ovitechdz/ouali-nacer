import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/app/shell/LanguageSwitcher';

export interface HeaderProps {
  drawerOpen: boolean;
  onOpenMenu: () => void;
}

export function Header({ drawerOpen, onOpenMenu }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface-2/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('common.menu')}
          aria-expanded={drawerOpen}
          aria-controls="app-drawer"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2 lg:hidden">
          <img
            src="/logo.jpeg"
            alt=""
            aria-hidden="true"
            className="size-8 rounded-lg object-cover ring-1 ring-border"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg-strong">{t('app.name')}</p>
          <p className="hidden truncate text-xs text-fg-muted sm:block">{t('app.tagline')}</p>
        </div>

        <LanguageSwitcher />

        <span className="hidden rounded-lg border border-border px-2 py-1 text-[11px] text-fg-muted md:inline">
          {t('footer.readOnly')}
        </span>
      </div>
    </header>
  );
}
