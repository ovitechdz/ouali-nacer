import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { InstallPromptEvent } from './use-install-prompt';
import { useInstallPrompt } from './use-install-prompt';

function promptEvent(outcome: 'accepted' | 'dismissed'): InstallPromptEvent {
  const event = new Event('beforeinstallprompt') as InstallPromptEvent;
  Object.defineProperty(event, 'prompt', { value: async () => undefined });
  Object.defineProperty(event, 'userChoice', {
    value: Promise.resolve({ outcome, platform: 'web' }),
  });
  return event;
}

describe('useInstallPrompt', () => {
  it('captures the deferred prompt and reports an accepted install', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);

    act(() => {
      window.dispatchEvent(promptEvent('accepted'));
    });
    expect(result.current.canInstall).toBe(true);

    let accepted = false;
    await act(async () => {
      accepted = await result.current.install();
    });
    expect(accepted).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('reports a dismissed install and clears the event', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(promptEvent('dismissed'));
    });
    let accepted = true;
    await act(async () => {
      accepted = await result.current.install();
    });
    expect(accepted).toBe(false);
    expect(result.current.canInstall).toBe(false);
  });

  it('returns false when no prompt is available', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    let accepted = true;
    await act(async () => {
      accepted = await result.current.install();
    });
    expect(accepted).toBe(false);
  });
});
