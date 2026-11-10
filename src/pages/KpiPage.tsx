import { Activity, CircleAlert, HeartPulse, Scale, Utensils, Wheat } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts';
import { EmptyState } from '@/components/ui/feedback';
import { ProgressBar, StatCard } from '@/components/ui/stat';
import { FEED_KINDS, type FeedKind } from '@/domain';
import type { MessageKey } from '@/i18n/messages';
import { formatDate, formatNumber } from '@/lib/format';
import { useGsapReveal } from '@/motion/use-gsap-reveal';
import { useFarm } from '@/store/use-farm';

const KIND_KEY: Record<FeedKind, MessageKey> = {
  fourrage: 'feed.kindFourrage',
  concentre: 'feed.kindConcentre',
  hybride: 'feed.kindHybride',
  mineral: 'feed.kindMineral',
};

export function KpiPage() {
  const { t, i18n } = useTranslation();
  const { document, rows, kpis } = useFarm();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const reveal = useGsapReveal<HTMLDivElement>({ stagger: 0.08 });

  const weightSeries = useMemo(() => {
    if (!document) return { points: [] as number[], labels: [] as string[] };
    const byDay = new Map<string, { sum: number; count: number }>();
    for (const record of document.weights) {
      const day = record.at.slice(0, 10);
      const entry = byDay.get(day) ?? { sum: 0, count: 0 };
      entry.sum += record.kg;
      entry.count += 1;
      byDay.set(day, entry);
    }
    const ordered = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, entry]) => ({ day, mean: entry.sum / entry.count }));
    return {
      points: ordered.map((entry) => Math.round(entry.mean * 10) / 10),
      labels: ordered.map((entry) => formatDate(`${entry.day}T00:00:00.000Z`, locale)),
    };
  }, [document, locale]);

  if (!document || !kpis) return null;

  const stageCounts = new Map<string, number>();
  const penCounts = new Map<string, number>();
  for (const row of rows) {
    stageCounts.set(row.animal.stage, (stageCounts.get(row.animal.stage) ?? 0) + 1);
    penCounts.set(row.animal.pen, (penCounts.get(row.animal.pen) ?? 0) + 1);
  }
  const health = {
    ok: rows.filter((row) => row.health.status === 'ok').length,
    suivi: rows.filter((row) => row.health.status === 'suivi').length,
    alerte: rows.filter((row) => row.health.status === 'alerte').length,
  };
  const feedByKind = FEED_KINDS.map((kind) => ({
    kind,
    stock: document.feedLots
      .filter((lot) => lot.kind === kind)
      .reduce((sum, lot) => sum + lot.stockKg, 0),
  })).filter((entry) => entry.stock > 0);
  const maxFeed = Math.max(1, ...feedByKind.map((entry) => entry.stock));

  return (
    <div ref={reveal} className="space-y-5">
      <PageHeader kicker={t('kpi.kicker')} title={t('kpi.title')} subtitle={t('kpi.subtitle')} />

      <div data-reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('kpi.herdSize')}
          value={formatNumber(rows.length, locale)}
          unit={t('common.unitHead')}
          icon={Scale}
          tone="accent"
        />
        <StatCard
          label={t('kpi.alerts')}
          value={formatNumber(health.alerte, locale)}
          icon={CircleAlert}
          tone={health.alerte > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label={t('kpi.avgAdg')}
          value={formatNumber(kpis.meanAdgKg * 1000, locale)}
          unit={`${t('common.unitG')}/${t('common.unitDay')}`}
          icon={Activity}
        />
        <StatCard
          label={t('kpi.rationCoverage')}
          value={formatNumber(kpis.dataDrivenPct, locale)}
          unit={t('common.unitPercent')}
          icon={Utensils}
          tone="accent"
        />
        <StatCard
          label={t('kpi.feedDays')}
          value={kpis.coverDays === null ? '—' : formatNumber(kpis.coverDays, locale)}
          unit={t('common.unitDay')}
          icon={Wheat}
          tone={kpis.coverDays !== null && kpis.coverDays < 7 ? 'warn' : 'neutral'}
        />
        <StatCard
          label={t('kpi.freshness')}
          value={formatNumber(
            Math.round(((rows.length - kpis.staleScanCount) / Math.max(1, rows.length)) * 100),
            locale,
          )}
          unit={t('common.unitPercent')}
          icon={HeartPulse}
        />
        <StatCard
          label={t('kpi.lowBcs')}
          value={formatNumber(kpis.lowBcsCount, locale)}
          tone={kpis.lowBcsCount > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label={t('kpi.missingWeights')}
          value={formatNumber(kpis.missingWeightCount, locale)}
          tone={kpis.missingWeightCount > 0 ? 'warn' : 'neutral'}
        />
      </div>

      <div data-reveal className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-fg-strong">{t('kpi.weightTitle')}</h2>
            <p className="text-xs text-fg-muted">{t('kpi.weightBody')}</p>
          </div>
          {weightSeries.points.length < 2 ? (
            <EmptyState title={t('kpi.weightEmpty')} />
          ) : (
            <LineChart
              summary={t('kpi.weightChart')}
              series={[
                {
                  id: 'weight',
                  label: t('common.weight'),
                  points: weightSeries.points,
                  tone: 'text-accent',
                },
              ]}
              labels={weightSeries.labels}
              yFormat={(value) => `${Math.round(value)}`}
            />
          )}
        </Card>

        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-fg-strong">{t('kpi.healthTitle')}</h2>
            <p className="text-xs text-fg-muted">{t('kpi.healthBody')}</p>
          </div>
          <div className="space-y-3">
            <ProgressBar
              label={t('domain.health.ok')}
              value={health.ok}
              max={Math.max(1, rows.length)}
              tone="accent"
            />
            <ProgressBar
              label={t('domain.health.suivi')}
              value={health.suivi}
              max={Math.max(1, rows.length)}
              tone="warn"
            />
            <ProgressBar
              label={t('domain.health.alerte')}
              value={health.alerte}
              max={Math.max(1, rows.length)}
              tone="danger"
            />
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-fg-muted">{t('kpi.byPen')}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {[...penCounts.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([pen, count]) => (
                  <li key={pen} className="flex items-center justify-between gap-2">
                    <span className="text-fg-muted">{pen}</span>
                    <span className="tabular-nums font-semibold text-fg">
                      {formatNumber(count, locale)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-fg-strong">{t('kpi.herdTitle')}</h2>
            <p className="text-xs text-fg-muted">{t('kpi.herdBody')}</p>
          </div>
          <div className="space-y-2">
            {[...stageCounts.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([stage, count]) => (
                <ProgressBar
                  key={stage}
                  label={t(`domain.stage.${stage}` as MessageKey)}
                  value={count}
                  max={Math.max(1, rows.length)}
                  display={`${formatNumber(count, locale)}`}
                />
              ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-fg-strong">{t('kpi.feedTitle')}</h2>
            <p className="text-xs text-fg-muted">{t('kpi.feedBody')}</p>
          </div>
          {feedByKind.length === 0 ? (
            <EmptyState title={t('kpi.feedEmpty')} />
          ) : (
            <div className="space-y-2">
              {feedByKind.map((entry) => (
                <ProgressBar
                  key={entry.kind}
                  label={t(KIND_KEY[entry.kind])}
                  value={entry.stock}
                  max={maxFeed}
                  display={`${formatNumber(entry.stock, locale)} ${t('common.unitKg')}`}
                  tone="info"
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <p className="text-[11px] text-fg-subtle">{t('kpi.targetNote')}</p>
    </div>
  );
}
