/**
 * Boot: native setup → load + migrate stored data → render.
 * Fonts are bundled (no Google Fonts request), so the APK works fully offline.
 */
import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/chakra-petch/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import './styles/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/app.js';
import { loadState, loadUi } from './platform/storage';
import { initNative, hideSplash } from './platform/native';
import { registerPWA } from './platform/pwa';

// Record crashes locally (message + version only, never amounts) for support.
function recordCrash(msg) {
  try {
    const log = JSON.parse(localStorage.getItem('wg-crash') || '[]');
    log.push({ ts: new Date().toISOString(), msg: String(msg).slice(0, 300), v: __APP_VERSION__ });
    localStorage.setItem('wg-crash', JSON.stringify(log.slice(-20)));
  } catch { /* ignore */ }
}
window.addEventListener('error', e => recordCrash(e.message));
window.addEventListener('unhandledrejection', e => recordCrash(e.reason && e.reason.message || e.reason));

(async () => {
  const root = createRoot(document.getElementById('root'));
  try {
    await initNative();
    const [{ state, warning }, ui] = await Promise.all([loadState(), loadUi()]);
    root.render(React.createElement(App, { initial: state, initialPage: ui.page || 'dashboard', bootWarning: warning }));
    // Never block rendering or storage restoration on a Service Worker.
    void registerPWA();
  } catch (e) {
    recordCrash(e && e.message);
    await hideSplash();
    document.getElementById('root').innerHTML = '<div style="padding:24px;font-family:sans-serif"><h2>財富花園無法啟動</h2><p>本機資料沒有被修改。請完全關閉 App 後再開啟；若仍失敗，請回報版本 ' + __APP_VERSION__ + '。</p></div>';
  }
})();
