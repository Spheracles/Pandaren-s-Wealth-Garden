/* Entry point for the web / PWA build (GitHub Pages). */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { setTemplate } from './runtime/dc-runtime.js';
import TEMPLATE from '../build/template.gen.js';
import { Component } from '../build/logic.gen.js';
import { registerPWA, setupInstallPrompt } from './platform/pwa.js';

/* Record crashes locally (message + version only, never amounts) for support. */
function recordCrash(msg) {
  try {
    const log = JSON.parse(localStorage.getItem('wg-crash') || '[]');
    log.push({ ts: new Date().toISOString(), msg: String(msg).slice(0, 300), v: __APP_VERSION__ });
    localStorage.setItem('wg-crash', JSON.stringify(log.slice(-20)));
  } catch (e) { /* ignore */ }
}
window.addEventListener('error', (e) => recordCrash(e.message));
window.addEventListener('unhandledrejection', (e) => recordCrash((e.reason && e.reason.message) || e.reason));

/* Appearance defaults — the same values the design canvas uses.
   Optional URL overrides, e.g. ?glow=柔和&motion=0&scanlines=1&density=緊湊&accent=2EE6C8 */
function readProps() {
  const p = { accent: '#4FC3FF', glow: '標準', density: '舒適', scanlines: false, motion: true };
  try {
    const q = new URLSearchParams(window.location.search);
    const acc = q.get('accent');
    if (acc && /^#?[0-9a-fA-F]{6}$/.test(acc)) p.accent = acc[0] === '#' ? acc : '#' + acc;
    const glow = q.get('glow');
    if (glow === '柔和' || glow === '標準' || glow === '強烈') p.glow = glow;
    const dens = q.get('density');
    if (dens === '舒適' || dens === '緊湊') p.density = dens;
    if (q.has('scanlines')) p.scanlines = q.get('scanlines') !== '0';
    if (q.has('motion')) p.motion = q.get('motion') !== '0';
  } catch (e) { /* ignore */ }
  return p;
}

const STORE_KEYS = ['wealth-garden-design-v2', 'wealth-garden-state', 'wealth-garden-neon-v1'];

/* If rendering ever fails, show a calm screen that never touches the stored data,
   and offer to download whatever is stored as a backup file. */
class Guard extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { recordCrash(err && err.message); try { console.error('[WealthGarden]', err); } catch (e) { /* ignore */ } }
  backup() {
    try {
      const out = {};
      STORE_KEYS.forEach((k) => { const v = window.localStorage.getItem(k); if (v) out[k] = v; });
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'wealth-garden-backup.json';
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { /* ignore */ }
  }
  render() {
    if (!this.state.err) return this.props.children;
    const h = React.createElement;
    const box = { maxWidth: 560, margin: '12vh auto', padding: 28, borderRadius: 16, background: '#0C1630', border: '1px solid rgba(120,170,235,.22)', color: '#E8F3FF', fontFamily: '"Noto Sans TC", system-ui, sans-serif', lineHeight: 1.7 };
    const btn = { marginRight: 10, marginTop: 14, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(79,195,255,.48)', background: 'rgba(79,195,255,.13)', color: '#E8F3FF', cursor: 'pointer', font: 'inherit' };
    return h('div', { style: { minHeight: '100vh', background: '#050A17', padding: 16 } },
      h('div', { style: box, role: 'alert' },
        h('h1', { style: { fontSize: 20, margin: '0 0 8px' } }, '畫面發生錯誤'),
        h('p', { style: { color: '#A9BDD8', margin: 0 } }, '你的財務資料沒有被修改，仍保存在這個瀏覽器裡。可以重新整理頁面，或先下載一份備份。'),
        h('pre', { style: { whiteSpace: 'pre-wrap', color: '#F87171', fontSize: 12, marginTop: 12 } }, String(this.state.err && this.state.err.message || this.state.err)),
        h('button', { type: 'button', style: btn, onClick: () => window.location.reload() }, '重新整理'),
        h('button', { type: 'button', style: btn, onClick: () => this.backup() }, '下載本機資料備份')));
  }
}

setTemplate(TEMPLATE);
createRoot(document.getElementById('root')).render(
  React.createElement(Guard, null, React.createElement(Component, readProps()))
);
// Never block rendering or data loading on the Service Worker.
setupInstallPrompt();
void registerPWA();
