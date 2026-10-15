/** PWA-only install/update support. Never register a Service Worker in Capacitor. */
import { isNative } from './native';
import { flush } from './storage';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform?: string };
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}
let deferredInstall: InstallEvent | null = null;
const INSTALL_CHANGE = 'wealthgarden:pwa-install';

if (typeof window !== 'undefined' && !isNative) {
  window.addEventListener('beforeinstallprompt', evt => {
    evt.preventDefault();
    deferredInstall = evt as InstallEvent;
    window.dispatchEvent(new Event(INSTALL_CHANGE));
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    window.dispatchEvent(new Event(INSTALL_CHANGE));
  });
}

export const isPwaInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
export const isIosBrowser = () =>
  /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const canPromptPwaInstall = () => !!deferredInstall;
export function listenPwaInstallChange(fn: () => void) {
  window.addEventListener(INSTALL_CHANGE, fn);
  return () => window.removeEventListener(INSTALL_CHANGE, fn);
}
export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const evt = deferredInstall;
  if (!evt) return 'unavailable';
  deferredInstall = null;
  window.dispatchEvent(new Event(INSTALL_CHANGE));
  try {
    await evt.prompt(); // Must be called from a user-initiated click.
    return (await evt.userChoice).outcome;
  } catch {
    return 'unavailable';
  }
}

/**
 * A new worker waits until the user explicitly opts in. Financial edits are
 * flushed before reload; no automatic refresh in the middle of form editing.
 */
function offerUpdate(registration: ServiceWorkerRegistration) {
  if (!registration.waiting || !navigator.serviceWorker.controller || document.getElementById('wg-pwa-update')) return;
  const panel = document.createElement('aside');
  panel.id = 'wg-pwa-update';
  panel.setAttribute('role', 'status');
  panel.innerHTML = '<span>財富花園有新版本。請先完成正在輸入的內容，再選擇更新。</span>';
  const update = document.createElement('button');
  update.type = 'button';
  update.textContent = '立即更新';
  update.className = 'btn pri';
  update.addEventListener('click', async () => {
    update.disabled = true;
    update.textContent = '更新中…';
    try {
      await flush();
      let refreshed = false;
      const onControl = () => {
        if (refreshed) return;
        refreshed = true;
        location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControl, { once: true });
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      update.disabled = false;
      update.textContent = '重試更新';
    }
  });
  const later = document.createElement('button');
  later.type = 'button';
  later.textContent = '稍後';
  later.className = 'btn ghost';
  later.addEventListener('click', () => panel.remove());
  panel.append(update, later);
  document.body.append(panel);
}

export async function registerPWA() {
  if (isNative || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    if (registration.waiting) offerUpdate(registration);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') offerUpdate(registration);
      });
    });
    const check = () => { if (navigator.onLine) registration.update().catch(() => {}); };
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  } catch (err) {
    // Failure to register offline support must not stop financial data access.
    console.warn('財富花園 PWA 離線快取無法啟用：', err);
  }
}
