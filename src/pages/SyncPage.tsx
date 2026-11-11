import { CloudOff, Database, Download, HardDrive, Printer, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Notice } from '@/components/ui/feedback';
import { useToast } from '@/components/ui/toast-context';
import { formatDateTime } from '@/lib/format';
import { useFarm } from '@/store/use-farm';
import { useFarmStore } from '@/store/farm-store';

export function SyncPage() {
  const { t, i18n } = useTranslation();
  const { document } = useFarm();
  const storage = useFarmStore((state) => state.storage);
  const reset = useFarmStore((state) => state.reset);
  const busy = useFarmStore((state) => state.busy);
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const [resetOpen, setResetOpen] = useState(false);

  if (!document) return null;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(document, null, 2));
      toast.push(t('sync.copied'), 'success');
    } catch {
      toast.push(t('error.body'), 'error');
    }
  };

  const doReset = async (): Promise<void> => {
    setResetOpen(false);
    await reset();
    toast.push(t('sync.resetSuccess'), 'success');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('sync.kicker')}
        title={t('sync.title')}
        subtitle={t('sync.subtitle')}
        actions={
          <Badge tone="accent">
            <HardDrive className="me-1 size-3" aria-hidden="true" />
            {storage === 'indexeddb' ? t('sync.storageIndexedDb') : t('sync.storageMemory')}
          </Badge>
        }
      />

      {storage === 'memory' ? (
        <Notice tone="danger" title={t('common.memoryOnly')}>
          {t('sync.storageWarning')}
        </Notice>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-base font-bold text-fg-strong">{t('sync.localTitle')}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">{t('sync.storageLabel')}</dt>
              <dd className="font-semibold text-fg">
                {storage === 'indexeddb' ? t('sync.storageIndexedDb') : t('sync.storageMemory')}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">{t('sync.documentId')}</dt>
              <dd className="font-mono text-xs text-fg" dir="ltr">
                {document.farmId}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">{t('sync.lastUpdated')}</dt>
              <dd className="text-xs text-fg">{formatDateTime(document.updatedAt, locale)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">{t('sync.pendingLabel')}</dt>
              <dd className="text-xs text-fg-muted">{t('sync.pendingNone')}</dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <CloudOff className="size-4 text-accent" aria-hidden="true" />
            {t('sync.remoteLabel')}
          </h2>
          <p className="text-sm font-semibold text-fg">{t('sync.remoteNone')}</p>
          <p className="text-sm text-fg-muted">{t('sync.remoteBody')}</p>
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
            <p className="text-xs font-semibold text-success">{t('sync.offlineReady')}</p>
            <p className="mt-1 text-xs text-fg-muted">{t('sync.offlineBody')}</p>
          </div>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
          <Database className="size-4 text-accent" aria-hidden="true" />
          {t('sync.exportTitle')}
        </h2>
        <p className="text-sm text-fg-muted">{t('sync.exportBody')}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            {t('sync.printDocument')}
          </Button>
          <Button variant="secondary" onClick={() => void copy()}>
            <Download className="size-4" aria-hidden="true" />
            {t('sync.copyJson')}
          </Button>
        </div>
      </Card>

      <Card className="space-y-2 border-danger/30 bg-danger/5">
        <h2 className="text-base font-bold text-danger">{t('sync.dangerTitle')}</h2>
        <p className="text-sm text-fg-muted">{t('sync.dangerBody')}</p>
        <Button variant="secondary" onClick={() => setResetOpen(true)}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {t('sync.reset')}
        </Button>
      </Card>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t('sync.resetTitle')}
        description={t('sync.resetBody')}
        closeLabel={t('common.close')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void doReset()} disabled={busy}>
              {t('sync.resetConfirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{t('sync.storageWarning')}</p>
      </Dialog>
    </div>
  );
}
