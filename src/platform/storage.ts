/**
 * Local persistence.
 * - Android: Capacitor Preferences (app-private SharedPreferences, excluded from
 *   Android auto-backup by the manifest). Survives APK updates signed with the same key.
 * - Web: localStorage.
 * Writes are debounced and flushed when the app goes to the background.
 * This is NOT the cloud database; multi-device sync arrives with the backend.
 */
import { Preferences } from '@capacitor/preferences';
import { isNative } from './native';
import { migrate, seed, type State } from '../engine/index';

const KEY = 'wealth-garden-state';
const LEGACY_WEB_KEY = 'wealth-garden-neon-v1'; // v1 web prototype
const UI_KEY = 'wealth-garden-ui';

async function getRaw(key: string): Promise<string | null> {
  if (isNative) return (await Preferences.get({ key })).value;
  try { return localStorage.getItem(key); } catch { return null; }
}
async function setRaw(key: string, value: string) {
  if (isNative) { await Preferences.set({ key, value }); return; }
  try { localStorage.setItem(key, value); } catch { /* quota / private mode */ }
}

export async function loadState(): Promise<{ state: State; source: 'stored' | 'migrated' | 'demo'; warning?: string }> {
  for (const key of [KEY, LEGACY_WEB_KEY]) {
    const raw = await getRaw(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const m = migrate(parsed);
      if (m) return { state: m, source: parsed.version === m.version && key === KEY ? 'stored' : 'migrated' };
      // Unreadable data is kept aside, never silently overwritten.
      await setRaw(KEY + '.corrupt.' + Date.now(), raw);
      return { state: seed(), source: 'demo', warning: '偵測到無法讀取的本機資料，已另存備份並載入示範資料。' };
    } catch {
      await setRaw(KEY + '.corrupt.' + Date.now(), raw);
      return { state: seed(), source: 'demo', warning: '本機資料格式損毀，已另存備份並載入示範資料。' };
    }
  }
  return { state: seed(), source: 'demo' };
}

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: State | null = null;
export function saveState(S: State) {
  pending = S;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 400);
}
export async function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!pending) return;
  const s = pending; pending = null;
  await setRaw(KEY, JSON.stringify(s));
}

export async function loadUi(): Promise<{ page?: string }> {
  try { return JSON.parse((await getRaw(UI_KEY)) || '{}'); } catch { return {}; }
}
export function saveUi(ui: { page?: string }) { setRaw(UI_KEY, JSON.stringify(ui)).catch(() => {}); }
