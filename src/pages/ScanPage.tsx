import { Link } from '@tanstack/react-router';
import { CircleCheck, CircleHelp, ScanLine, SearchX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { AnimalForm } from '@/components/forms/AnimalForm';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Notice } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/input';
import { formatDate } from '@/lib/format';
import { useFarm } from '@/store/use-farm';
import { useToast } from '@/components/ui/toast-context';

interface RecentRead {
  id: number;
  query: string;
  code: string | null;
  known: boolean;
}

export function ScanPage() {
  const { t, i18n } = useTranslation();
  const { document, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';

  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState<string | null>(null);
  const [foundId, setFoundId] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentRead[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [nextId, setNextId] = useState(1);

  const found = document?.animals.find((animal) => animal.id === foundId) ?? null;
  const pens = document?.settings.pens ?? [];

  const read = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const value = query.trim();
    if (!value || !document) return;
    const needle = value.toLowerCase();
    const animal =
      document.animals.find((entry) => entry.rfid.trim().toLowerCase() === needle) ??
      document.animals.find((entry) => entry.code.trim().toLowerCase() === needle) ??
      null;

    if (animal) {
      const result = await execute(() => services.farm.recordScan(animal.id));
      setFoundId(animal.id);
      setRecent((current) =>
        [{ id: nextId, query: value, code: animal.code, known: result.ok }, ...current].slice(0, 8),
      );
      setNextId((value) => value + 1);
    } else {
      await execute(() => services.farm.logScanFailure(value));
      setFoundId(null);
      setRecent((current) =>
        [{ id: nextId, query: value, code: null, known: false }, ...current].slice(0, 8),
      );
      setNextId((value) => value + 1);
    }
    setSearched(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t('scan.kicker')}
        title={t('scan.title')}
        subtitle={t('scan.subtitle')}
        actions={<Badge tone="neutral">{t('scan.demoNote')}</Badge>}
      />

      <Card className="space-y-4">
        <form
          onSubmit={(event) => void read(event)}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field
            label={t('scan.inputLabel')}
            htmlFor="scan-input"
            hint={t('scan.inputHint')}
            className="flex-1"
          >
            <Input
              id="scan-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              dir="ltr"
              placeholder="E280-…"
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || query.trim() === ''}>
              <ScanLine className="size-4" aria-hidden="true" />
              {busy ? t('common.loading') : t('scan.submit')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('');
                setSearched(null);
                setFoundId(null);
              }}
            >
              {t('scan.clear')}
            </Button>
          </div>
        </form>

        <div aria-live="polite">
          {searched === null ? (
            <Notice tone="info">{t('scan.empty')}</Notice>
          ) : found ? (
            <div className="space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-success">
                <CircleCheck className="size-4" aria-hidden="true" />
                {t('scan.foundTitle')}
              </p>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-fg-strong">
                  {found.code} <span className="text-fg-muted">· {found.rfid}</span>
                </p>
                <p className="text-fg-muted">
                  {t('animal.pen')}: {found.pen} · {t('animal.stage')}:{' '}
                  {t(`domain.stage.${found.stage}`)}
                </p>
                <p className="text-fg-muted">
                  {t('animal.lastScan')}: {formatDate(found.lastScanAt, locale)}
                </p>
                <p className="text-fg-muted">
                  {t('common.bcs')}: {found.bcs ?? '—'} · {t('common.weight')}:{' '}
                  {found.weightKg ?? '—'} {t('common.unitKg')}
                </p>
              </div>
              <Link
                to="/troupeau/$id"
                params={{ id: found.id }}
                className="inline-flex h-9 items-center rounded-xl bg-accent-strong px-3 text-sm font-semibold text-accent-contrast"
              >
                {t('scan.openAnimal')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-warn/40 bg-warn/10 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-warn">
                <CircleHelp className="size-4" aria-hidden="true" />
                {t('scan.unknownTitle')}
              </p>
              <p className="text-sm text-fg-muted">{t('scan.unknownBody')}</p>
              <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                {t('scan.createAnimal')}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card className="space-y-2">
          <h2 className="text-base font-bold text-fg-strong">{t('scan.instructionsTitle')}</h2>
          <p className="text-sm leading-relaxed text-fg-muted">{t('scan.instructionsBody')}</p>
          <p className="text-xs text-fg-subtle">{t('scan.demoNote')}</p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold text-fg-strong">{t('scan.recentTitle')}</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-fg-muted">{t('scan.recentEmpty')}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {recent.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                  <span dir="ltr" className="font-mono text-xs text-fg">
                    {entry.query}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    {entry.known ? (
                      <>
                        <CircleCheck className="size-3.5 text-accent" aria-hidden="true" />
                        <span className="text-success">{entry.code}</span>
                      </>
                    ) : (
                      <>
                        <SearchX className="size-3.5 text-warn" aria-hidden="true" />
                        <span className="text-warn">{t('scan.anonymous')}</span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('herd.addTitle')}
        description={t('herd.addBody')}
        closeLabel={t('common.close')}
        size="lg"
      >
        <AnimalForm
          pens={pens}
          defaults={{ rfid: searched ?? '' }}
          submitLabel={t('herd.submit')}
          busy={busy}
          onSubmit={async (input) => {
            const result = await execute(() => services.farm.registerAnimal(input));
            if (!result.ok) {
              toast.push(t(result.error.key, result.error.params), 'error');
              return false;
            }
            setCreateOpen(false);
            setFoundId(result.result.id);
            toast.push(t('scan.created'), 'success');
            return true;
          }}
        />
      </Dialog>
    </div>
  );
}
