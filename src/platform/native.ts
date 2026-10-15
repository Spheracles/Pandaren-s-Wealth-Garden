/**
 * Thin wrapper around Capacitor plugins. Every call degrades gracefully in a
 * normal browser so the same code runs as a web app and inside the APK.
 */
import { Capacitor, SystemBars, SystemBarsStyle, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

const reducedMotion = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
/** Low-end devices get fewer animated elements (≤4 cores or ≤3 GB RAM reported). */
export const lowPower = ((navigator.hardwareConcurrency || 8) <= 4) || (((navigator as any).deviceMemory || 8) <= 3);
export const REDUCED = reducedMotion;

export async function initNative() {
  if (!isNative) return;
  try { await SystemBars.setStyle({ style: SystemBarsStyle.Dark }); } catch { /* older WebView: ignore */ }
}
export async function hideSplash() { if (isNative) { try { await SplashScreen.hide({ fadeOutDuration: 200 }); } catch { /* ignore */ } } }

export const haptic = {
  tap() { if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); },
  success() { if (isNative) Haptics.notification({ type: NotificationType.Success }).catch(() => {}); },
  warn() { if (isNative) Haptics.notification({ type: NotificationType.Warning }).catch(() => {}); },
};

type Off = () => void;
const handleOff = (p: Promise<PluginListenerHandle>): Off => () => { p.then(h => h.remove()).catch(() => {}); };

/** Android hardware/gesture back. The callback decides what "back" means at that moment. */
export function onBackButton(cb: () => void): Off {
  if (!isNative) return () => {};
  return handleOff(App.addListener('backButton', () => cb()));
}
/** Leaves the app without killing it, so the session is restored on reopen. */
export function leaveApp() { if (isNative) App.minimizeApp().catch(() => App.exitApp()); }

export function onAppState(cb: (active: boolean) => void): Off {
  if (isNative) return handleOff(App.addListener('appStateChange', s => cb(s.isActive)));
  const h = () => cb(document.visibilityState === 'visible');
  document.addEventListener('visibilitychange', h);
  return () => document.removeEventListener('visibilitychange', h);
}

export async function getOnline(): Promise<boolean> {
  if (isNative) { try { return (await Network.getStatus()).connected; } catch { return navigator.onLine; } }
  return navigator.onLine;
}
export function onNetwork(cb: (online: boolean) => void): Off {
  if (isNative) return handleOff(Network.addListener('networkStatusChange', s => cb(s.connected)));
  const on = () => cb(true), off = () => cb(false);
  window.addEventListener('online', on); window.addEventListener('offline', off);
  return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
}

/** Keeps the focused field visible above the soft keyboard. */
export function installKeyboardAssist(): Off {
  const reveal = () => {
    const el = document.activeElement as HTMLElement | null;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' }), 60);
  };
  document.addEventListener('focusin', reveal);
  const offs: Off[] = [() => document.removeEventListener('focusin', reveal)];
  if (isNative) {
    offs.push(handleOff(Keyboard.addListener('keyboardDidShow', () => { document.body.classList.add('kb-open'); reveal(); })));
    offs.push(handleOff(Keyboard.addListener('keyboardDidHide', () => document.body.classList.remove('kb-open'))));
  }
  return () => offs.forEach(f => f());
}

/**
 * Android: share from app-private cache through the system share sheet.
 * PWA/browser: download JSON or CSV directly, without uploading financial data.
 * Returns false when browser download is unavailable; caller can offer copying.
 */
export async function shareTextFile(name: string, content: string): Promise<boolean> {
  if (!isNative) {
    if (!('download' in document.createElement('a')) || !URL.createObjectURL) return false;
    const mime = name.endsWith('.csv') ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.style.display = 'none';
      document.body.append(link);
      link.click();
      link.remove();
      return true;
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  }
  const res = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: name, files: [res.uri], dialogTitle: '匯出財富花園資料' });
  return true;
}
