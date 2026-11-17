import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';

import { FarmGate } from '@/app/farm-gate';
import { router } from '@/app/router';
import { ToastProvider } from '@/components/ui/toast';
import { useCrossTabSync } from '@/store/cross-tab';

export function Providers() {
  useCrossTabSync();

  useEffect(() => {
    // Registration is not needed for first paint; keep the PWA module out of the entry.
    void import('@/pwa/register-service-worker').then((m) => m.registerServiceWorker());
  }, []);

  return (
    <ToastProvider>
      <FarmGate>
        <RouterProvider router={router} />
      </FarmGate>
    </ToastProvider>
  );
}
