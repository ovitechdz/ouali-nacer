import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Providers } from '@/app/providers';
import { initI18n } from '@/i18n';
import { installPrintSafety } from '@/motion/print-safety';

import '@/styles/base.css';

async function bootstrap(): Promise<void> {
  await initI18n();

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element #root is missing from index.html');
  }

  installPrintSafety();

  createRoot(container).render(
    <StrictMode>
      <Providers />
    </StrictMode>,
  );
}

void bootstrap();
