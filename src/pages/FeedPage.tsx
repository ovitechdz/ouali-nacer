import { PackagePlus, SlidersHorizontal, Wheat } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { Field, Input, Select } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat';
import { useToast } from '@/components/ui/toast-context';
import { Table, TableWrap, Td, Th } from '@/components/ui/table';
import { FEED_KINDS, type FeedKind } from '@/domain';
import type { MessageKey } from '@/i18n/messages';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { useFarm } from '@/store/use-farm';

const KIND_KEY: Record<FeedKind, MessageKey> = {
  fourrage: 'feed.kindFourrage',
  concentre: 'feed.kindConcentre',
  hybride: 'feed.kindHybride',
  mineral: 'feed.kindMineral',
};

export function FeedPage() {
  const { t, i18n } = useTranslation();
  const { document, kpis, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';

  const [addOpen, setAddOpen] = useState(false);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<FeedKind>('fourrage');
  const [stock, setStock] = useState('');
  const [cost, setCost] = useState('');
  const [origin, setOrigin] = useState('');
  const [available, setAvailable] = useState(true);
  const [newStock, setNewStock] = useState('');

  if (!document || !kpis) return null;

  const lots = [...document.feedLots].sort((a, b) => a.name.localeCompare(b.name));
  const totalStock = lots.reduce((sum, lot) => sum + lot.stockKg, 0);
  const low = kpis.coverDays !== null && kpis.coverDays < 7;
  const adjusting = lots.find((lot) => lot.id === adjustId) ?? null;

  const addLot = async (): Promise<void> => {
    if (name.trim() === '' || stock.trim() === '' || cost.trim() === '') return;
    const result = await execute(() =>
      services.farm.saveFeedLot({
        name: name.trim(),
        kind,
        stockKg: Number(stock),
        costPerKg: Number(cost),
        available,
        origin: origin.trim() || undefined,
      }),
    );
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('feed.success'), 'success');
    setAddOpen(false);
    setName('');
    setStock('');
    setCost('');
    setOrigin('');
  };

  const adjust = async (): Promise<void> => {
    if (!adjusting || newStock.trim() === '') return;
    const delta = Number(newStock) - adjusting.stockKg;
    const result = await execute(() => services.farm.adjustFeedStock(adjusting.id, delta));
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('feed.successAdjust'), 'success');
    setAdjustId(null);
    setNewStock('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('feed.kicker')}
        title={t('feed.title')}
        subtitle={t('feed.subtitle')}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <PackagePlus className="size-4" aria-hidden="true" />
            {t('feed.add')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('feed.lotCount')} count={lots.length} locale={locale} />
        <StatCard
          label={t('feed.totalStock')}
          count={Math.round(totalStock)}
          locale={locale}
          unit={t('common.unitKg')}
        />
        <StatCard
          label={t('feed.available')}
          count={lots.filter((lot) => lot.available).length}
          locale={locale}
        />
        <StatCard
          label={t('feed.daysLeft')}
          value={kpis.coverDays === null ? '—' : formatNumber(kpis.coverDays, locale)}
          count={kpis.coverDays === null ? null : Math.round(kpis.coverDays)}
          locale={locale}
          hint={t('feed.coverageBody')}
          tone={low ? 'warn' : 'accent'}
        />
      </div>

      {low ? (
        <Notice tone="warn" title={t('feed.lowTitle')}>
          {t('journee.taskStockBody')}
        </Notice>
      ) : null}

      {lots.length === 0 ? (
        <EmptyState icon={Wheat} title={t('feed.emptyTitle')} body={t('feed.emptyBody')} />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>{t('feed.colName')}</Th>
                <Th>{t('feed.colKind')}</Th>
                <Th>{t('feed.colStock')}</Th>
                <Th>{t('feed.colCost')}</Th>
                <Th>{t('feed.colOrigin')}</Th>
                <Th>{t('feed.colAvailable')}</Th>
                <Th>{t('feed.colUpdated')}</Th>
                <Th>{t('common.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id} className="last:[&>td]:border-0">
                  <Td className="font-semibold text-fg-strong">{lot.name}</Td>
                  <Td className="text-fg-muted">{t(KIND_KEY[lot.kind])}</Td>
                  <Td className="tabular-nums">
                    {formatNumber(lot.stockKg, locale)} {t('common.unitKg')}
                  </Td>
                  <Td className="tabular-nums text-fg-muted">
                    {formatCurrency(lot.costPerKg, locale)}
                  </Td>
                  <Td className="text-fg-muted">{lot.origin || '—'}</Td>
                  <Td>
                    {lot.available ? (
                      <Badge tone="accent">{t('feed.available')}</Badge>
                    ) : (
                      <Badge tone="warn">{t('feed.unavailable')}</Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-fg-muted">
                    {formatDate(lot.updatedAt, locale)}
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAdjustId(lot.id);
                        setNewStock(String(lot.stockKg));
                      }}
                    >
                      <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                      {t('feed.adjust')}
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <Card className="text-xs text-fg-muted">
        {t('feed.coverageBody')} · {t('ration.costNote')}
      </Card>
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('feed.addTitle')}
        description={t('feed.addBody')}
        closeLabel={t('common.close')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void addLot()} disabled={busy}>
              {busy ? t('common.saving') : t('feed.submit')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('feed.name')} htmlFor="lot-name" required>
            <Input
              id="lot-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label={t('feed.kind')} htmlFor="lot-kind">
            <Select
              id="lot-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as FeedKind)}
            >
              {FEED_KINDS.map((value) => (
                <option key={value} value={value}>
                  {t(KIND_KEY[value])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('feed.stockKg')} htmlFor="lot-stock" required>
            <Input
              id="lot-stock"
              inputMode="decimal"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
            />
          </Field>
          <Field label={t('feed.costPerKg')} htmlFor="lot-cost" required>
            <Input
              id="lot-cost"
              inputMode="decimal"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
            />
          </Field>
          <Field label={t('feed.origin')} htmlFor="lot-origin" hint={t('common.optional')}>
            <Input
              id="lot-origin"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              maxLength={120}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
              className="size-4 rounded border-border bg-surface-3 text-accent"
            />
            {t('feed.availableToggle')}
          </label>
        </div>
      </Dialog>

      <Dialog
        open={adjusting !== null}
        onClose={() => setAdjustId(null)}
        title={adjusting ? t('feed.adjustTitle', { name: adjusting.name }) : t('feed.adjust')}
        description={t('feed.adjustBody')}
        closeLabel={t('common.close')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustId(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void adjust()} disabled={busy}>
              {busy ? t('common.saving') : t('feed.saveAdjust')}
            </Button>
          </>
        }
      >
        <Field label={t('feed.newStock')} htmlFor="lot-new-stock">
          <Input
            id="lot-new-stock"
            inputMode="decimal"
            value={newStock}
            onChange={(event) => setNewStock(event.target.value)}
          />
        </Field>
      </Dialog>
    </div>
  );
}
