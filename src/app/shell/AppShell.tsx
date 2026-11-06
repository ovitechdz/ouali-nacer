import { Outlet } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Footer } from '@/app/shell/Footer';
import { Header } from '@/app/shell/Header';
import { Sidebar } from '@/app/shell/Sidebar';
import { SidebarDrawer } from '@/app/shell/SidebarDrawer';

export function AppShell() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-contrast"
      >
        {t('common.skipToContent')}
      </a>

      <Sidebar />

      <div className="flex min-h-dvh flex-col lg:ms-64">
        <Header drawerOpen={drawerOpen} onOpenMenu={openDrawer} />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <div className="mx-auto w-full max-w-page px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>

      <SidebarDrawer open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
