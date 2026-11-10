import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastApi {
  push: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastApi>({ push: () => undefined });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
