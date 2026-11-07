import { describeRepositoryContract } from '@/test/repository-contract';

import { MemoryFarmRepository } from './memory-repository';

describeRepositoryContract('MemoryFarmRepository', () => new MemoryFarmRepository());
