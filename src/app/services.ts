import { MemoryFarmRepository } from '@/adapters/memory-repository';
import { SystemClock } from '@/adapters/system-clock';
import { UlidGenerator } from '@/adapters/ulid-ids';
import type { Clock } from '@/ports/clock';
import type { IdGenerator } from '@/ports/ids';
import type { FarmRepository } from '@/ports/repository';

export interface Services {
  clock: Clock;
  ids: IdGenerator;
  repository: FarmRepository;
}

/**
 * Composition root. Only this file decides which adapter is active; domain,
 * application and UI code depend on the ports alone.
 */
export const services: Services = {
  clock: new SystemClock(),
  ids: new UlidGenerator(),
  repository: new MemoryFarmRepository(),
};
