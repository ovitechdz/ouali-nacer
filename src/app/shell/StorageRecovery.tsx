import { Link } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useFarmStore } from '@/store/farm-store';

/**
 * Shown when IndexedDB reports a quota error. The session keeps working in
 * memory, but the operator must export a backup or free space before the next
 * reload, so the panel stays visible until acknowledged.
 */
export function StorageRecovery() {
  const { t } = useTranslation();
  const quota = useFarmStore((state) => state.storageIssue === 'quota');
  const dismiss = useFarmStore((state) => state.dismissStorageIssue);

  if (!quota) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="storage-quota-title"
      className="ov-no-print fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-danger/40 bg-surface-2 p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 id="storage-quota-title" className="text-sm font-bold text-fg-strong">
            {t('storage.quotaTitle')}
          </h2>
          <p className="text-xs leading-relaxed text-fg-muted">{t('storage.quotaBody')}</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/sync">
              <Button size="sm">{t('storage.quotaAction')}</Button>
            </Link>
            <Button size="sm" variant="secondary" onClick={dismiss}>
              {t('storage.quotaDismiss')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
