import { Award, CheckCircle2, CircleAlert, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/feedback';

const CRITERIA = [
  ['label.a1', 'label.a1now', 'label.a1need'],
  ['label.a2', 'label.a2now', 'label.a2need'],
  ['label.a3', 'label.a3now', 'label.a3need'],
  ['label.a4', 'label.a4now', 'label.a4need'],
] as const;

export function LabelPage() {
  const { t } = useTranslation();

  return (
    <div className="ov-page-enter space-y-5">
      <PageHeader
        kicker={t('label.kicker')}
        title={t('label.title')}
        subtitle={t('label.lead')}
        actions={<Badge tone="neutral">{t('common.demonstration')}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map(([title, now, need], index) => (
          <Card key={title} className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold text-fg-strong">
              <span className="grid size-6 place-items-center rounded-lg bg-accent/10 text-xs font-bold leading-none text-accent">
                {index + 1}
              </span>
              {t(title)}
            </p>
            <div className="flex gap-2 text-xs">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-fg-muted">{t(now)}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
              <p className="text-fg-muted">
                <span className="font-semibold text-warn">{t('label.needPrefix')}</span>
                {t(need)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Award className="size-4 text-accent" aria-hidden="true" />
            {t('label.equationTitle')}
          </h2>
          <p className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm font-medium text-fg">
            {t('label.equation')}
          </p>
          <p className="text-xs text-fg-muted">{t('label.note')}</p>
        </Card>

        <Card className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Scale className="size-4 text-warn" aria-hidden="true" />
            {t('label.outTitle')}
          </h2>
          <ul className="space-y-1 text-sm text-fg-muted">
            {(['label.out1', 'label.out2', 'label.out3', 'label.out4', 'label.out5'] as const).map(
              (key) => (
                <li key={key} className="flex gap-2">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warn"
                    aria-hidden="true"
                  />
                  <span>{t(key)}</span>
                </li>
              ),
            )}
          </ul>
        </Card>
      </div>

      <Notice tone="warn">{t('label.footer')}</Notice>
    </div>
  );
}
