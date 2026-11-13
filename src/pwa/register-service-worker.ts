import { usePwaStore } from './pwa-store';

const SW_URL = '/sw.js';
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

let started = false;
let registration: ServiceWorkerRegistration | null = null;
let reloading = false;

function announceWaiting(reg: ServiceWorkerRegistration): void {
  if (reg.waiting && navigator.serviceWorker.controller) {
    usePwaStore.getState().setNeedRefresh(true);
  }
}

/**
 * Registers the generated service worker in production only. The worker
 * precaches every build asset, so a reload without a network renders the full
 * app. A waiting worker is surfaced through the PWA store instead of activating
 * silently; the operator decides when to reload.
 */
export function registerServiceWorker(): void {
  if (started || !import.meta.env.PROD) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  started = true;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  void navigator.serviceWorker
    .register(SW_URL, { scope: '/' })
    .then((reg) => {
      registration = reg;
      announceWaiting(reg);

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') announceWaiting(reg);
        });
      });

      void navigator.serviceWorker.ready.then(() => {
        usePwaStore.getState().setOfflineReady(true);
      });

      window.setInterval(() => {
        void reg.update().catch(() => undefined);
      }, UPDATE_INTERVAL_MS);

      usePwaStore.getState().setApplyUpdate(async () => {
        const target = registration?.waiting;
        if (!target) return;
        target.postMessage({ type: 'SKIP_WAITING' });
      });
    })
    .catch(() => {
      usePwaStore.getState().setRegistrationFailed(true);
    });
}
