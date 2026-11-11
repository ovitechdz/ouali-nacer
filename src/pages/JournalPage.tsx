import { BookOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { FilterChips, type FilterOption } from '@/components/ui/filter-chips';
import { Input } from '@/components/ui/input';
import { Table, TableWrap, Td, Th } from '@/components/ui/table';
import { AUDIT_EVENT_TYPES, type AuditEventType } from '@/domain';
import type { MessageKey } from '@/i18n/messages';
import { cn } from '@/lib/cn';
import { formatDateTime, formatDate } from '@/lib/format';
import { useFarm } from '@/store/use-farm';

type TypeFilter = 'all' | AuditEventType;
type Severity = 'all' | 'info' | 'warn' | 'error';

const TYPE_KEY: Record<AuditEventType, MessageKey> = {
  scan: 'journal.typeScan',
  saisie: 'journal.typeSaisie',
  recommandation: 'journal.typeRecommandation',
  approbation: 'journal.typeApprobation',
  distribution: 'journal.typeDistribution',
  transfert: 'journal.typeTransfert',
  identite: 'journal.typeIdentite',
  erreur: 'journal.typeErreur',
  import: 'journal.typeImport',
  export: 'journal.typeExport',
  settings: 'journal.typeSettings',
  archivage: 'journal.typeArchivage',
};

const SEVERITY_CLASS: Record<'info' | 'warn' | 'error', string> = {
  info: 'text-fg-muted',
  warn: 'text-warn',
  error: 'text-danger',
};

const ENTITY_KEY: Record<string, MessageKey> = {
  animal: 'journal.entityAnimal',
  recommendation: 'journal.entityRecommendation',
  feedLot: 'journal.entityFeed',
  document: 'journal.entityDocument',
  operator: 'journal.entityOperator',
  signoff: 'journal.entitySignoff',
};

export function JournalPage() {
  const { t, i18n } = useTranslation();
  const { document } = useFarm();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const [type, setType] = useState<TypeFilter>('all');
  const [severity, setSeverity] = useState<Severity>('all');
  const [search, setSearch] = useState('');

  const events = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...(document?.auditEvents ?? [])]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .filter((event) => type === 'all' || event.type === type)
      .filter((event) => severity === 'all' || event.severity === severity)
      .filter((event) => {
        if (needle === '') return true;
        const summary = t(event.summary.key as MessageKey, event.summary.params);
        return summary.toLowerCase().includes(needle);
      });
  }, [document, type, severity, search, t]);

  const typeOptions: FilterOption<TypeFilter>[] = [
    { value: 'all', label: t('journal.allTypes') },
    ...AUDIT_EVENT_TYPES.map((value) => ({ value, label: t(TYPE_KEY[value]) })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('journal.kicker')}
        title={t('journal.title')}
        subtitle={t('journal.subtitle')}
        actions={<Badge tone="neutral">{t('journal.count', { count: events.length })}</Badge>}
      />

      <div className="ov-print-only border-b border-border pb-2">
        <p className="text-sm font-bold">{document?.settings.farmName}</p>
        <p className="text-xs">
          {document?.settings.region} · {document ? formatDate(document.updatedAt, locale) : null}
        </p>
      </div>

      <div className="ov-no-print flex flex-col gap-3">
        <FilterChips
          label={t('journal.filterType')}
          options={typeOptions}
          value={type}
          onChange={setType}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', t('journal.allSeverities')],
                ['info', t('journal.severityInfo')],
                ['warn', t('journal.severityWarn')],
                ['error', t('journal.severityError')],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={severity === value}
                onClick={() => setSeverity(value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-150',
                  severity === value
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute start-3 top-3 size-4 text-fg-subtle"
              aria-hidden="true"
            />
            <Input
              aria-label={t('journal.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('journal.search')}
              className="ps-9"
            />
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            document?.auditEvents.length === 0 ? t('journal.emptyTitle') : t('journal.noMatch')
          }
          body={document?.auditEvents.length === 0 ? t('journal.emptyBody') : undefined}
        />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>{t('journal.colDate')}</Th>
                <Th>{t('journal.colType')}</Th>
                <Th>{t('journal.colSummary')}</Th>
                <Th>{t('journal.colEntity')}</Th>
                <Th>{t('journal.colSeverity')}</Th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="transition-colors duration-150 hover:bg-surface-3/50">
                  <Td className="whitespace-nowrap text-xs text-fg-muted">
                    {formatDateTime(event.at, locale)}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-fg-muted">
                    {t(TYPE_KEY[event.type])}
                  </Td>
                  <Td className="text-fg">
                    {t(event.summary.key as MessageKey, event.summary.params)}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-fg-muted">
                    {event.entityType
                      ? t((ENTITY_KEY[event.entityType] ?? event.entityType) as MessageKey)
                      : '-'}
                  </Td>
                  <Td
                    className={cn(
                      'whitespace-nowrap text-xs font-semibold',
                      SEVERITY_CLASS[event.severity],
                    )}
                  >
                    {event.severity === 'info'
                      ? t('journal.severityInfo')
                      : event.severity === 'warn'
                        ? t('journal.severityWarn')
                        : t('journal.severityError')}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
