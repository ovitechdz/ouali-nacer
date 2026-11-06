import type { ErrorComponentProps } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function RouteError({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error);

  return (
    <Card role="alert" className="border-danger/40 bg-danger/5">
      <h1 className="text-lg font-bold text-fg-strong">{t('error.title')}</h1>
      <p className="mt-2 text-sm text-fg-muted">{t('error.body')}</p>
      <p className="mt-3 break-words font-mono text-xs text-fg-subtle">{message}</p>
      <Button className="mt-4" onClick={reset}>
        {t('common.retry')}
      </Button>
    </Card>
  );
}
