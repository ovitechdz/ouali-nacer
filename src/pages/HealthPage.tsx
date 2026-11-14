import { Link } from '@tanstack/react-router';
import { HeartPulse, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { AnimalCodeLink } from '@/components/AnimalCodeLink';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { FilterChips, type FilterOption } from '@/components/ui/filter-chips';
import { Field, Select, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-context';
import { cn } from '@/lib/cn';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useFarm } from '@/store/use-farm';
import { HEALTH_EVENT_TYPES, type HealthEventType } from '@/domain';

type TypeFilter = 'all' | HealthEventType;
type Severity = 'info' | 'suivi' | 'alerte';

const SEVERITY_CLASS: Record<Severity, string> = {
  info: 'text-success',
  suivi: 'text-warn',
  alerte: 'text-danger',
};

export function HealthPage() {
  const { t, i18n } = useTranslation();
  const { document, rows, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';

  const [filter, setFilter] = useState<TypeFilter>('all');
  const [open, setOpen] = useState(false);
  const [animalId, setAnimalId] = useState('');
  const [type, setType] = useState<HealthEventType>('observation');
  const [severity, setSeverity] = useState<Severity>('info');
  const [note, setNote] = useState('');

  const alerts = rows.filter((row) => row.health.status === 'alerte');
  const counts = {
    alerte: alerts.length,
    suivi: rows.filter((row) => row.health.status === 'suivi').length,
    ok: rows.filter((row) => row.health.status === 'ok').length,
  };

  const events = useMemo(
    () =>
      (document?.healthEvents ?? [])
        .slice()
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .filter((event) => filter === 'all' || event.type === filter),
    [document, filter],
  );

  const typeOptions: FilterOption<TypeFilter>[] = [
    { value: 'all', label: t('health.allTypes') },
    ...HEALTH_EVENT_TYPES.map((value) => ({ value, label: t(`health.type.${value}`) })),
  ];

  const byId = new Map((document?.animals ?? []).map((animal) => [animal.id, animal]));

  const submit = async (): Promise<void> => {
    if (animalId === '') return;
    const result = await execute(() =>
      services.farm.recordHealthEvent({
        animalId,
        type,
        severity,
        note: note.trim() || undefined,
      }),
    );
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successHealth'), 'success');
    setOpen(false);
    setNote('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('health.kicker')}
        title={t('health.title')}
        subtitle={t('health.subtitle')}
        actions={
          <Button
            onClick={() => {
              setAnimalId(rows[0]?.animal.id ?? '');
              setOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('health.addEvent')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ['alerte', t('health.countAlerte'), counts.alerte, 'text-danger'],
            ['suivi', t('health.countSuivi'), counts.suivi, 'text-warn'],
            ['ok', t('health.countOk'), counts.ok, 'text-success'],
          ] as const
        ).map(([key, label, value, tone]) => (
          <Card key={key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-fg-muted">{label}</p>
              <p className={cn('mt-1 text-2xl font-bold tabular-nums', tone)}>
                {formatNumber(value, locale)}
              </p>
            </div>
            <HeartPulse className={cn('size-6', tone)} aria-hidden="true" />
          </Card>
        ))}
      </div>

      <Notice tone="info">{t('health.ruleNote')}</Notice>

      <section aria-labelledby="health-alerts" className="space-y-2">
        <h2 id="health-alerts" className="text-base font-bold text-fg-strong">
          {t('health.alertsTitle')}
        </h2>
        {alerts.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title={t('health.alertsEmpty')}
            body={t('animal.noSignals')}
          />
        ) : (
          <ul className="ov-stagger space-y-2">
            {alerts.map(({ animal, health }) => (
              <li key={animal.id}>
                <Link
                  to="/troupeau/$id"
                  params={{ id: animal.id }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-3 transition-colors duration-[var(--duration-quick)] ease-out hover:bg-danger/10"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-fg-strong">
                      {animal.code}{' '}
                      <span className="text-xs font-normal text-fg-muted">· {animal.pen}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {t('health.reason')}:{' '}
                      {health.signals.map((signal) => t(`domain.signal.${signal.id}`)).join(' · ')}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-danger">
                    {t('health.openAnimal')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="health-events" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="health-events" className="text-base font-bold text-fg-strong">
              {t('health.eventsTitle')}
            </h2>
            <p className="text-xs text-fg-muted">{t('health.eventsBody')}</p>
          </div>
        </div>
        <FilterChips
          label={t('health.filterType')}
          options={typeOptions}
          value={filter}
          onChange={setFilter}
        />

        {events.length === 0 ? (
          <EmptyState title={t('health.eventsEmpty')} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-start text-[11px] uppercase tracking-[0.06em] text-fg-muted">
                  <th scope="col" className="px-3 py-2.5 text-start">
                    {t('health.eventAnimal')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-start">
                    {t('health.eventType')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-start">
                    {t('health.eventSeverity')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-start">
                    {t('health.eventDate')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-start">
                    {t('health.eventNote')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const animal = byId.get(event.animalId);
                  return (
                    <tr key={event.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2.5 font-medium text-fg">
                        {animal ? (
                          <AnimalCodeLink
                            id={animal.id}
                            code={animal.code}
                            className="hover:text-accent"
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-fg-muted">
                        {t(`health.type.${event.type}`)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-xs font-semibold',
                          SEVERITY_CLASS[event.severity],
                        )}
                      >
                        {event.severity === 'info'
                          ? t('animal.severityInfo')
                          : event.severity === 'suivi'
                            ? t('animal.severitySuivi')
                            : t('animal.severityAlerte')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-fg-muted">
                        {formatDateTime(event.at, locale)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-fg-muted">{event.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('health.addEvent')}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void submit()} disabled={busy || animalId === ''}>
              {busy ? t('common.saving') : t('animal.submitHealth')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('health.eventAnimal')} htmlFor="health-animal">
            <Select
              id="health-animal"
              value={animalId}
              onChange={(event) => setAnimalId(event.target.value)}
            >
              {rows.map(({ animal }) => (
                <option key={animal.id} value={animal.id}>
                  {animal.code} · {animal.pen}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('health.eventType')} htmlFor="health-type">
            <Select
              id="health-type"
              value={type}
              onChange={(event) => setType(event.target.value as HealthEventType)}
            >
              {HEALTH_EVENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`health.type.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('health.eventSeverity')} htmlFor="health-severity">
            <Select
              id="health-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as Severity)}
            >
              <option value="info">{t('animal.severityInfo')}</option>
              <option value="suivi">{t('animal.severitySuivi')}</option>
              <option value="alerte">{t('animal.severityAlerte')}</option>
            </Select>
          </Field>
        </div>
        <Field label={t('health.eventNote')} htmlFor="health-note" className="mt-3">
          <Textarea
            id="health-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
          />
        </Field>
      </Dialog>
    </div>
  );
}
