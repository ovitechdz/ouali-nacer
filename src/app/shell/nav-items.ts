import {
  Award,
  BookOpen,
  Camera,
  CalendarDays,
  ChartLine,
  Cpu,
  DoorOpen,
  Eye,
  HeartPulse,
  Home,
  ListChecks,
  Package,
  RefreshCw,
  ScanLine,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  Utensils,
  Wheat,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type { MessageKey } from '@/i18n/messages';

export type RoutePath =
  | '/'
  | '/journee'
  | '/scan'
  | '/troupeau'
  | '/sante'
  | '/nutrition'
  | '/ration'
  | '/fourrage'
  | '/energie'
  | '/indicateurs'
  | '/preuve'
  | '/verification'
  | '/journal'
  | '/sync'
  | '/ecosysteme'
  | '/ecosysteme/cameras'
  | '/ecosysteme/portails'
  | '/ecosysteme/balance'
  | '/ecosysteme/iot'
  | '/vision'
  | '/investisseurs'
  | '/label'
  | '/equipe';

export interface NavItem {
  to: RoutePath;
  labelKey: MessageKey;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavGroup {
  id: string;
  labelKey: MessageKey;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'herd',
    labelKey: 'nav.group.herd',
    items: [
      { to: '/journee', labelKey: 'nav.journee', icon: CalendarDays },
      { to: '/troupeau', labelKey: 'nav.troupeau', icon: Users },
      { to: '/sante', labelKey: 'nav.sante', icon: HeartPulse },
    ],
  },
  {
    id: 'nutrition',
    labelKey: 'nav.group.nutrition',
    items: [
      { to: '/nutrition', labelKey: 'nav.nutrition', icon: Utensils },
      { to: '/ration', labelKey: 'nav.ration', icon: Scale },
    ],
  },
  {
    id: 'autonomy',
    labelKey: 'nav.group.autonomy',
    items: [
      { to: '/fourrage', labelKey: 'nav.fourrage', icon: Wheat },
      { to: '/energie', labelKey: 'nav.energie', icon: Zap },
    ],
  },
  {
    id: 'pilotage',
    labelKey: 'nav.group.pilotage',
    items: [
      { to: '/indicateurs', labelKey: 'nav.indicateurs', icon: ChartLine },
      { to: '/preuve', labelKey: 'nav.preuve', icon: ShieldCheck },
      { to: '/verification', labelKey: 'nav.verification', icon: ListChecks },
      { to: '/journal', labelKey: 'nav.journal', icon: BookOpen },
      { to: '/sync', labelKey: 'nav.sync', icon: RefreshCw },
    ],
  },
  {
    id: 'ecosysteme',
    labelKey: 'nav.group.ecosysteme',
    items: [
      { to: '/ecosysteme', labelKey: 'nav.ecosysteme', icon: Package, exact: true },
      { to: '/ecosysteme/cameras', labelKey: 'nav.cameras', icon: Camera },
      { to: '/ecosysteme/portails', labelKey: 'nav.portails', icon: DoorOpen },
      { to: '/ecosysteme/balance', labelKey: 'nav.balance', icon: Scale },
      { to: '/ecosysteme/iot', labelKey: 'nav.iot', icon: Cpu },
    ],
  },
  {
    id: 'dossier',
    labelKey: 'nav.group.dossier',
    items: [
      { to: '/label', labelKey: 'nav.label', icon: Award },
      { to: '/vision', labelKey: 'nav.vision', icon: Eye },
      { to: '/investisseurs', labelKey: 'nav.investisseurs', icon: TrendingUp },
      { to: '/equipe', labelKey: 'nav.team', icon: Users },
    ],
  },
];

/** Home and scan are reached from the brand mark and the call-to-action. */
export const NAV_HOME: NavItem = { to: '/', labelKey: 'nav.home', icon: Home };
export const NAV_SCAN: NavItem = { to: '/scan', labelKey: 'nav.scan', icon: ScanLine };
