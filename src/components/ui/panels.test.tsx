import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import { Disclosure } from './disclosure';
import { SpotlightCard } from './spotlight-card';
import { ToastProvider } from './toast';
import { useToast } from './toast-context';

const originalMatchMedia = window.matchMedia;

/** jsdom has no `matchMedia`; the components must survive both a stub and its absence. */
function stubReducedMotion(reduce: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function rect(left: number, top: number): DOMRect {
  return {
    left,
    top,
    width: 300,
    height: 200,
    right: left + 300,
    bottom: top + 200,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.useRealTimers();
});

describe('Disclosure', () => {
  it('renders a native details element closed until asked to open', () => {
    const { container, rerender } = render(
      <Disclosure summary="Stock du lot">
        <p>120 kg restants</p>
      </Disclosure>,
    );
    expect(container.querySelector('details')?.open).toBe(false);

    rerender(
      <Disclosure summary="Stock du lot" open className="mt-4">
        <p>120 kg restants</p>
      </Disclosure>,
    );
    const details = container.querySelector('details');
    expect(details?.open).toBe(true);
    expect(details?.className).toContain('mt-4');
    expect(screen.getByText('Stock du lot').closest('summary')).not.toBeNull();
    expect(screen.getByText('120 kg restants')).toBeInTheDocument();
  });
});

describe('SpotlightCard', () => {
  it('writes the pointer position so the highlight follows the cursor', () => {
    stubReducedMotion(false);
    const { container } = render(<SpotlightCard>KPI</SpotlightCard>);
    const card = container.firstElementChild as HTMLElement;
    card.getBoundingClientRect = () => rect(10, 20);

    fireEvent.pointerMove(card, { clientX: 40, clientY: 70 });

    expect(card.style.getPropertyValue('--ov-spot-x')).toBe('30px');
    expect(card.style.getPropertyValue('--ov-spot-y')).toBe('50px');
  });

  it('stays a plain card when the reader asked for reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<SpotlightCard>KPI</SpotlightCard>);
    const card = container.firstElementChild as HTMLElement;
    card.getBoundingClientRect = () => rect(10, 20);

    fireEvent.pointerMove(card, { clientX: 40, clientY: 70 });

    expect(card.style.getPropertyValue('--ov-spot-x')).toBe('');
  });
});

function PushButton({ count = 1 }: { count?: number }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        for (let index = 1; index <= count; index += 1) toast.push(`message ${index}`);
      }}
    >
      push
    </button>
  );
}

describe('ToastProvider', () => {
  it('announces pushed messages politely and keeps only the last four', () => {
    const { container } = render(
      <ToastProvider>
        <PushButton count={5} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'push' }));

    const live = container.querySelector('[aria-live]');
    expect(live?.getAttribute('aria-live')).toBe('polite');
    const items = screen.getAllByRole('status');
    expect(items).toHaveLength(4);
    expect(items.map((item) => item.textContent)).toEqual([
      'message 2',
      'message 3',
      'message 4',
      'message 5',
    ]);
  });

  it('lets the reader dismiss a message with its close button', () => {
    render(
      <ToastProvider>
        <PushButton />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(screen.getByText('message 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.close') }));

    expect(screen.queryByText('message 1')).toBeNull();
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });

  it('expires a message after 4.2 s when the reader ignores it', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <PushButton />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(screen.getByText('message 1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4300);
    });

    expect(screen.queryByText('message 1')).toBeNull();
  });

  it('gives a bare useToast a no-op push outside a provider', () => {
    render(<PushButton />);
    fireEvent.click(screen.getByRole('button', { name: 'push' }));

    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });
});
