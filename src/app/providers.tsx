import { RouterProvider } from '@tanstack/react-router';

import { FarmGate } from '@/app/farm-gate';
import { router } from '@/app/router';
import { ToastProvider } from '@/components/ui/toast';

export function Providers() {
  return (
    <ToastProvider>
      <FarmGate>
        <RouterProvider router={router} />
      </FarmGate>
    </ToastProvider>
  );
}
