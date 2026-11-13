import { CheckCircle2, Download, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { usePwaStore } from '@/pwa/pwa-store';
import { useInstallPrompt } from '@/pwa/use-install-prompt';

type Mode = 'update' | 'install' | 'offline' | 'failed';

export function PwaNotice() {
  const { t } = useTranslation();
  const needRefresh = usePwaStore((state) => state.needRefresh);
  const offlineReady = usePwaStore((state) => state.offlineReady);
  const registrationFailed = usePwaStore((state) => state.registrationFailed);
  const applying = usePwaStore((state) => state.applying);
  const applyNow = usePwaStore((state) => state.applyNow);
  const dismiss = usePwaStore((state) => state.dismiss);
  const { canInstall, install } = useInstallPrompt();

  const mode: Mode | null = needRefresh
    ? 'update'
    : canInstall
      ? 'install'
      : offlineReady
        ? 'offline'
        : registrationFailed
          ? 'failed'
          : null;

  if (!mode) return null;

  const copy = {
    update: {
      title: t('pwa.updateTitle'),
      body: t('pwa.updateBody'),
      icon: <RefreshCw className="size-4" aria-hidden="true" />,
    },
    install: {
      title: t('pwa.installTitle'),
      body: t('pwa.installBody'),
      icon: <Download className="size-4" aria-hidden="true" />,
    },
    offline: {
      title: t('pwa.offlineReadyTitle'),
      body: t('pwa.offlineReadyBody'),
      icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
    },
    failed: {
      title: t('pwa.registrationFailed'),
      body: t('pwa.registrationFailedBody'),
      icon: <RefreshCw className="size-4" aria-hidden="true" />,
    },
  }[mode];

  return (
    <div
      role="status"
      aria-live="polite"
      className="ov-no-print fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-accent/30 bg-surface-2 p-3 shadow-lg"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
        {copy.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg-strong">{copy.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{copy.body}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {mode === 'update' ? (
            <Button size="sm" onClick={() => void applyNow()} disabled={applying}>
              {applying ? t('common.saving') : t('pwa.updateNow')}
            </Button>
          ) : null}
          {mode === 'install' ? (
            <Button size="sm" onClick={() => void install()}>
              {t('pwa.installNow')}
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={dismiss}>
            {mode === 'update' ? t('pwa.later') : t('pwa.dismiss')}
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('pwa.dismiss')}
        className="grid size-7 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
