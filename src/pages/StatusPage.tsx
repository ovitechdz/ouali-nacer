import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { APP_VERSION } from '@/app/config';
import { CAPABILITIES, type CapabilityClass, type CapabilityStatus } from '@/app/capabilities';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOnlineStatus } from '@/app/shell/use-online';
import type { MessageKey } from '@/i18n/messages';
import { usePwaStore } from '@/pwa/pwa-store';
import { useInstallPrompt } from '@/pwa/use-install-prompt';
import { useFarmStore } from '@/store/farm-store';

const CLASS_LABEL: Record<CapabilityClass, MessageKey> = {
  A: 'status.classA',
  B: 'status.classB',
  C: 'status.classC',
};

const CLASS_TONE: Record<CapabilityClass, 'accent' | 'info' | 'warn'> = {
  A: 'accent',
  B: 'info',
  C: 'warn',
};

const STATUS_LABEL: Record<CapabilityStatus, MessageKey> = {
  available: 'status.capAvailable',
  planned: 'status.capPlanned',
  simulated: 'status.capSimulated',
};

const STATUS_TONE: Record<CapabilityStatus, 'accent' | 'neutral' | 'warn'> = {
  available: 'accent',
  planned: 'neutral',
  simulated: 'warn',
};

export function StatusPage() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const storage = useFarmStore((state) => state.storage);
  const needRefresh = usePwaStore((state) => state.needRefresh);
  const offlineReady = usePwaStore((state) => state.offlineReady);
  const registrationFailed = usePwaStore((state) => state.registrationFailed);
  const { canInstall, install } = useInstallPrompt();

  const swStatus = registrationFailed
    ? 'status.swInactive'
    : needRefresh
      ? 'status.swPending'
      : offlineReady
        ? 'status.swActive'
        : 'status.swInactive';

  const rows = [
    { label: t('status.envLabel'), value: t('status.envValue') },
    { label: t('status.buildLabel'), value: APP_VERSION },
    { label: t('status.i18nLabel'), value: t('status.i18nValue') },
    {
      label: t('status.storageLabel'),
      value: storage === 'indexeddb' ? t('sync.storageIndexedDb') : t('sync.storageMemory'),
    },
    {
      label: t('status.networkLabel'),
      value: online ? t('common.online') : t('common.offline'),
    },
    { label: t('status.engineLabel'), value: t('status.engineValue') },
    { label: t('status.swLabel'), value: t(swStatus) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('status.title')}
        subtitle={t('status.subtitle')}
        actions={<Badge tone="neutral">{t('app.phase')}</Badge>}
      />

      <Card className="space-y-3">
        <h2 className="text-base font-bold text-fg-strong">{t('status.appTitle')}</h2>
        <p className="text-sm text-fg-muted">{t('status.appBody')}</p>
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

      <Card className="space-y-3">
        <h2 className="text-base font-bold text-fg-strong">{t('status.installTitle')}</h2>
        <p className="text-sm text-fg-muted">{t('status.installBody')}</p>
        <div className="flex flex-wrap items-center gap-2">
          {canInstall ? (
            <Button onClick={() => void install()}>
              <Download className="size-4" aria-hidden="true" />
              {t('pwa.installNow')}
            </Button>
          ) : null}
          <p className="text-xs text-fg-muted">{t('pwa.installIos')}</p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-bold text-fg-strong">{t('status.capabilitiesTitle')}</h2>
        <p className="text-sm text-fg-muted">{t('status.capabilitiesBody')}</p>
        <div className="space-y-2">
          {CAPABILITIES.map((capability) => (
            <div
              key={capability.id}
              data-capability={capability.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface-3/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">{t(capability.labelKey)}</p>
                <p className="text-xs leading-relaxed text-fg-muted">{t(capability.bodyKey)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge tone={CLASS_TONE[capability.class]}>
                  {t(CLASS_LABEL[capability.class])}
                </Badge>
                <Badge tone={STATUS_TONE[capability.status]}>
                  {t(STATUS_LABEL[capability.status])}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
