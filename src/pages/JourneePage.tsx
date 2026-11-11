import { Link } from '@tanstack/react-router';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Scale,
  ScanLine,
  Utensils,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { Gauge } from '@/components/ui/stat';
import type { MessageKey } from '@/i18n/messages';
import { cn } from '@/lib/cn';
import { formatDate, formatNumber } from '@/lib/format';
import { useFarm } from '@/store/use-farm';

interface Task {
  key: MessageKey;
  bodyKey: MessageKey;
  count: number;
  to: '/troupeau' | '/sante' | '/ration' | '/fourrage';
  icon: LucideIcon;
  tone: 'warn' | 'danger' | 'accent' | 'info';
}

export function Journee() {
  const { t, i18n } = useTranslation();
  const { document, now, rows, kpis } = useFarm();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const Chevron = i18n.dir() === 'rtl' ? ChevronLeft : ChevronRight;

  if (!document || !kpis) return null;

  const alerts = rows.filter((row) => row.health.status === 'alerte').length;
  const ready = document.recommendations.filter(
    (rec) => rec.approvedBy !== null && rec.servedAt === null && rec.ration !== null,
  ).length;
  const freshness = Math.round(
    ((rows.length - kpis.staleScanCount) / Math.max(1, rows.length)) * 100,
  );

  const tasks: Task[] = [
    {
      key: 'journee.taskWeigh',
      bodyKey: 'journee.taskWeighBody',
      count: kpis.staleScanCount,
      to: '/troupeau',
      icon: Scale,
      tone: 'info',
    },
    {
      key: 'journee.taskHealth',
      bodyKey: 'journee.taskHealthBody',
      count: alerts,
      to: '/sante',
      icon: CircleAlert,
      tone: 'danger',
    },
    {
      key: 'journee.taskRations',
      bodyKey: 'journee.taskRationsBody',
      count: ready,
      to: '/ration',
      icon: Utensils,
      tone: 'accent',
    },
    {
      key: 'journee.taskStock',
      bodyKey: 'journee.taskStockBody',
      count: kpis.coverDays !== null && kpis.coverDays < 7 ? 1 : 0,
      to: '/fourrage',
      icon: Wheat,
      tone: 'warn',
    },
  ];

  const pending = tasks.filter((task) => task.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t('journee.kicker')}
        title={t('journee.title')}
        subtitle={`${formatDate(now.toISOString(), locale)} · ${t('journee.subtitle')}`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Gauge
          label={t('journee.freshness')}
          value={freshness}
          display={`${formatNumber(freshness, locale)} %`}
          hint={t('journee.freshnessBody')}
          tone={freshness >= 70 ? 'accent' : freshness >= 40 ? 'warn' : 'danger'}
        />
        <Card className="space-y-1">
          <p className="text-xs font-semibold text-fg-muted">{t('journee.stale')}</p>
          <p className="text-2xl font-bold tabular-nums text-fg-strong">
            {formatNumber(kpis.staleScanCount, locale)}
          </p>
          <p className="text-xs text-fg-muted">{t('journee.taskWeighBody')}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-semibold text-fg-muted">{t('journee.missingWeight')}</p>
          <p className="text-2xl font-bold tabular-nums text-fg-strong">
            {formatNumber(kpis.missingWeightCount, locale)}
          </p>
          <p className="text-xs text-fg-muted">
            {t('journee.lowBcs')} · {formatNumber(kpis.lowBcsCount, locale)}
          </p>
        </Card>
      </div>

      <section aria-labelledby="journee-tasks" className="space-y-3">
        <div>
          <h2 id="journee-tasks" className="text-base font-bold text-fg-strong">
            {t('journee.tasksTitle')}
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">{t('journee.tasksBody')}</p>
        </div>

        {pending.length === 0 ? (
          <EmptyState title={t('journee.noTasks')} body={t('journee.demoNote')} />
        ) : (
          <ul className="ov-stagger grid gap-3 sm:grid-cols-2">
            {pending.map((task) => {
              const Icon = task.icon;
              return (
                <li key={task.key}>
                  <Link
                    to={task.to}
                    className="flex h-full items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4 transition-colors duration-150 hover:border-border-strong hover:bg-surface-3/60"
                  >
                    <span
                      className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-xl',
                        task.tone === 'danger' && 'bg-danger/10 text-danger',
                        task.tone === 'warn' && 'bg-warn/10 text-warn',
                        task.tone === 'accent' && 'bg-accent/10 text-accent',
                        task.tone === 'info' && 'bg-info/10 text-info',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-fg-strong">{t(task.key)}</span>
                        <span className="text-lg font-bold tabular-nums text-fg-strong">
                          {formatNumber(task.count, locale)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">
                        {t(task.bodyKey)}
                      </span>
                    </span>
                    <Chevron className="mt-1 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="journee-quick" className="space-y-3">
        <h2 id="journee-quick" className="text-base font-bold text-fg-strong">
          {t('journee.quickTitle')}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/scan' as const, label: t('journee.quickScan'), icon: ScanLine },
            { to: '/troupeau' as const, label: t('journee.quickWeigh'), icon: Scale },
            { to: '/ration' as const, label: t('journee.quickRation'), icon: Utensils },
            { to: '/journal' as const, label: t('journee.quickJournal'), icon: BookOpen },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-border-strong hover:bg-surface-3"
              >
                <Icon className="size-4 text-accent" aria-hidden="true" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>

      <Notice tone="info">{t('journee.demoNote')}</Notice>
    </div>
  );
}
