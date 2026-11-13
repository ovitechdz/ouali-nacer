import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePwaStore } from '@/pwa/pwa-store';
import { PwaNotice } from './PwaNotice';

function reset(): void {
  usePwaStore.setState({
    needRefresh: false,
    offlineReady: false,
    registrationFailed: false,
    applying: false,
    applyUpdate: null,
  });
}

describe('PwaNotice', () => {
  beforeEach(reset);

  it('offers the waiting update and applies it once', async () => {
    const apply = vi.fn(async () => undefined);
    usePwaStore.setState({ needRefresh: true, applyUpdate: apply });
    render(<PwaNotice />);
    expect(screen.getByText('تحديث متاح')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'تحديث الآن' }));
    });
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('confirms that the first install is ready offline', () => {
    usePwaStore.setState({ offlineReady: true });
    render(<PwaNotice />);
    expect(screen.getByText('جاهز دون اتصال')).toBeInTheDocument();
  });

  it('warns when registration failed', () => {
    usePwaStore.setState({ registrationFailed: true });
    render(<PwaNotice />);
    expect(screen.getByText('تعذر تفعيل العمل دون اتصال')).toBeInTheDocument();
  });

  it('renders nothing when there is no event', () => {
    const { container } = render(<PwaNotice />);
    expect(container).toBeEmptyDOMElement();
  });
});
