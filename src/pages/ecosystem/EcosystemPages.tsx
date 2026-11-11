import { Link } from '@tanstack/react-router';
import {
  Camera,
  Cpu,
  DoorOpen,
  Scale,
  ShieldAlert,
  Sparkles,
  Unplug,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/feedback';
import type { MessageKey } from '@/i18n/messages';

const MODULES = [
  { to: '/ecosysteme/cameras', key: 'cameras', icon: Camera },
  { to: '/ecosysteme/portails', key: 'portails', icon: DoorOpen },
  { to: '/ecosysteme/balance', key: 'balance', icon: Scale },
  { to: '/ecosysteme/iot', key: 'iot', icon: Cpu },
] as const;

export function EcosystemHubPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t('eco.kicker')}
        title={t('eco.title')}
        subtitle={t('eco.subtitle')}
        actions={<Badge tone="warn">{t('eco.statusNone')}</Badge>}
      />

      <Notice tone="info" title={t('eco.statusTitle')}>
        {t('eco.statusBody')}
      </Notice>

      <div className="ov-stagger grid gap-3 sm:grid-cols-2">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.to} to={module.to} className="group block">
              <Card className="flex h-full flex-col gap-2 transition-colors duration-150 group-hover:border-border-strong group-hover:bg-surface-3/60">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <Badge tone="warn">{t('eco.notConnected')}</Badge>
                </div>
                <h2 className="text-sm font-bold text-fg-strong">{t(`eco.${module.key}`)}</h2>
                <p className="text-xs leading-relaxed text-fg-muted">
                  {t(`eco.${module.key}Body`)}
                </p>
                <span className="mt-auto text-xs font-semibold text-accent">{t('eco.open')}</span>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Sparkles className="size-4 text-accent" aria-hidden="true" />
            {t('eco.provenTitle')}
          </h2>
          <p className="text-sm text-fg-muted">{t('eco.provenBody')}</p>
        </Card>
        <Card className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Unplug className="size-4 text-warn" aria-hidden="true" />
            {t('eco.plannedTitle')}
          </h2>
          <p className="text-sm text-fg-muted">{t('eco.plannedBody')}</p>
        </Card>
      </div>
    </div>
  );
}

interface ModuleProps {
  kicker: MessageKey;
  title: MessageKey;
  subtitle: MessageKey;
  bulletKeys: readonly MessageKey[];
  icon: LucideIcon;
}

function EcosystemModule({ kicker, title, subtitle, bulletKeys, icon: Icon }: ModuleProps) {
  const { t } = useTranslation();
  const base = kicker.replace('.kicker', '');
  return (
    <div className="space-y-5">
      <PageHeader
        kicker={t(kicker)}
        title={t(title)}
        subtitle={t(subtitle)}
        actions={<Badge tone="warn">{t('eco.notConnected')}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
            <Icon className="size-4 text-accent" aria-hidden="true" />
            {t('eco.readMore')}
          </h2>
          <ul className="space-y-2 text-sm text-fg-muted">
            {bulletKeys.map((key) => (
              <li key={key} className="flex gap-2">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-3">
          <Notice tone="warn" title={t(`${base}.limitTitle` as MessageKey)}>
            {t(`${base}.limitBody` as MessageKey)}
          </Notice>
          <Card className="space-y-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-fg-strong">
              <ShieldAlert className="size-4 text-warn" aria-hidden="true" />
              {t(`${base}.valueTitle` as MessageKey)}
            </h2>
            <p className="text-sm text-fg-muted">{t(`${base}.valueBody` as MessageKey)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CamerasPage() {
  return (
    <EcosystemModule
      kicker="eco.cameras.kicker"
      title="eco.cameras.title"
      subtitle="eco.cameras.subtitle"
      bulletKeys={[
        'eco.cameras.use1',
        'eco.cameras.use2',
        'eco.cameras.use3',
        'eco.cameras.limitBody',
      ]}
      icon={Camera}
    />
  );
}

export function GatesPage() {
  return (
    <EcosystemModule
      kicker="eco.portails.kicker"
      title="eco.portails.title"
      subtitle="eco.portails.subtitle"
      bulletKeys={[
        'eco.portails.flow1',
        'eco.portails.flow2',
        'eco.portails.flow3',
        'eco.portails.flow4',
      ]}
      icon={DoorOpen}
    />
  );
}

export function ScalePage() {
  return (
    <EcosystemModule
      kicker="eco.balance.kicker"
      title="eco.balance.title"
      subtitle="eco.balance.subtitle"
      bulletKeys={['eco.balance.todayBody', 'eco.balance.limitBody', 'eco.balance.valueBody']}
      icon={Scale}
    />
  );
}

export function IotPage() {
  return (
    <EcosystemModule
      kicker="eco.iot.kicker"
      title="eco.iot.title"
      subtitle="eco.iot.subtitle"
      bulletKeys={['eco.iot.sensor1', 'eco.iot.sensor2', 'eco.iot.sensor3', 'eco.iot.limitBody']}
      icon={Cpu}
    />
  );
}
