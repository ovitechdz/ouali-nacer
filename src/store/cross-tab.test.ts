import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFarmStore } from './farm-store';
import { useCrossTabSync } from './cross-tab';

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();

  constructor(public name: string) {
    FakeBroadcastChannel.instances.push(this);
  }
}

describe('useCrossTabSync', () => {
  afterEach(() => {
    FakeBroadcastChannel.instances = [];
    // @ts-expect-error the test removes the browser global it installed.
    delete globalThis.BroadcastChannel;
  });

  it('reloads the document when another tab reports a change', () => {
    globalThis.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;
    const refresh = vi.fn(async () => undefined);
    useFarmStore.setState({ refresh });

    renderHook(() => useCrossTabSync());
    const channel = FakeBroadcastChannel.instances[0];
    expect(channel?.name).toBe('ovitech-farm');

    act(() => {
      channel?.onmessage?.({ data: { type: 'document-changed' } } as MessageEvent);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated messages', () => {
    globalThis.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;
    const refresh = vi.fn(async () => undefined);
    useFarmStore.setState({ refresh });

    renderHook(() => useCrossTabSync());
    const channel = FakeBroadcastChannel.instances[0];
    act(() => {
      channel?.onmessage?.({ data: { type: 'other' } } as MessageEvent);
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('is a no-op when BroadcastChannel is missing', () => {
    expect(() => renderHook(() => useCrossTabSync())).not.toThrow();
  });
});
