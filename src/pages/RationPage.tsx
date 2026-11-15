import { CheckCheck, Printer, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { StatCard, KPI_GRID } from '@/components/ui/stat';
import { useToast } from '@/components/ui/toast-context';
import { buildRationSheet } from '@/domain';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { useFarm } from '@/store/use-farm';

export function RationPage() {
  const { t, i18n } = useTranslation();
  const { document, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const [servePen, setServePen] = useState<string | null>(null);

  const sheet = useMemo(
    () =>
      document
        ? buildRationSheet(document.animals, document.recommendations, document.feedLots)
        : null,
    [document],
  );

  if (!document || !sheet) return null;

  const canServe = document.operator.authority === 'production';

  const serve = async (pen: string): Promise<void> => {
    const result = await execute(() => services.farm.servePen(pen));
    setServePen(null);
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successServe'), 'success');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('ration.kicker')}
        title={t('ration.title')}
        subtitle={t('ration.subtitle')}
        actions={
          <Button variant="secondary" onClick={() => window.print()} className="ov-no-print">
            <Printer className="size-4" aria-hidden="true" />
            {t('ration.print')}
          </Button>
        }
      />

      <div className="ov-print-only border-b border-border pb-2">
        <p className="text-sm font-bold">{document.settings.farmName}</p>
        <p className="text-xs">
          {document.settings.region} · {formatDate(document.updatedAt, locale)}
        </p>
      </div>

      <div className={KPI_GRID}>
        <StatCard
          label={t('ration.forage')}
          value={formatNumber(sheet.forageKg, locale, 1)}
          unit={t('common.unitKg')}
        />
        <StatCard
          label={t('ration.concentrate')}
          value={formatNumber(sheet.concentrateKg, locale, 1)}
          unit={t('common.unitKg')}
        />
        <StatCard
          label={t('ration.water')}
          value={formatNumber(sheet.waterL, locale, 1)}
          unit={t('common.unitL')}
        />
        <StatCard
          label={t('ration.cost')}
          value={formatCurrency(sheet.cost, locale)}
          hint={t('ration.costNote')}
          tone="info"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center justify-between gap-2 p-4">
          <span className="text-xs font-semibold text-fg-muted">{t('ration.covered')}</span>
          <Badge tone="accent">
            {formatNumber(sheet.covered, locale)} / {formatNumber(sheet.total, locale)}
          </Badge>
        </Card>
        <Card className="flex items-center justify-between gap-2 p-4">
          <span className="text-xs font-semibold text-fg-muted">{t('ration.blocked')}</span>
          <Badge tone="warn">{formatNumber(sheet.blocked, locale)}</Badge>
        </Card>
        <Card className="flex items-center justify-between gap-2 p-4">
          <span className="text-xs font-semibold text-fg-muted">{t('ration.ready')}</span>
          <Badge tone="accent">{formatNumber(sheet.ready, locale)}</Badge>
        </Card>
      </div>

      <Notice tone="info">{t('ration.stockNote')}</Notice>

      {sheet.groups.length === 0 ? (
        <EmptyState icon={Utensils} title={t('ration.groupsEmpty')} body={t('herd.emptyBody')} />
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-fg-strong">{t('ration.groupsTitle')}</h2>
          {sheet.groups.map((group) => (
            <Card key={group.pen} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-fg-strong">
                    {t('common.pen')} {group.pen}
                  </h3>
                  <p className="text-xs text-fg-muted">
                    {t('ration.penTotals')}: {formatNumber(group.forageKg, locale, 1)}{' '}
                    {t('common.unitKg')} · {formatNumber(group.concentrateKg, locale, 1)}{' '}
                    {t('common.unitKg')} · {formatCurrency(group.cost, locale)}
                  </p>
                </div>
                <div className="ov-no-print flex flex-wrap items-center gap-2">
                  <Badge tone="accent">
                    {t('ration.ready')}: {formatNumber(group.ready, locale)}
                  </Badge>
                  {group.blocked > 0 ? (
                    <Badge tone="warn">
                      {t('ration.blocked')}: {formatNumber(group.blocked, locale)}
                    </Badge>
                  ) : null}
                  {canServe && group.ready > 0 ? (
                    <Button size="sm" onClick={() => setServePen(group.pen)} disabled={busy}>
                      <CheckCheck className="size-3.5" aria-hidden="true" />
                      {t('ration.servePen')}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="ov-micro border-b border-border text-fg-muted">
                      <th scope="col" className="px-3 py-2 text-start">
                        {t('ration.rowAnimal')}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t('ration.rowForage')}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t('ration.rowConcentrate')}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t('ration.rowMineral')}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t('ration.rowWater')}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t('ration.rowCost')}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t('ration.rowStatus')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.animal.id} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-2 font-medium text-fg">{row.animal.code}</td>
                        <td className="px-3 py-2 tabular-nums text-fg-muted">
                          {formatNumber(row.forageKg, locale, 1)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-fg-muted">
                          {formatNumber(row.concentrateKg, locale, 1)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-fg-muted">
                          {formatNumber(row.mineralG, locale)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-fg-muted">
                          {formatNumber(row.waterL, locale, 1)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-fg-muted">
                          {formatCurrency(row.cost, locale)}
                        </td>
                        <td className="px-3 py-2">
                          {row.served ? (
                            <Badge tone="neutral">{t('ration.served')}</Badge>
                          ) : row.approved ? (
                            <Badge tone="accent">{t('ration.ready')}</Badge>
                          ) : row.blocked ? (
                            <Badge tone="warn">{t('ration.blocked')}</Badge>
                          ) : (
                            <Badge tone="info">{t('animal.pending')}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={servePen !== null}
        onClose={() => setServePen(null)}
        title={t('ration.servePen')}
        description={
          servePen ? `${t('common.pen')} ${servePen} · ${t('ration.penReadyOnly')}` : undefined
        }
        closeLabel={t('common.close')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setServePen(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => (servePen ? void serve(servePen) : undefined)} disabled={busy}>
              {busy ? t('common.saving') : t('common.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{t('ration.stockNote')}</p>
      </Dialog>
    </div>
  );
}
