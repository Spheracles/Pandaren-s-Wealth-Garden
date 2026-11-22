/* =====================================================================
   WEALTH GARDEN — NEON CITY 2.0 · UI logic layer (web / PWA)
   Every money rule comes from the unit-tested engine (WGE = src/engine,
   unchanged from the Android project). This class only turns state into
   view values and user actions into engine calls.
   ===================================================================== */
var E = WGE;
var VERSION = '2.5.0';
var LS_KEY = 'wealth-garden-design-v2';
/* Earlier versions on this site: the v1 PWA ('wealth-garden-state') and the v1 web prototype.
   They are only read, never written or deleted, so going back to an older version stays possible. */
var LEGACY_KEYS = ['wealth-garden-state', 'wealth-garden-neon-v1'];

var IC = {
  grid: 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  triad: 'M12 3.5l8.5 15h-17z M12 10v4.5',
  vault: 'M3.5 7.5h17v12.5h-17z M3.5 7.5L6.5 4h11l3 3.5 M12 11.5v5 M9.5 14h5',
  leaf: 'M5 20c0-8.5 5-14.5 15-15.5-1 9.8-7 14.8-15 15.5z M5 20l7.5-7.5',
  flag: 'M5 21V4 M5 4.5h11l-2 3.8 2 3.7H5',
  chip: 'M7.5 7.5h9v9h-9z M9.5 2.5v3M14.5 2.5v3M9.5 18.5v3M14.5 18.5v3M2.5 9.5h3M2.5 14.5h3M18.5 9.5h3M18.5 14.5h3',
  chart: 'M3.5 20.5h17 M6.5 16.5v-5 M11 16.5V7.5 M15.5 16.5v-8 M20 16.5v-3',
  bell: 'M6 16.5v-5a6 6 0 1112 0v5l1.8 1.8H4.2z M10 21h4',
  gear: 'M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5.3 5.3l2 2M16.7 16.7l2 2M5.3 18.7l2-2M16.7 7.3l2-2',
  plus: 'M12 5v14M5 12h14',
  eye: 'M2.5 12S6.3 5.5 12 5.5 21.5 12 21.5 12 17.7 18.5 12 18.5 2.5 12 2.5 12z M12 14.8a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6z',
  eyeoff: 'M3 3l18 18 M10.6 6.1A9.8 9.8 0 0112 6c6 0 10 6 10 6a17 17 0 01-3.2 3.8 M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 004.4-1',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14z M20.5 20.5l-4.5-4.5',
  x: 'M6 6l12 12M18 6L6 18',
  panel: 'M3.5 4.5h17v15h-17z M15 4.5v15',
  check: 'M5 12.5l4.5 4.5L19.5 7',
  undo: 'M9 14L4 9l5-5 M4 9h11a5 5 0 010 10h-3',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  swap: 'M7 4L3 8l4 4 M3 8h14 M17 20l4-4-4-4 M21 16H7',
  bolt: 'M13 2.5L4.5 14h7l-1 7.5 8.5-11.5h-7z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l3.2 2',
  coin: 'M12 21a9 9 0 100-18 9 9 0 000 18z M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1.3 1.6 3 2 3 1 3 2-1.3 1.8-3 1.8-3-.8-3-1.8 M12 6v12',
  up: 'M12 19V5M5.5 11.5L12 5l6.5 6.5',
  down: 'M12 5v14M5.5 12.5L12 19l6.5-6.5',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z',
  terminal: 'M3.5 5h17v14h-17z M7 9.5l3 2.5-3 2.5 M12.5 15h4.5',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
  download: 'M12 4v12 M7 11l5 5 5-5 M4 20h16',
  copy: 'M8 8h12v12H8z M4 16V4h12',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  prev: 'M15 18l-6-6 6-6',
  next: 'M9 6l6 6-6 6',
  wifi: 'M2 2l20 20 M8.5 16.5a5 5 0 017 0 M5 12.9a10 10 0 015.2-2.7 M19 12.9a10 10 0 00-2.4-1.6 M12 20h.01',
  sound: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4z M15.5 9a4.2 4.2 0 010 6 M18 6.5a7.8 7.8 0 010 11',
  mute: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4z M16 9.5l5 5 M21 9.5l-5 5',
  cloud: 'M7 18.5h10.5a4 4 0 00.6-7.95A5.5 5.5 0 007.2 9.6 4.5 4.5 0 007 18.5z',
  signal: 'M5 19v-2 M9.5 19v-5 M14 19v-8 M18.5 19V8',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18z M9.5 9.2a2.6 2.6 0 015 .9c0 1.7-2.5 2.3-2.5 4 M12 17.2h.01'
};

var NAV_GROUPS = [
  { label: 'OVERVIEW · 總覽', items: [['dashboard', '總覽控制台', 'DASH', 'grid']] },
  { label: 'LEDGER · 帳務', items: [['ledger', '收入與支出', 'LEDGER', 'list'], ['resources', '三維資源', 'MATRIX', 'triad'], ['assets', '資產與負債', 'ASSETS', 'vault']] },
  { label: 'GROWTH · 培育', items: [['garden', '財富花園', 'GARDEN', 'leaf'], ['projects', '資產培育計畫', 'PROJECTS', 'flag']] },
  { label: 'INTEL · 智慧', items: [['ai', 'AI 財富策略師', 'AI.CORE', 'chip'], ['reports', '分析報告', 'REPORTS', 'chart'], ['notifications', '通知中心', 'ALERTS', 'bell']] },
  { label: 'SYSTEM · 系統', items: [['settings', '系統設定', 'SYS', 'gear']] }
];
var NAV_FLAT = [];
NAV_GROUPS.forEach(function (g) { g.items.forEach(function (i) { NAV_FLAT.push(i); }); });
var MOBILE_TABS = [['dashboard', '控制台', 'grid'], ['ledger', '記帳', 'list'], ['garden', '花園', 'leaf'], ['ai', '策略師', 'chip']];
var PAGE_VM = { dashboard: 'vmDash', ledger: 'vmLedger', resources: 'vmRes', assets: 'vmAssets', garden: 'vmGarden', projects: 'vmProjects', ai: 'vmAI', reports: 'vmReports', notifications: 'vmNotes', settings: 'vmSettings' };

/* Calmer data palette: same hues as NEON CITY, lower chroma, readable on the dark ground. */
var CAT = ['#00707E', '#B35400', '#5B2C91', '#0A6B45', '#8A6400', '#1F4E9E', '#A3122A', '#9A1F6B', '#3D6E91', '#6B7A00', '#C24A1A', '#4A5560'];
var catCol = function (c, list) { return CAT[Math.max(0, list.indexOf(c)) % CAT.length]; };
var STAGE_C = { seed: '#1F4E9E', sprout: '#004750', bud: '#4A2380', bloom: '#7A1250', stable: '#06472D', dormant: '#3A4048', amber: '#5C3500', specimen: '#3A4048' };
var STAGE_DESC = { seed: '新建立或構想', sprout: '持續投入中', bud: '有已驗證的階段成果', bloom: '所有里程碑已驗證', stable: '近期有實際持續收入', dormant: '暫停中', amber: '超出預算或標記風險', specimen: '已終止，保留紀錄' };
var GROUP_COL = { cash: '#00707E', bank: '#5B2C91', invest: '#9A1F6B', realestate: '#8A6400', other: '#0A6B45' };
/* cockpit system colour per section: nav lamps, HUD frame, top bar and panel edges follow it */
var SEC = { dashboard: '#35E0FF', ledger: '#FF9B3D', resources: '#B58CFF', assets: '#FFC93C', garden: '#4BE39A', projects: '#2EF2D0', ai: '#FF4FCF', reports: '#7FB2FF', notifications: '#FF8FB8', settings: '#FFD25A' };

/* ---------- cockpit sound: mechanical servo, latch and switch sounds, synthesized with Web Audio ----------
   Nothing is downloaded. The audio context starts on the first click (browsers require a user gesture).
   The on/off choice is a per-browser preference ('wg-sfx'), not financial data. */
var SFX = (function () {
  var ctx = null, master = null, on = true;
  try { on = window.localStorage.getItem('wg-sfx') !== '0'; } catch (e) { /* default on */ }
  function ac() {
    if (!on) return null;
    try {
      if (!ctx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C(); master = ctx.createGain(); master.gain.value = 0.3; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function noise(c, dur) {
    var n = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = b; return s;
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function click(c, t, freq, vol, dur) {
    var s = noise(c, dur + 0.02), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 5; s.connect(f); f.connect(g); g.connect(master);
    env(g, t, 0.001, vol, dur); s.start(t); s.stop(t + dur + 0.03);
  }
  function thunk(c, t, freq, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 0.12);
    o.connect(g); g.connect(master); env(g, t, 0.004, vol, 0.14); o.start(t); o.stop(t + 0.22);
  }
  function servo(c, t, f0, f1, dur, vol) {
    var o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o2.frequency.setValueAtTime(f0 * 0.5, t); o2.frequency.exponentialRampToValueAtTime(f1 * 0.5, t + dur);
    f.type = 'lowpass'; f.frequency.value = 1300; f.Q.value = 2;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + Math.max(0.04, dur - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.03); o2.stop(t + dur + 0.03);
  }
  function hiss(c, t, dur, vol) {
    var s = noise(c, dur), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'highpass'; f.frequency.value = 2600; s.connect(f); f.connect(g); g.connect(master);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.start(t); s.stop(t + dur);
  }
  function chirp(c, t, f0, f1, dur, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(g); g.connect(master); env(g, t, 0.005, vol, dur); o.start(t); o.stop(t + dur + 0.05);
  }
  function play(fn) { var c = ac(); if (!c) return; try { fn(c, c.currentTime + 0.01); } catch (e) { /* audio is optional */ } }
  return {
    isOn: function () { return on; },
    toggle: function () { on = !on; try { window.localStorage.setItem('wg-sfx', on ? '1' : '0'); } catch (e) { /* ignore */ } if (on) this.flip(); return on; },
    /* heavy toggle switch: two-stage metal click */
    flip: function () { play(function (c, t) { click(c, t, 2600, 0.55, 0.012); click(c, t + 0.035, 1400, 0.4, 0.022); thunk(c, t + 0.03, 170, 0.22); }); },
    /* panels fold away: servo winding down, then a soft lock */
    retract: function () { play(function (c, t) { servo(c, t, 540, 170, 0.2, 0.075); thunk(c, t + 0.18, 115, 0.28); }); },
    /* panels slide in: air release, servo up, latch */
    deploy: function () { play(function (c, t) { hiss(c, t, 0.16, 0.045); servo(c, t + 0.02, 160, 580, 0.28, 0.07); click(c, t + 0.3, 1900, 0.45, 0.02); thunk(c, t + 0.31, 140, 0.3); }); },
    /* dialog hatch opens */
    hatch: function () { play(function (c, t) { hiss(c, t, 0.22, 0.06); servo(c, t, 220, 640, 0.22, 0.06); chirp(c, t + 0.2, 880, 1320, 0.09, 0.07); }); },
    /* dialog hatch closes */
    seal: function () { play(function (c, t) { servo(c, t, 520, 200, 0.14, 0.06); click(c, t + 0.13, 1600, 0.35, 0.018); thunk(c, t + 0.14, 120, 0.22); }); },
    /* small key press */
    tick: function () { play(function (c, t) { click(c, t, 3200, 0.3, 0.01); }); },
    /* status beep for messages */
    blip: function () { play(function (c, t) { chirp(c, t, 1320, 1760, 0.07, 0.06); }); }
  };
})();
function pad2(n) { return (n < 10 ? '0' : '') + n; }
var WEEK = ['週日 SUN', '週一 MON', '週二 TUE', '週三 WED', '週四 THU', '週五 FRI', '週六 SAT'];
/* greenhouse planting slots: x / bottom offset in % of the bed, scale; front row last so it draws on top */
var GH_SLOTS = [[50, 24, 0.86], [27, 28, 0.74], [73, 28, 0.74], [12, 34, 0.6], [88, 34, 0.6], [38, 12, 1], [62, 12, 1]];
var reducedMotion = (function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
var lowPower = ((typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 8) <= 4;

function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function loadData() {
  var keys = [LS_KEY].concat(LEGACY_KEYS);
  for (var i = 0; i < keys.length; i++) {
    var raw = lsGet(keys[i]);
    if (!raw) continue;
    var m = null;
    try { m = E.migrate(JSON.parse(raw)); } catch (e) { m = null; }
    if (m) return { data: m, source: i === 0 ? 'stored' : 'migrated' };
    /* Unreadable current data is kept aside before anything can overwrite it. */
    if (i === 0) lsSet(LS_KEY + '.corrupt.' + Date.now(), raw);
  }
  return { data: E.seed(), source: 'demo' };
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function hexA(hex, a) {
  var h = String(hex || '#00707E').replace('#', '');
  if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  var n = parseInt(h, 16); if (isNaN(n)) n = 0x4FC3FF;
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

/* ---------- chart geometry (pure) ---------- */
function niceTicks(mn, mx, n) {
  var span = mx - mn || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  var st = [1, 2, 2.5, 5, 10].map(function (x) { return x * mag; }).find(function (x) { return x >= raw; });
  var lo = Math.floor(mn / st) * st, hi = Math.ceil(mx / st) * st, t = [];
  for (var v = lo; v <= hi + st / 2; v += st) t.push(Math.round(v));
  return t;
}
function lineChart(id, labels, series, o) {
  o = o || {};
  var H = o.h || 220, W = 1000, padT = 10, padB = 10;
  var all = [];
  series.forEach(function (s) { s.values.forEach(function (v) { if (v != null) all.push(v); }); });
  var mn = Math.min.apply(null, [0].concat(all)), mx = Math.max.apply(null, [0].concat(all));
  if (mx === mn) mx = mn + 100;
  var ticks = niceTicks(mn, mx, 4); mn = ticks[0]; mx = ticks[ticks.length - 1];
  var n = labels.length;
  var x = function (i) { return n <= 1 ? W / 2 : i * W / (n - 1); };
  var y = function (v) { return padT + (mx - v) * (H - padT - padB) / (mx - mn); };
  var yfmt = o.yfmt || E.fmtK;
  var out = { id: id, h: H, vb: '0 0 ' + W + ' ' + H, dots: [], hdots: [], tipRows: [] };
  out.grid = ticks.map(function (t) { return 'M0 ' + y(t).toFixed(1) + 'H' + W; }).join(' ');
  out.zero = (mn < 0 && mx > 0) ? 'M0 ' + y(0).toFixed(1) + 'H' + W : '';
  out.yt = ticks.map(function (t) { return { label: o.mask ? '•••' : yfmt(t), top: (y(t) / H * 100).toFixed(2) }; });
  var every = Math.max(1, Math.ceil(n / 4)), xt = [];
  labels.forEach(function (l, i) {
    var last = i === n - 1;
    if (i % every === 0 && !(i !== 0 && !last && n - 1 - i <= every * 0.85)) xt.push({ label: l, left: (x(i) / W * 100).toFixed(2), cls: i === 0 ? 'a0' : 'am' });
    else if (last) xt.push({ label: l, left: (x(i) / W * 100).toFixed(2), cls: 'a1' });
  });
  if (xt.length && xt[0].cls !== 'a0') xt[0].cls = 'a0';
  if (xt.length > 1) xt[xt.length - 1].cls = 'a1';
  out.xt = xt;
  ['s0', 's1', 's2'].forEach(function (k, si) {
    var s = series[si];
    if (!s) { out[k] = { line: '', area: '', color: 'transparent', dash: 'none', w: 0 }; return; }
    var pts = [];
    s.values.forEach(function (v, i) { if (v != null) pts.push([x(i), y(v)]); });
    var line = pts.map(function (p, j) { return (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var base = y(Math.max(mn, 0));
    var area = (s.area !== false && pts.length > 1) ? line + 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + base.toFixed(1) + 'L' + pts[0][0].toFixed(1) + ' ' + base.toFixed(1) + 'Z' : '';
    out[k] = { line: line, area: area, color: s.color, dash: s.dash || 'none', w: s.width || 2 };
    if (pts.length) { var p = pts[pts.length - 1]; out.dots.push({ left: (p[0] / W * 100).toFixed(2), top: (p[1] / H * 100).toFixed(2), color: s.color }); }
  });
  var hi = o.hover;
  out.hover = hi != null && hi >= 0 && hi < n;
  out.hline = '';
  out.tipLeft = '0'; out.tipTitle = '';
  if (out.hover) {
    out.hline = 'M' + x(hi).toFixed(1) + ' 0V' + H;
    var px = x(hi) / W * 100;
    out.tipLeft = Math.min(70, Math.max(0, px - 12)).toFixed(1);
    out.tipTitle = labels[hi];
    out.tipRows = series.map(function (s) { return { name: s.name, color: s.color, val: o.mask ? '•••' : (s.fmt ? s.fmt(s.values[hi]) : E.fmt(s.values[hi])) }; });
    out.hdots = series.filter(function (s) { return s.values[hi] != null; }).map(function (s) { return { left: px.toFixed(2), top: (y(s.values[hi]) / H * 100).toFixed(2), color: s.color }; });
  }
  out.legend = series.map(function (s) { return { name: s.name, color: s.color, dashed: !!s.dash }; });
  return out;
}
function spark(values) {
  var v = values.filter(function (x) { return x != null; });
  if (v.length < 2) return '';
  var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), sp = mx - mn || 1;
  return values.map(function (x, i) { return ((i / (values.length - 1)) * 100).toFixed(1) + ',' + (26 - ((x - mn) / sp) * 22).toFixed(1); }).join(' ');
}
function circ(cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0Z'; }
function ellipsePath(cx, cy, rx, ry, rot) {
  var a = rot * Math.PI / 180, dx = -Math.sin(a) * ry, dy = Math.cos(a) * ry;
  var x1 = (cx + dx).toFixed(2), y1 = (cy + dy).toFixed(2), x2 = (cx - dx).toFixed(2), y2 = (cy - dy).toFixed(2);
  return 'M' + x1 + ' ' + y1 + 'A' + rx + ' ' + ry + ' ' + rot + ' 1 0 ' + x2 + ' ' + y2 + 'A' + rx + ' ' + ry + ' ' + rot + ' 1 0 ' + x1 + ' ' + y1 + 'Z';
}
/** Plant drawing for a growth stage: every shape is a computed path, so one SVG serves all stages. */
function plantVM(stage, opts) {
  opts = opts || {};
  var c = STAGE_C[stage] || '#00707E';
  var h = { seed: 14, sprout: 34, bud: 44, bloom: 48, stable: 52, dormant: 28, amber: 36, specimen: 34 }[stage] || 20;
  var nl = { seed: 1, sprout: 3, bud: 4, bloom: 4, stable: 6, dormant: 2, amber: 3, specimen: 2 }[stage] || 1;
  var base = 82, top = base - h, leaves = '';
  for (var i = 0; i < nl; i++) {
    var yy = base - 6 - (i + 1) * (h - 8) / (nl + 1), dir = i % 2 ? 1 : -1;
    leaves += 'M50 ' + yy.toFixed(1) + ' q ' + (dir * 10) + ' -8 ' + (dir * 16) + ' -2 q ' + (-dir * 8) + ' 6 ' + (-dir * 16) + ' 2z ';
  }
  var head = '', core = '', ring = '', mark = '';
  if (stage === 'seed') head = circ(50, top, 4);
  if (stage === 'bud') head = ellipsePath(50, top - 4, 5, 8, 0);
  if (stage === 'bloom') {
    for (var k = 0; k < 6; k++) { var A = k * 60, rad = A * Math.PI / 180; head += ellipsePath(50 + 9 * Math.sin(rad), top - 9 * Math.cos(rad), 4.5, 9, A) + ' '; }
    core = circ(50, top, 4);
  }
  if (stage === 'stable') { head = circ(50, top - 4, 9); ring = circ(50, top - 4, 15); }
  if (stage === 'amber') mark = 'M50 ' + (top - 12) + ' l7 12 h-14z';
  var dim = stage === 'dormant' || stage === 'specimen';
  var sway = opts.animate !== false && !reducedMotion && !lowPower && !dim;
  return {
    c: c, stem: 'M50 ' + base + ' C 48 ' + (base - h / 2) + ', 52 ' + (base - h / 2) + ', 50 ' + top, leaves: leaves,
    leafOp: dim ? 0.35 : 0.78, head: head, core: core, ring: ring, mark: mark,
    zOp: stage === 'dormant' ? 1 : 0, zY: top - 2, frameOp: stage === 'specimen' ? 0.6 : 0,
    glow: dim ? 'none' : 'drop-shadow(0 0 2px ' + c + ')', glowH: dim ? 'none' : 'drop-shadow(0 0 6px ' + c + ')',
    sway: sway ? 'sway' : '', grow: opts.grow ? 'sprung' : '', stageLabel: E.STAGES[stage], stage: stage
  };
}
function cashSeries(D, range) {
  var T = D.T;
  if (range === '365') {
    var m = D.months;
    return { labels: m.map(function (x) { return x.k.slice(2).replace('-', '/'); }), inc: m.map(function (x) { return x.inc + x.real; }), exp: m.map(function (x) { return x.exp; }), net: m.map(function (x) { return x.net; }), unit: '每點 = 1 個月' };
  }
  var days = Number(range), bucket = range === '90' ? 7 : 1, labels = [], inc = [], exp = [], net = [];
  for (var s = days - 1; s >= 0; s -= bucket) {
    var from = E.addDays(T, -s), end = E.addDays(from, bucket - 1);
    if (end > T) end = T;
    var f = D.flow(from, end);
    labels.push(from.slice(5).replace('-', '/')); inc.push(f.inc + f.real); exp.push(f.exp); net.push(f.net);
  }
  return { labels: labels, inc: inc, exp: exp, net: net, unit: bucket === 7 ? '每點 = 1 週' : '每點 = 1 日' };
}
function maskMoney(text) { return String(text).replace(/(NT\$|US\$|HK\$|¥)[\d,.]+/g, '•••'); }

class Component extends DCLogic {
  constructor(...args) {
    super(...args);
    var L = loadData(), T = E.todayISO();
    this.state = {
      data: L.data, src: L.source, page: 'dashboard', projSel: null, plantSel: null, modal: null, toasts: [], hov: null,
      dashRange: '30', donutPick: null,
      lq: '', ltype: '', lcat: '', lacct: '', lfrom: E.addDays(T, -89), lto: T, ltab: 'list', llimit: 60, recon: {},
      rwin: '30', ratesDraft: null, newCur: '',
      gwin: '90', starPick: null,
      aiLines: null, aiQ: '', aiBusy: false,
      repMonth: E.addMonths(E.monthKey(T), -1), repGen: false,
      hourlyDraft: null, budDraft: null, budNew: '', catKind: 'expense', catName: '', impPaste: '', impErr: '', impDef: '',
      msName: '', taskName: '',
      cmdQ: '', cmdIx: 0, online: true, tw: null, rail: true, grew: null, noStore: false,
      now: new Date(), pgOut: false, sfx: SFX.isOn(), desk: (function () { try { return window.localStorage.getItem('wg-desk') !== '0'; } catch (e) { return true; } })()
    };
    this._fh = {}; this._sh = {}; this._mh = {}; this._vm = {}; this._D = null; this._DK = null;
    this._timers = []; this._saveT = null; this._achPrev = null; this._pulse = null; this._raf = null;
    this.noop = function () {};
    this.leaveH = () => { if (this.state.hov) this.setState({ hov: null }); };
    this.h = this.handlers();
    this.go = {};
    NAV_FLAT.forEach((n) => { this.go[n[0]] = () => this.nav(n[0]); });
  }

  /* ---------- lifecycle & persistence ---------- */
  componentDidMount() {
    this._onOn = () => this.setState({ online: true });
    this._onOff = () => this.setState({ online: false });
    try {
      window.addEventListener('online', this._onOn); window.addEventListener('offline', this._onOff);
      if (navigator.onLine === false) this.setState({ online: false });
      /* Save immediately when the page is hidden, closed, or about to reload for an update. */
      this._onHide = () => { if (this._saveT) this.flush(); };
      this._onVis = () => { if (document.visibilityState === 'hidden') this._onHide(); };
      window.addEventListener('pagehide', this._onHide);
      window.addEventListener('wealthgarden:flush', this._onHide);
      document.addEventListener('visibilitychange', this._onVis);
    } catch (e) { /* no window events in this host */ }
    var D = this.getD();
    this._achPrev = D.ach.filter(function (a) { return a.done; }).map(function (a) { return a.id; });
    this._pulse = this.pulseVals(D);
    this._clock = setInterval(() => this.setState({ now: new Date() }), 20000);
  }
  componentWillUnmount() {
    try {
      window.removeEventListener('online', this._onOn); window.removeEventListener('offline', this._onOff);
      window.removeEventListener('pagehide', this._onHide); window.removeEventListener('wealthgarden:flush', this._onHide);
      document.removeEventListener('visibilitychange', this._onVis);
    } catch (e) { /* ignore */ }
    this._timers.forEach(function (t) { clearTimeout(t); });
    if (this._clock) clearInterval(this._clock);
    if (this._navT) clearTimeout(this._navT);
    if (this._raf) cancelAnimationFrame(this._raf);
    this.flush();
  }
  componentDidUpdate(pp, ps) {
    if (ps.aiLines !== this.state.aiLines) {
      try { var term = document.querySelector('.term'); if (term) term.scrollTop = term.scrollHeight; } catch (e) { /* ignore */ }
    }
    var mk = this.state.modal && this.state.modal.kind, pmk = ps.modal && ps.modal.kind;
    if (mk && mk !== pmk) {
      try { var first = document.querySelector(mk === 'cmd' ? '.cmd .inp' : '.dlg .inp, .dlg .pk, .dlg .btn.pri'); if (first) first.focus(); } catch (e) { /* ignore */ }
    }
    if (ps.data === this.state.data) return;
    this.scheduleSave();
    var D = this.getD();
    var done = D.ach.filter(function (a) { return a.done; }).map(function (a) { return a.id; });
    var prev = this._achPrev || [];
    done.filter(function (x) { return prev.indexOf(x) < 0; }).forEach((id) => {
      var a = D.ach.find(function (z) { return z.id === id; });
      this.toast('成就達成：' + a.name, null, true);
    });
    this._achPrev = done;
    this.tweenPulse(D);
  }
  scheduleSave() {
    if (this._saveT) clearTimeout(this._saveT);
    this._saveT = setTimeout(() => this.flush(), 400);
  }
  flush() {
    if (this._saveT) { clearTimeout(this._saveT); this._saveT = null; }
    var ok = lsSet(LS_KEY, JSON.stringify(this.state.data));
    if (!ok && !this.state.noStore) this.setState({ noStore: true });
  }
  motionOn() { return this.props.motion !== false; }
  pulseVals(D) { return { net: D.now.net, assets: D.now.assets, liab: D.now.liab, inc: D.month.inc, exp: D.month.exp, cf: D.month.net }; }
  tweenPulse(D) {
    var to = this.pulseVals(D), from = this._pulse; this._pulse = to;
    if (!from || reducedMotion || !this.motionOn() || typeof requestAnimationFrame === 'undefined') return;
    if (!Object.keys(to).some(function (k) { return to[k] !== from[k]; })) return;
    if (this._raf) cancelAnimationFrame(this._raf);
    var t0 = performance.now();
    var step = (t) => {
      var k = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - k, 3), v = {};
      Object.keys(to).forEach(function (key) { v[key] = Math.round(from[key] + (to[key] - from[key]) * e); });
      this.setState({ tw: k < 1 ? v : null });
      this._raf = k < 1 ? requestAnimationFrame(step) : null;
    };
    this._raf = requestAnimationFrame(step);
  }
  getD() {
    if (this._DK !== this.state.data) { this._D = E.compute(this.state.data); this._DK = this.state.data; }
    return this._D;
  }
  M(c, cur, sign) { return this.state.data.privacy ? '••••••' : E.fmt(c, cur || 'TWD', !!sign); }
  accent() { var a = this.props.accent; return (typeof a === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(a)) ? a : '#004750'; }

  /* ---------- state helpers ---------- */
  upd(fn, audit) {
    this.setState(function (st) {
      var s = clone(st.data); fn(s);
      if (audit) s.audit.push(Object.assign({ id: E.uid(), ts: E.nowTs() }, audit));
      return { data: s };
    });
  }
  replaceData(next, label) {
    next.audit = (next.audit || []).concat([{ id: E.uid(), ts: E.nowTs(), action: '系統', entity: 'system', detail: label }]);
    this.setState({ data: next, page: 'dashboard', projSel: null, plantSel: null, modal: null, recon: {}, ratesDraft: null, budDraft: null, hourlyDraft: null });
  }
  toast(msg, action, ach) {
    var id = E.uid();
    SFX.blip();
    this.setState(function (st) { return { toasts: st.toasts.concat([{ id: id, msg: msg, action: action || null, ach: !!ach }]) }; });
    this._timers.push(setTimeout(() => this.setState(function (st) { return { toasts: st.toasts.filter(function (t) { return t.id !== id; }) }; }), action ? 7000 : 3800));
  }
  nav(p, focus) {
    var go = () => {
      this._navT = null;
      this.setState(function (st) {
        return { page: p, pgOut: false, modal: null, hov: null, projSel: p === 'projects' ? (focus || null) : st.projSel, plantSel: p === 'garden' ? (focus || st.plantSel) : st.plantSel };
      });
      try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
    };
    var same = p === this.state.page && !this._navT;
    if (!same) SFX.flip();
    if (same || reducedMotion || !this.motionOn()) { go(); if (!same) SFX.deploy(); return; }
    /* panels and instruments fold away first (about 0.2 s), then the next console deploys */
    if (this._navT) clearTimeout(this._navT);
    else { SFX.retract(); this.setState({ pgOut: true, modal: null }); }
    this._navT = setTimeout(() => { go(); SFX.deploy(); }, 220);
  }
  setModal0(m) { if (!this.state.modal) SFX.hatch(); this.setState({ modal: Object.assign({ errs: [] }, m) }); }
  setModal(patch) { this.setState(function (st) { return st.modal ? { modal: Object.assign({}, st.modal, patch) } : null; }); }
  setForm(patch) { this.setState(function (st) { return st.modal ? { modal: Object.assign({}, st.modal, { form: Object.assign({}, st.modal.form, patch) }) } : null; }); }
  closeModal() { if (this.state.modal) SFX.seal(); this.setState({ modal: null }); }
  /** Cached change handler for a form field of the open dialog. */
  fld(k) {
    if (!this._fh[k]) this._fh[k] = (e) => { var t = e && e.target; this.setForm({ [k]: t ? (t.type === 'checkbox' ? t.checked : t.value) : e }); };
    return this._fh[k];
  }
  /** Cached change handler for a top-level UI state field. */
  sf(k, after) {
    var key = k + (after ? ':a' : '');
    if (!this._sh[key]) this._sh[key] = (e) => { var t = e && e.target; var v = t ? (t.type === 'checkbox' ? t.checked : t.value) : e; var o = { [k]: v }; if (after) Object.assign(o, after); this.setState(o); };
    return this._sh[key];
  }
  confirm(title, body, ok, danger) { this.setModal0({ kind: 'confirm', title: title, body: body, ok: ok, danger: !!danger }); }
  seg(opts, cur, set) { return opts.map(function (o) { return { label: o[1], cls: o[0] === cur ? 'on' : '', pressed: o[0] === cur ? 'true' : 'false', pick: function () { if (o[0] !== cur) SFX.tick(); set(o[0]); } }; }); }
  chart(id, labels, series, o) {
    o = o || {};
    var hv = this.state.hov;
    var c = lineChart(id, labels, series, { h: o.h, yfmt: o.yfmt, hover: hv && hv.id === id ? hv.i : null, mask: !!this.state.data.privacy });
    c.move = this.moveH(id, labels.length); c.leave = this.leaveH;
    return c;
  }
  moveH(id, n) {
    var k = id + ':' + n;
    if (!this._mh[k]) this._mh[k] = (e) => {
      var el = e.currentTarget; if (!el || !el.getBoundingClientRect) return;
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var i = n <= 1 ? 0 : Math.round((e.clientX - r.left) / r.width * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      var hv = this.state.hov;
      if (!hv || hv.id !== id || hv.i !== i) this.setState({ hov: { id: id, i: i } });
    };
    return this._mh[k];
  }
  bars(entries, total, colorFn, onPick, fmtFn) {
    var mx = Math.max.apply(null, [1].concat(entries.map(function (e) { return Math.abs(e[1]); })));
    return entries.map((e) => ({
      label: e[0], w: (Math.abs(e[1]) / mx * 100).toFixed(1), color: colorFn(e[0]),
      val: fmtFn ? fmtFn(e[1]) : this.M(e[1]), pct: total ? Math.round(e[1] / total * 100) + '%' : '',
      pick: onPick ? function () { onPick(e[0]); } : this.noop, clickable: onPick ? 'click' : ''
    }));
  }
  txRow(t) {
    var S = this.state.data;
    var a = S.accounts.find(function (x) { return x.id === (t.acct || t.from); });
    var b = t.to && S.accounts.find(function (x) { return x.id === t.to; });
    var sign = ['income', 'refund', 'realized'].indexOf(t.type) >= 0 ? 1 : t.type === 'expense' ? -1 : t.type === 'valuation' ? (t.amt >= 0 ? 1 : -1) : 0;
    var icn = { income: 'up', expense: 'down', refund: 'undo', transfer: 'swap', ccpay: 'swap', fx: 'swap', invest: 'swap', realized: 'coin', valuation: 'chart' }[t.type];
    var sub = t.type === 'fx' ? '→ ' + this.M(t.toAmt, t.toCur) : t.cur !== 'TWD' ? '≈ ' + this.M(t.base) : '';
    return {
      id: t.id, desc: t.desc,
      meta: E.fmtD(t.date) + ' · ' + E.TYPES[t.type] + (t.cat ? ' · ' + t.cat : '') + ' · ' + (a ? a.name : '?') + (b ? ' → ' + b.name : '') + (t.snapshotCovered ? ' · 快照前紀錄' : ''),
      amt: sign === 0 ? this.M(t.amt, t.cur) : this.M(sign * Math.abs(t.amt), t.cur, true),
      cls: sign > 0 ? 'pos' : sign < 0 ? 'neg' : 'neu', ic: IC[icn], sub: sub,
      open: () => this.openTxDetail(t.id)
    };
  }
  plantItem(p, sel) {
    return Object.assign(plantVM(p.stage, { grow: this.state.grew === p.id }), {
      id: p.id, name: p.name, cls: sel === p.id ? 'on' : '', pressed: sel === p.id ? 'true' : 'false',
      pick: () => this.setState({ plantSel: p.id }), open: () => this.nav('garden', p.id)
    });
  }

  /* ---------- dialogs: open ---------- */
  openTx(init) {
    var S = this.state.data, accs = S.accounts.filter(function (a) { return !a.archived; });
    if (!accs.length) { this.toast('請先建立帳戶。'); this.nav('assets'); return; }
    init = init || {};
    var f = Object.assign({ type: 'expense', date: E.todayISO(), cat: '', acct: accs[0].id, from: '', to: '', desc: '', recurringAttr: false, reusable: false, withAct: false, minutes: '', energy: 0, kind: '其他', saveTpl: false }, init);
    f.amt = init.amt != null ? String(init.amt / 100) : '';
    f.toAmt = init.toAmt != null ? String(init.toAmt / 100) : '';
    f.alloc = (init.alloc || []).map(function (x) { return { pid: x.pid, pct: String(x.pct) }; });
    if (!f.acct && !E.TWO_LEG.includes(f.type)) f.acct = accs[0].id;
    this.setModal0({ kind: 'tx', title: init.id ? '編輯紀錄' : '新增紀錄', form: f });
  }
  openTxDetail(id) { this.setModal0({ kind: 'txd', id: id }); }
  openAct(init) {
    init = init || {};
    var f = Object.assign({ date: E.todayISO(), title: '', minutes: '', kind: '其他', energy: 0, saved: '' }, init);
    f.minutes = init.minutes != null ? String(init.minutes) : '';
    f.saved = init.saved ? String(init.saved) : '';
    f.alloc = (init.alloc || []).map(function (x) { return { pid: x.pid, pct: String(x.pct) }; });
    this.setModal0({ kind: 'act', title: init.id ? '編輯活動' : '記錄時間與心力', form: f });
  }
  openActDetail(id) { this.setModal0({ kind: 'actd', id: id }); }
  openProj(init, cb) {
    init = init || {};
    var f = Object.assign({ name: '', desc: '', goal: '', due: '', status: '構想', expected: '', riskFlag: false, risks: '' }, init);
    f.budget = init.budget != null ? String(init.budget / 100) : '';
    f.expectedAmt = init.expectedAmt != null ? String(init.expectedAmt / 100) : '';
    this.setModal0({ kind: 'proj', title: init.id ? '編輯專案' : '建立培育計畫', form: f, cb: cb || null });
  }
  openWizard() {
    this.setModal0({ kind: 'wiz', form: { i: 0, hourly: '', accounts: [{ name: '', kind: 'bank', cur: 'TWD', opening: '' }], assets: [{ name: '', type: 'other', value: '' }], liabs: [{ name: '', balance: '' }], importLater: true, goal: '', consent: { summary: false, projects: false, raw: false } } });
  }
  openExport(k) {
    var S = this.state.data, stamp = E.todayISO();
    var text = k === 'json' ? JSON.stringify({ app: 'wealth-garden', exportedAt: E.nowTs(), state: S }, null, 1) : E.toCSV(S);
    this.setModal0({ kind: 'export', title: k === 'json' ? '匯出完整備份（JSON）' : '匯出交易 CSV', text: text, name: k === 'json' ? 'WealthGarden-backup-' + stamp + '.json' : 'WealthGarden-transactions-' + stamp + '.csv' });
    this.upd(function () {}, { action: k === 'json' ? '匯出完整備份' : '匯出交易 CSV', entity: 'export', detail: stamp });
  }

  /* ---------- dialogs: submit ---------- */
  submitTx(e) {
    if (e && e.preventDefault) e.preventDefault();
    var S = this.state.data, f = this.state.modal.form, edit = !!f.id;
    var old = edit ? S.txs.find(function (t) { return t.id === f.id; }) : undefined;
    var r = E.buildTransaction(S, f, old); // shared, unit-tested rules
    var errs = r.errors.slice();
    if (f.withAct && !edit && !(Number(f.minutes) > 0)) errs.push('活動時間需大於 0 分鐘。');
    if (errs.length) { this.setModal({ errs: errs }); return; }
    var tx = r.tx, T = f.type;
    this.upd(function (s) {
      if (edit) { s.txs[s.txs.findIndex(function (t) { return t.id === tx.id; })] = tx; } else s.txs.push(tx);
      if (f.withAct && !edit) s.activities.push({ id: E.uid(), created: E.nowTs(), demo: false, date: f.date, title: tx.desc, minutes: Number(f.minutes), kind: f.kind, energy: Number(f.energy), saved: 0, txId: tx.id, alloc: tx.alloc });
      if (f.saveTpl) s.templates.push({ id: E.uid(), name: tx.desc, type: T, amt: tx.amt, cat: tx.cat, acct: tx.acct, desc: tx.desc });
    }, { action: edit ? '編輯交易' : '新增交易', entity: 'transactions', detail: E.TYPES[T] + '｜' + tx.desc + '｜' + E.fmt(tx.amt, tx.cur), before: old ? E.summTx(old) : undefined, after: E.summTx(tx) });
    this.closeModal();
    this.toast(edit ? '已更新紀錄，所有統計已重新計算。' : '已新增' + E.TYPES[T] + '。');
  }
  submitAct(e) {
    if (e && e.preventDefault) e.preventDefault();
    var S = this.state.data, f = this.state.modal.form, err = [];
    if (!String(f.title).trim()) err.push('請輸入活動名稱。');
    if (!(Number(f.minutes) > 0)) err.push('時間需大於 0 分鐘。');
    err = err.concat(E.validateAlloc(f.alloc));
    if (err.length) { this.setModal({ errs: err }); return; }
    var edit = !!f.id, old = edit ? S.activities.find(function (x) { return x.id === f.id; }) : null;
    var a = Object.assign({}, old || { id: E.uid(), created: E.nowTs(), demo: false }, { date: f.date, title: String(f.title).trim(), minutes: Number(f.minutes), kind: f.kind, energy: Number(f.energy), saved: Number(f.saved) || 0, alloc: f.alloc.map(function (x) { return { pid: x.pid, pct: Number(x.pct) }; }) });
    this.upd(function (s) { if (edit) s.activities[s.activities.findIndex(function (x) { return x.id === a.id; })] = a; else s.activities.push(a); },
      { action: edit ? '編輯活動' : '新增活動', entity: 'activities', detail: a.title + '｜' + E.fmtMin(a.minutes) + '｜心力 ' + a.energy });
    this.closeModal();
    this.toast(edit ? '活動已更新。' : '已記錄活動的時間與心力。');
  }
  submitProj(e) {
    if (e && e.preventDefault) e.preventDefault();
    var S = this.state.data, m = this.state.modal, f = m.form;
    if (!String(f.name).trim()) { this.setModal({ errs: ['請輸入專案名稱。'] }); return; }
    var budget = f.budget ? E.parseC(f.budget) : 0;
    if (isNaN(budget) || budget < 0) { this.setModal({ errs: ['預算格式不正確。'] }); return; }
    var edit = !!f.id, old = edit ? S.projects.find(function (x) { return x.id === f.id; }) : null, T = E.todayISO();
    var p = Object.assign({}, old || { id: E.uid(), created: T, tasks: [], milestones: [], history: [{ date: T, text: '建立計畫' }] },
      { name: String(f.name).trim(), desc: f.desc, goal: f.goal, due: f.due, status: f.status, budget: budget, expected: f.expected, expectedAmt: E.parseC(f.expectedAmt) || 0, riskFlag: !!f.riskFlag, risks: f.risks });
    if (old && old.status !== p.status) p.history = p.history.concat([{ date: T, text: '狀態變更：' + old.status + ' → ' + p.status }]);
    else if (old) p.history = p.history.concat([{ date: T, text: '計畫內容調整' }]);
    this.upd(function (s) { if (edit) s.projects[s.projects.findIndex(function (x) { return x.id === p.id; })] = p; else s.projects.push(p); },
      { action: edit ? '編輯專案' : '建立專案', entity: 'projects', detail: p.name });
    var cb = m.cb;
    this.closeModal();
    this.toast(edit ? '專案已更新。' : '已建立培育計畫。');
    if (cb) cb(p.id);
  }
  deleteTx(id) {
    var t = this.state.data.txs.find(function (x) { return x.id === id; });
    if (!t) return;
    this.confirm('刪除這筆紀錄？', '「' + t.desc + '」會移到回收區，統計會立即重新計算；可在「收入與支出 → 回收區」還原。', () => {
      this.upd(function (s) { s.txs.find(function (x) { return x.id === id; }).deleted = true; }, { action: '刪除交易（軟刪除）', entity: 'transactions', detail: t.desc + '｜' + E.fmt(t.amt, t.cur) });
      this.toast('已移到回收區。', { label: '復原', fn: () => this.restoreTx(id) });
    }, true);
  }
  restoreTx(id) {
    var t = this.state.data.txs.find(function (x) { return x.id === id; });
    this.upd(function (s) { s.txs.find(function (x) { return x.id === id; }).deleted = false; }, { action: '還原交易', entity: 'transactions', detail: t ? t.desc : id });
    this.toast('已還原紀錄。');
  }
  setProjectStatus(pid, v) {
    var p = this.state.data.projects.find(function (x) { return x.id === pid; });
    if (!p || p.status === v) return;
    this.confirm('變更專案狀態？', p.status + ' → ' + v + '。' + (v === '終止' ? '終止後仍保留所有既有成本與成果。' : ''), () => {
      this.upd(function (s) { var x = s.projects.find(function (y) { return y.id === pid; }); x.history = (x.history || []).concat([{ date: E.todayISO(), text: '狀態變更：' + x.status + ' → ' + v }]); x.status = v; },
        { action: '更新專案', entity: 'projects', detail: p.name + '｜狀態 ' + v });
    });
  }
  verifyMilestone(pid, mid) {
    var p = this.state.data.projects.find(function (x) { return x.id === pid; });
    var ms = p && p.milestones.find(function (x) { return x.id === mid; });
    if (!ms) return;
    this.confirm('確認並驗證里程碑？', '「' + ms.name + '」將標記為已驗證成果，植物會依此成長。請確認你能提出可檢查的成果（作品、連結、收據等）。', () => {
      this.upd(function (s) { var x = s.projects.find(function (y) { return y.id === pid; }); var y = x.milestones.find(function (z) { return z.id === mid; }); y.done = true; y.verified = true; y.date = E.todayISO(); x.history = (x.history || []).concat([{ date: E.todayISO(), text: '里程碑「' + ms.name + '」經使用者確認驗證' }]); },
        { action: '驗證里程碑', entity: 'project_milestones', detail: p.name + '｜' + ms.name });
      this.setState({ grew: 'p:' + pid });
      this._timers.push(setTimeout(() => this.setState({ grew: null }), 1200));
      this.toast('里程碑已驗證，植物已更新。', null, true);
    });
  }
  decide(sid, d) {
    var title = (this.state.data.suggestions.find(function (x) { return x.id === sid; }) || {}).title;
    var run = () => { this.setState(function (st) { return { data: E.decideSuggestion(st.data, sid, d).state }; }); this.toast(d === 'approve' ? '已核准並建立計畫。' : '已駁回草案。'); };
    if (d === 'approve') this.confirm('核准並建立正式計畫？', '會建立專案「' + title + '」，狀態為「構想」。預估效益只記為預測，不會寫成實際收入；任何交易、帳戶與資產數值都不會被修改。', run);
    else run();
  }
  readFile(e, cb) {
    var t = e && e.target, fl = t && t.files && t.files[0];
    if (!fl) return;
    var r = new FileReader();
    r.onload = function () { cb(String(r.result || ''), fl.name); };
    r.onerror = () => this.toast('檔案無法讀取。');
    r.readAsText(fl);
    try { t.value = ''; } catch (x) { /* ignore */ }
  }
  analyzeImport(text) {
    var S = this.state.data, def = this.state.impDef || (S.accounts[0] && S.accounts[0].id) || '';
    if (!S.accounts.length) { this.setState({ impErr: '請先建立帳戶，匯入的紀錄需要對應帳戶。' }); return; }
    var r = E.analyzeImport(S, text, def);
    if (r.error) { this.setState({ impErr: r.error }); return; }
    this.setState({ impErr: '' });
    this.setModal0({ kind: 'imp', rows: r.rows });
  }
  runCommand(c) { this.setState({ modal: null }); this._timers.push(setTimeout(c.fn, 0)); }
  commands() {
    var s = this;
    return [
      ['/dashboard', '總覽控制台', function () { s.nav('dashboard'); }], ['/income', '新增收入', function () { s.openTx({ type: 'income' }); }],
      ['/expense', '新增支出', function () { s.openTx({ type: 'expense' }); }], ['/transfer', '帳戶轉帳／繳卡費', function () { s.openTx({ type: 'transfer' }); }],
      ['/activity', '記錄時間與心力', function () { s.openAct({}); }], ['/ledger', '收入與支出', function () { s.nav('ledger'); }],
      ['/resources', '三維資源', function () { s.nav('resources'); }], ['/assets', '資產與負債', function () { s.nav('assets'); }],
      ['/garden', '財富花園', function () { s.nav('garden'); }], ['/projects', '資產培育計畫', function () { s.nav('projects'); }],
      ['/ai', 'AI 財富策略師', function () { s.nav('ai'); }], ['/reports', '分析報告', function () { s.nav('reports'); }],
      ['/alerts', '通知中心', function () { s.nav('notifications'); }], ['/settings', '系統設定', function () { s.nav('settings'); }],
      ['/privacy', '切換隱私遮罩', function () { s.h.privacy(); }], ['/setup', '開啟設定精靈', function () { s.openWizard(); }],
      ['/help', '說明', function () { s.setModal0({ kind: 'help' }); }]
    ].map(function (c) { return { code: c[0], label: c[1], fn: c[2] }; });
  }
  cmdList() {
    var q = String(this.state.cmdQ || '').trim().toLowerCase();
    return this.commands().filter(function (c) { return !q || c.code.indexOf(q.replace(/^\/?/, '/')) >= 0 || c.label.indexOf(q) >= 0; });
  }

  /* ---------- AI terminal (rule-based, labelled as non-AI) ---------- */
  aiIntro() {
    var S = this.state.data;
    return [
      { c: 'sys', t: 'WEALTH STRATEGIST // AI INTELLIGENCE CORE' },
      { c: 'sys', t: 'PROVIDER: 未連線 · MODE: ' + (S.mode === 'demo' ? 'DEMO' : 'USER') },
      { c: 'dim', t: '這個網頁版沒有後端，不會呼叫 Gemini 或 OpenAI。下方分析由「規則式引擎」依你的資料計算，不是 AI 回答。' }
    ];
  }
  aiRun(key) {
    if (this.state.aiBusy) return;
    var S = this.state.data, lines = this.state.aiLines || this.aiIntro();
    if (!S.settings.aiConsent.summary) { this.setState({ aiLines: lines.concat([{ c: 'sys', t: '[拒絕] 尚未授權「彙總統計資料」用於分析。請到「系統設定 → AI 資料使用授權」開啟。' }]) }); return; }
    var a = E.ruleAnalyses(S, this.getD())[key];
    var out = [{ c: 'usr', t: '> ' + a.title }, { c: 'sys', t: '[規則式引擎 // 非 AI 回應]' }].concat(a.lines.map(function (t) { return { c: '', t: t }; }));
    if (reducedMotion || !this.motionOn()) { this.setState({ aiLines: lines.concat(out) }); return; }
    this.setState({ aiBusy: true, aiLines: lines.concat([{ c: 'dim', t: 'COMPUTING …' }]) });
    var i = 0;
    var tick = () => {
      var line = out[i];
      i++;
      this.setState(function (st) { return { aiLines: (st.aiLines || []).concat([line]) }; });
      if (i < out.length) this._timers.push(setTimeout(tick, 90)); else this.setState({ aiBusy: false });
    };
    this._timers.push(setTimeout(tick, 320));
  }
  aiAsk(e) {
    if (e && e.preventDefault) e.preventDefault();
    var q = String(this.state.aiQ || '').trim();
    if (!q) return;
    this.setState({ aiQ: '' });
    var map = [['收入', 'income'], ['支出', 'income'], ['花費', 'income'], ['訂閱', 'recurring'], ['固定', 'recurring'], ['持續', 'recurring'], ['時間', 'time'], ['心力', 'energy'], ['累', 'energy'], ['精神', 'energy'], ['轉化', 'convert'], ['資產', 'convert'], ['技能', 'convert']];
    var hit = map.find(function (m) { return q.indexOf(m[0]) >= 0; });
    if (hit) { this.aiRun(hit[1]); return; }
    var lines = this.state.aiLines || this.aiIntro();
    this.setState({ aiLines: lines.concat([{ c: 'usr', t: '> ' + q }, { c: 'sys', t: '[AI 未連線] 自由提問需要 Gemini 或 OpenAI。規則式引擎可處理：收入、支出、訂閱／固定支出、時間、心力、支出轉化資產。' }]) });
  }
  aiDraft() {
    var S = this.state.data;
    if (!S.settings.aiConsent.summary) { this.toast('請先授權彙總資料使用。'); return; }
    var d = E.draftFromData(S, this.getD());
    if (!d) { this.toast('沒有進行中的專案可產生草案。'); return; }
    this.upd(function (s) { s.suggestions.unshift(d); }, { action: '建立待核准草案', entity: 'ai_suggestions', detail: d.title });
    this.toast('已建立待核准草案，尚未寫入任何正式資料。');
  }

  /* ---------- handlers that never change identity ---------- */
  handlers() {
    var s = this;
    return {
      sfx: function () { s.setState({ sfx: SFX.toggle() }); },
      /* fold the instrument desk away (or bring it back); a per-browser layout preference */
      desk: function () { var open = !s.state.desk; if (open) SFX.deploy(); else SFX.retract(); try { window.localStorage.setItem('wg-desk', open ? '1' : '0'); } catch (e) { /* ignore */ } s.setState({ desk: open }); },
      addExpense: function () { s.openTx({ type: 'expense' }); },
      addIncome: function () { s.openTx({ type: 'income' }); },
      addTransfer: function () { s.openTx({ type: 'transfer' }); },
      addActivity: function () { s.openAct({}); },
      newProject: function () { s.openProj({}, function (id) { s.setState({ page: 'projects', projSel: id }); }); },
      quick: function () { s.setModal0({ kind: 'quick' }); },
      more: function () { s.setModal0({ kind: 'more' }); },
      cmd: function () { s.setState({ modal: { kind: 'cmd', errs: [] }, cmdQ: '', cmdIx: 0 }); },
      help: function () { s.setModal0({ kind: 'help' }); },
      wizard: function () { s.openWizard(); },
      close: function () { s.closeModal(); },
      scrim: function (e) { if (e && e.target === e.currentTarget) s.closeModal(); },
      privacy: function () { s.setState(function (st) { return { data: Object.assign({}, st.data, { privacy: !st.data.privacy }) }; }); },
      rail: function () { s.setState(function (st) { return { rail: !st.rail }; }); },
      useMine: function () { s.confirm('開始使用自己的資料？', '會清除這個瀏覽器中的示範資料，並開啟 10 步設定精靈。', function () { s.replaceData(E.blankState(), '清除示範資料，開始設定'); s.openWizard(); }, true); },
      submitTx: function (e) { s.submitTx(e); },
      submitAct: function (e) { s.submitAct(e); },
      submitProj: function (e) { s.submitProj(e); },
      confirmOk: function () { var ok = s.state.modal && s.state.modal.ok; s.closeModal(); if (ok) ok(); },
      cmdKey: function (e) {
        var list = s.cmdList(), ix = s.state.cmdIx;
        if (e.key === 'ArrowDown') { e.preventDefault(); s.setState({ cmdIx: Math.min(list.length - 1, ix + 1) }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); s.setState({ cmdIx: Math.max(0, ix - 1) }); }
        else if (e.key === 'Enter' && list[ix]) { e.preventDefault(); s.runCommand(list[ix]); }
        else if (e.key === 'Escape') s.closeModal();
      },
      cmdQ: function (e) { s.setState({ cmdQ: e.target.value, cmdIx: 0 }); },
      dlgKey: function (e) { if (e.key === 'Escape') s.closeModal(); },
      aiAsk: function (e) { s.aiAsk(e); },
      aiDraft: function () { s.aiDraft(); },
      aiClear: function () { s.setState({ aiLines: null }); },
      exportJson: function () { s.openExport('json'); },
      exportCsv: function () { s.openExport('csv'); },
      copyExport: function () {
        var m = s.state.modal; if (!m) return;
        var ta = null; try { ta = document.getElementById('wg-export'); } catch (e) { /* ignore */ }
        var fallback = function () { if (ta) { ta.focus(); ta.select(); } s.toast('已選取全部內容，請按 Ctrl/⌘ + C 複製。'); };
        try { navigator.clipboard.writeText(m.text).then(function () { s.toast('已複製到剪貼簿。'); }, fallback); } catch (e) { fallback(); }
      },
      importFile: function (e) {
        var fl = e && e.target && e.target.files && e.target.files[0];
        if (fl && /\.xlsx?$/i.test(fl.name)) { s.setState({ impErr: '網頁版目前只讀取 CSV。請在 Excel 選「另存新檔 → CSV UTF-8」後再匯入。' }); try { e.target.value = ''; } catch (x) { /* ignore */ } return; }
        s.readFile(e, function (text) { s.analyzeImport(text); });
      },
      importPaste: function () { s.analyzeImport(s.state.impPaste); },
      importCommit: function () {
        var rows = s.state.modal.rows, txs = E.importRowsToTx(s.state.data, rows);
        s.upd(function (d) { d.txs.push.apply(d.txs, txs); }, { action: '匯入歷史交易', entity: 'transactions', detail: txs.length + ' 筆（略過重複 ' + rows.filter(function (r) { return r.status === 'dup'; }).length + '、錯誤 ' + rows.filter(function (r) { return r.status === 'err'; }).length + '）' });
        s.closeModal(); s.toast('已匯入 ' + txs.length + ' 筆。');
      },
      restoreFile: function (e) {
        s.readFile(e, function (text, name) {
          var st = null;
          try { var j = JSON.parse(text); st = E.migrate(j && j.app === 'wealth-garden' && j.state ? j.state : j); } catch (x) { st = null; }
          if (!st) { s.toast('這不是有效的財富花園備份檔。'); return; }
          s.confirm('從備份還原？', '備份「' + name + '」包含 ' + st.txs.length + ' 筆交易、' + st.accounts.length + ' 個帳戶。目前瀏覽器中的資料會被取代；建議先匯出一份目前的備份。', function () { s.replaceData(st, '從備份還原：' + name); s.toast('已從備份還原。'); }, true);
        });
      },
      reseed: function () { s.confirm('重新載入示範資料？', '目前瀏覽器中的所有資料會被示範資料取代。', function () { s.replaceData(E.seed(), '重新載入示範資料'); }, true); },
      wipe: function () { s.confirm('清除所有資料並開始設定？', '會刪除這個瀏覽器中的所有紀錄（包含示範資料），然後開啟首次使用設定精靈。', function () { s.replaceData(E.blankState(), '清除全部資料'); s.openWizard(); }, true); },
      saveHourly: function () {
        var v = E.parseC(s.state.hourlyDraft != null ? s.state.hourlyDraft : s.state.data.settings.hourly / 100);
        if (!(v >= 0)) { s.toast('請輸入大於或等於 0 的數字。'); return; }
        s.upd(function (d) { d.settings.hourly = v; }, { action: '更新參考時薪', entity: 'user_preferences', detail: E.fmt(v) });
        s.setState({ hourlyDraft: null }); s.toast('已更新參考時薪。');
      },
      saveRates: function () {
        var draft = s.state.ratesDraft; if (!draft) return;
        var out = {};
        for (var k in draft) { var x = parseFloat(draft[k].rate); if (!(x > 0)) { s.toast(k + ' 匯率需大於 0。'); return; } out[k] = { rate: x, date: draft[k].date || E.todayISO() }; }
        s.upd(function (d) { d.settings.rates = out; }, { action: '更新手動匯率', entity: 'exchange_rates', detail: Object.keys(out).map(function (k) { return k + '=' + out[k].rate; }).join(', ') });
        s.setState({ ratesDraft: null }); s.toast('匯率已更新，淨資產換算已重新計算。');
      },
      addCur: function () {
        var c = String(s.state.newCur || '').toUpperCase().slice(0, 3), base = s.state.ratesDraft || s.ratesFromSettings();
        if (c.length !== 3 || c === 'TWD' || base[c]) { s.toast('請輸入 3 碼且尚未存在的幣別代碼。'); return; }
        var next = Object.assign({}, base); next[c] = { rate: '', date: E.todayISO() };
        s.setState({ ratesDraft: next, newCur: '' });
      },
      saveBudgets: function () {
        var draft = s.state.budDraft || s.budFromData(), o = {};
        for (var k in draft) { var x = E.parseC(draft[k]); if (x > 0) o[k] = x; }
        s.upd(function (d) { d.budgets = o; }, { action: '更新預算', entity: 'budgets', detail: Object.keys(o).join('、') || '（無）' });
        s.setState({ budDraft: null }); s.toast('預算已儲存。');
      },
      addBudget: function () {
        var k = s.state.budNew; if (!k) return;
        var draft = Object.assign({}, s.state.budDraft || s.budFromData()); draft[k] = '';
        s.setState({ budDraft: draft, budNew: '' });
      },
      addCat: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var n = String(s.state.catName || '').trim(), kind = s.state.catKind;
        if (!n || E.allCats(s.state.data, kind).indexOf(n) >= 0) { s.toast('請輸入新的類別名稱。'); return; }
        s.upd(function (d) { d.customCats[kind] = (d.customCats[kind] || []).concat([n]); }, { action: '新增自訂類別', entity: 'categories', detail: n });
        s.setState({ catName: '' });
      },
      genReport: function () {
        s.setState({ repGen: true });
        if (!(s.state.data.flags && s.state.data.flags.monthlyReport)) s.upd(function (d) { d.flags = Object.assign({}, d.flags || {}, { monthlyReport: true }); }, { action: '產生月報', entity: 'reports', detail: s.state.repMonth });
      },
      markAllRead: function () { var ids = s.getD().notes.map(function (n) { return n.id; }); s.upd(function (d) { d.notifRead = Array.from(new Set(d.notifRead.concat(ids))); }); },
      showMore: function () { s.setState(function (st) { return { llimit: st.llimit + 100 }; }); },
      backToProjects: function () { s.setState({ projSel: null }); },
      addMilestone: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var n = String(s.state.msName || '').trim(), pid = s.state.projSel; if (!n || !pid) return;
        s.upd(function (d) { var x = d.projects.find(function (y) { return y.id === pid; }); x.milestones = (x.milestones || []).concat([{ id: E.uid(), name: n, done: false, verified: false }]); }, { action: '新增里程碑', entity: 'project_milestones', detail: n });
        s.setState({ msName: '' });
      },
      addTask: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var n = String(s.state.taskName || '').trim(), pid = s.state.projSel; if (!n || !pid) return;
        s.upd(function (d) { var x = d.projects.find(function (y) { return y.id === pid; }); x.tasks = (x.tasks || []).concat([{ id: E.uid(), text: n, done: false }]); }, { action: '新增任務', entity: 'projects', detail: n });
        s.setState({ taskName: '' });
      },
      editProject: function () { var p = s.state.data.projects.find(function (x) { return x.id === s.state.projSel; }); if (p) s.openProj(p); },
      wizNext: function () { var f = s.state.modal.form; s.setForm({ i: Math.min(9, f.i + 1) }); },
      wizPrev: function () { var f = s.state.modal.form; s.setForm({ i: Math.max(0, f.i - 1) }); },
      wizFinish: function () { s.wizFinish(); },
      wizAddAcct: function () { var f = s.state.modal.form; s.setForm({ accounts: f.accounts.concat([{ name: '', kind: 'bank', cur: 'TWD', opening: '' }]) }); },
      submitAccount: function (e) { s.submitSimple(e, 'acct'); },
      submitAsset: function (e) { s.submitSimple(e, 'asset'); },
      submitLiab: function (e) { s.submitSimple(e, 'liab'); },
      submitValue: function (e) { s.submitSimple(e, 'value'); },
      submitLbal: function (e) { s.submitSimple(e, 'lbal'); },
      submitRec: function (e) { s.submitSimple(e, 'rec'); },
      newAccount: function () { s.setModal0({ kind: 'acct', form: { name: '', kind: 'bank', cur: 'TWD', opening: '' } }); },
      newAsset: function () { s.setModal0({ kind: 'asset', form: { name: '', type: 'other', value: '', monthlyIncome: '', maintenance: '' } }); },
      newLiab: function () { s.setModal0({ kind: 'liab', form: { name: '', balance: '', rate: '', installment: '', dueDay: '' } }); },
      newRec: function () { var a = s.state.data.accounts[0]; s.setModal0({ kind: 'rec', form: { kind: 'expense', desc: '', amt: '', cat: '', acct: a ? a.id : '', day: '1' } }); },
      stop: function (e) { if (e && e.stopPropagation) e.stopPropagation(); }
    };
  }
  ratesFromSettings() { var r = this.state.data.settings.rates, o = {}; Object.keys(r).forEach(function (k) { o[k] = { rate: String(r[k].rate), date: r[k].date }; }); return o; }
  budFromData() { var b = this.state.data.budgets || {}, o = {}; Object.keys(b).forEach(function (k) { o[k] = String(b[k] / 100); }); return o; }
  submitSimple(e, kind) {
    if (e && e.preventDefault) e.preventDefault();
    var m = this.state.modal, f = m.form, S = this.state.data, T = E.todayISO();
    if (kind === 'acct') {
      if (!String(f.name).trim()) return this.setModal({ errs: ['請輸入帳戶名稱。'] });
      var op = f.opening === '' ? 0 : E.parseC(f.opening);
      if (isNaN(op)) return this.setModal({ errs: ['期初餘額格式不正確。'] });
      if (f.kind === 'credit' && op > 0) op = -op;
      this.upd(function (s) { s.accounts.push({ id: E.uid(), name: String(f.name).trim(), kind: f.kind, cur: f.cur, opening: op }); }, { action: '新增帳戶', entity: 'accounts', detail: f.name + '｜' + E.ACC_KINDS[f.kind] + '｜期初 ' + E.fmt(op, f.cur) });
    } else if (kind === 'asset') {
      var v = E.parseC(f.value);
      if (!String(f.name).trim() || !(v >= 0)) return this.setModal({ errs: ['請輸入名稱與大於或等於 0 的評價。'] });
      var a = { id: E.uid(), name: String(f.name).trim(), type: f.type, value: v, monthlyIncome: E.parseC(f.monthlyIncome) || 0, maintenance: E.parseC(f.maintenance) || 0, date: T, history: [{ date: T, value: v }] };
      this.upd(function (s) { s.assets.push(a); }, { action: '新增資產', entity: 'assets', detail: a.name + '｜' + E.fmt(v) });
    } else if (kind === 'liab') {
      var b = E.parseC(f.balance);
      if (!String(f.name).trim() || !(b >= 0)) return this.setModal({ errs: ['請輸入名稱與大於或等於 0 的餘額。'] });
      var dd = Number(f.dueDay) || 0;
      if (dd && (dd < 1 || dd > 31)) return this.setModal({ errs: ['每月到期日需介於 1 到 31。'] });
      var l = { id: E.uid(), name: String(f.name).trim(), balance: b, rate: Number(f.rate) || 0, installment: E.parseC(f.installment) || 0, dueDay: dd, history: [{ date: T, balance: b }] };
      this.upd(function (s) { s.liabilities.push(l); }, { action: '新增負債', entity: 'liabilities', detail: l.name + '｜' + E.fmt(b) });
    } else if (kind === 'value') {
      var x = E.parseC(f.value), asset = S.assets.find(function (z) { return z.id === m.id; });
      if (!(x >= 0) || !asset) return this.setModal({ errs: ['請輸入大於或等於 0 的評價。'] });
      this.upd(function (s) { var y = s.assets.find(function (z) { return z.id === m.id; }); y.value = x; y.date = T; y.history = (y.history || []).concat([{ date: T, value: x }]); }, { action: '更新資產評價', entity: 'assets', detail: asset.name + '｜' + E.fmt(asset.value) + ' → ' + E.fmt(x) });
      this.toast('評價已更新（未實現變動，不計入收入）。');
    } else if (kind === 'lbal') {
      var y2 = E.parseC(f.balance), li = S.liabilities.find(function (z) { return z.id === m.id; });
      if (!(y2 >= 0) || !li) return this.setModal({ errs: ['請輸入大於或等於 0 的餘額。'] });
      this.upd(function (s) { var y = s.liabilities.find(function (z) { return z.id === m.id; }); y.balance = y2; y.history = (y.history || []).concat([{ date: T, balance: y2 }]); }, { action: '更新負債餘額', entity: 'liabilities', detail: li.name + '｜' + E.fmt(li.balance) + ' → ' + E.fmt(y2) });
    } else if (kind === 'rec') {
      var amt = E.parseC(f.amt), day = Number(f.day);
      if (!(amt > 0) || !String(f.desc).trim() || !f.cat || !f.acct) return this.setModal({ errs: ['請填寫名稱、類別、帳戶與大於 0 的金額。'] });
      if (!(day >= 1 && day <= 31)) return this.setModal({ errs: ['每月日期需介於 1 到 31。'] });
      this.upd(function (s) { s.recurring.push({ id: E.uid(), kind: f.kind, desc: String(f.desc).trim(), amt: amt, cat: f.cat, acct: f.acct, day: day, active: true }); }, { action: '新增定期項目', entity: 'recurring_entries', detail: f.desc });
    }
    this.closeModal();
  }
  wizFinish() {
    var w = this.state.modal.form, T = E.todayISO();
    this.upd(function (s) {
      s.mode = 'user'; s.settings.setupDone = true; s.settings.snapshotDate = T; s.settings.hourly = E.parseC(w.hourly) || 0; s.settings.aiConsent = Object.assign({}, w.consent);
      w.accounts.forEach(function (a) { if (!String(a.name).trim()) return; var op = E.parseC(a.opening) || 0; if (a.kind === 'credit' && op > 0) op = -op; s.accounts.push({ id: E.uid(), name: String(a.name).trim(), kind: a.kind, cur: a.cur, opening: op }); });
      w.assets.forEach(function (a) { var v = E.parseC(a.value); if (String(a.name).trim() && v >= 0) s.assets.push({ id: E.uid(), name: String(a.name).trim(), type: a.type, value: v, monthlyIncome: 0, maintenance: 0, date: T, history: [{ date: T, value: v }] }); });
      w.liabs.forEach(function (l) { var v = E.parseC(l.balance); if (String(l.name).trim() && v >= 0) s.liabilities.push({ id: E.uid(), name: String(l.name).trim(), balance: v, rate: 0, installment: 0, dueDay: 0, history: [{ date: T, balance: v }] }); });
      if (String(w.goal).trim()) s.settings.goals = [{ name: String(w.goal).trim(), target: 0 }];
    }, { action: '完成設定精靈', entity: 'users', detail: '建立初始快照' });
    this.closeModal();
    this.nav(w.importLater ? 'dashboard' : 'settings');
    this.toast('設定完成，已建立初始快照。', null, true);
  }
  allocVM(alloc, projects) {
    var sum = alloc.reduce(function (s, a) { return s + Number(a.pct || 0); }, 0);
    var set = (i, patch) => this.setForm({ alloc: alloc.map(function (x, j) { return j === i ? Object.assign({}, x, patch) : x; }) });
    return {
      allocRows: alloc.map((a, i) => ({
        n: i + 1, pct: a.pct, onPct: (e) => set(i, { pct: e.target.value }), remove: () => this.setForm({ alloc: alloc.filter(function (_, j) { return j !== i; }) }),
        projects: projects.map(function (p) { return { label: p.name, cls: a.pid === p.id ? 'on' : '', pressed: a.pid === p.id ? 'true' : 'false', pick: function () { set(i, { pid: p.id }); } }; })
      })),
      allocSum: sum + '% / 100%', allocCls: sum > 100 ? 'neg' : 'dim', allocCan: projects.length > 0, allocNone: !projects.length,
      allocAdd: () => this.setForm({ alloc: alloc.concat([{ pid: '', pct: String(Math.max(0, 100 - sum) || '') }]) })
    };
  }
  energyVM(v) {
    return Array.from({ length: 11 }, (_, i) => i - 5).map((n) => {
      var on = v === n;
      return {
        label: (n > 0 ? '+' : '') + n, aria: n + '：' + E.ELABEL[String(n)], on: on ? 'true' : 'false', cls: on ? 'on' : '',
        bg: n < 0 ? 'rgba(163,18,42,' + (0.06 + Math.abs(n) * 0.06).toFixed(2) + ')' : n > 0 ? 'rgba(6,71,45,' + (0.06 + n * 0.06).toFixed(2) + ')' : 'rgba(0,60,70,.1)',
        pick: () => this.setForm({ energy: n })
      };
    });
  }

  /* ======================= PAGE VIEW MODELS ======================= */
  vmDash() {
    var S = this.state.data, D = this.getD(), st = this.state, acc = this.accent();
    var empty = !S.accounts.length && !S.txs.length;
    var tw = st.tw || {}, tv = function (k, v) { return tw[k] != null ? tw[k] : v; };
    var labels12 = D.months.map(function (m) { return m.k.slice(2).replace('-', '/'); });
    var nw = D.months.map(function (m) { return m.netWorth; });
    var delta = nw[nw.length - 1] - nw[0];
    var m6 = D.months.slice(-6);
    var cf = cashSeries(D, st.dashRange);
    var groups = [['cash', '現金與電子支付'], ['bank', '銀行存款'], ['invest', '投資資產'], ['realestate', '不動產'], ['other', '其他資產']].map(function (g) { return { key: g[0], label: g[1], color: GROUP_COL[g[0]], value: D.now.groups[g[0]] }; });
    var total = groups.reduce(function (s, g) { return s + Math.max(0, g.value); }, 0);
    var R = 62, C = 2 * Math.PI * R, run = 0, pick = st.donutPick, donut = {};
    groups.forEach(function (g) {
      var len = total > 0 ? Math.max(0, g.value) / total * C : 0;
      donut[g.key] = { da: Math.max(0, len - 1.5).toFixed(2) + ' ' + C.toFixed(2), off: (-run).toFixed(2), sw: pick === g.key ? 24 : 18, color: g.color, label: g.label, pick: () => this.setState({ donutPick: pick === g.key ? null : g.key }) };
      run += len;
    });
    var pg = pick && groups.find(function (g) { return g.key === pick; });
    donut.cLabel = pg ? pg.label : '總資產';
    donut.cValue = S.privacy ? '•••' : E.fmtK(pg ? pg.value : D.now.assets);
    var legend = groups.map((g) => ({ label: g.label, color: g.color, val: this.M(g.value), pct: total ? Math.round(Math.max(0, g.value) / total * 100) + '%' : '0%', cls: pick === g.key ? 'on' : '', pressed: pick === g.key ? 'true' : 'false', pick: donut[g.key].pick }));
    var drill = [];
    if (pick) {
      var kinds = { cash: ['cash', 'epay'], bank: ['bank'], invest: ['invest'], other: ['custom'] }[pick] || [];
      S.accounts.filter(function (a) { return !a.archived && a.kind !== 'credit' && kinds.indexOf(a.kind) >= 0; }).forEach((a) => drill.push({ name: a.name, val: this.M(D.bal[a.id], a.cur) + (a.cur !== 'TWD' ? '（≈ ' + this.M(D.tw(a.id)) + '）' : '') }));
      S.assets.filter(function (a) { return (a.type === 'realestate' ? 'realestate' : a.type === 'invest' ? 'invest' : 'other') === pick; }).forEach((a) => drill.push({ name: a.name, val: this.M(a.value) }));
    }
    var N = 5, rc = 110, rcy = 100, rR = 74;
    var pt = function (i, r) { return [rc + r * Math.sin(2 * Math.PI * i / N), rcy - r * Math.cos(2 * Math.PI * i / N)]; };
    var radar = { rings: [0.25, 0.5, 0.75, 1].map(function (k) { return D.radar.map(function (_, i) { return pt(i, rR * k).map(function (v) { return v.toFixed(1); }).join(','); }).join(' '); }).join('|').split('|'), poly: D.radar.map(function (a, i) { return pt(i, rR * a.value).map(function (v) { return v.toFixed(1); }).join(','); }).join(' '), spokes: D.radar.map(function (_, i) { var p = pt(i, rR); return 'M' + rc + ' ' + rcy + 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '), dots: D.radar.map(function (a, i) { var p = pt(i, rR * a.value); return circ(+p[0].toFixed(1), +p[1].toFixed(1), 2.6); }).join(' ') };
    D.radar.forEach(function (a, i) { var p = pt(i, rR + 15); radar['a' + i] = { x: p[0].toFixed(1), y: (p[1] + 3).toFixed(1), anchor: Math.abs(p[0] - rc) < 5 ? 'middle' : p[0] > rc ? 'start' : 'end', label: a.label }; });
    radar.r0 = radar.rings[0]; radar.r1 = radar.rings[1]; radar.r2 = radar.rings[2]; radar.r3 = radar.rings[3];
    var radarDefs = D.radar.map(function (r) { return { label: r.label, raw: r.raw, def: r.def }; });
    return {
      empty: empty, has: !empty,
      hero: { net: this.M(tv('net', D.now.net)), assets: this.M(tv('assets', D.now.assets)), liab: this.M(tv('liab', D.now.liab)), cc: this.M(D.now.ccOwed), delta: '12 個月 ' + (S.privacy ? '•••' : E.fmt(delta, 'TWD', true)), deltaCls: delta >= 0 ? 'ok' : 'b', chart: this.chart('nw', labels12, [{ name: '淨資產', color: acc, values: nw }], { h: 120 }) },
      tiles: [
        { label: '本月實際收入', code: 'INCOME', val: this.M(tv('inc', D.month.inc)), cls: 'pos', sub: '不含轉帳、換匯與評價變動', spark: spark(m6.map(function (m) { return m.inc; })), sc: '#0A6B45' },
        { label: '本月支出', code: 'SPEND', val: this.M(tv('exp', D.month.exp)), cls: '', sub: '已扣退款；信用卡於刷卡時認列', spark: spark(m6.map(function (m) { return m.exp; })), sc: '#A3122A' },
        { label: '本月現金流', code: 'FLOW', val: this.M(tv('cf', D.month.net), 'TWD', true), cls: D.month.net >= 0 ? 'pos' : 'neg', sub: '收入＋已實現損益 − 支出', spark: spark(m6.map(function (m) { return m.net; })), sc: '#5B2C91' }
      ],
      fixed: { inc: this.M(D.recInc), exp: this.M(D.recExp), net: this.M(D.recInc - D.recExp, 'TWD', true), cls: D.recInc - D.recExp >= 0 ? 'pos' : 'neg' },
      cf: this.chart('cf', cf.labels, [{ name: '收入', color: '#0A6B45', values: cf.inc }, { name: '支出', color: '#A3122A', values: cf.exp, area: false }, { name: '淨現金流', color: acc, values: cf.net, area: false, dash: '7 6' }], { h: 230 }),
      cfUnit: cf.unit, ranges: this.seg([['7', '7 日'], ['30', '30 日'], ['90', '90 日'], ['365', '年度']], st.dashRange, (v) => this.setState({ dashRange: v, hov: null })),
      donut: donut, legend: legend, drill: drill, drillShow: !!pick, drillEmpty: !!pick && !drill.length, drillTitle: pg ? pg.label + ' 明細' : '',
      radar: radar, radarDefs: radarDefs,
      plants: D.plants.slice(0, 6).map((p) => this.plantItem(p, null)), plantsEmpty: !D.plants.length,
      insights: D.insights.map((i) => Object.assign({}, i, { go: () => this.nav(i.page) })), insightsEmpty: !D.insights.length,
      recent: D.txs.slice(0, 6).map((t) => this.txRow(t)),
      ach: D.ach.map(function (a) { return { name: a.name, desc: a.desc, done: a.done, cls: a.done ? 'done' : '', tag: a.done ? '已達成' : '未達成', tagCls: a.done ? 'p' : '' }; }),
      kpis: this.kpiVM(D, tv, delta),
      rings: this.ringVM(D),
      plans: this.planVM(S, D),
      plansEmpty: !S.projects.length,
      notes: this.noteVM(S, D),
      notesEmpty: !D.notes.length
    };
  }
  /* four headline figures, each compared with last month's full-month figure (never a projection) */
  kpiVM(D, tv, delta) {
    var S = this.state.data, mm = D.months, prev = mm.length > 1 ? mm[mm.length - 2] : null, m6 = mm.slice(-6);
    var pv = (v, sign) => prev ? '上月 ' + this.M(v, 'TWD', sign) : '—';
    return [
      { code: 'CASH FLOW', label: '現金流', ic: IC.swap, tint: 't-cyan', val: this.M(tv('cf', D.month.net), 'TWD', true), cls: D.month.net >= 0 ? 'pos' : 'neg', sub: pv(prev && prev.net, true), spark: spark(m6.map(function (m) { return m.net; })), sc: '#00707E' },
      { code: 'INCOME', label: '收入', ic: IC.up, tint: 't-grn', val: this.M(tv('inc', D.month.inc)), cls: 'pos', sub: pv(prev && prev.inc), spark: spark(m6.map(function (m) { return m.inc; })), sc: '#0A6B45' },
      { code: 'EXPENSES', label: '支出', ic: IC.down, tint: 't-mag', val: this.M(tv('exp', D.month.exp)), cls: '', sub: pv(prev && prev.exp), spark: spark(m6.map(function (m) { return m.exp; })), sc: '#9A1F6B' },
      { code: 'NET WORTH', label: '淨資產', ic: IC.vault, tint: 't-gold', val: this.M(tv('net', D.now.net)), cls: '', sub: '12 個月 ' + (S.privacy ? '•••' : E.fmt(delta, 'TWD', true)), spark: spark(mm.map(function (m) { return m.netWorth; })), sc: '#8A6400' }
    ];
  }
  /* three status rings, each with its definition; no target is invented */
  ringVM(D) {
    var R = 34, C = 2 * Math.PI * R;
    var mk = (label, code, pct, txt, sub, color) => ({ label: label, code: code, val: pct == null ? '—' : txt, sub: sub, color: color, da: ((pct == null ? 0 : Math.max(0, Math.min(100, pct))) / 100 * C).toFixed(1) + ' ' + C.toFixed(1) });
    var inc = D.month.inc, sav = inc > 0 ? D.month.net / inc * 100 : null;
    var e = D.a7.avg, ep = e == null ? null : (e + 5) / 10 * 100;
    var tp = D.a7.min > 0 ? D.a7.projMin / D.a7.min * 100 : null;
    return [
      mk('儲蓄率', 'SAVINGS', sav, Math.round(sav) + '%', '本月現金流 ÷ 本月收入', '#00707E'),
      mk('心力', 'ENERGY', ep, (e > 0 ? '+' : '') + (e == null ? '' : e.toFixed(1)), '7 日平均（−5～+5）', '#8A6400'),
      mk('培育時間', 'GROWTH', tp, Math.round(tp) + '%', '7 日投入計畫的時間占比', '#9A1F6B')
    ];
  }
  planVM(S, D) {
    return S.projects.filter(function (p) { return p.status !== '終止'; }).slice(0, 4).map((p) => {
      var ms = p.milestones || [], ver = ms.filter(function (x) { return x.verified; }).length, pct = ms.length ? Math.round(ver / ms.length * 100) : 0;
      return { name: p.name, pct: pct + '%', w: pct, sub: ver + '/' + ms.length + ' 里程碑已驗證', go: () => this.nav('projects', p.id) };
    });
  }
  noteVM(S, D) {
    var read = new Set(S.notifRead);
    return D.notes.slice(0, 3).map((n) => ({ type: n.type, tone: n.tone, text: S.privacy && n.sensitive ? maskMoney(n.text) : n.text, unread: !read.has(n.id), go: () => { if (!read.has(n.id)) this.upd(function (d) { d.notifRead.push(n.id); }); this.nav(n.page || 'notifications'); } }));
  }
  /* greenhouse dome: the same plants as the garden, grown only from verified milestones and real income */
  vmGreen() {
    var S = this.state.data, D = this.getD(), nw = D.months.map(function (m) { return m.netWorth; }), delta = nw[nw.length - 1] - nw[0];
    var plants = D.plants.slice(0, GH_SLOTS.length).map((p, i) => {
      var sl = GH_SLOTS[i];
      return Object.assign(this.plantItem(p, null), { x: sl[0], y: sl[1], s: sl[2], z: 100 - sl[1], aria: p.name + '，' + E.STAGES[p.stage] });
    });
    var mature = D.plants.filter(function (p) { return p.stage === 'stable' || p.stage === 'bloom'; }).length;
    var ver = S.projects.reduce(function (s, p) { return s + (p.milestones || []).filter(function (m) { return m.verified; }).length; }, 0);
    return {
      plants: plants, none: !plants.length, seed: plantVM('seed'),
      count: D.plants.length + ' 株', mature: mature, verified: ver,
      delta: S.privacy ? '•••' : E.fmt(delta, 'TWD', true), deltaCls: delta >= 0 ? 'pos' : 'neg',
      spark: spark(nw), up: delta >= 0
    };
  }
  /* console instruments read real figures; decorative parts carry no numbers */
  vmConsole() {
    var S = this.state.data, D = this.getD(), L = 150.8;
    var g = function (label, code, pct, val, sub, color) {
      var p = pct == null ? 0 : Math.max(0, Math.min(100, pct));
      return { label: label, code: code, val: pct == null ? '—' : val, sub: sub, color: color, deg: (-120 + p * 2.4).toFixed(1), da: (p / 100 * L).toFixed(1) + ' ' + L };
    };
    var inc = D.month.inc, sav = inc > 0 ? D.month.net / inc * 100 : null;
    var bud = S.budgets || {}, cats = Object.keys(bud), lim = cats.reduce(function (s, k) { return s + bud[k]; }, 0);
    var used = cats.reduce(function (s, k) { return s + (D.month.ec[k] || 0); }, 0), bp = lim > 0 ? used / lim * 100 : null;
    var e = D.a7.avg;
    return {
      gauges: [
        g('儲蓄率', 'SAVE', sav, Math.round(sav) + '%', '本月', '#00707E'),
        g('預算使用', 'BUDGET', bp == null ? null : bp / 1.2, Math.round(bp) + '%', lim > 0 ? '本月預算類別' : '未設定預算', bp != null && bp >= 100 ? '#A3122A' : '#8A6400'),
        g('心力', 'ENERGY', e == null ? null : (e + 5) * 10, (e > 0 ? '+' : '') + (e == null ? '' : e.toFixed(1)), '7 日平均', '#9A1F6B')
      ],
      flow: spark(D.months.slice(-6).map(function (m) { return m.net; })),
      flowVal: this.M(D.month.net, 'TWD', true), flowCls: D.month.net >= 0 ? 'pos' : 'neg'
    };
  }
  vmLedger() {
    var S = this.state.data, D = this.getD(), st = this.state;
    var q = String(st.lq || '').toLowerCase();
    var list = D.txs.filter(function (t) { return (!st.ltype || t.type === st.ltype) && (!st.lcat || t.cat === st.lcat) && (!st.lacct || t.acct === st.lacct || t.from === st.lacct || t.to === st.lacct) && t.date >= st.lfrom && t.date <= st.lto && (!q || (t.desc + (t.cat || '')).toLowerCase().indexOf(q) >= 0); });
    var f = D.flow(st.lfrom, st.lto), ecats = E.allCats(S, 'expense'), icats = E.allCats(S, 'income');
    var chip = (label, val, cur, set) => ({ label: label, cls: cur === val ? 'on' : '', pressed: cur === val ? 'true' : 'false', pick: () => set(val) });
    var setCat = (v) => this.setState({ lcat: v, llimit: 60 }), setAcct = (v) => this.setState({ lacct: v, llimit: 60 });
    var months = D.months;
    var activeAccs = S.accounts.filter(function (a) { return !a.archived; });
    var tab = st.ltab;
    return {
      templates: S.templates.map((tp) => ({ name: tp.name, amt: this.M(tp.amt), use: () => this.openTx({ type: tp.type, amt: tp.amt, cat: tp.cat, acct: tp.acct, desc: tp.desc }) })),
      noTemplates: !S.templates.length,
      tabs: this.seg([['list', '交易紀錄'], ['charts', '收支圖表'], ['recurring', '重複紀錄'], ['reconcile', '對帳'], ['bin', '回收區']], tab, (v) => this.setState({ ltab: v, hov: null })),
      t: { list: tab === 'list', charts: tab === 'charts', recurring: tab === 'recurring', reconcile: tab === 'reconcile', bin: tab === 'bin' },
      q: st.lq, onQ: this.sf('lq'), type: st.ltype, onType: this.sf('ltype'), from: st.lfrom, onFrom: this.sf('lfrom'), to: st.lto, onTo: this.sf('lto'),
      catChipsAll: [chip('全部類別', '', st.lcat, setCat)], incChips: icats.map(function (c) { return chip(c, c, st.lcat, setCat); }), expChips: ecats.map(function (c) { return chip(c, c, st.lcat, setCat); }),
      acctChips: [chip('全部帳戶', '', st.lacct, setAcct)].concat(S.accounts.map(function (a) { return chip(a.name, a.id, st.lacct, setAcct); })),
      clear: () => this.setState({ lq: '', ltype: '', lcat: '', lacct: '', llimit: 60 }),
      count: list.length + ' 筆', inc: this.M(f.inc), exp: this.M(f.exp), net: this.M(f.net, 'TWD', true), netCls: f.net >= 0 ? 'pos' : 'neg',
      rows: list.slice(0, st.llimit).map((t) => this.txRow(t)), more: list.length > st.llimit, moreN: '顯示更多（尚有 ' + Math.max(0, list.length - st.llimit) + ' 筆）', none: !list.length,
      ebars: this.bars(Object.entries(f.ec).filter(function (x) { return x[1] !== 0; }).sort(function (a, b) { return b[1] - a[1]; }), f.exp, function (c) { return catCol(c, ecats); }, (c) => this.setState({ lcat: c, ltype: '', ltab: 'list' })),
      ibars: this.bars(Object.entries(f.ic).sort(function (a, b) { return b[1] - a[1]; }), f.inc, function (c) { return catCol(c, icats); }, (c) => this.setState({ lcat: c, ltype: '', ltab: 'list' })),
      ebarsNone: !Object.keys(f.ec).length, ibarsNone: !Object.keys(f.ic).length,
      range: E.fmtD(st.lfrom) + ' – ' + E.fmtD(st.lto),
      monthly: this.chart('lm', months.map(function (m) { return m.k.slice(2).replace('-', '/'); }), [{ name: '收入', color: '#0A6B45', values: months.map(function (m) { return m.inc + m.real; }) }, { name: '支出', color: '#A3122A', values: months.map(function (m) { return m.exp; }) }], { h: 220 }),
      rec: S.recurring.map((r) => ({
        desc: r.desc, kind: E.TYPES[r.kind], cat: r.cat, day: '每月 ' + r.day + ' 日', amt: this.M(r.amt), active: r.active, stateLabel: r.active ? '啟用中' : '已停用', stateCls: r.active ? 'ok' : '',
        toggle: () => this.upd(function (s) { var x = s.recurring.find(function (y) { return y.id === r.id; }); x.active = !x.active; }, { action: r.active ? '停用定期項目' : '啟用定期項目', entity: 'recurring_entries', detail: r.desc }),
        gen: () => this.openTx({ type: r.kind, amt: r.amt, cat: r.cat, acct: r.acct, desc: r.desc, recurringAttr: r.kind === 'expense', date: E.monthKey(E.todayISO()) + '-' + E.pad(Math.min(r.day, 28)) })
      })),
      recon: activeAccs.map((a) => {
        var raw = st.recon[a.id] || '', stv = E.parseC(raw), diff = isNaN(stv) ? null : stv - D.bal[a.id];
        return {
          name: a.name, sub: E.ACC_KINDS[a.kind] + ' · ' + a.cur, book: this.M(D.bal[a.id], a.cur), val: raw,
          onVal: this.reconH(a.id), ph: a.kind === 'credit' ? '欠款填負數' : '對帳單餘額',
          diffOk: diff === 0, diffBad: diff != null && diff !== 0, diff: diff == null ? '' : this.M(diff, a.cur, true), diffCls: diff > 0 ? 'pos' : 'neg', none: diff == null,
          last: a.reconciled ? E.fmtD(a.reconciled.date) + (a.reconciled.diff ? ' · 差額 ' + this.M(a.reconciled.diff, a.cur) : ' · 一致') : '—',
          dis: diff == null,
          mark: () => { if (diff == null) return; this.upd(function (s) { s.accounts.find(function (x) { return x.id === a.id; }).reconciled = { date: E.todayISO(), stmt: stv, diff: diff }; }, { action: '標記對帳', entity: 'accounts', detail: a.name + '｜對帳單 ' + E.fmt(stv, a.cur) + '｜差額 ' + E.fmt(diff, a.cur) }); this.toast('已記錄對帳結果，帳本未被自動調整。'); }
        };
      }),
      bin: S.txs.filter(function (t) { return t.deleted; }).map((t) => Object.assign(this.txRow(t), { open: () => this.restoreTx(t.id) })),
      binEmpty: !S.txs.some(function (t) { return t.deleted; })
    };
  }
  reconH(id) {
    var k = 'recon:' + id;
    if (!this._sh[k]) this._sh[k] = (e) => { var v = e.target.value; this.setState(function (st) { var r = Object.assign({}, st.recon); r[id] = v; return { recon: r }; }); };
    return this._sh[k];
  }
  vmRes() {
    var S = this.state.data, D = this.getD(), st = this.state, win = st.rwin;
    var stt = win === '1' ? D.a1 : win === '7' ? D.a7 : D.a30;
    var from = E.addDays(D.T, -(Number(win) - 1)), f = D.flow(from, D.T);
    var kinds = Object.entries(stt.byKind).sort(function (a, b) { return b[1] - a[1]; });
    var mxd = Math.max.apply(null, [1].concat(Object.values(stt.dist)));
    var fmtAvg = function (v) { return v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(1); };
    var clsAvg = function (v) { return v == null ? '' : v > 0 ? 'pos' : v < 0 ? 'neg' : ''; };
    var en = D.energyDaily;
    var hourly = S.settings.hourly;
    return {
      win: this.seg([['1', '今日'], ['7', '7 日'], ['30', '30 日']], win, (v) => this.setState({ rwin: v })),
      exp: this.M(f.exp), inc: this.M(f.inc),
      money: D.txs.filter(function (t) { return t.date >= from && (t.type === 'expense' || t.type === 'income'); }).slice(0, 8).map((t) => this.txRow(t)),
      moneyEmpty: !D.txs.some(function (t) { return t.date >= from && (t.type === 'expense' || t.type === 'income'); }),
      min: E.fmtMin(stt.min), projMin: E.fmtMin(stt.projMin), saved: E.fmtMin(stt.saved),
      tbars: this.bars(kinds, stt.min, function (k) { return CAT[E.ACT_KINDS.indexOf(k) % CAT.length]; }, null, function (v) { return E.fmtMin(v); }),
      tEmpty: !kinds.length,
      opp: this.M(Math.round(hourly * stt.min / 60)), hourly: this.M(hourly),
      avgs: [['今日', D.a1.avg], ['7 日', D.a7.avg], ['30 日', D.a30.avg]].map(function (x) { return { l: x[0] + '平均', v: fmtAvg(x[1]), cls: clsAvg(x[1]) }; }),
      count: stt.count + ' 項活動',
      dist: Array.from({ length: 11 }, function (_, i) { return i - 5; }).map(function (n) { return { n: n, h: Math.max(4, stt.dist[n] / mxd * 100).toFixed(0), color: n < 0 ? '#A3122A' : n > 0 ? '#0A6B45' : '#4A5560', op: stt.dist[n] ? 0.9 : 0.22, title: n + '：' + stt.dist[n] + ' 項', cnt: stt.dist[n] }; }),
      chart: this.chart('en', en.map(function (x) { return x.d.slice(5).replace('-', '/'); }), [{ name: '平均心力', color: '#5B2C91', values: en.map(function (x) { return x.avg == null ? null : Math.round(x.avg * 100); }), area: false, fmt: function (v) { return v == null ? '—' : (v / 100).toFixed(1); } }], { h: 170, yfmt: function (v) { return (v / 100).toFixed(0); } }),
      drains: stt.drains.map(function (a) { return { title: a.title, v: String(a.energy) }; }), drainsNone: !stt.drains.length,
      recov: stt.recov.map(function (a) { return { title: a.title, v: '+' + a.energy }; }), recovNone: !stt.recov.length,
      rows: stt.list.slice(0, 80).map((a) => {
        var tx = a.txId && D.txs.find(function (t) { return t.id === a.txId; });
        return {
          date: a.date.slice(5).replace('-', '/'), title: a.title, kind: a.kind, money: tx ? this.M(tx.base) : '—', time: E.fmtMin(a.minutes), opp: this.M(Math.round(hourly * a.minutes / 60)),
          en: (a.energy > 0 ? '+' : '') + a.energy, enCls: a.energy > 0 ? 'pos' : a.energy < 0 ? 'neg' : '',
          proj: (a.alloc || []).map(function (x) { var p = S.projects.find(function (p) { return p.id === x.pid; }); return p ? p.name + ' ' + x.pct + '%' : ''; }).filter(Boolean).join('、') || '—',
          open: () => this.openActDetail(a.id)
        };
      }),
      rowsEmpty: !stt.list.length
    };
  }
  vmAssets() {
    var S = this.state.data, D = this.getD(), st = this.state, sh = D.now;
    var rates = st.ratesDraft || this.ratesFromSettings();
    return {
      net: this.M(sh.net), assets: this.M(sh.assets), liab: this.M(sh.liab), snap: E.fmtD(S.settings.snapshotDate),
      accounts: S.accounts.filter(function (a) { return !a.archived; }).map((a) => ({
        name: a.name, demo: !!a.demo, kind: E.ACC_KINDS[a.kind], cur: a.cur, opening: this.M(a.opening, a.cur), bal: this.M(D.bal[a.id], a.cur),
        balCls: a.kind === 'credit' ? (D.bal[a.id] < 0 ? 'neg' : '') : '', payable: a.kind === 'credit' && D.bal[a.id] < 0, tw: this.M(D.tw(a.id)),
        archive: () => this.confirm('封存帳戶？', '「' + a.name + '」會從列表與總額中隱藏，交易紀錄保留。', () => this.upd(function (s) { s.accounts.find(function (x) { return x.id === a.id; }).archived = true; }, { action: '封存帳戶', entity: 'accounts', detail: a.name }))
      })),
      noAccounts: !S.accounts.length,
      others: S.assets.map((a) => ({ name: a.name, type: E.ASSET_TYPES[a.type], val: this.M(a.value), meta: '評價日 ' + E.fmtD(a.date) + (a.monthlyIncome ? ' · 定期收入 ' + this.M(a.monthlyIncome) + '／月' : '') + (a.maintenance ? ' · 維護支出 ' + this.M(a.maintenance) + '／月' : ''), update: () => this.setModal0({ kind: 'value', id: a.id, title: '更新評價：' + a.name, form: { value: String(a.value / 100) } }) })),
      othersNone: !S.assets.length,
      liabs: S.liabilities.map((l) => ({ name: l.name, val: this.M(l.balance), meta: '年利率 ' + l.rate + '% · 分期 ' + this.M(l.installment) + (l.dueDay ? ' · 每月 ' + l.dueDay + ' 日到期' : ''), update: () => this.setModal0({ kind: 'lbal', id: l.id, title: '更新餘額：' + l.name, form: { balance: String(l.balance / 100) } }) })),
      cc: sh.ccOwed > 0, ccVal: this.M(sh.ccOwed), liabsNone: !S.liabilities.length && !(sh.ccOwed > 0),
      rates: Object.keys(rates).map((k) => ({ cur: k, rate: rates[k].rate, date: rates[k].date, onRate: this.rateH(k, 'rate'), onDate: this.rateH(k, 'date') })),
      ratesDirty: !!st.ratesDraft, ratesClean: !st.ratesDraft, newCur: st.newCur, onNewCur: this.sf('newCur')
    };
  }
  rateH(cur, field) {
    var k = 'rate:' + cur + ':' + field;
    if (!this._sh[k]) this._sh[k] = (e) => {
      var v = e.target.value;
      this.setState((st) => { var r = clone(st.ratesDraft || this.ratesFromSettings()); r[cur] = Object.assign({}, r[cur], { [field]: v }); return { ratesDraft: r }; });
    };
    return this._sh[k];
  }
  vmGarden() {
    var S = this.state.data, D = this.getD(), st = this.state;
    var sel = st.plantSel && D.plants.some(function (p) { return p.id === st.plantSel; }) ? st.plantSel : (D.plants[0] && D.plants[0].id);
    var p = D.plants.find(function (x) { return x.id === sel; });
    var card = { has: false, isProject: false, eyebrow: '', title: '', plant: plantVM('seed'), rows: [], open: this.noop };
    if (p && p.kind === 'income') {
      var s = p.ref;
      card = { has: true, isProject: false, eyebrow: 'INCOME SOURCE', title: s.cat, plant: plantVM(p.stage), open: this.noop, rows: [
        { k: '所屬', v: '收入來源（類別：' + s.cat + '）', cls: '' }, { k: '首次紀錄', v: E.fmtD(s.first), cls: '' }, { k: '目前階段', v: E.STAGES[p.stage], cls: '' },
        { k: '近 90 日已實現', v: this.M(s.total) + '（' + s.txs.length + ' 筆，' + s.months.size + ' 個月份）', cls: 'num' }, { k: '最近更新', v: E.fmtD(s.last), cls: '' },
        { k: '判定依據', v: '近 90 日有 2 個以上月份收到此類收入 → 穩定發光；否則為發光花苞。', cls: 'dim' }] };
    } else if (p) {
      var pr = p.ref, m = D.pm[pr.id], ms = pr.milestones || [], last = (pr.history || [])[(pr.history || []).length - 1], next = (pr.tasks || []).filter(function (t) { return !t.done; })[0];
      var pending = ms.filter(function (x) { return x.done && !x.verified; }).length;
      card = { has: true, isProject: true, eyebrow: 'CULTIVATION PROJECT', title: pr.name, plant: plantVM(p.stage, { grow: st.grew === p.id }), open: () => this.nav('projects', pr.id), rows: [
        { k: '所屬計畫', v: pr.desc || '—', cls: '' }, { k: '建立日期', v: E.fmtD(pr.created), cls: '' }, { k: '目前階段', v: E.STAGES[p.stage] + ' · 狀態 ' + pr.status, cls: '' },
        { k: '已投入金錢', v: this.M(m.money) + (pr.budget ? ' / 預算 ' + this.M(pr.budget) : ''), cls: 'num' }, { k: '已投入時間', v: E.fmtMin(m.time), cls: '' },
        { k: '心力紀錄', v: m.energy.length ? m.energy.length + ' 項活動，平均 ' + (m.energy.reduce(function (a, b) { return a + b; }, 0) / m.energy.length).toFixed(1) : '無', cls: '' },
        { k: '預期收益（預測）', v: pr.expected || '未設定', cls: 'dim' }, { k: '已實現收益', v: this.M(m.income), cls: 'num pos' }, { k: '階段目標', v: pr.goal || '—', cls: '' },
        { k: '已完成里程碑', v: ms.filter(function (x) { return x.verified; }).length + ' / ' + ms.length + ' 已驗證' + (pending ? ' · ' + pending + ' 項待驗證' : ''), cls: '' },
        { k: '最近更新', v: last ? E.fmtD(last.date) + ' ' + last.text : '—', cls: '' }, { k: '風險與行動', v: (pr.risks || '—') + (next ? '　下一步：' + next.text : ''), cls: '' }] };
    }
    var icats = E.allCats(S, 'income'), win = st.gwin, gf = D.flow(E.addDays(D.T, -(Number(win) - 1)), D.T);
    var items = Object.entries(gf.ic).sort(function (a, b) { return b[1] - a[1]; }), mx = Math.max.apply(null, [1].concat(items.map(function (i) { return i[1]; })));
    var W = 600, H = 260, lines = '';
    var stars = items.map((it, i) => {
      var ang = i * 2.399963, r = i === 0 ? 0 : 40 + Math.sqrt(i) * 42, x = W / 2 + r * Math.cos(ang) * 1.6, y = H / 2 + r * Math.sin(ang) * 0.75;
      x = Math.max(40, Math.min(W - 40, x)); y = Math.max(30, Math.min(H - 40, y));
      if (i > 0) lines += 'M' + (W / 2) + ' ' + (H / 2) + 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      var size = Math.round(12 + Math.sqrt(it[1] / mx) * 46), col = catCol(it[0], icats), dimmed = st.starPick && st.starPick !== it[0];
      return { label: it[0], val: this.M(it[1]), left: (x / W * 100).toFixed(2), top: (y / H * 100).toFixed(2), size: size, color: col, op: dimmed ? 0.35 : 1, glow: Math.round(size / 2), pressed: st.starPick === it[0] ? 'true' : 'false', pick: () => this.setState({ starPick: st.starPick === it[0] ? null : it[0] }) };
    });
    var picked = st.starPick ? D.txs.filter(function (t) { return t.type === 'income' && t.cat === st.starPick && t.date >= E.addDays(D.T, -(Number(win) - 1)); }).slice(0, 8).map((t) => this.txRow(t)) : [];
    var ev = [];
    S.projects.forEach((pp) => this.projectEvents(pp).filter(function (e) { return ['收入產生', '成果驗證', '計畫調整'].indexOf(e.k) >= 0; }).forEach(function (e) { ev.push(Object.assign({}, e, { text: '【' + pp.name + '】' + e.text })); }));
    ev.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return {
      income: D.plants.filter(function (x) { return x.kind === 'income'; }).map((x) => this.plantItem(x, sel)),
      projects: D.plants.filter(function (x) { return x.kind === 'project'; }).map((x) => this.plantItem(x, sel)),
      incomeNone: !D.plants.some(function (x) { return x.kind === 'income'; }), projectsNone: !D.plants.some(function (x) { return x.kind === 'project'; }),
      card: card, noCard: !card.has,
      legend: Object.keys(E.STAGES).map(function (k) { return Object.assign(plantVM(k, { animate: false }), { desc: STAGE_DESC[k] }); }),
      gwin: this.seg([['30', '30 日'], ['90', '90 日'], ['365', '一年']], win, (v) => this.setState({ gwin: v, starPick: null })),
      stars: stars, starLines: lines, starsNone: !items.length, picked: picked, pickedShow: picked.length > 0,
      timeline: ev.slice(0, 14).map((e) => ({ date: E.fmtD(e.date), k: e.k, text: e.text, amt: e.amt != null ? this.M(e.amt) : '', color: e.c })), timelineNone: !ev.length
    };
  }
  projectEvents(p) {
    var S = this.state.data, D = this.getD(), m = D.pm[p.id], ev = [];
    if (!m) return ev;
    (p.history || []).forEach(function (h) { ev.push({ date: h.date, text: h.text, c: '#5B2C91', k: '計畫調整' }); });
    (p.milestones || []).forEach(function (x) { if (x.verified) ev.push({ date: x.date, text: '里程碑已驗證：' + x.name, c: '#9A1F6B', k: '成果驗證' }); });
    (p.tasks || []).forEach(function (t) { if (t.done && t.doneDate) ev.push({ date: t.doneDate, text: '完成任務：' + t.text, c: '#00707E', k: '任務完成' }); });
    m.txs.forEach(function (x) { var inc = x.t.type === 'income' || x.t.type === 'realized'; ev.push({ date: x.t.date, text: (inc ? '收入產生：' : '金錢投入：') + x.t.desc + '（' + x.pct + '%）', amt: x.part, c: inc ? '#0A6B45' : '#A3122A', k: inc ? '收入產生' : '投入' }); });
    m.acts.forEach(function (x) { ev.push({ date: x.a.date, text: '時間投入：' + x.a.title + ' ' + E.fmtMin(x.a.minutes * x.pct / 100), c: '#1F4E9E', k: '投入時間' }); });
    S.suggestions.filter(function (s) { return s.projectId === p.id; }).forEach(function (s) { ev.push({ date: s.decided || s.created, text: '建議草案核准：' + s.title, c: '#8A6400', k: 'AI 建議' }); });
    return ev.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }
  vmProjects() {
    var S = this.state.data, D = this.getD(), st = this.state;
    var p = st.projSel && S.projects.find(function (x) { return x.id === st.projSel; });
    var list = S.projects.map((pp) => {
      var m = D.pm[pp.id], ms = pp.milestones || [], ver = ms.filter(function (x) { return x.verified; }).length;
      return Object.assign({ name: pp.name, status: pp.status, goal: pp.goal || '—', prog: ms.length ? (ver / ms.length * 100).toFixed(0) : '0', progLabel: ver + '/' + ms.length + ' 里程碑', money: this.M(m.money), time: E.fmtMin(m.time), income: this.M(m.income), demo: !!pp.demo, open: () => this.setState({ projSel: pp.id }) }, { plant: plantVM(D.stageOf(pp), { grow: st.grew === 'p:' + pp.id }) });
    });
    var d = { has: false, plant: plantVM('seed'), kv: [], ms: [], tasks: [], allocs: [], allocNone: true, ev: [], evNone: true, status: [], name: '', statusLabel: '', stageLabel: '', stageColor: '#00707E', demo: false, msName: '', taskName: '', msNone: true, tasksNone: true };
    if (p) {
      var m = D.pm[p.id], stage = D.stageOf(p), avgE = m.energy.length ? (m.energy.reduce(function (a, b) { return a + b; }, 0) / m.energy.length).toFixed(1) : null;
      d = {
        has: true, name: p.name, statusLabel: p.status, demo: !!p.demo, plant: plantVM(stage, { grow: st.grew === 'p:' + p.id }), stageLabel: E.STAGES[stage], stageColor: STAGE_C[stage],
        status: E.P_STATUS.map((s) => ({ label: s, cls: s === p.status ? 'on' : '', pressed: s === p.status ? 'true' : 'false', pick: () => this.setProjectStatus(p.id, s) })),
        kv: [
          { k: '說明', v: p.desc || '—', cls: '' }, { k: '目標', v: p.goal || '—', cls: '' }, { k: '預計完成', v: E.fmtD(p.due), cls: '' },
          { k: '預算', v: this.M(p.budget) + '（已用 ' + (p.budget ? Math.round(m.money / p.budget * 100) : 0) + '%）', cls: 'num' }, { k: '時間投入', v: E.fmtMin(m.time), cls: '' },
          { k: '心力評估', v: avgE != null ? '平均 ' + avgE + '（' + m.energy.length + ' 項活動）' : '無紀錄', cls: '' },
          { k: '預期成果（預測）', v: p.expected || '—', cls: 'dim' },
          { k: '實際成果（已實現）', v: '收入 ' + this.M(m.income) + ' · 已驗證里程碑 ' + (p.milestones || []).filter(function (x) { return x.verified; }).length + ' 項', cls: 'pos' },
          { k: '風險', v: (p.risks || '—') + (p.riskFlag ? '（已標記需檢視）' : ''), cls: p.riskFlag ? 'wrn' : '' }
        ],
        ms: (p.milestones || []).map((x) => ({ name: x.name, sub: x.verified ? '已驗證 ' + E.fmtD(x.date) : x.done ? '已完成、待驗證' : '未完成', cls: x.verified ? 'v' : x.done ? 'w' : '', canVerify: !x.verified, verify: () => this.verifyMilestone(p.id, x.id) })),
        msNone: !(p.milestones || []).length,
        tasks: (p.tasks || []).map((t) => ({ text: t.text, done: !!t.done, cls: t.done ? 'done' : '', due: t.due ? E.fmtD(t.due) : '', toggle: () => this.upd(function (s) { var x = s.projects.find(function (y) { return y.id === p.id; }); var y = x.tasks.find(function (z) { return z.id === t.id; }); y.done = !y.done; y.doneDate = y.done ? E.todayISO() : undefined; }, { action: '更新專案', entity: 'projects', detail: p.name + '｜' + (t.done ? '取消完成' : '完成') + '任務 ' + t.text }) })),
        tasksNone: !(p.tasks || []).length,
        allocs: m.txs.map((x) => ({ desc: x.t.desc, meta: E.fmtD(x.t.date) + ' · ' + E.TYPES[x.t.type] + ' · 原始 ' + this.M(x.t.base) + ' × ' + x.pct + '%', amt: this.M(x.t.type === 'expense' ? -x.part : x.part, 'TWD', true), cls: x.t.type === 'expense' ? 'neg' : 'pos' })),
        allocNone: !m.txs.length,
        ev: this.projectEvents(p).map((e) => ({ date: E.fmtD(e.date), k: e.k, text: e.text, amt: e.amt != null ? this.M(e.amt) : '', color: e.c })), evNone: false,
        msName: st.msName, taskName: st.taskName
      };
      d.evNone = !d.ev.length;
    }
    return { list: list, listNone: !S.projects.length, isList: !p, isDetail: !!p, allocated: this.M(D.allocatedCost), d: d, onMs: this.sf('msName'), onTask: this.sf('taskName') };
  }
  vmAI() {
    var S = this.state.data, st = this.state;
    var lines = (st.aiLines || this.aiIntro()).map(function (l, i) { return { t: l.t, cls: 'ln ' + (l.c || ''), k: i }; });
    var consent = S.settings.aiConsent;
    var sugCard = (s) => ({
      title: s.title, source: s.source,
      rows: [['發現', s.finding], ['資料依據', s.basis], ['建議原因', s.reason], ['可行方案', s.plan], ['預估金錢', this.M(s.money)], ['預估時間', E.fmtMin(s.timeMin)], ['心力負擔', s.energy], ['潛在效益', s.benefit], ['主要風險', s.risks], ['衡量方法', s.measure]].map(function (r) { return { k: r[0], v: r[1], cls: '' }; }),
      steps: (s.steps || []).map(function (x, i) { return { n: i + 1, t: x }; }),
      approve: () => this.decide(s.id, 'approve'), reject: () => this.decide(s.id, 'reject')
    });
    var pending = S.suggestions.filter(function (s) { return s.status === 'pending'; });
    var done = S.suggestions.filter(function (s) { return s.status !== 'pending'; });
    return {
      lines: lines, busy: st.aiBusy, idle: !st.aiBusy, q: st.aiQ, onQ: this.sf('aiQ'),
      quick: [['income', '分析收入與支出'], ['recurring', '持續性支出'], ['time', '時間配置'], ['energy', '心力消耗與恢復'], ['convert', '支出轉化資產']].map((x) => ({ label: x[1], run: () => this.aiRun(x[0]) })),
      providers: [['Google Gemini', '第一版串接'], ['OpenAI', '第一版串接'], ['Claude', '預留供應商']].map(function (x) { return { name: x[0], sub: x[1] }; }),
      consent: [['summary', '彙總統計資料'], ['projects', '專案與里程碑'], ['raw', '逐筆交易明細']].map(function (x) { return { label: x[1], on: !!consent[x[0]], tag: consent[x[0]] ? '已授權' : '未授權', tagCls: consent[x[0]] ? 'ok' : '' }; }),
      pending: pending.map(sugCard), pendingNone: !pending.length, pendingTitle: '待核准草案（' + pending.length + '）',
      done: done.map(function (s) { return { title: s.title, meta: s.source + ' · ' + E.fmtD(s.decided), tag: s.status === 'approved' ? '已核准' : '已駁回', tagCls: s.status === 'approved' ? 'ok' : 'b' }; }), doneShow: done.length > 0,
      goSettings: () => this.nav('settings')
    };
  }
  vmReports() {
    var S = this.state.data, D = this.getD(), st = this.state, mk = st.repMonth;
    var f = D.flow(mk + '-01', E.monthEnd(mk)), prev = D.flow(E.addMonths(mk, -1) + '-01', E.monthEnd(E.addMonths(mk, -1)));
    var as = D.actStats(mk + '-01', E.monthEnd(mk)), wk = D.a7, wf = D.flow(E.addDays(D.T, -6), D.T);
    var first = D.months[0].k, lastM = D.months[D.months.length - 1].k;
    var delta = function (a, b) { return b ? Math.round((a - b) / Math.abs(b) * 100) : null; };
    var dInc = delta(f.inc, prev.inc), dExp = delta(f.exp, prev.exp);
    var mrow = D.months.find(function (m) { return m.k === mk; }) || {};
    var ecats = E.allCats(S, 'expense'), icats = E.allCats(S, 'income');
    return {
      month: mk.replace('-', ' 年 ') + ' 月', prevDis: mk <= first, nextDis: mk >= lastM,
      prev: () => this.setState({ repMonth: E.addMonths(mk, -1), repGen: false }), next: () => this.setState({ repMonth: E.addMonths(mk, 1), repGen: false }),
      gen: st.repGen, notGen: !st.repGen, genHint: '按「產生月報」，依 ' + mk + ' 的資料即時計算。',
      week: { inc: this.M(wf.inc), exp: this.M(wf.exp), min: E.fmtMin(wk.min), proj: E.fmtMin(wk.projMin), avg: wk.avg == null ? '—' : wk.avg.toFixed(1), rec: wk.posShare == null ? '—' : Math.round(wk.posShare * 100) + '%' },
      kv: [
        { k: '實際收入', v: this.M(f.inc) + (dInc != null ? '（較前月 ' + (dInc > 0 ? '+' : '') + dInc + '%）' : ''), cls: 'num' },
        { k: '已實現投資損益', v: this.M(f.real), cls: 'num' },
        { k: '支出', v: this.M(f.exp) + (dExp != null ? '（較前月 ' + (dExp > 0 ? '+' : '') + dExp + '%）' : ''), cls: 'num' },
        { k: '淨現金流', v: this.M(f.net, 'TWD', true), cls: 'num ' + (f.net >= 0 ? 'pos' : 'neg') },
        { k: '月底淨資產', v: this.M(mrow.netWorth) + '（其他資產與負債以目前值近似）', cls: 'num' }
      ],
      ibars: this.bars(Object.entries(f.ic).sort(function (a, b) { return b[1] - a[1]; }), f.inc, function (c) { return catCol(c, icats); }),
      ebars: this.bars(Object.entries(f.ec).filter(function (x) { return x[1]; }).sort(function (a, b) { return b[1] - a[1]; }), f.exp, function (c) { return catCol(c, ecats); }),
      sheet: [{ k: '總資產', v: this.M(D.now.assets), cls: 'num' }, { k: '總負債', v: this.M(D.now.liab), cls: 'num neg' }, { k: '淨資產', v: this.M(D.now.net), cls: 'num neu' }],
      tbars: this.bars(Object.entries(as.byKind).sort(function (a, b) { return b[1] - a[1]; }), as.min, function (k) { return CAT[E.ACT_KINDS.indexOf(k) % CAT.length]; }, null, function (v) { return E.fmtMin(v); }),
      tTotal: '合計 ' + E.fmtMin(as.min),
      energy: '平均 ' + (as.avg == null ? '—' : as.avg.toFixed(2)) + ' · ' + as.count + ' 項活動',
      drains: as.drains.map(function (a) { return a.title; }).join('、') || '—', recov: as.recov.map(function (a) { return a.title; }).join('、') || '—',
      projects: S.projects.map((p) => ({ name: p.name, status: p.status, money: this.M(D.pm[p.id].money), time: E.fmtMin(D.pm[p.id].time), income: this.M(D.pm[p.id].income), forecast: p.expectedAmt ? this.M(p.expectedAmt) + '／月（預測）' : '—' })),
      nw: this.chart('rnw', D.months.map(function (m) { return m.k.slice(2).replace('-', '/'); }), [{ name: '淨資產', color: this.accent(), values: D.months.map(function (m) { return m.netWorth; }) }], { h: 200 })
    };
  }
  vmNotes() {
    var S = this.state.data, D = this.getD(), read = new Set(S.notifRead);
    return {
      list: D.notes.map((n) => ({
        type: n.type, tone: n.tone, text: S.privacy && n.sensitive ? maskMoney(n.text) : n.text, unread: !read.has(n.id), op: read.has(n.id) ? 0.62 : 1,
        go: () => { if (!read.has(n.id)) this.upd(function (d) { d.notifRead.push(n.id); }); if (n.page) this.nav(n.page); }
      })),
      none: !D.notes.length
    };
  }
  vmSettings() {
    var S = this.state.data, D = this.getD(), st = this.state, ops = S.settings.opsBudget || E.defaultOps();
    var opsSum = ops.items.reduce(function (s, i) { return s + i.v; }, 0);
    var bud = st.budDraft || this.budFromData();
    var c = S.settings.aiConsent;
    var vm = {
      storage: st.noStore ? '僅存在記憶體（此環境不允許瀏覽器儲存，重新整理後會遺失）' : '此瀏覽器的 localStorage（設計原型，非雲端資料庫）',
      version: 'v' + VERSION + '（資料格式 v' + E.STATE_VERSION + '）',
      hourly: st.hourlyDraft != null ? st.hourlyDraft : String(S.settings.hourly / 100), onHourly: this.sf('hourlyDraft'),
      snap: S.settings.snapshotDate, onSnap: this.snapH || (this.snapH = (e) => { var v = e.target.value; if (!v) return; this.upd(function (d) { d.settings.snapshotDate = v; }, { action: '變更快照日', entity: 'user_preferences', detail: v }); }),
      mail: S.settings.emailPrivacy, onMail: this.mailH || (this.mailH = (e) => { var v = e.target.value; this.upd(function (d) { d.settings.emailPrivacy = v; }, { action: '變更 Email 隱私', entity: 'user_preferences', detail: v }); }),
      consent: [['summary', '允許使用彙總統計資料（收支總額、分類比例、時間與心力平均）'], ['projects', '允許使用專案、里程碑與成果'], ['raw', '允許傳送逐筆交易明細（含說明文字）']].map((x) => ({
        label: x[1], on: !!c[x[0]], toggle: () => { var v = !c[x[0]]; this.upd(function (d) { d.settings.aiConsent[x[0]] = v; }, { action: '變更 AI 資料授權', entity: 'user_preferences', detail: x[1] + '：' + (v ? '允許' : '拒絕') }); }
      })),
      budgets: Object.keys(bud).map((k) => ({ cat: k, val: bud[k], used: '本月已用 ' + this.M(D.month.ec[k] || 0), onVal: this.budH(k), remove: () => { var b = Object.assign({}, st.budDraft || this.budFromData()); delete b[k]; this.setState({ budDraft: b }); } })),
      budNone: !Object.keys(bud).length,
      budChoices: E.allCats(S, 'expense').filter(function (x) { return !(x in bud); }).map((x) => ({ label: x, cls: st.budNew === x ? 'on' : '', pressed: st.budNew === x ? 'true' : 'false', pick: () => this.setState({ budNew: st.budNew === x ? '' : x }) })),
      budDirty: !!st.budDraft, budAddDis: !st.budNew,
      customInc: (S.customCats.income || []).map(function (x) { return { label: x }; }), customExp: (S.customCats.expense || []).map(function (x) { return { label: x }; }),
      customNone: !(S.customCats.income || []).length && !(S.customCats.expense || []).length,
      catKinds: this.seg([['expense', '支出'], ['income', '收入']], st.catKind, (v) => this.setState({ catKind: v })), catName: st.catName, onCatName: this.sf('catName'),
      ops: ops.items.map((it, i) => ({ k: it.k, v: String(it.v / 100), onV: this.opsH(i) })),
      opsSum: this.M(opsSum) + ' / ' + this.M(ops.total), opsCls: opsSum > ops.total ? 'neg' : opsSum > ops.total * 0.8 ? 'wrn' : 'pos', opsOver: opsSum > ops.total,
      impDef: st.impDef || (S.accounts[0] && S.accounts[0].id) || '',
      impAccts: S.accounts.map((a) => ({ label: a.name, cls: (st.impDef || (S.accounts[0] && S.accounts[0].id)) === a.id ? 'on' : '', pressed: 'false', pick: () => this.setState({ impDef: a.id }) })),
      impPaste: st.impPaste, onImpPaste: this.sf('impPaste'), impErr: st.impErr, impErrShow: !!st.impErr,
      audit: S.audit.slice().reverse().slice(0, 200).map(function (a) { return { ts: a.ts.slice(0, 16).replace('T', ' '), action: a.action, entity: a.entity, detail: S.privacy ? maskMoney(a.detail) : a.detail }; }),
      done: ['主控制台：財富脈動、資產結構（可點選）、現金流、三維雷達、花園概覽、規則式洞察', '收支：新增／編輯／軟刪除與復原、搜尋與篩選、範本、重複紀錄、對帳、回收區、收支圖表', '帳務規則（沿用 17 項自動測試的引擎）：轉帳、信用卡應付與繳款、換匯、退款、投資本金、已實現與未實現損益', '多帳戶、多幣別、手動匯率、資產與負債、評價更新', '三維資源：金錢／時間／心力；今日／7 日／30 日心力統計與趨勢', '專案成本與時間分攤（≤100%），心力不重複計入', '財富花園植物卡、成長規則、收入星系、成長時間軸', 'AI 策略師介面、資料授權、草案核准（AI 無寫入路徑）、規則式分析（明確標示非 AI）', '週巡檢、月報、通知中心、成就', 'CSV 匯入（去重與快照規則）、JSON 備份匯出與還原、CSV 匯出', '指令面板、隱私遮罩、異動紀錄、手機底部導覽與快速記帳、設定精靈'],
      todo: ['雲端資料庫、跨裝置同步、每日加密備份（目前只存在此瀏覽器）', '帳號登入、多因素驗證、多人資料隔離（後端草案在 Android 專案的 supabase/，尚未部署）', 'Gemini／OpenAI 實際串接與用量控管', '週報／月報排程與 Email 通知', 'Excel 直接匯入（網頁版請先另存為 CSV）', '自動市場匯率、貸款本息自動拆分']
    };
    vm.done = vm.done.map(function (t) { return { t: t }; });
    vm.todo = vm.todo.map(function (t) { return { t: t }; });
    return vm;
  }
  budH(k) {
    var key = 'bud:' + k;
    if (!this._sh[key]) this._sh[key] = (e) => { var v = e.target.value; this.setState((st) => { var b = Object.assign({}, st.budDraft || this.budFromData()); b[k] = v; return { budDraft: b }; }); };
    return this._sh[key];
  }
  opsH(i) {
    var key = 'ops:' + i;
    if (!this._sh[key]) this._sh[key] = (e) => { var v = E.parseC(e.target.value) || 0; this.upd(function (d) { var o = d.settings.opsBudget || (d.settings.opsBudget = E.defaultOps()); o.items[i].v = Math.max(0, v); }); };
    return this._sh[key];
  }

  /* ======================= DIALOG VIEW MODELS (flat) ======================= */
  vmTx(m) {
    var S = this.state.data, f = m.form, T = f.type, two = E.TWO_LEG.includes(T);
    var accs = S.accounts.filter(function (a) { return !a.archived; });
    var acc = function (id) { return S.accounts.find(function (a) { return a.id === id; }); };
    var a1 = two ? acc(f.from) : acc(f.acct), a2 = two ? acc(f.to) : null;
    var cats = T === 'income' ? E.allCats(S, 'income') : (T === 'realized' || T === 'valuation') ? [] : E.allCats(S, 'expense');
    var chips = (field, list) => list.map((a) => ({ label: a.name, sub: a.cur, cls: f[field] === a.id ? 'on' : '', pressed: f[field] === a.id ? 'true' : 'false', pick: () => this.setForm({ [field]: a.id }) }));
    var x = E.parseC(f.amt), y = E.parseC(f.toAmt);
    var rate = a1 ? E.rateOf(S, a1.cur) : 1;
    var al = this.allocVM(f.alloc || [], S.projects.filter(function (p) { return p.status !== '終止'; }));
    return Object.assign({
      title: m.title, edit: !!f.id, notEdit: !f.id, errs: m.errs || [], hasErrs: (m.errs || []).length > 0,
      types: Object.keys(E.TYPES).map((k) => ({ label: E.TYPES[k], cls: k === T ? 'on' : '', pressed: k === T ? 'true' : 'false', pick: () => this.setForm({ type: k, cat: '' }) })),
      date: f.date, amt: f.amt, toAmt: f.toAmt, desc: f.desc,
      amtLabel: (T === 'fx' ? '兌出金額' : '金額') + '（' + (a1 ? a1.cur : '原幣') + '）', amtHint: (T === 'valuation' || T === 'realized') ? '損失或評價下降請輸入負數' : '',
      two: two, one: !two, isFx: T === 'fx', hasCats: !two && cats.length > 0,
      cats: cats.map((c) => ({ label: c, cls: f.cat === c ? 'on' : '', pressed: f.cat === c ? 'true' : 'false', pick: () => this.setForm({ cat: c }) })),
      accts: chips('acct', accs.filter(function (a) { return T === 'valuation' ? a.kind === 'invest' : true; })),
      froms: chips('from', accs), tos: chips('to', accs.filter(function (a) { return T === 'ccpay' ? a.kind === 'credit' : true; })),
      toLabel: T === 'ccpay' ? '信用卡（轉入）' : '轉入帳戶', toAmtLabel: '實際入帳金額（' + (a2 ? a2.cur : '目標幣別') + '）',
      fxHint: (x > 0 && y > 0 && a1 && a2) ? '實際成交匯率：1 ' + a2.cur + ' = ' + (x / y).toFixed(4) + ' ' + a1.cur + '（保存原幣、匯率與日期）' : '系統以實際入帳金額計算成交匯率',
      foreign: !!(a1 && a1.cur !== 'TWD' && T !== 'fx'), foreignNote: a1 ? '外幣帳戶：系統保存原幣金額、記帳當下的手動匯率（1 ' + a1.cur + ' = ' + rate + ' TWD，' + ((S.settings.rates[a1.cur] || {}).date || '未設定日期') + '）與換算後金額。' : '',
      isCcpay: T === 'ccpay', isTransfer: T === 'transfer', isVal: T === 'valuation', isExp: T === 'expense', canAlloc: ['expense', 'income', 'refund', 'realized'].indexOf(T) >= 0,
      rec: !!f.recurringAttr, reuse: !!f.reusable, withAct: !!f.withAct, minutes: f.minutes, saveTpl: !!f.saveTpl,
      kinds: E.ACT_KINDS.map((k) => ({ label: k, cls: f.kind === k ? 'on' : '', pressed: f.kind === k ? 'true' : 'false', pick: () => this.setForm({ kind: k }) })),
      energy: this.energyVM(Number(f.energy)), energyLabel: (Number(f.energy) > 0 ? '+' : '') + Number(f.energy) + '　' + E.ELABEL[String(Number(f.energy))],
      on: { date: this.fld('date'), amt: this.fld('amt'), toAmt: this.fld('toAmt'), desc: this.fld('desc'), rec: this.fld('recurringAttr'), reuse: this.fld('reusable'), withAct: this.fld('withAct'), minutes: this.fld('minutes'), saveTpl: this.fld('saveTpl') },
      submitLabel: f.id ? '確認修改' : '確認新增'
    }, al);
  }
  vmTxd(m) {
    var S = this.state.data, t = S.txs.find(function (x) { return x.id === m.id; });
    if (!t) return { kv: [], acts: [], allocs: [], isExp: false };
    var a = S.accounts.find(function (x) { return x.id === (t.acct || t.from); }), b = t.to && S.accounts.find(function (x) { return x.id === t.to; });
    var isExp = t.type === 'expense';
    var kv = [{ k: '類型', v: E.TYPES[t.type], cls: '' }, { k: '金額', v: this.M(t.amt, t.cur) + (t.cur !== 'TWD' && t.type !== 'fx' ? ' · 匯率 ' + t.rate + ' · 換算 ' + this.M(t.base) : ''), cls: 'num' }];
    if (t.type === 'fx') kv.push({ k: '兌換', v: this.M(t.amt, t.cur) + ' → ' + this.M(t.toAmt, t.toCur) + '　成交匯率 1 ' + t.toCur + ' = ' + (t.amt / t.toAmt).toFixed(4) + ' ' + t.cur + '（' + E.fmtD(t.date) + '）', cls: 'num' });
    if (t.cat) kv.push({ k: '類別', v: t.cat, cls: '' });
    kv.push({ k: '帳戶', v: (a ? a.name : '—') + (b ? ' → ' + b.name : ''), cls: '' });
    kv.push({ k: '發生時間', v: E.fmtD(t.date) + '　建立 ' + t.created.slice(0, 16).replace('T', ' '), cls: '' });
    if (isExp) { kv.push({ k: '持續性支出', v: t.recurringAttr ? '是' : '否', cls: t.recurringAttr ? 'wrn' : '' }); kv.push({ k: '可轉化資產', v: t.reusable ? '可能轉化為可重複利用資產' : '未標記', cls: t.reusable ? 'vio' : '' }); }
    if (t.snapshotCovered) kv.push({ k: '匯入規則', v: '早於初始快照日，僅計入歷史統計，不影響帳戶餘額（避免重複計算）。', cls: 'wrn' });
    if (t.demo) kv.push({ k: '資料來源', v: '示範資料（虛構）', cls: 'wrn' });
    return {
      title: isExp ? '支出透視 EXPENSE X-RAY' : '交易明細', kv: kv, isExp: isExp,
      allocs: (t.alloc || []).map((x) => { var p = S.projects.find(function (p) { return p.id === x.pid; }); return { name: p ? p.name : '已刪除專案', v: x.pct + '% · ' + this.M(Math.round(t.base * x.pct / 100)) }; }),
      allocNone: !(t.alloc || []).length,
      acts: S.activities.filter(function (x) { return x.txId === t.id && !x.deleted; }).map(function (x) { return { v: x.title + ' · ' + E.fmtMin(x.minutes) + ' · 心力 ' + (x.energy > 0 ? '+' : '') + x.energy }; }),
      actsNone: !S.activities.some(function (x) { return x.txId === t.id && !x.deleted; }),
      del: () => this.deleteTx(t.id), edit: () => this.openTx(t),
      toProject: () => this.openProj({ name: t.desc + ' 轉化計畫', desc: '由支出「' + t.desc + '」（' + E.fmtD(t.date) + '，' + E.fmt(t.base) + '）發現的培育機會。', status: '構想' }, (id) => this.setState({ page: 'projects', projSel: id }))
    };
  }
  vmAct(m) {
    var S = this.state.data, f = m.form;
    var cost = S.settings.hourly * (Number(f.minutes) || 0) / 60;
    return Object.assign({
      title: m.title, errs: m.errs || [], hasErrs: (m.errs || []).length > 0,
      ftitle: f.title, date: f.date, minutes: f.minutes, saved: f.saved,
      minHint: S.settings.hourly ? '參考機會成本 ' + this.M(Math.round(cost)) + '（不計入現金或帳戶餘額）' : '未設定參考時薪',
      kinds: E.ACT_KINDS.map((k) => ({ label: k, cls: f.kind === k ? 'on' : '', pressed: f.kind === k ? 'true' : 'false', pick: () => this.setForm({ kind: k }) })),
      energy: this.energyVM(Number(f.energy)), energyLabel: (Number(f.energy) > 0 ? '+' : '') + Number(f.energy) + '　' + E.ELABEL[String(Number(f.energy))],
      on: { title: this.fld('title'), date: this.fld('date'), minutes: this.fld('minutes'), saved: this.fld('saved') },
      submitLabel: f.id ? '確認修改' : '確認新增'
    }, this.allocVM(f.alloc || [], S.projects.filter(function (p) { return p.status !== '終止'; })));
  }
  vmActd(m) {
    var S = this.state.data, a = S.activities.find(function (x) { return x.id === m.id; });
    if (!a) return { kv: [] };
    return {
      kv: [{ k: '活動', v: a.title, cls: '' }, { k: '日期', v: E.fmtD(a.date), cls: '' }, { k: '時間', v: E.fmtMin(a.minutes) + '（參考機會成本 ' + this.M(Math.round(S.settings.hourly * a.minutes / 60)) + '，不計入現金）', cls: '' },
        { k: '心力', v: (a.energy > 0 ? '+' : '') + a.energy + '　' + E.ELABEL[String(a.energy)], cls: a.energy > 0 ? 'pos' : a.energy < 0 ? 'neg' : '' }, { k: '節省時間', v: E.fmtMin(a.saved), cls: '' },
        { k: '專案分攤', v: (a.alloc || []).map(function (x) { var p = S.projects.find(function (p) { return p.id === x.pid; }); return (p ? p.name : '?') + ' ' + x.pct + '% · ' + E.fmtMin(a.minutes * x.pct / 100); }).join('、') || '無', cls: '' }],
      del: () => this.confirm('刪除活動？', '這項活動的時間與心力會從統計中移除。', () => { this.upd(function (s) { s.activities.find(function (x) { return x.id === a.id; }).deleted = true; }, { action: '刪除活動', entity: 'activities', detail: a.title }); this.toast('活動已刪除。'); }, true),
      edit: () => this.openAct(a)
    };
  }
  vmProj(m) {
    var f = m.form;
    return {
      title: m.title, errs: m.errs || [], hasErrs: (m.errs || []).length > 0, name: f.name, desc: f.desc, goal: f.goal, due: f.due, budget: f.budget, expectedAmt: f.expectedAmt, expected: f.expected, risks: f.risks, riskFlag: !!f.riskFlag,
      status: E.P_STATUS.map((s) => ({ label: s, cls: f.status === s ? 'on' : '', pressed: f.status === s ? 'true' : 'false', pick: () => this.setForm({ status: s }) })),
      on: { name: this.fld('name'), desc: this.fld('desc'), goal: this.fld('goal'), due: this.fld('due'), budget: this.fld('budget'), expectedAmt: this.fld('expectedAmt'), expected: this.fld('expected'), risks: this.fld('risks'), riskFlag: this.fld('riskFlag') },
      submitLabel: f.id ? '確認修改' : '建立計畫'
    };
  }
  vmWiz(m) {
    var S = this.state.data, w = m.form, i = w.i;
    var steps = ['歡迎進入財富花園', '選擇主要幣別', '設定參考時薪', '建立金融帳戶', '設定初始帳戶餘額', '初始資產與負債快照', '歷史交易匯入', '財務目標', 'AI 資料使用授權', '進入主控制台'];
    var curs = ['TWD'].concat(Object.keys(S.settings.rates));
    var setRow = (list, idx, patch) => { var arr = w[list].map(function (x, j) { return j === idx ? Object.assign({}, x, patch) : x; }); this.setForm({ [list]: arr }); };
    var named = w.accounts.map(function (a, j) { return { a: a, j: j }; }).filter(function (x) { return String(x.a.name).trim(); });
    var vm = {
      title: '設定精靈 ' + (i + 1) + '/10：' + steps[i], bar: steps.map(function (_, j) { return { cls: j <= i ? 'on' : '' }; }),
      first: i === 0, notFirst: i > 0, last: i === 9, notLast: i < 9, canSkip: i > 0 && i < 9,
      hourly: w.hourly, onHourly: this.fld('hourly'), goal: w.goal, onGoal: this.fld('goal'),
      accounts: w.accounts.map((a, j) => ({
        name: a.name, onName: (e) => setRow('accounts', j, { name: e.target.value }),
        kinds: Object.keys(E.ACC_KINDS).map(function (k) { return { label: E.ACC_KINDS[k], cls: a.kind === k ? 'on' : '', pressed: a.kind === k ? 'true' : 'false', pick: function () { setRow('accounts', j, { kind: k }); } }; }),
        curs: curs.map(function (c) { return { label: c, cls: a.cur === c ? 'on' : '', pressed: a.cur === c ? 'true' : 'false', pick: function () { setRow('accounts', j, { cur: c }); } }; })
      })),
      balances: named.map((x) => ({ label: x.a.name + '（' + x.a.cur + '）' + (x.a.kind === 'credit' ? '目前未繳金額' : '目前餘額'), val: x.a.opening, onVal: (e) => setRow('accounts', x.j, { opening: e.target.value }) })),
      noBalances: !named.length,
      assets: w.assets.map((a, j) => ({ name: a.name, onName: (e) => setRow('assets', j, { name: e.target.value }), value: a.value, onValue: (e) => setRow('assets', j, { value: e.target.value }), types: Object.keys(E.ASSET_TYPES).map(function (k) { return { label: E.ASSET_TYPES[k], cls: a.type === k ? 'on' : '', pressed: a.type === k ? 'true' : 'false', pick: function () { setRow('assets', j, { type: k }); } }; }) })),
      liabs: w.liabs.map((l, j) => ({ name: l.name, onName: (e) => setRow('liabs', j, { name: e.target.value }), balance: l.balance, onBalance: (e) => setRow('liabs', j, { balance: e.target.value }) })),
      imp: [[true, '先不匯入，之後再說'], [false, '完成後前往匯入頁面']].map((x) => ({ label: x[1], cls: w.importLater === x[0] ? 'on' : '', pressed: w.importLater === x[0] ? 'true' : 'false', pick: () => this.setForm({ importLater: x[0] }) })),
      consent: [['summary', '允許 AI 使用彙總統計資料'], ['projects', '允許 AI 使用專案與成果'], ['raw', '允許傳送逐筆交易明細']].map((x) => ({ label: x[1], on: !!w.consent[x[0]], toggle: () => { var c = Object.assign({}, w.consent); c[x[0]] = !c[x[0]]; this.setForm({ consent: c }); } })),
      summary: '帳戶 ' + named.length + ' 個 · 資產 ' + w.assets.filter(function (a) { return String(a.name).trim(); }).length + ' 項 · 負債 ' + w.liabs.filter(function (a) { return String(a.name).trim(); }).length + ' 項'
    };
    for (var k = 0; k < 10; k++) vm['s' + k] = i === k;
    return vm;
  }
  vmSimple(m) {
    var S = this.state.data, f = m.form || {};
    var chips = (field, opts) => opts.map((o) => ({ label: o[1], cls: f[field] === o[0] ? 'on' : '', pressed: f[field] === o[0] ? 'true' : 'false', pick: () => this.setForm({ [field]: o[0] }) }));
    return {
      title: m.title || '', errs: m.errs || [], hasErrs: (m.errs || []).length > 0,
      f: f, on: { name: this.fld('name'), opening: this.fld('opening'), value: this.fld('value'), monthlyIncome: this.fld('monthlyIncome'), maintenance: this.fld('maintenance'), balance: this.fld('balance'), rate: this.fld('rate'), installment: this.fld('installment'), dueDay: this.fld('dueDay'), desc: this.fld('desc'), amt: this.fld('amt'), day: this.fld('day') },
      accKinds: chips('kind', Object.keys(E.ACC_KINDS).map(function (k) { return [k, E.ACC_KINDS[k]]; })),
      curs: chips('cur', ['TWD'].concat(Object.keys(S.settings.rates)).map(function (c) { return [c, c]; })),
      openingLabel: f.kind === 'credit' ? '目前未繳金額' : '期初餘額（快照日）',
      assetTypes: chips('type', Object.keys(E.ASSET_TYPES).map(function (k) { return [k, E.ASSET_TYPES[k]]; })),
      recKinds: chips('kind', [['expense', '支出'], ['income', '收入']]).map((c, idx) => Object.assign(c, { pick: () => this.setForm({ kind: idx === 0 ? 'expense' : 'income', cat: '' }) })),
      recCats: chips('cat', E.allCats(S, f.kind === 'income' ? 'income' : 'expense').map(function (c) { return [c, c]; })),
      recAccts: chips('acct', S.accounts.filter(function (a) { return !a.archived; }).map(function (a) { return [a.id, a.name]; }))
    };
  }

  /* ======================= renderVals ======================= */
  renderVals() {
    var st = this.state, S = st.data, D = this.getD(), page = st.page, acc = this.accent();
    var pg = {};
    var pageErr = '';
    if (!this._vmInit) {
      for (var k in PAGE_VM) { try { this._vm[k] = this[PAGE_VM[k]](); } catch (e) { this._vm[k] = {}; if (k === page) pageErr = String(e && e.message || e); } }
      this._vmInit = true;
    } else {
      try { this._vm[page] = this[PAGE_VM[page]](); } catch (e) { pageErr = String(e && e.message || e); }
    }
    /* a page whose view model failed is not rendered: the error panel shows instead */
    NAV_FLAT.forEach(function (n) { pg[n[0]] = !pageErr && page === n[0]; });
    var unread = D.notes.filter(function (n) { return S.notifRead.indexOf(n.id) < 0; }).length;
    var nav = NAV_GROUPS.map((g) => ({
      label: g.label,
      items: g.items.map((n) => ({ id: n[0], label: n[1], code: n[2], ic: IC[n[3]], c: SEC[n[0]], cls: page === n[0] ? 'on' : '', cur: page === n[0] ? 'page' : undefined, go: () => this.nav(n[0]), badge: n[0] === 'notifications' ? unread : 0, noBadge: !(n[0] === 'notifications' && unread) }))
    }));
    var tabs = MOBILE_TABS.map((n) => ({ label: n[1], ic: IC[n[2]], c: SEC[n[0]], cls: page === n[0] ? 'on' : '', cur: page === n[0] ? 'page' : undefined, go: () => this.nav(n[0]) }));
    var moreOn = MOBILE_TABS.every(function (n) { return n[0] !== page; });
    /* dialogs */
    var mo = st.modal, mk = mo ? mo.kind : '';
    var md = { open: !!mo, tx: { on: {} }, txd: {}, act: { on: {} }, actd: {}, proj: { on: {} }, wiz: {}, simple: { f: {}, on: {} }, cmd: {}, exp: {}, imp: {}, conf: {} };
    var kinds = ['tx', 'txd', 'act', 'actd', 'proj', 'confirm', 'wiz', 'quick', 'more', 'cmd', 'help', 'export', 'imp', 'acct', 'asset', 'liab', 'value', 'lbal', 'rec'];
    kinds.forEach(function (k) { md['is_' + k] = mk === k; });
    try {
      if (mk === 'tx') md.tx = this.vmTx(mo);
      else if (mk === 'txd') md.txd = this.vmTxd(mo);
      else if (mk === 'act') md.act = this.vmAct(mo);
      else if (mk === 'actd') md.actd = this.vmActd(mo);
      else if (mk === 'proj') md.proj = this.vmProj(mo);
      else if (mk === 'wiz') md.wiz = this.vmWiz(mo);
      else if (['acct', 'asset', 'liab', 'value', 'lbal', 'rec'].indexOf(mk) >= 0) md.simple = this.vmSimple(mo);
      else if (mk === 'confirm') md.conf = { title: mo.title, body: mo.body, okCls: mo.danger ? 'btn danger' : 'btn pri' };
      else if (mk === 'export') md.exp = { title: mo.title, text: mo.text, name: mo.name };
      else if (mk === 'imp') {
        var okN = mo.rows.filter(function (r) { return r.status === 'ok' || r.status === 'snap'; }).length;
        md.imp = { rows: mo.rows.map(function (r) { return { line: r.line, date: r.date, type: E.TYPES[r.type] || '?', amt: isNaN(r.amt) ? '—' : E.fmt(r.amt), acct: r.accName, desc: r.desc, note: r.note, tag: { ok: '匯入', snap: '歷史參考', dup: '略過', err: '錯誤' }[r.status], tagCls: { ok: 'ok', snap: 'w', dup: '', err: 'b' }[r.status] }; }), okN: '確認匯入 ' + okN + ' 筆', dis: okN === 0 };
      }
      else if (mk === 'cmd') md.cmd = { q: st.cmdQ, list: this.cmdList().map((c, i) => ({ code: c.code, label: c.label, sel: i === st.cmdIx ? 'true' : 'false', cls: i === st.cmdIx ? 'on' : '', run: () => this.runCommand(c), hover: () => this.setState({ cmdIx: i }) })), none: !this.cmdList().length };
    } catch (e) { md.err = String(e && e.message || e); }
    ['tx', 'act', 'proj', 'simple'].forEach(function (k) { if (Array.isArray(md[k].errs)) md[k].errs = md[k].errs.map(function (t) { return { t: t }; }); });
    var templates = S.templates.map((tp) => ({ name: tp.name, use: () => this.openTx({ type: tp.type, amt: tp.amt, cat: tp.cat, acct: tp.acct, desc: tp.desc }) }));
    var moreItems = NAV_FLAT.filter(function (n) { return !MOBILE_TABS.some(function (t) { return t[0] === n[0]; }); }).map((n) => ({ label: n[1], ic: IC[n[3]], c: SEC[n[0]], go: () => this.nav(n[0]), badge: n[0] === 'notifications' ? unread : 0 }));
    var dens = this.props.density === '緊湊' ? 'compact' : '';
    var sec = SEC[page] || acc, navIx = NAV_FLAT.findIndex(function (n) { return n[0] === page; });
    var navCode = navIx >= 0 ? NAV_FLAT[navIx][2] : String(page).toUpperCase();
    /* neon strength tweak: [text glow, outer halo, panel glow] alpha */
    var gl = this.props.glow === '柔和' ? [0.32, 0.12, 0.22] : this.props.glow === '強烈' ? [0.8, 0.36, 0.5] : [0.55, 0.22, 0.36];
    return {
      t: { acc: acc, accSoft: hexA(acc, 0.13), accLine: hexA(acc, 0.48), accGlow: hexA(acc, gl[2]), accNeon: hexA(acc, gl[0]), accNeon2: hexA(acc, gl[1]), cls: [dens, this.props.scanlines ? 'scan' : '', this.motionOn() ? '' : 'nomo', 'pg-' + page, st.rail ? 'rail-on' : '', st.desk ? '' : 'desk-min'].join(' '), sec: sec, secSoft: hexA(sec, 0.14), secLine: hexA(sec, 0.5), secGlow: hexA(sec, gl[2] + 0.06) },
      ic: IC, h: this.h, go: this.go, pg: pg, pageErr: pageErr, hasPageErr: !!pageErr,
      nav: nav, tabs: tabs, moreCls: moreOn ? 'on' : '', unread: unread, hasUnread: unread > 0,
      ui: {
        crumb: 'COCKPIT://' + navCode, chan: 'CH ' + String(navIx + 1).padStart(2, '0'), demo: S.mode === 'demo', user: S.mode !== 'demo', privacy: !!S.privacy, noPrivacy: !S.privacy, privLabel: S.privacy ? '已遮罩' : '隱私遮罩',
        store: st.noStore ? '僅記憶體' : '本機瀏覽器', offline: !st.online, rail: st.rail, railCls: st.rail ? 'on' : '', version: 'v' + VERSION,
        clock: pad2(st.now.getHours()) + ':' + pad2(st.now.getMinutes()), date: st.now.getFullYear() + '-' + pad2(st.now.getMonth() + 1) + '-' + pad2(st.now.getDate()) + ' ' + WEEK[st.now.getDay()],
        sfx: st.sfx, noSfx: !st.sfx, sfxLabel: st.sfx ? '音效開' : '音效關', outCls: st.pgOut ? 'deck-out' : '', deskCls: st.desk ? '' : 'min', deskOpen: st.desk ? 'true' : 'false', deskLabel: st.desk ? '收合儀表台' : '展開儀表台', online: st.online, netLabel: st.online ? '連線中' : '離線'
      },
      dash: this._vm.dashboard, led: this._vm.ledger, res: this._vm.resources, ast: this._vm.assets, gdn: this._vm.garden, prj: this._vm.projects, ai: this._vm.ai, rep: this._vm.reports, ntf: this._vm.notifications, set: this._vm.settings,
      side: { insights: D.insights.map((i) => Object.assign({}, i, { go: () => this.nav(i.page) })), none: !D.insights.length, inc: this.M(D.month.inc), exp: this.M(D.month.exp), e7: D.a7.avg == null ? '—' : D.a7.avg.toFixed(1), pending: S.suggestions.filter(function (s) { return s.status === 'pending'; }).length },
      md: md, templates: templates, moreItems: moreItems, gh: this.vmGreen(), cons: this.vmConsole(),
      toasts: st.toasts.map((tt) => ({ msg: tt.msg, cls: tt.ach ? 'toast ach' : 'toast', ach: tt.ach && !reducedMotion && this.motionOn(), hasAction: !!tt.action, label: tt.action ? tt.action.label : '', run: () => { if (tt.action) tt.action.fn(); this.setState(function (s) { return { toasts: s.toasts.filter(function (x) { return x.id !== tt.id; }) }; }); } })),
      sparks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    };
  }
}
