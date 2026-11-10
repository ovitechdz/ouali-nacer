import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { ToastContext, type ToastApi, type ToastTone } from '@/components/ui/toast-context';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const TONE: Record<ToastTone, { box: string; icon: typeof Info }> = {
  success: { box: 'border-accent/40 bg-surface-2 text-success', icon: CircleCheck },
  error: { box: 'border-danger/50 bg-surface-2 text-danger', icon: CircleAlert },
  info: { box: 'border-info/40 bg-surface-2 text-info', icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++;
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex flex-col items-center gap-2 px-3"
      >
        {items.map((item) => {
          const config = TONE[item.tone];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'ov-pop pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-xl',
                config.box,
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm font-medium text-fg">{item.message}</p>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-md p-0.5 text-fg-muted transition-colors duration-150 hover:text-fg"
                aria-label={t('common.close')}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
