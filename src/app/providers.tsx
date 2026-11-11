import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';

import { FarmGate } from '@/app/farm-gate';
import { router } from '@/app/router';
import { ToastProvider } from '@/components/ui/toast';
import { registerServiceWorker } from '@/pwa/register-service-worker';
import { useCrossTabSync } from '@/store/cross-tab';

export function Providers() {
  useCrossTabSync();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ToastProvider>
      <FarmGate>
        <RouterProvider router={router} />
      </FarmGate>
    </ToastProvider>
  );
}
