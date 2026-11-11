import { create } from 'zustand';

export interface PwaState {
  /** A new service worker is installed and waiting for activation. */
  needRefresh: boolean;
  /** The first install finished precaching the app shell. */
  offlineReady: boolean;
  /** Registration failed, so offline mode is not guaranteed. */
  registrationFailed: boolean;
  /** Set while the waiting worker is being activated. */
  applying: boolean;
  applyUpdate: (() => Promise<void>) | null;
  setNeedRefresh: (value: boolean) => void;
  setOfflineReady: (value: boolean) => void;
  setRegistrationFailed: (value: boolean) => void;
  setApplyUpdate: (fn: (() => Promise<void>) | null) => void;
  applyNow: () => Promise<void>;
  dismiss: () => void;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  needRefresh: false,
  offlineReady: false,
  registrationFailed: false,
  applying: false,
  applyUpdate: null,

  setNeedRefresh(value) {
    set({ needRefresh: value });
  },
  setOfflineReady(value) {
    set({ offlineReady: value });
  },
  setRegistrationFailed(value) {
    set({ registrationFailed: value });
  },
  setApplyUpdate(fn) {
    set({ applyUpdate: fn });
  },
  async applyNow() {
    const apply = get().applyUpdate;
    if (!apply) return;
    set({ applying: true });
    try {
      await apply();
    } finally {
      set({ applying: false, needRefresh: false });
    }
  },
  dismiss() {
    set({ needRefresh: false, offlineReady: false, registrationFailed: false });
  },
}));
