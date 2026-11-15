import { CheckCircle2, CircleDot, Compass, Route, ShieldQuestion, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/feedback';

const PILLARS = [
  ['vision.pillar1', 'vision.pillar1Role'],
  ['vision.pillar2', 'vision.pillar2Role'],
  ['vision.pillar3', 'vision.pillar3Role'],
  ['vision.pillar4', 'vision.pillar4Role'],
] as const;

const PLATFORM = [
  'vision.platform1',
  'vision.platform2',
  'vision.platform3',
  'vision.platform4',
  'vision.platform5',
  'vision.platform6',
] as const;

const DECISIONS = [
  'vision.decision1',
  'vision.decision2',
  'vision.decision3',
  'vision.decision4',
  'vision.decision5',
  'vision.decision6',
] as const;

const ROADMAP = [
  ['vision.roadmap1', 'vision.roadmap1Body'],
  ['vision.roadmap2', 'vision.roadmap2Body'],
  ['vision.roadmap3', 'vision.roadmap3Body'],
] as const;

export function VisionPage() {
  const { t } = useTranslation();

  return (
    <div className="ov-page-enter space-y-5">
      <PageHeader
        kicker={t('vision.kicker')}
        title={t('vision.title')}
        subtitle={t('vision.lead')}
        actions={<Badge tone="neutral">{t('app.phase')}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Compass className="size-4 text-accent" aria-hidden="true" />
            {t('vision.platformTitle')}
          </h2>
          <p className="text-sm text-fg-muted">{t('vision.platformBody')}</p>
          <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
            {PLATFORM.map((key) => (
              <li key={key} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Sparkles className="size-4 text-accent" aria-hidden="true" />
            {t('vision.pillarsTitle')}
          </h2>
          <ul className="space-y-2">
            {PILLARS.map(([name, role], index) => (
              <li key={name} className="rounded-xl border border-border bg-surface-3/50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <span className="grid size-5 place-items-center rounded-full bg-accent/15 text-xs font-bold leading-none text-accent">
                    {index + 1}
                  </span>
                  {t(name)}
                </p>
                <p className="mt-1 text-xs text-fg-muted">{t(role)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
          <CircleDot className="size-4 text-accent" aria-hidden="true" />
          {t('vision.decisionsTitle')}
        </h2>
        <ul className="grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
          {DECISIONS.map((key) => (
            <li key={key} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Route className="size-4 text-accent" aria-hidden="true" />
            {t('vision.roadmapTitle')}
          </h2>
          <ol className="space-y-3">
            {ROADMAP.map(([title, body], index) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-bold leading-none text-accent">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">{t(title)}</p>
                  <p className="text-xs text-fg-muted">{t(body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-3">
          <Notice tone="info" title={t('vision.equationTitle')}>
            {t('vision.equation')}
          </Notice>
          <Card className="space-y-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
              <ShieldQuestion className="size-4 text-warn" aria-hidden="true" />
              {t('vision.outTitle')}
            </h2>
            <ul className="space-y-1 text-sm text-fg-muted">
              {(
                ['vision.out1', 'vision.out2', 'vision.out3', 'vision.out4', 'vision.out5'] as const
              ).map((key) => (
                <li key={key} className="flex gap-2">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warn"
                    aria-hidden="true"
                  />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-fg-subtle">{t('vision.footer')}</p>
    </div>
  );
}
