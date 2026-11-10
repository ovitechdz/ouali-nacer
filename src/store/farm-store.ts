import { create } from 'zustand';

import { services } from '@/app/services';
import type { CommandResult, OnboardingDraft } from '@/domain';
import type { MessageDescriptor } from '@/domain';
import type { FarmDocument } from '@/domain/types';

type FarmStatus = 'loading' | 'ready' | 'empty' | 'error';

interface FarmState {
  status: FarmStatus;
  document: FarmDocument | null;
  storage: 'indexeddb' | 'memory';
  busy: boolean;
  failure: MessageDescriptor | null;
  initialize: () => Promise<void>;
  onboard: (draft: OnboardingDraft) => Promise<boolean>;
  execute: <T>(operation: () => Promise<CommandResult<T>>) => Promise<CommandResult<T>>;
  replace: (document: FarmDocument) => Promise<void>;
  reset: () => Promise<void>;
}

async function developmentSeed(): Promise<FarmDocument | null> {
  if (!import.meta.env.DEV) return null;
  const { buildDemoDocument } = await import('@/app/seed-demo');
  return buildDemoDocument(services.clock.now());
}

export const useFarmStore = create<FarmState>((set, get) => ({
  status: 'loading',
  document: null,
  storage: 'indexeddb',
  busy: false,
  failure: null,

  async initialize() {
    set({ status: 'loading', failure: null });
    try {
      let document = await services.farm.load();
      if (!document) {
        const seed = await developmentSeed();
        if (seed) {
          await services.farm.replace(seed);
          document = seed;
        }
      }
      set({
        status: document ? 'ready' : 'empty',
        document,
        storage: services.repository.mode,
      });
    } catch {
      set({ status: 'error', document: null, storage: services.repository.mode });
    }
  },

  async onboard(draft) {
    set({ busy: true, failure: null });
    try {
      const result = await services.farm.initialize(draft);
      if (!result.ok) {
        set({ busy: false, failure: result.error });
        return false;
      }
      set({
        busy: false,
        status: 'ready',
        document: result.document,
        storage: services.repository.mode,
      });
      return true;
    } catch {
      set({ busy: false, failure: { key: 'domain.error.malformed' } });
      return false;
    }
  },

  async execute(operation) {
    set({ busy: true, failure: null });
    const result = await operation();
    if (result.ok) {
      set({ busy: false, document: result.document, status: 'ready' });
    } else {
      set({ busy: false, failure: result.error });
    }
    return result;
  },

  async replace(document) {
    await services.farm.replace(document);
    set({ document, status: 'ready', failure: null });
  },

  async reset() {
    set({ busy: true });
    await services.farm.reset();
    set({ busy: false, document: null, status: 'empty', failure: null });
    await get().initialize();
  },
}));
