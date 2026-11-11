import type { MessageKey } from '@/i18n/messages';

export type CapabilityClass = 'A' | 'B' | 'C';
export type CapabilityStatus = 'available' | 'planned' | 'simulated';

export interface Capability {
  id: string;
  labelKey: MessageKey;
  bodyKey: MessageKey;
  class: CapabilityClass;
  status: CapabilityStatus;
}

/**
 * Static capability registry rendered by `/etat`. It is intentionally code, not
 * data: the farm document cannot add, remove or promote a capability. Class C
 * entries are declared simulations and are labelled as such in the UI.
 */
export const CAPABILITIES: readonly Capability[] = [
  {
    id: 'local-first',
    labelKey: 'home.cardOfflineTitle',
    bodyKey: 'home.cardOfflineBody',
    class: 'A',
    status: 'available',
  },
  {
    id: 'herd',
    labelKey: 'nav.troupeau',
    bodyKey: 'herd.subtitle',
    class: 'A',
    status: 'available',
  },
  {
    id: 'weights',
    labelKey: 'common.weight',
    bodyKey: 'animal.weightsBody',
    class: 'A',
    status: 'available',
  },
  {
    id: 'health',
    labelKey: 'nav.sante',
    bodyKey: 'health.subtitle',
    class: 'A',
    status: 'available',
  },
  {
    id: 'ration',
    labelKey: 'nav.ration',
    bodyKey: 'ration.subtitle',
    class: 'A',
    status: 'available',
  },
  {
    id: 'feed',
    labelKey: 'nav.fourrage',
    bodyKey: 'feed.subtitle',
    class: 'A',
    status: 'available',
  },
  {
    id: 'kpi',
    labelKey: 'nav.indicateurs',
    bodyKey: 'kpi.subtitle',
    class: 'A',
    status: 'available',
  },
  {
    id: 'audit',
    labelKey: 'nav.journal',
    bodyKey: 'journal.subtitle',
    class: 'A',
    status: 'available',
  },
  {
    id: 'backup',
    labelKey: 'sync.exportTitle',
    bodyKey: 'sync.exportBody',
    class: 'A',
    status: 'available',
  },
  {
    id: 'offline',
    labelKey: 'common.offline',
    bodyKey: 'home.offlineNote',
    class: 'A',
    status: 'available',
  },
  {
    id: 'sync',
    labelKey: 'sync.remoteLabel',
    bodyKey: 'sync.remoteBody',
    class: 'B',
    status: 'planned',
  },
  {
    id: 'cameras',
    labelKey: 'eco.cameras',
    bodyKey: 'eco.camerasBody',
    class: 'C',
    status: 'simulated',
  },
  {
    id: 'gates',
    labelKey: 'eco.portails',
    bodyKey: 'eco.portailsBody',
    class: 'C',
    status: 'simulated',
  },
  {
    id: 'scale',
    labelKey: 'eco.balance',
    bodyKey: 'eco.balanceBody',
    class: 'C',
    status: 'simulated',
  },
  {
    id: 'iot',
    labelKey: 'eco.iot',
    bodyKey: 'eco.iotBody',
    class: 'C',
    status: 'simulated',
  },
  {
    id: 'vision',
    labelKey: 'nav.vision',
    bodyKey: 'vision.lead',
    class: 'C',
    status: 'simulated',
  },
];

export function capabilityCounts(): Record<CapabilityClass, number> {
  return CAPABILITIES.reduce(
    (counts, capability) => {
      counts[capability.class] += 1;
      return counts;
    },
    { A: 0, B: 0, C: 0 },
  );
}
