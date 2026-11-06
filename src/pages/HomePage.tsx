import { Languages, Layers3, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const CARDS = [
  {
    icon: WifiOff,
    titleKey: 'home.cardOfflineTitle',
    bodyKey: 'home.cardOfflineBody',
    iconClass: 'bg-accent/10 text-accent',
  },
  {
    icon: Languages,
    titleKey: 'home.cardArabicTitle',
    bodyKey: 'home.cardArabicBody',
    iconClass: 'bg-info/10 text-info',
  },
  {
    icon: Layers3,
    titleKey: 'home.cardLayersTitle',
    bodyKey: 'home.cardLayersBody',
    iconClass: 'bg-team/10 text-team',
  },
] as const;

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('home.title')}
        subtitle={t('home.subtitle')}
        actions={<Badge tone="accent">{t('app.phase')}</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.titleKey} className="flex flex-col gap-3">
              <span className={`grid size-10 place-items-center rounded-xl ${card.iconClass}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-base font-semibold text-fg-strong">{t(card.titleKey)}</h2>
              <p className="text-sm leading-relaxed text-fg-muted">{t(card.bodyKey)}</p>
            </Card>
          );
        })}
      </div>

      <Card className="border-accent/30 bg-accent/5">
        <h2 className="text-base font-semibold text-fg-strong">{t('home.phaseTitle')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">
          {t('home.phaseBody')}
        </p>
      </Card>
    </div>
  );
}
