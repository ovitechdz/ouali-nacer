import { useMemo } from 'react';

import { services } from '@/app/services';
import { farmKpis, herdRows } from '@/store/selectors';
import { useFarmStore } from '@/store/farm-store';

/**
 * Read-model hook shared by every page. The clock is sampled once per document
 * revision so derived memos stay stable across re-renders.
 */
export function useFarm() {
  const document = useFarmStore((state) => state.document);
  const busy = useFarmStore((state) => state.busy);
  const failure = useFarmStore((state) => state.failure);
  const execute = useFarmStore((state) => state.execute);
  const replace = useFarmStore((state) => state.replace);
  const now = useMemo(
    () => services.clock.now(),
    // The document revision is the only reason derived views must be recomputed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [document?.updatedAt],
  );
  const rows = useMemo(() => (document ? herdRows(document, now) : []), [document, now]);
  const kpis = useMemo(() => (document ? farmKpis(document, now) : null), [document, now]);
  return { document, now, rows, kpis, busy, failure, execute, replace };
}
