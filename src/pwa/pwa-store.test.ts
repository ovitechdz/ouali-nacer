import { describe, expect, it, vi } from 'vitest';

import { usePwaStore } from './pwa-store';

describe('pwa store', () => {
  it('applies a waiting update once and clears the prompt', async () => {
    const apply = vi.fn(async () => undefined);
    usePwaStore.setState({ needRefresh: true, applyUpdate: apply, applying: false });
    await usePwaStore.getState().applyNow();
    expect(apply).toHaveBeenCalledTimes(1);
    expect(usePwaStore.getState().needRefresh).toBe(false);
    expect(usePwaStore.getState().applying).toBe(false);
  });

  it('does nothing when no update handler is registered', async () => {
    usePwaStore.setState({ needRefresh: true, applyUpdate: null, applying: false });
    await usePwaStore.getState().applyNow();
    expect(usePwaStore.getState().needRefresh).toBe(true);
  });

  it('dismiss clears every banner flag', () => {
    usePwaStore.setState({ needRefresh: true, offlineReady: true, registrationFailed: true });
    usePwaStore.getState().dismiss();
    expect(usePwaStore.getState().needRefresh).toBe(false);
    expect(usePwaStore.getState().offlineReady).toBe(false);
    expect(usePwaStore.getState().registrationFailed).toBe(false);
  });

  it('exposes setters for each registration signal', () => {
    const store = usePwaStore.getState();
    store.setNeedRefresh(true);
    expect(usePwaStore.getState().needRefresh).toBe(true);
    store.setOfflineReady(true);
    expect(usePwaStore.getState().offlineReady).toBe(true);
    store.setRegistrationFailed(true);
    expect(usePwaStore.getState().registrationFailed).toBe(true);
    store.setApplyUpdate(async () => undefined);
    expect(usePwaStore.getState().applyUpdate).toBeTypeOf('function');
  });
});
