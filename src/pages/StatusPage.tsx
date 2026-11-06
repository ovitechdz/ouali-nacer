import { useTranslation } from 'react-i18next';

import { APP_VERSION } from '@/app/config';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function StatusPage() {
  const { t } = useTranslation();

  const rows = [
    { label: t('status.envLabel'), value: t('status.envValue') },
    { label: t('status.buildLabel'), value: APP_VERSION },
    { label: t('status.i18nLabel'), value: t('status.i18nValue') },
    { label: t('status.storageLabel'), value: t('status.storageValue') },
    { label: t('status.networkLabel'), value: t('status.networkValue') },
    { label: t('status.engineLabel'), value: t('status.engineValue') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('status.title')}
        subtitle={t('status.subtitle')}
        actions={<Badge tone="warn">{t('app.phase')}</Badge>}
      />

      <Card>
        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-6"
            >
              <dt className="w-48 shrink-0 text-sm font-medium text-fg">{row.label}</dt>
              <dd className="text-sm text-fg-muted">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
