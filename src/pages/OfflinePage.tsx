import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function OfflinePage() {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Card className="flex max-w-lg flex-col items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-warn/10 text-warn">
          <WifiOff className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-fg-strong">{t('offline.title')}</h1>
        <p className="text-sm leading-relaxed text-fg-muted">{t('offline.body')}</p>
        <Button onClick={() => window.location.reload()}>{t('offline.action')}</Button>
      </Card>
    </div>
  );
}
