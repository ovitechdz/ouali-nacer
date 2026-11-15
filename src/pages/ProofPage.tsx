import { FileCheck2, Printer, ShieldCheck, Signature } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat';
import { useToast } from '@/components/ui/toast-context';
import { validateDocumentInvariants } from '@/domain';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useFarm } from '@/store/use-farm';

export function ProofPage() {
  const { t, i18n } = useTranslation();
  const { document, now, busy, execute } = useFarm();
  const toast = useToast();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState<'nutrition' | 'elevage'>('nutrition');
  const [protocol, setProtocol] = useState('');
  const [passed, setPassed] = useState('');
  const [total, setTotal] = useState('');
  const [caseIds, setCaseIds] = useState('');
  const [error, setError] = useState<string | null>(null);

  const issues = useMemo(
    () => (document ? validateDocumentInvariants(document, now) : []),
    [document, now],
  );

  const decisions = useMemo(
    () =>
      (document?.recommendations ?? [])
        .filter((rec) => rec.approvedBy !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
    [document],
  );
  const animalCode = new Map((document?.animals ?? []).map((animal) => [animal.id, animal.code]));

  if (!document) return null;

  const submit = async (): Promise<void> => {
    setError(null);
    if (name.trim() === '' || protocol.trim() === '' || caseIds.trim() === '') {
      setError(t('proof.signoffRequired'));
      return;
    }
    const result = await execute(() =>
      services.farm.signProtocol({
        name: name.trim(),
        specialty,
        protocol: protocol.trim(),
        passed: Number(passed) || 0,
        total: Number(total) || 0,
        caseIds: caseIds
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        notes: '',
      }),
    );
    if (!result.ok) {
      toast.push(t(result.error.key, result.error.params), 'error');
      return;
    }
    toast.push(t('proof.signoffSuccess'), 'success');
    setOpen(false);
    setName('');
    setProtocol('');
    setCaseIds('');
    setPassed('');
    setTotal('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('proof.kicker')}
        title={t('proof.title')}
        subtitle={t('proof.subtitle')}
        actions={
          <>
            <Badge tone="neutral">
              {t('proof.generatedAt')}: {formatDateTime(now.toISOString(), locale)}
            </Badge>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden="true" />
              {t('proof.print')}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label={t('proof.animals')}
          value={formatNumber(document.animals.length, locale)}
        />
        <StatCard
          label={t('proof.weights')}
          value={formatNumber(document.weights.length, locale)}
        />
        <StatCard
          label={t('proof.health')}
          value={formatNumber(document.healthEvents.length, locale)}
        />
        <StatCard
          label={t('proof.recommendations')}
          value={formatNumber(document.recommendations.length, locale)}
        />
        <StatCard
          label={t('proof.audit')}
          value={formatNumber(document.auditEvents.length, locale)}
        />
        <StatCard
          label={t('proof.signoffs')}
          value={formatNumber(document.signoffs.length, locale)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              {t('proof.integrityTitle')}
            </h2>
            <Badge tone={issues.length === 0 ? 'accent' : 'warn'}>
              {issues.length === 0 ? t('proof.integrityOk') : t('proof.integrityFail')}
            </Badge>
          </div>
          {issues.length === 0 ? (
            <p className="text-sm text-fg-muted">{t('verify.okBody')}</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-fg-muted">
              {issues.map((issue, index) => (
                <li key={`${issue.code}-${issue.entityId ?? index}`}>
                  {t(issue.key)}
                  {issue.entityId ? (
                    <span className="ms-1 font-mono text-xs text-fg-subtle">
                      ({issue.entityId})
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-xl border border-border bg-surface-3/50 p-3 text-xs text-fg-muted">
            {t('proof.engine')}:{' '}
            <span className="font-semibold text-fg">{document.settings.engineVersion}</span>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
              <Signature className="size-4 text-accent" aria-hidden="true" />
              {t('proof.signoffsTitle')}
            </h2>
            <Button size="sm" onClick={() => setOpen(true)}>
              {t('proof.addSignoff')}
            </Button>
          </div>
          <p className="text-xs text-fg-muted">{t('proof.signoffsBody')}</p>
          {document.signoffs.length === 0 ? (
            <EmptyState title={t('proof.signoffsEmpty')} />
          ) : (
            <ul className="space-y-2">
              {document.signoffs.map((signoff) => (
                <li
                  key={signoff.id}
                  className="rounded-xl border border-border bg-surface-3/40 p-3"
                >
                  <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-fg">
                    {signoff.name}
                    <Badge tone="accent">
                      {signoff.passed}/{signoff.total}
                    </Badge>
                  </p>
                  <p className="text-xs text-fg-muted">
                    {signoff.specialty === 'nutrition'
                      ? t('proof.specialtyNutrition')
                      : t('proof.specialtyElevage')}{' '}
                    · {formatDateTime(signoff.signedAt, locale)}
                  </p>
                  <p className="mt-1 text-xs text-fg-muted">{signoff.protocol}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section aria-labelledby="proof-decisions" className="space-y-2">
        <h2 id="proof-decisions" className="text-base font-bold text-fg-strong">
          {t('proof.latestTitle')}
        </h2>
        <p className="text-xs text-fg-muted">{t('proof.latestBody')}</p>
        {decisions.length === 0 ? (
          <EmptyState title={t('proof.latestEmpty')} />
        ) : (
          <ul className="ov-stagger space-y-2">
            {decisions.map((rec) => (
              <li
                key={rec.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface-2 p-3"
              >
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg">
                    <FileCheck2 className="size-3.5 text-accent" aria-hidden="true" />
                    {animalCode.get(rec.animalId) ?? rec.animalId}
                  </p>
                  <p className="text-xs text-fg-muted">{formatDateTime(rec.createdAt, locale)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rec.servedAt ? (
                    <Badge tone="accent">{t('animal.served')}</Badge>
                  ) : (
                    <Badge tone="info">{t('animal.approved')}</Badge>
                  )}
                  {rec.approvedBy ? <Badge tone="neutral">{rec.approvedBy.name}</Badge> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Notice tone="info">
        {t('proof.integrityOk')} · {t('kpi.targetNote')}
      </Notice>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('proof.signoffTitle')}
        description={t('proof.signoffBody')}
        closeLabel={t('common.close')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? t('common.saving') : t('proof.submitSignoff')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('proof.expertName')} htmlFor="signoff-name" required>
            <Input
              id="signoff-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label={t('proof.specialty')} htmlFor="signoff-specialty">
            <Select
              id="signoff-specialty"
              value={specialty}
              onChange={(event) =>
                setSpecialty(event.target.value === 'elevage' ? 'elevage' : 'nutrition')
              }
            >
              <option value="nutrition">{t('proof.specialtyNutrition')}</option>
              <option value="elevage">{t('proof.specialtyElevage')}</option>
            </Select>
          </Field>
          <Field label={t('proof.passed')} htmlFor="signoff-passed">
            <Input
              id="signoff-passed"
              inputMode="numeric"
              value={passed}
              onChange={(event) => setPassed(event.target.value)}
            />
          </Field>
          <Field label={t('proof.total')} htmlFor="signoff-total">
            <Input
              id="signoff-total"
              inputMode="numeric"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
            />
          </Field>
        </div>
        <Field
          label={t('proof.caseIds')}
          htmlFor="signoff-cases"
          hint={t('proof.caseIdsHint')}
          className="mt-3"
          required
        >
          <Input
            id="signoff-cases"
            value={caseIds}
            onChange={(event) => setCaseIds(event.target.value)}
          />
        </Field>
        <Field label={t('proof.protocol')} htmlFor="signoff-protocol" className="mt-3" required>
          <Textarea
            id="signoff-protocol"
            value={protocol}
            onChange={(event) => setProtocol(event.target.value)}
            maxLength={2000}
          />
        </Field>
        {error ? (
          <Notice tone="danger" className="mt-3">
            {error}
          </Notice>
        ) : null}
      </Dialog>
    </div>
  );
}
