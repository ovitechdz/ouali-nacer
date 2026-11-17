import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useOnlineStatus } from './use-online';

const onlineDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
let online = true;

function NetworkBadge() {
  const value = useOnlineStatus();
  return <span>{value ? 'en ligne' : 'hors ligne'}</span>;
}

afterEach(() => {
  if (onlineDescriptor) Object.defineProperty(window.navigator, 'onLine', onlineDescriptor);
});

describe('useOnlineStatus', () => {
  it('starts from the browser flag and follows the online and offline events', () => {
    online = false;
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online });

    render(<NetworkBadge />);
    expect(screen.getByText('hors ligne')).toBeInTheDocument();

    online = true;
    fireEvent(window, new Event('online'));
    expect(screen.getByText('en ligne')).toBeInTheDocument();

    online = false;
    fireEvent(window, new Event('offline'));
    expect(screen.getByText('hors ligne')).toBeInTheDocument();
  });

  it('removes both listeners when the component unmounts', () => {
    online = true;
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online });
    const removeListener = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<NetworkBadge />);
    unmount();

    expect(removeListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('offline', expect.any(Function));
    removeListener.mockRestore();
  });
});
