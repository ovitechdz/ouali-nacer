import { Outlet, useRouterState } from '@tanstack/react-router';
import { FlaskConical } from 'lucide-react';
import { Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Footer } from '@/app/shell/Footer';
import { Header } from '@/app/shell/Header';
import { Sidebar } from '@/app/shell/Sidebar';
import { SidebarDrawer } from '@/app/shell/SidebarDrawer';
import { Skeleton } from '@/components/ui/feedback';
import { useFarmStore } from '@/store/farm-store';

function PageFallback() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const demo = useFarmStore((state) => state.document?.settings.demoMode ?? false);

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
        <div className="sticky top-0 z-30">
          {demo ? (
            <p className="flex items-center justify-center gap-2 border-b border-warn/30 bg-warn/10 px-3 py-1.5 text-center text-[11px] font-semibold text-warn">
              <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
              {t('common.demoBanner')}
            </p>
          ) : null}
          <Header drawerOpen={drawerOpen} onOpenMenu={openDrawer} />
        </div>

        <main
          id="main-content"
          className="mx-auto w-full max-w-page flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          <Suspense fallback={<PageFallback />}>
            <div key={pathname} className="ov-fade">
              <Outlet />
            </div>
          </Suspense>
        </main>

        <Footer />
      </div>

      <SidebarDrawer open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
