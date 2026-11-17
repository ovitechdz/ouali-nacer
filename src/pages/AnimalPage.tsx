import { Link, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  FlaskConical,
  HeartPulse,
  MoveRight,
  Scale,
  Utensils,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkline } from '@/components/ui/charts';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-context';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import type { MessageKey } from '@/i18n/messages';
import { useFarm } from '@/store/use-farm';

type Action = 'weight' | 'move' | 'health' | null;

export function AnimalPage() {
  const { t, i18n } = useTranslation();
  const params = useParams({ strict: false }) as { id?: string };
  const { document, rows, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const Back = i18n.dir() === 'rtl' ? ArrowRight : ArrowLeft;

  const [action, setAction] = useState<Action>(null);
  const [serveOpen, setServeOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [bcs, setBcs] = useState('');
  const [note, setNote] = useState('');
  const [pen, setPen] = useState('');
  const [healthType, setHealthType] = useState<
    'examen' | 'traitement' | 'vaccination' | 'naissance' | 'observation'
  >('observation');
  const [severity, setSeverity] = useState<'info' | 'suivi' | 'alerte'>('info');

  const row = rows.find((entry) => entry.animal.id === params.id) ?? null;
  const animal = row?.animal ?? null;

  const weights =
    animal && document
      ? document.weights
          .filter((record) => record.animalId === animal.id)
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      : [];
  const rec = row?.rec ?? null;

  if (!animal || !document) {
    return (
      <EmptyState
        title={t('animal.notFound')}
        body={t('herd.emptyBody')}
        action={
          <Link
            to="/troupeau"
            className="inline-flex h-9 items-center rounded-xl border border-border bg-surface-3 px-3 text-sm font-semibold text-fg"
          >
            {t('common.back')}
          </Link>
        }
      />
    );
  }

  const pens = document.settings.pens.filter((entry) => entry !== animal.pen);
  const close = (): void => {
    setAction(null);
    setNote('');
  };

  const submitWeight = async (): Promise<void> => {
    const result = await execute(() =>
      services.farm.recordWeight({
        animalId: animal.id,
        weight: weight.trim() === '' ? '' : Number(weight),
        bcs: bcs.trim() === '' ? '' : Number(bcs),
        note: note.trim() || undefined,
      }),
    );
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successWeight'), 'success');
    setWeight('');
    setBcs('');
    close();
  };

  const submitMove = async (): Promise<void> => {
    if (pen === '') return;
    const result = await execute(() => services.farm.moveAnimal(animal.id, pen));
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successMove'), 'success');
    close();
  };

  const submitHealth = async (): Promise<void> => {
    const result = await execute(() =>
      services.farm.recordHealthEvent({
        animalId: animal.id,
        type: healthType,
        severity,
        note: note.trim() || undefined,
      }),
    );
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successHealth'), 'success');
    close();
  };

  const runEngine = async (): Promise<void> => {
    const result = await execute(() => services.farm.runEngine(animal.id));
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successRec'), 'success');
  };

  const approve = async (): Promise<void> => {
    if (!rec) return;
    const result = await execute(() => services.farm.approve(rec.id));
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successApprove'), 'success');
  };

  const serve = async (): Promise<void> => {
    if (!rec) return;
    const result = await execute(() => services.farm.serve(rec.id));
    setServeOpen(false);
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('animal.successServe'), 'success');
  };

  const canApprove =
    document.operator.authority === 'production' &&
    rec !== null &&
    rec.approvedBy === null &&
    rec.ration !== null;
  const canServe =
    document.operator.authority === 'production' &&
    rec !== null &&
    rec.approvedBy !== null &&
    rec.servedAt === null &&
    rec.ration !== null;

  return (
    <div className="space-y-5">
      <Link
        to="/troupeau"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-fg"
      >
        <Back className="size-3.5" aria-hidden="true" />
        {t('nav.troupeau')}
      </Link>

      <PageHeader
        kicker={t('animal.kicker')}
        title={t('animal.title', { code: animal.code })}
        subtitle={`${animal.rfid} · ${t(`domain.stage.${animal.stage}`)} · ${animal.pen}`}
        actions={
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
              row?.health.status === 'alerte'
                ? 'border-danger/40 bg-danger/10 text-danger'
                : row?.health.status === 'suivi'
                  ? 'border-warn/40 bg-warn/10 text-warn'
                  : 'border-accent/30 bg-accent/10 text-success',
            )}
          >
            {t(`domain.health.${row?.health.status ?? 'ok'}`)}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-fg-strong">{t('animal.identity')}</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              [t('animal.born'), formatDate(animal.birthDate, locale)],
              [t('animal.breed'), animal.breed],
              [t('animal.sex'), animal.sex === 'M' ? t('herd.sexMale') : t('herd.sexFemale')],
              [t('animal.stage'), t(`domain.stage.${animal.stage}`)],
              [t('animal.pen'), animal.pen],
              [t('animal.lastScan'), formatDate(animal.lastScanAt, locale)],
              [
                t('common.weight'),
                animal.weightKg != null
                  ? `${formatNumber(animal.weightKg, locale, 1)} ${t('common.unitKg')}`
                  : '—',
              ],
              [t('common.bcs'), animal.bcs != null ? formatNumber(animal.bcs, locale, 1) : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="ov-micro text-fg-muted">{label}</dt>
                <dd className="mt-0.5 text-fg">{value}</dd>
              </div>
            ))}
          </dl>
          {animal.notes ? (
            <p className="rounded-xl border border-border bg-surface-3/60 p-3 text-xs text-fg-muted">
              {animal.notes}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-fg-strong">{t('animal.healthTitle')}</h2>
            <HeartPulse className="size-4 text-accent" aria-hidden="true" />
          </div>
          <p className="text-xs text-fg-muted">{t('animal.healthBody')}</p>
          <div className="flex flex-wrap gap-2">
            {row && row.health.signals.length > 0 ? (
              row.health.signals.map((signal) => (
                <Badge key={signal.id} tone={signal.level === 'alerte' ? 'warn' : 'info'}>
                  {t(`domain.signal.${signal.id}`)} · {t(`domain.health.${signal.level}`)}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-fg-muted">{t('animal.noSignals')}</span>
            )}
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-fg-muted">{t('animal.weightsTitle')}</p>
              {weights.length >= 2 ? (
                <Sparkline
                  points={[...weights].reverse().map((record) => record.kg)}
                  summary={t('animal.weightsTitle')}
                />
              ) : null}
            </div>
            {weights.length === 0 ? (
              <p className="mt-1 text-sm text-fg-muted">{t('animal.noWeights')}</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {weights.slice(0, 5).map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3">
                    <span className="text-fg-muted">{formatDateTime(record.at, locale)}</span>
                    <span className="tabular-nums font-semibold text-fg">
                      {formatNumber(record.kg, locale, 1)} {t('common.unitKg')}
                      {record.bcs != null ? (
                        <span className="ms-2 text-xs text-fg-muted">· {record.bcs}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-fg-strong">{t('animal.recTitle')}</h2>
            <p className="text-xs text-fg-muted">{t('animal.recBody')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rec?.approvedBy === null && rec?.ration !== null ? (
              <Badge tone="info">{t('animal.pending')}</Badge>
            ) : rec?.servedAt ? (
              <Badge tone="accent">{t('animal.served')}</Badge>
            ) : rec?.approvedBy ? (
              <Badge tone="accent">{t('animal.approved')}</Badge>
            ) : rec?.ration === null ? (
              <Badge tone="warn">{t('nutrition.refusedTitle')}</Badge>
            ) : null}
            {rec ? (
              <Badge tone="neutral">
                {t('animal.confidence')}: {t(`domain.confidence.${rec.confidence}`)}
              </Badge>
            ) : null}
          </div>
        </div>

        {rec === null ? (
          <Notice tone="info">{t('animal.noRec')}</Notice>
        ) : rec.ration === null ? (
          <Notice tone="warn" title={t('nutrition.refusedTitle')}>
            {rec.missingInputs
              .map((input) => t(input.key as MessageKey, input.params))
              .join(' · ') || t('nutrition.refusedBody')}
          </Notice>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                t('nutrition.forage'),
                `${formatNumber(rec.ration.forageKg, locale, 1)} ${t('common.unitKg')}`,
              ],
              [
                t('nutrition.concentrate'),
                `${formatNumber(rec.ration.concentrateKg, locale, 1)} ${t('common.unitKg')}`,
              ],
              [
                t('nutrition.mineral'),
                `${formatNumber(rec.ration.mineralG, locale)} ${t('common.unitG')}`,
              ],
              [
                t('nutrition.water'),
                `${formatNumber(rec.ration.waterL, locale, 1)} ${t('common.unitL')}`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-surface-3/50 p-3">
                <p className="ov-micro text-fg-muted">{label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-fg-strong">{value}</p>
              </div>
            ))}
          </div>
        )}

        {rec && rec.evidence.length > 0 ? (
          <details className="rounded-xl border border-border bg-surface-3/40 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-fg-muted">
              {t('animal.evidence')} ({rec.evidence.length})
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-fg-muted">
              {rec.evidence.map((item, index) => (
                <li key={`${item.key}-${index}`}>{t(item.key as MessageKey, item.params)}</li>
              ))}
            </ul>
          </details>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button variant="secondary" size="sm" onClick={() => setAction('weight')}>
            <Scale className="size-3.5" aria-hidden="true" />
            {t('animal.recordWeight')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPen(pens[0] ?? '');
              setAction('move');
            }}
          >
            <MoveRight className="size-3.5" aria-hidden="true" />
            {t('animal.move')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAction('health')}>
            <HeartPulse className="size-3.5" aria-hidden="true" />
            {t('animal.recordHealth')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void runEngine()} disabled={busy}>
            <FlaskConical className="size-3.5" aria-hidden="true" />
            {t('animal.newRec')}
          </Button>
          {canApprove ? (
            <Button size="sm" onClick={() => void approve()} disabled={busy}>
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              {t('animal.approve')}
            </Button>
          ) : null}
          {canServe ? (
            <Button size="sm" onClick={() => setServeOpen(true)} disabled={busy}>
              <Utensils className="size-3.5" aria-hidden="true" />
              {t('animal.serve')}
            </Button>
          ) : null}
        </div>
        {document.operator.authority !== 'production' ? (
          <p className="text-xs text-fg-subtle">{t('animal.needsProduction')}</p>
        ) : null}
      </Card>

      <Dialog
        open={action === 'weight'}
        onClose={close}
        title={t('animal.recordWeight')}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void submitWeight()} disabled={busy}>
              {busy ? t('common.saving') : t('animal.submitWeight')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('animal.weightKg')} htmlFor="weight-kg" required>
            <Input
              id="weight-kg"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </Field>
          <Field label={t('animal.bcsValue')} htmlFor="weight-bcs">
            <Input
              id="weight-bcs"
              inputMode="decimal"
              value={bcs}
              onChange={(event) => setBcs(event.target.value)}
            />
          </Field>
        </div>
        <Field label={t('animal.note')} htmlFor="weight-note" className="mt-3">
          <Textarea
            id="weight-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
          />
        </Field>
      </Dialog>

      <Dialog
        open={action === 'move'}
        onClose={close}
        title={t('animal.move')}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void submitMove()} disabled={busy || pen === ''}>
              {busy ? t('common.saving') : t('animal.submitMove')}
            </Button>
          </>
        }
      >
        <Field label={t('animal.targetPen')} htmlFor="move-pen" required>
          <Select id="move-pen" value={pen} onChange={(event) => setPen(event.target.value)}>
            <option value="">—</option>
            {pens.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
      </Dialog>

      <Dialog
        open={action === 'health'}
        onClose={close}
        title={t('animal.recordHealth')}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void submitHealth()} disabled={busy}>
              {busy ? t('common.saving') : t('animal.submitHealth')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('animal.healthType')} htmlFor="health-type">
            <Select
              id="health-type"
              value={healthType}
              onChange={(event) => setHealthType(event.target.value as typeof healthType)}
            >
              {(['examen', 'traitement', 'vaccination', 'naissance', 'observation'] as const).map(
                (value) => (
                  <option key={value} value={value}>
                    {t(`health.type.${value}`)}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <Field label={t('animal.healthSeverity')} htmlFor="health-severity">
            <Select
              id="health-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as typeof severity)}
            >
              <option value="info">{t('animal.severityInfo')}</option>
              <option value="suivi">{t('animal.severitySuivi')}</option>
              <option value="alerte">{t('animal.severityAlerte')}</option>
            </Select>
          </Field>
        </div>
        <Field label={t('animal.note')} htmlFor="health-note" className="mt-3">
          <Textarea
            id="health-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
          />
        </Field>
      </Dialog>

      <Dialog
        open={serveOpen}
        onClose={() => setServeOpen(false)}
        title={t('animal.serve')}
        description={t('nutrition.serve')}
        closeLabel={t('common.close')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setServeOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void serve()} disabled={busy}>
              {busy ? t('common.saving') : t('common.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{t('ration.stockNote')}</p>
      </Dialog>

      <p className="text-xs text-fg-subtle">
        <CircleAlert className="me-1 inline size-3" aria-hidden="true" />
        {t('health.ruleNote')}
      </p>
    </div>
  );
}
