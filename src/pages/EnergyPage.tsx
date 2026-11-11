import { Gauge as GaugeIcon, PlugZap, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Notice, SimulationBadge } from '@/components/ui/feedback';
import { StatCard } from '@/components/ui/stat';
import { useGsapReveal } from '@/motion/use-gsap-reveal';

export function EnergyPage() {
  const { t } = useTranslation();
  const reveal = useGsapReveal<HTMLDivElement>({ stagger: 0.08 });

  return (
    <div ref={reveal} className="space-y-5">
      <PageHeader
        kicker={t('energy.kicker')}
        title={t('energy.title')}
        subtitle={t('energy.subtitle')}
        actions={<SimulationBadge label={t('common.simulation')} />}
      />

      <Notice tone="warn" title={t('energy.simulationTitle')}>
        {t('energy.simulationBody')}
      </Notice>

      <section aria-labelledby="energy-targets" data-reveal className="space-y-3">
        <div>
          <h2 id="energy-targets" className="text-base font-bold text-fg-strong">
            {t('energy.targetsTitle')}
          </h2>
          <p className="text-xs text-fg-muted">{t('energy.targetsBody')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label={t('energy.autonomyTarget')}
            value="85 %"
            hint={`${t('common.target')} · ${t('common.simulatedValue')}`}
            icon={GaugeIcon}
            tone="info"
          />
          <StatCard
            label={t('energy.actualLabel')}
            value={t('energy.actualNone')}
            hint={t('energy.honestyBody')}
            icon={PlugZap}
            tone="neutral"
          />
        </div>
      </section>

      <section
        aria-labelledby="energy-arch"
        data-reveal
        className="grid gap-4 lg:grid-cols-[1.1fr_1fr]"
      >
        <Card className="space-y-3">
          <h2 id="energy-arch" className="text-base font-bold text-fg-strong">
            {t('energy.architectureTitle')}
          </h2>
          <ul className="space-y-2 text-sm text-fg-muted">
            {(['energy.arch1', 'energy.arch2', 'energy.arch3', 'energy.arch4'] as const).map(
              (key) => (
                <li key={key} className="flex gap-2">
                  <Waves className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{t(key)}</span>
                </li>
              ),
            )}
          </ul>
        </Card>

        <div className="space-y-3">
          <Notice tone="info" title={t('energy.honestyTitle')}>
            {t('energy.honestyBody')}
          </Notice>
          <Card className="text-xs leading-relaxed text-fg-muted">
            {t('energy.simulationBody')}
          </Card>
        </div>
      </section>
    </div>
  );
}
