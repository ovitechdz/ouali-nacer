import { Activity, Home, Users, WifiOff, type LucideIcon } from 'lucide-react';

import type { MessageKey } from '@/i18n/messages';

export interface NavItem {
  to: '/' | '/equipe' | '/etat' | '/offline';
  labelKey: MessageKey;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: Home },
  { to: '/equipe', labelKey: 'nav.team', icon: Users },
  { to: '/etat', labelKey: 'nav.status', icon: Activity },
  { to: '/offline', labelKey: 'nav.offline', icon: WifiOff },
];
