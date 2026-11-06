import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';

import { initI18n, i18n } from '@/i18n';

beforeAll(async () => {
  if (!i18n.isInitialized) await initI18n();
});
