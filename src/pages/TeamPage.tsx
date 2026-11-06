import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/**
 * Phase 3 placeholder. The full style-site `/equipe` page (statistics strip,
 * department filter, member cards, dialogs) is implemented in phase 4 from
 * docs/team-page-source/. No member or contact data is invented here.
 */
export function TeamPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('team.title')}
        subtitle={t('team.subtitle')}
        actions={<Badge tone="team">{t('app.phase')}</Badge>}
      />

      <Card className="flex flex-col items-start gap-4 py-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-team/10 text-team">
          <Users className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-fg-strong">{t('team.placeholderTitle')}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">
          {t('team.placeholderBody')}
        </p>
      </Card>
    </div>
  );
}
