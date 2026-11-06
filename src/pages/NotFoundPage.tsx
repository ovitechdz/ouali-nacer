import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Card className="flex max-w-lg flex-col items-center gap-4 text-center">
        <p className="font-mono text-3xl font-bold text-accent">404</p>
        <h1 className="text-xl font-bold text-fg-strong">{t('notFound.title')}</h1>
        <p className="text-sm leading-relaxed text-fg-muted">{t('notFound.body')}</p>
        <Link
          to="/"
          className="inline-flex h-[42px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-contrast shadow-accent transition-colors hover:bg-accent-strong"
        >
          {t('notFound.action')}
        </Link>
      </Card>
    </div>
  );
}
