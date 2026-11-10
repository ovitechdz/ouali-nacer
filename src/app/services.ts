import { IndexedDbFarmRepository } from '@/adapters/indexeddb-repository';
import { MemoryFarmRepository } from '@/adapters/memory-repository';
import { ResilientFarmRepository } from '@/adapters/resilient-repository';
import { SystemClock } from '@/adapters/system-clock';
import { UlidGenerator } from '@/adapters/ulid-ids';
import { FarmService } from '@/application/farm-service';
import type { Clock } from '@/ports/clock';
import type { IdGenerator } from '@/ports/ids';

export interface Services {
  clock: Clock;
  ids: IdGenerator;
  repository: ResilientFarmRepository;
  farm: FarmService;
}

const repository = new ResilientFarmRepository(
  new IndexedDbFarmRepository(),
  new MemoryFarmRepository(),
);

const clock = new SystemClock();
const ids = new UlidGenerator();

/**
 * Composition root. Only this file decides which adapter is active; domain,
 * application and UI code depend on the ports alone.
 */
export const services: Services = {
  clock,
  ids,
  repository,
  farm: new FarmService({ repository, clock, ids }),
};
