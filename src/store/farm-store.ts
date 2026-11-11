import { create } from 'zustand';

import { services } from '@/app/services';
import type { CommandResult, OnboardingDraft } from '@/domain';
import type { MessageDescriptor } from '@/domain';
import type { FarmDocument } from '@/domain/types';

type FarmStatus = 'loading' | 'ready' | 'empty' | 'error';

const CROSS_TAB_CHANNEL = 'ovitech-farm';

function notifyCrossTab(): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(CROSS_TAB_CHANNEL);
  channel.postMessage({ type: 'document-changed', at: Date.now() });
  channel.close();
}

function quotaIssue(): 'quota' | null {
  return services.repository.storageIssue === 'quota' ? 'quota' : null;
}

interface FarmState {
  status: FarmStatus;
  document: FarmDocument | null;
  storage: 'indexeddb' | 'memory';
  storageIssue: 'quota' | null;
  busy: boolean;
  failure: MessageDescriptor | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  onboard: (draft: OnboardingDraft) => Promise<boolean>;
  execute: <T>(operation: () => Promise<CommandResult<T>>) => Promise<CommandResult<T>>;
  replace: (document: FarmDocument) => Promise<void>;
  reset: () => Promise<void>;
  dismissStorageIssue: () => void;
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
  storageIssue: null,
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
        storageIssue: quotaIssue(),
      });
    } catch {
      set({
        status: 'error',
        document: null,
        storage: services.repository.mode,
        storageIssue: quotaIssue(),
      });
    }
  },

  async refresh() {
    try {
      const document = await services.farm.reload();
      set({
        status: document ? 'ready' : 'empty',
        document,
        storage: services.repository.mode,
        storageIssue: quotaIssue(),
      });
    } catch {
      set({ status: 'error', storage: services.repository.mode });
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
        storageIssue: quotaIssue(),
      });
      notifyCrossTab();
      return true;
    } catch {
      set({ busy: false, failure: { key: 'domain.error.malformed' } });
      return false;
    }
  },

  async execute(operation) {
    set({ busy: true, failure: null });
    try {
      const result = await operation();
      if (result.ok) {
        set({
          busy: false,
          document: result.document,
          status: 'ready',
          storage: services.repository.mode,
          storageIssue: quotaIssue(),
        });
        notifyCrossTab();
      } else {
        set({ busy: false, failure: result.error, storageIssue: quotaIssue() });
      }
      return result;
    } catch {
      set({
        busy: false,
        failure: { key: 'domain.error.malformed' },
        storage: services.repository.mode,
        storageIssue: quotaIssue(),
      });
      return { ok: false as const, error: { key: 'domain.error.malformed' as const } };
    }
  },

  async replace(document) {
    await services.farm.replace(document);
    set({
      document,
      status: 'ready',
      failure: null,
      storage: services.repository.mode,
      storageIssue: quotaIssue(),
    });
    notifyCrossTab();
  },

  async reset() {
    set({ busy: true });
    await services.farm.reset();
    set({ busy: false, document: null, status: 'empty', failure: null, storageIssue: null });
    notifyCrossTab();
    await get().initialize();
  },

  dismissStorageIssue() {
    set({ storageIssue: null });
  },
}));
