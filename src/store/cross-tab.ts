import { useEffect } from 'react';

import { useFarmStore } from '@/store/farm-store';

const CROSS_TAB_CHANNEL = 'ovitech-farm';

/**
 * Keeps two open tabs on the same document. A local write broadcasts
 * "document-changed"; the other tabs reload from storage. The receiving tab
 * never writes, so the channel cannot loop.
 */
export function useCrossTabSync(): void {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel(CROSS_TAB_CHANNEL);
    channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'document-changed') {
        void useFarmStore.getState().refresh();
      }
    };
    return () => channel.close();
  }, []);
}
