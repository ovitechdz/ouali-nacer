import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  FlaskConical,
  ScanLine,
  Users,
  Utensils,
  Wheat,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NAV_GROUPS } from '@/app/shell/nav-items';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/feedback';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { StatCard, KPI_GRID } from '@/components/ui/stat';
import type { MessageKey } from '@/i18n/messages';
import { cn } from '@/lib/cn';
import { useGsapReveal } from '@/motion/use-gsap-reveal';
import { useFarm } from '@/store/use-farm';

const WORKFLOW = [
  'home.workflowStep1',
  'home.workflowStep2',
  'home.workflowStep3',
  'home.workflowStep4',
  'home.workflowStep5',
] as const;
const WORKFLOW_BODY = [
  'home.workflowStep1Body',
  'home.workflowStep2Body',
  'home.workflowStep3Body',
  'home.workflowStep4Body',
  'home.workflowStep5Body',
] as const;

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { kpis, rows } = useFarm();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const Arrow = i18n.dir() === 'rtl' ? ArrowLeft : ArrowRight;

  const alerts = rows.filter((row) => row.health.status === 'alerte').length;
  const ready = rows.filter((row) => row.rec?.approvedBy && !row.rec.servedAt).length;
  const reveal = useGsapReveal<HTMLDivElement>({ stagger: 0.06, scroll: true });

  return (
    <div ref={reveal} className="space-y-6">
      <SpotlightCard data-reveal className="overflow-hidden rounded-3xl p-5 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="ov-micro text-accent">{t('home.kicker')}</p>
            <h1 className="mt-2 text-3xl font-bold text-fg-strong sm:text-4xl">
              {t('home.title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
              {t('home.subtitle')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/scan"
                className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-accent-strong px-4 text-sm font-semibold text-accent-contrast transition-colors duration-[var(--duration-quick)] ease-out hover:bg-accent"
              >
                <ScanLine className="size-4" aria-hidden="true" />
                {t('home.ctaScan')}
              </Link>
              <Link
                to="/troupeau"
                className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-border bg-surface-3 px-4 text-sm font-semibold text-fg transition-colors duration-[var(--duration-quick)] ease-out hover:border-border-strong hover:bg-surface-2"
              >
                <Users className="size-4" aria-hidden="true" />
                {t('home.ctaHerd')}
              </Link>
            </div>
            <p className="mt-4 text-xs text-fg-subtle">{t('home.offlineNote')}</p>
          </div>

          <div className={cn(KPI_GRID, 'lg:grid-cols-2')}>
            <StatCard
              label={t('home.kpiHerd')}
              count={rows.length}
              locale={locale}
              unit={t('common.unitHead')}
              icon={Users}
              tone="accent"
            />
            <StatCard
              label={t('home.kpiAlerts')}
              count={alerts}
              locale={locale}
              icon={FlaskConical}
              tone={alerts > 0 ? 'warn' : 'neutral'}
            />
            <StatCard
              label={t('home.kpiRations')}
              count={ready}
              locale={locale}
              icon={Utensils}
              tone={ready > 0 ? 'accent' : 'neutral'}
            />
            <StatCard
              label={t('home.kpiStock')}
              count={Math.round(kpis?.forageStockKg ?? 0)}
              locale={locale}
              unit={t('common.unitKg')}
              icon={Wheat}
            />
          </div>
        </div>
      </SpotlightCard>

      <section aria-labelledby="home-modules" className="space-y-3">
        <div>
          <h2 id="home-modules" className="text-base font-bold text-fg-strong">
            {t('home.modulesTitle')}
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">{t('home.modulesBody')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {NAV_GROUPS.map((group) => {
            const first = group.items[0];
            if (!first) return null;
            const Icon = first.icon;
            return (
              <Link
                key={group.id}
                to={group.items[0]?.to ?? '/'}
                data-reveal
                className="group block"
              >
                <Card className="flex h-full flex-col gap-2 transition-colors duration-[var(--duration-quick)] ease-out group-hover:border-border-strong group-hover:bg-surface-3/60">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-fg-strong">
                    {t(group.labelKey)}
                    <Arrow className="size-4 text-fg-subtle" aria-hidden="true" />
                  </span>
                  <span className="text-xs leading-relaxed text-fg-muted">
                    {group.items.map((item) => t(item.labelKey)).join(' · ')}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="home-workflow"
        data-reveal
        className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"
      >
        <Card className="space-y-3">
          <h2 id="home-workflow" className="text-base font-bold text-fg-strong">
            {t('home.workflowTitle')}
          </h2>
          <ol className="space-y-3">
            {WORKFLOW.map((key, index) => (
              <li key={key} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-bold leading-none text-accent">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{t(key)}</p>
                  <p className="text-xs leading-relaxed text-fg-muted">
                    {t(WORKFLOW_BODY[index] as MessageKey)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-3">
          <Notice tone="info" title={t('home.honestyTitle')}>
            {t('home.honestyBody')}
          </Notice>
          <Card className="space-y-2 text-sm text-fg-muted">
            <p className="flex items-center gap-2">
              <CircleCheck className="size-4 text-accent" aria-hidden="true" />
              {t('home.tierCss')}
            </p>
            <p className="flex items-center gap-2">
              <CircleCheck className="size-4 text-accent" aria-hidden="true" />
              {t('home.tierGzip')}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge tone="accent">{t('common.demonstration')}</Badge>
              <Badge tone="neutral">{t('app.phase')}</Badge>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
