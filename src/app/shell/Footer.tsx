import { useTranslation } from 'react-i18next';

import { APP_VERSION } from '@/app/config';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border px-4 py-6 text-xs text-fg-muted sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-page flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.phase')}</p>
        <p className="text-fg-subtle">
          {t('footer.version')} {APP_VERSION} · {t('footer.readOnly')}
        </p>
      </div>
    </footer>
  );
}
