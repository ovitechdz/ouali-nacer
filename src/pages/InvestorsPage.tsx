import { Link } from '@tanstack/react-router';
import { BadgeCheck, CircleCheck, Printer, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/feedback';

const PILLARS = ['vision.pillar1', 'vision.pillar2', 'vision.pillar3', 'vision.pillar4'] as const;
const PROOF = [
  'invest.proof1',
  'invest.proof2',
  'invest.proof3',
  'invest.proof4',
  'invest.proof5',
] as const;

export function InvestorsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('invest.kicker')}
        title={t('invest.title')}
        subtitle={t('invest.lead')}
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            {t('invest.print')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((key) => (
          <Card key={key} className="space-y-2">
            <span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-accent">
              <BadgeCheck className="size-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-fg">{t(key)}</p>
            <p className="text-xs text-fg-muted">{t(`${key}Role`)}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="space-y-3">
          <h2 className="text-base font-bold text-fg-strong">{t('invest.proofTitle')}</h2>
          <ul className="space-y-2 text-sm text-fg-muted">
            {PROOF.map((key) => (
              <li key={key} className="flex gap-2">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          <Notice tone="warn">{t('invest.honestNote')}</Notice>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold text-fg-strong">{t('invest.labelTitle')}</h2>
          <p className="text-sm text-fg-muted">{t('invest.labelLead')}</p>
          <div className="grid gap-2">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
              <p className="text-xs font-semibold text-success">{t('invest.labelOk')}</p>
              <p className="mt-1 text-xs text-fg-muted">{t('invest.labelOkBody')}</p>
            </div>
            <div className="rounded-xl border border-warn/35 bg-warn/10 p-3">
              <p className="text-xs font-semibold text-warn">{t('invest.labelNext')}</p>
              <p className="mt-1 text-xs text-fg-muted">{t('invest.labelNextBody')}</p>
            </div>
          </div>
          <p className="text-[11px] text-fg-subtle">{t('invest.disclaimer')}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-bold text-fg-strong">{t('invest.roadmapTitle')}</h2>
        <ol className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ['vision.roadmap1', 'vision.roadmap1Body'],
              ['vision.roadmap2', 'vision.roadmap2Body'],
              ['vision.roadmap3', 'vision.roadmap3Body'],
            ] as const
          ).map(([title, body], index) => (
            <li key={title} className="rounded-xl border border-border bg-surface-3/50 p-3">
              <p className="text-xs font-bold text-accent">{index + 1}</p>
              <p className="mt-1 text-sm font-semibold text-fg">{t(title)}</p>
              <p className="text-xs text-fg-muted">{t(body)}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-bold text-fg-strong">{t('invest.contactTitle')}</h2>
        <p className="text-sm text-fg-muted">{t('invest.contactLead')}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/equipe"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-3 px-3 text-sm font-semibold text-fg hover:border-border-strong"
          >
            <Users className="size-4" aria-hidden="true" />
            {t('nav.team')}
          </Link>
        </div>
        <p className="text-xs text-fg-subtle">{t('invest.contactLine')}</p>
        <Badge tone="neutral">{t('invest.disclaimer')}</Badge>
      </Card>
    </div>
  );
}
