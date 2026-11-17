import { Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { APP_VERSION } from '@/app/config';
import { LanguageSwitcher } from '@/app/shell/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Notice } from '@/components/ui/feedback';
import { useFarmStore } from '@/store/farm-store';

function Splash() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src="/logo.jpeg"
          alt=""
          aria-hidden="true"
          className="size-16 rounded-2xl object-cover ring-1 ring-border"
        />
        <p className="inline-flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </p>
      </div>
    </div>
  );
}

function Onboarding() {
  const { t, i18n } = useTranslation();
  const busy = useFarmStore((state) => state.busy);
  const failure = useFarmStore((state) => state.failure);
  const onboard = useFarmStore((state) => state.onboard);

  const [farmName, setFarmName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [authority, setAuthority] = useState<'field' | 'production'>('production');
  const [region, setRegion] = useState('');
  const [pens, setPens] = useState('A1, A2, B1');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setLocalError(null);
    if (farmName.trim() === '' || operatorName.trim() === '') {
      setLocalError(t('onboarding.required'));
      return;
    }
    const penList = pens
      .split(',')
      .map((pen) => pen.trim())
      .filter((pen) => pen !== '');
    await onboard({
      farmName: farmName.trim(),
      operatorName: operatorName.trim(),
      authority,
      locale: (i18n.resolvedLanguage ?? 'ar') as 'ar' | 'fr' | 'en',
      region: region.trim() || undefined,
      pens: penList.length > 0 ? penList : ['A1'],
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpeg"
            alt=""
            aria-hidden="true"
            className="size-9 rounded-lg object-cover ring-1 ring-border"
          />
          <span className="text-sm font-bold text-fg-strong">{t('app.name')}</span>
        </div>
        <LanguageSwitcher />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10">
        <div className="ov-rise">
          <p className="ov-micro text-accent">{t('onboarding.kicker')}</p>
          <h1 className="mt-2 text-2xl font-bold text-fg-strong sm:text-3xl">
            {t('onboarding.title')}
          </h1>
          <p className="mt-2 text-sm text-fg-muted">{t('onboarding.lead')}</p>

          <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('onboarding.farmName')} htmlFor="onboarding-farm" required>
                <Input
                  id="onboarding-farm"
                  value={farmName}
                  onChange={(event) => setFarmName(event.target.value)}
                  autoComplete="organization"
                  maxLength={120}
                />
              </Field>
              <Field label={t('onboarding.operatorName')} htmlFor="onboarding-operator" required>
                <Input
                  id="onboarding-operator"
                  value={operatorName}
                  onChange={(event) => setOperatorName(event.target.value)}
                  autoComplete="name"
                  maxLength={120}
                />
              </Field>
              <Field
                label={t('onboarding.authority')}
                htmlFor="onboarding-authority"
                hint={t('onboarding.authorityHint')}
              >
                <Select
                  id="onboarding-authority"
                  value={authority}
                  onChange={(event) =>
                    setAuthority(event.target.value === 'field' ? 'field' : 'production')
                  }
                >
                  <option value="production">{t('authority.production')}</option>
                  <option value="field">{t('authority.field')}</option>
                </Select>
              </Field>
              <Field label={t('onboarding.region')} htmlFor="onboarding-region">
                <Input
                  id="onboarding-region"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  maxLength={120}
                />
              </Field>
              <Field
                label={t('onboarding.pens')}
                htmlFor="onboarding-pens"
                hint={t('onboarding.pensHint')}
                className="sm:col-span-2"
              >
                <Input
                  id="onboarding-pens"
                  value={pens}
                  onChange={(event) => setPens(event.target.value)}
                  dir="ltr"
                />
              </Field>
            </div>

            {localError ? <Notice tone="danger">{localError}</Notice> : null}
            {failure ? <Notice tone="danger">{t(failure.key, failure.params)}</Notice> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? t('common.saving') : t('onboarding.submit')}
              </Button>
              <p className="text-xs text-fg-subtle">{t('onboarding.localNote')}</p>
            </div>
          </form>
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-fg-subtle">
        {t('app.name')} · {APP_VERSION}
      </footer>
    </div>
  );
}

function FailureState() {
  const { t } = useTranslation();
  const initialize = useFarmStore((state) => state.initialize);
  const errorKind = useFarmStore((state) => state.errorKind);
  const chunkFailed = errorKind === 'chunk';
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4">
      <Notice
        tone="danger"
        title={t('error.title')}
        className="max-w-md flex-col items-start gap-3"
      >
        <p>{chunkFailed ? t('error.chunkBody') : t('error.body')}</p>
        <Button
          type="button"
          onClick={() => {
            if (chunkFailed) window.location.reload();
            else void initialize();
          }}
        >
          {chunkFailed ? t('common.reloadPage') : t('common.retry')}
        </Button>
      </Notice>
    </div>
  );
}

export function FarmGate({ children }: { children: ReactNode }) {
  const status = useFarmStore((state) => state.status);
  const initialize = useFarmStore((state) => state.initialize);

  useEffect(() => {
    if (status === 'loading') void initialize();
  }, [status, initialize]);

  if (status === 'loading') return <Splash />;
  if (status === 'empty') return <Onboarding />;
  if (status === 'error') return <FailureState />;
  return <>{children}</>;
}
