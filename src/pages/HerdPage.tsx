import { Link } from '@tanstack/react-router';
import { Plus, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { AnimalCodeLink } from '@/components/AnimalCodeLink';
import { AnimalForm } from '@/components/forms/AnimalForm';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
import { FilterChips, type FilterOption } from '@/components/ui/filter-chips';
import { Input } from '@/components/ui/input';
import { Table, TableWrap, Td, Th } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast-context';
import { cn } from '@/lib/cn';
import { formatDate, formatNumber } from '@/lib/format';
import { useGsapReveal } from '@/motion/use-gsap-reveal';
import { useFarm } from '@/store/use-farm';

type Filter = 'all' | 'alerte' | 'suivi' | 'ok';

const HEALTH_TONE: Record<'ok' | 'suivi' | 'alerte', string> = {
  ok: 'text-success',
  suivi: 'text-warn',
  alerte: 'text-danger',
};

export function HerdPage() {
  const { t, i18n } = useTranslation();
  const { document, rows, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: rows.length,
      alerte: rows.filter((row) => row.health.status === 'alerte').length,
      suivi: rows.filter((row) => row.health.status === 'suivi').length,
      ok: rows.filter((row) => row.health.status === 'ok').length,
    }),
    [rows],
  );

  const options: FilterOption<Filter>[] = [
    { value: 'all', label: t('herd.filterAll'), count: counts.all },
    { value: 'alerte', label: t('domain.health.alerte'), count: counts.alerte },
    { value: 'suivi', label: t('domain.health.suivi'), count: counts.suivi },
    { value: 'ok', label: t('domain.health.ok'), count: counts.ok },
  ];

  const needle = search.trim().toLowerCase();
  const visible = rows
    .filter((row) => filter === 'all' || row.health.status === filter)
    .filter((row) =>
      needle === ''
        ? true
        : `${row.animal.code} ${row.animal.rfid} ${row.animal.pen}`.toLowerCase().includes(needle),
    )
    .sort((a, b) => a.animal.code.localeCompare(b.animal.code));

  const pens = document?.settings.pens ?? [];
  const reveal = useGsapReveal<HTMLDivElement>({
    selector: 'tbody tr',
    offsetY: 8,
    stagger: 0.015,
    duration: 0.3,
    watch: filter,
  });

  return (
    <div ref={reveal} className="space-y-5">
      <PageHeader
        kicker={t('herd.kicker')}
        title={t('herd.title')}
        subtitle={t('herd.subtitle')}
        actions={
          <>
            <Badge tone="neutral">
              {t('herd.count', { count: formatNumber(rows.length, locale) })}
            </Badge>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              {t('herd.add')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label={t('herd.filterLabel')}
          options={options}
          value={filter}
          onChange={setFilter}
        />
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute start-3 top-3 size-4 text-fg-subtle"
            aria-hidden="true"
          />
          <Input
            aria-label={t('herd.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('herd.search')}
            className="ps-9"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('herd.emptyTitle')}
          body={t('herd.emptyBody')}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              {t('herd.add')}
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title={t('common.empty')} body={t('herd.noMatch')} />
      ) : (
        <>
          <TableWrap className="hidden md:block">
            <Table>
              <thead>
                <tr>
                  <Th>{t('herd.colAnimal')}</Th>
                  <Th>{t('herd.colPen')}</Th>
                  <Th>{t('herd.colStage')}</Th>
                  <Th>{t('herd.colWeight')}</Th>
                  <Th>{t('herd.colBcs')}</Th>
                  <Th>{t('herd.colHealth')}</Th>
                  <Th>{t('herd.colScan')}</Th>
                  <Th>{t('herd.colRec')}</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ animal, rec, health }) => (
                  <tr
                    key={animal.id}
                    className="transition-colors duration-150 hover:bg-surface-3/50"
                  >
                    <Td>
                      <AnimalCodeLink
                        id={animal.id}
                        code={animal.code}
                        className="font-semibold text-fg-strong hover:text-accent"
                      />
                      <span className="block font-mono text-[10px] text-fg-subtle" dir="ltr">
                        {animal.rfid}
                      </span>
                    </Td>
                    <Td>{animal.pen}</Td>
                    <Td className="whitespace-nowrap">{t(`domain.stage.${animal.stage}`)}</Td>
                    <Td className="tabular-nums">
                      {animal.weightKg != null ? `${animal.weightKg} ${t('common.unitKg')}` : '—'}
                    </Td>
                    <Td className="tabular-nums">{animal.bcs ?? '—'}</Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold',
                          HEALTH_TONE[health.status],
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                        {t(`domain.health.${health.status}`)}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-fg-muted">
                      {formatDate(animal.lastScanAt, locale)}
                    </Td>
                    <Td>
                      {rec === null ? (
                        <span className="text-xs text-fg-subtle">{t('herd.recNone')}</span>
                      ) : rec.ration === null ? (
                        <Badge tone="warn">{t('herd.recBlocked')}</Badge>
                      ) : rec.servedAt ? (
                        <Badge tone="neutral">{t('animal.served')}</Badge>
                      ) : rec.approvedBy ? (
                        <Badge tone="accent">{t('herd.recReady')}</Badge>
                      ) : (
                        <Badge tone="info">{t('animal.pending')}</Badge>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>

          <ul className="ov-stagger space-y-2 md:hidden">
            {visible.map(({ animal, rec, health }) => (
              <li key={animal.id}>
                <Link
                  to="/troupeau/$id"
                  params={{ id: animal.id }}
                  className="block rounded-2xl border border-border bg-surface-2 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-fg-strong">{animal.code}</p>
                      <p className="font-mono text-[10px] text-fg-subtle" dir="ltr">
                        {animal.rfid}
                      </p>
                    </div>
                    <span className={cn('text-xs font-semibold', HEALTH_TONE[health.status])}>
                      {t(`domain.health.${health.status}`)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-fg-muted">
                    <span>
                      {t('common.pen')}: <span className="text-fg">{animal.pen}</span>
                    </span>
                    <span>
                      {t('common.weight')}:{' '}
                      <span className="tabular-nums text-fg">
                        {animal.weightKg != null ? `${animal.weightKg} ${t('common.unitKg')}` : '—'}
                      </span>
                    </span>
                    <span>
                      {t('common.bcs')}:{' '}
                      <span className="tabular-nums text-fg">{animal.bcs ?? '—'}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-fg-subtle">
                      {t('animal.lastScan')}: {formatDate(animal.lastScanAt, locale)}
                    </span>
                    {rec?.ration === null ? (
                      <Badge tone="warn">{t('herd.recBlocked')}</Badge>
                    ) : rec?.approvedBy ? (
                      <Badge tone="accent">{t('herd.recReady')}</Badge>
                    ) : rec ? (
                      <Badge tone="info">{t('animal.pending')}</Badge>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('herd.addTitle')}
        description={t('herd.addBody')}
        closeLabel={t('common.close')}
        size="lg"
      >
        <AnimalForm
          pens={pens}
          submitLabel={t('herd.submit')}
          busy={busy}
          onSubmit={async (input) => {
            const result = await execute(() => services.farm.registerAnimal(input));
            if (!result.ok) {
              toast.push(t(result.error.key, result.error.params), 'error');
              return false;
            }
            setAddOpen(false);
            toast.push(t('common.saved'), 'success');
            return true;
          }}
        />
      </Dialog>
    </div>
  );
}
