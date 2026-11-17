import { BadgeCheck, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { AnimalCodeLink } from '@/components/AnimalCodeLink';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { FilterChips, type FilterOption } from '@/components/ui/filter-chips';
import { KPI_GRID } from '@/components/ui/stat';
import { useToast } from '@/components/ui/toast-context';
import type { MessageKey } from '@/i18n/messages';
import { cn } from '@/lib/cn';
import { formatDateTime, formatNumber } from '@/lib/format';
import { CountUp } from '@/motion/count-up';
import { useFarm } from '@/store/use-farm';

type Status = 'all' | 'pending' | 'ready' | 'blocked' | 'served';

function statusOf(rec: {
  ration: unknown;
  approvedBy: unknown;
  servedAt: string | null;
}): Exclude<Status, 'all'> {
  if (rec.ration === null) return 'blocked';
  if (rec.servedAt) return 'served';
  if (rec.approvedBy) return 'ready';
  return 'pending';
}

export function NutritionPage() {
  const { t, i18n } = useTranslation();
  const { document, rows, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';

  const [filter, setFilter] = useState<Status>('all');
  const [serveId, setServeId] = useState<string | null>(null);

  const entries = useMemo(
    () =>
      rows.filter((row) => row.rec !== null && (filter === 'all' || statusOf(row.rec) === filter)),
    [rows, filter],
  );
  const all = rows.filter((row) => row.rec !== null);
  const counts = {
    all: all.length,
    pending: all.filter((row) => row.rec && statusOf(row.rec) === 'pending').length,
    ready: all.filter((row) => row.rec && statusOf(row.rec) === 'ready').length,
    blocked: all.filter((row) => row.rec && statusOf(row.rec) === 'blocked').length,
    served: all.filter((row) => row.rec && statusOf(row.rec) === 'served').length,
  };
  const options: FilterOption<Status>[] = [
    { value: 'all', label: t('nutrition.statusAll'), count: counts.all },
    { value: 'pending', label: t('nutrition.statusPending'), count: counts.pending },
    { value: 'ready', label: t('nutrition.statusReady'), count: counts.ready },
    { value: 'blocked', label: t('nutrition.statusBlocked'), count: counts.blocked },
    { value: 'served', label: t('nutrition.statusServed'), count: counts.served },
  ];

  const approve = async (id: string): Promise<void> => {
    const result = await execute(() => services.farm.approve(id));
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successApprove'), 'success');
  };

  const serve = async (): Promise<void> => {
    if (!serveId) return;
    const result = await execute(() => services.farm.serve(serveId));
    setServeId(null);
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successServe'), 'success');
  };

  const engine = document?.settings.engineVersion ?? '—';

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('nutrition.kicker')}
        title={t('nutrition.title')}
        subtitle={t('nutrition.subtitle')}
        actions={
          <Badge tone="neutral">
            {t('nutrition.engine')}: {engine}
          </Badge>
        }
      />

      <div className={cn(KPI_GRID, 'lg:grid-cols-5')}>
        {[
          ['all', t('nutrition.total'), counts.all, 'text-fg-strong'],
          ['pending', t('nutrition.pending'), counts.pending, 'text-info'],
          ['ready', t('nutrition.ready'), counts.ready, 'text-success'],
          ['blocked', t('nutrition.blocked'), counts.blocked, 'text-warn'],
          ['served', t('nutrition.served'), counts.served, 'text-accent'],
        ].map(([key, label, value, tone]) => (
          <Card key={String(key)} className="p-4">
            <p className="text-xs font-semibold text-fg-muted">{label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>
              <CountUp value={Number(value)} locale={locale} />
            </p>
          </Card>
        ))}
      </div>

      <Notice tone="info" title={t('nutrition.engineNote')}>
        {t('nutrition.listBody')}
      </Notice>

      <FilterChips
        label={t('nutrition.filterLabel')}
        options={options}
        value={filter}
        onChange={setFilter}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title={t('nutrition.emptyTitle')}
          body={t('nutrition.emptyBody')}
        />
      ) : (
        <ul className="ov-stagger space-y-2">
          {entries.map(({ animal, rec }) => {
            if (!rec) return null;
            const status = statusOf(rec);
            return (
              <li key={rec.id} className="rounded-2xl border border-border bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <AnimalCodeLink
                      id={animal.id}
                      code={animal.code}
                      className="text-sm font-bold text-fg-strong hover:text-accent"
                    />
                    <p className="text-xs text-fg-muted">
                      {animal.pen} · {t(`domain.stage.${animal.stage}`)} ·{' '}
                      {formatDateTime(rec.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">
                      {t('animal.confidence')}: {t(`domain.confidence.${rec.confidence}`)}
                    </Badge>
                    {status === 'pending' ? (
                      <Badge tone="info">{t('nutrition.statusPending')}</Badge>
                    ) : null}
                    {status === 'ready' ? (
                      <Badge tone="accent">{t('nutrition.statusReady')}</Badge>
                    ) : null}
                    {status === 'blocked' ? (
                      <Badge tone="warn">{t('nutrition.statusBlocked')}</Badge>
                    ) : null}
                    {status === 'served' ? (
                      <Badge tone="neutral">{t('nutrition.statusServed')}</Badge>
                    ) : null}
                  </div>
                </div>

                {rec.ration === null ? (
                  <div className="mt-3 rounded-xl border border-warn/40 bg-warn/10 p-3 text-xs text-fg-muted">
                    <p className="font-semibold text-warn">{t('nutrition.blockedReason')}</p>
                    <p className="mt-1">
                      {rec.missingInputs
                        .map((input) => t(input.key as MessageKey, input.params))
                        .join(' · ') || t('nutrition.refusedBody')}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <span className="rounded-lg bg-surface-3/60 px-2 py-1.5 text-fg-muted">
                      {t('nutrition.forage')}:{' '}
                      <b className="text-fg">
                        {formatNumber(rec.ration.forageKg, locale, 1)} {t('common.unitKg')}
                      </b>
                    </span>
                    <span className="rounded-lg bg-surface-3/60 px-2 py-1.5 text-fg-muted">
                      {t('nutrition.concentrate')}:{' '}
                      <b className="text-fg">
                        {formatNumber(rec.ration.concentrateKg, locale, 1)} {t('common.unitKg')}
                      </b>
                    </span>
                    <span className="rounded-lg bg-surface-3/60 px-2 py-1.5 text-fg-muted">
                      {t('nutrition.mineral')}:{' '}
                      <b className="text-fg">
                        {formatNumber(rec.ration.mineralG, locale)} {t('common.unitG')}
                      </b>
                    </span>
                    <span className="rounded-lg bg-surface-3/60 px-2 py-1.5 text-fg-muted">
                      {t('nutrition.water')}:{' '}
                      <b className="text-fg">
                        {formatNumber(rec.ration.waterL, locale, 1)} {t('common.unitL')}
                      </b>
                    </span>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {status === 'pending' && document?.operator.authority === 'production' ? (
                    <Button size="sm" onClick={() => void approve(rec.id)} disabled={busy}>
                      <BadgeCheck className="size-3.5" aria-hidden="true" />
                      {t('nutrition.approve')}
                    </Button>
                  ) : null}
                  {status === 'ready' && document?.operator.authority === 'production' ? (
                    <Button size="sm" onClick={() => setServeId(rec.id)} disabled={busy}>
                      <Utensils className="size-3.5" aria-hidden="true" />
                      {t('nutrition.serve')}
                    </Button>
                  ) : null}
                  {status === 'pending' ? (
                    <span className="self-center text-xs text-fg-subtle">
                      {t('animal.needsProduction')}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={serveId !== null}
        onClose={() => setServeId(null)}
        title={t('nutrition.serve')}
        description={t('nutrition.serve')}
        closeLabel={t('common.close')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setServeId(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void serve()} disabled={busy}>
              {busy ? t('common.saving') : t('common.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{t('ration.stockNote')}</p>
      </Dialog>
    </div>
  );
}
