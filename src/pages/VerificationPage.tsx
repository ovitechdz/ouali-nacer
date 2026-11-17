import { CircleCheck, CircleX, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { services } from '@/app/services';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { validateDocumentInvariants, type FarmDocument } from '@/domain';
import type { MessageKey } from '@/i18n/messages';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { useFarm } from '@/store/use-farm';

interface Rule {
  id: string;
  label: MessageKey;
  ok: boolean;
}

function evaluate(document: FarmDocument, now: Date): Rule[] {
  const animalIds = new Set(document.animals.map((animal) => animal.id));
  const codes = document.animals.map((animal) => animal.code.trim().toUpperCase());
  const rfids = document.animals.map((animal) => animal.rfid.trim().toUpperCase()).filter(Boolean);
  return [
    {
      id: 'duplicateCode',
      label: 'verify.ruleDuplicateCode',
      ok: new Set(codes).size === codes.length,
    },
    {
      id: 'duplicateRfid',
      label: 'verify.ruleDuplicateRfid',
      ok: new Set(rfids).size === rfids.length,
    },
    {
      id: 'orphan',
      label: 'verify.ruleOrphan',
      ok:
        document.weights.every((record) => animalIds.has(record.animalId)) &&
        document.healthEvents.every((event) => animalIds.has(event.animalId)) &&
        document.recommendations.every((rec) => animalIds.has(rec.animalId)),
    },
    {
      id: 'served',
      label: 'verify.ruleServed',
      ok: document.recommendations.every(
        (rec) => rec.servedAt === null || (rec.approvedBy !== null && rec.stocksDeducted),
      ),
    },
    {
      id: 'stock',
      label: 'verify.ruleStock',
      ok: document.feedLots.every((lot) => lot.stockKg >= 0),
    },
    {
      id: 'birth',
      label: 'verify.ruleBirth',
      ok: document.animals.every(
        (animal) => new Date(`${animal.birthDate}T00:00:00.000Z`).getTime() <= now.getTime(),
      ),
    },
  ];
}

export function VerificationPage() {
  const { t, i18n } = useTranslation();
  const { document, now } = useFarm();
  const locale = i18n.resolvedLanguage ?? 'ar';
  const [checkedAt, setCheckedAt] = useState(() => services.clock.now());
  const [round, setRound] = useState(0);

  if (!document) return null;

  const rules = evaluate(document, now);
  const issues = validateDocumentInvariants(document, now);
  const failing = rules.filter((rule) => !rule.ok).length;

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('verify.kicker')}
        title={t('verify.title')}
        subtitle={t('verify.subtitle')}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setCheckedAt(services.clock.now());
              setRound((value) => value + 1);
            }}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t('verify.run')}
          </Button>
        }
      />

      <div key={round} className="ov-fade space-y-4">
        <Notice
          tone={failing === 0 ? 'info' : 'warn'}
          title={failing === 0 ? t('verify.okTitle') : t('verify.failTitle', { count: failing })}
        >
          {failing === 0 ? t('verify.okBody') : t('verify.failBody')}
        </Notice>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              {t('verify.rulesTitle')}
            </h2>
            <Badge tone={failing === 0 ? 'accent' : 'warn'}>
              {t('verify.checkedAt')}: {formatDateTime(checkedAt.toISOString(), locale)}
            </Badge>
          </div>
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm',
                  rule.ok
                    ? 'border-accent/25 bg-accent/5 text-fg'
                    : 'border-danger/35 bg-danger/5 text-fg',
                )}
              >
                {rule.ok ? (
                  <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <CircleX className="size-4 shrink-0 text-danger" aria-hidden="true" />
                )}
                <span>{t(rule.label)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-base font-bold text-fg-strong">{t('verify.rulesTitle')}</h2>
          {issues.length === 0 ? (
            <EmptyState title={t('verify.okTitle')} body={t('verify.noIssues')} />
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
        </Card>
      </div>
    </div>
  );
}
