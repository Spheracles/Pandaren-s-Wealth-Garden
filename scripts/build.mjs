/* Builds the web / PWA site into dist/ (deployed to GitHub Pages by .github/workflows/pwa-pages.yml).
   1. expands the template macros in src/ui/*.html
   2. bundles React + the mini-runtime + the tested engine + the UI logic with esbuild
   3. writes dist/index.html, dist/assets/app.<hash>.js / .css and copies public/ (manifest, icons)
   The offline Service Worker is generated afterwards by scripts/generate-pwa.mjs (npm run build does both).
   Usage: node scripts/build.mjs [outDir]   (default: dist) */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UI = join(ROOT, 'src', 'ui');
const GEN = join(ROOT, 'build');
const OUT = resolve(process.argv[2] || join(ROOT, 'dist'));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const read = (f) => readFileSync(join(UI, f), 'utf8');

/* ---------------- template macros ---------------- */

const ico = (name, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="{{ic.${name}}}"></path></svg>`;

function chart(x) {
  const area = [0, 1].map((i) =>
    `<linearGradient id="{{${x}.id}}-g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color: {{${x}.s${i}.color}}; stop-opacity: .26"></stop><stop offset="1" style="stop-color: {{${x}.s${i}.color}}; stop-opacity: 0"></stop></linearGradient>`).join('');
  return `<div class="chart">
<div class="yax" style="height: {{${x}.h}}px"><sc-for list="{{${x}.yt}}" as="y" hint-placeholder-count="5"><span style="top: {{y.top}}%">{{y.label}}</span></sc-for></div>
<div class="plot" style="height: {{${x}.h}}px" onMouseMove="{{${x}.move}}" onMouseLeave="{{${x}.leave}}">
<svg viewBox="{{${x}.vb}}" preserveAspectRatio="none" aria-hidden="true"><defs>${area}</defs>
<path class="gl" d="{{${x}.grid}}"></path>
<path class="zl" d="{{${x}.zero}}"></path>
<path d="{{${x}.s0.area}}" style="fill: url(#{{${x}.id}}-g0)"></path>
<path d="{{${x}.s1.area}}" style="fill: url(#{{${x}.id}}-g1)"></path>
<path class="ln" d="{{${x}.s0.line}}" style="stroke: {{${x}.s0.color}}; stroke-dasharray: {{${x}.s0.dash}}"></path>
<path class="ln" d="{{${x}.s1.line}}" style="stroke: {{${x}.s1.color}}; stroke-dasharray: {{${x}.s1.dash}}"></path>
<path class="ln" d="{{${x}.s2.line}}" style="stroke: {{${x}.s2.color}}; stroke-dasharray: {{${x}.s2.dash}}"></path>
<path class="hl" d="{{${x}.hline}}"></path>
</svg>
<sc-for list="{{${x}.dots}}" as="d" hint-placeholder-count="1"><i class="dot" style="left: {{d.left}}%; top: {{d.top}}%; background: {{d.color}}"></i></sc-for>
<sc-for list="{{${x}.hdots}}" as="d" hint-placeholder-count="0"><i class="dot" style="left: {{d.left}}%; top: {{d.top}}%; background: {{d.color}}"></i></sc-for>
<sc-if value="{{${x}.hover}}" hint-placeholder-val="{{ false }}"><div class="tip" style="left: {{${x}.tipLeft}}%"><span class="dim num">{{${x}.tipTitle}}</span><sc-for list="{{${x}.tipRows}}" as="tr" hint-placeholder-count="2"><span class="tr2"><i class="swatch" style="background: {{tr.color}}"></i>{{tr.name}}<b>{{tr.val}}</b></span></sc-for></div></sc-if>
</div>
<div class="xax"><sc-for list="{{${x}.xt}}" as="x" hint-placeholder-count="6"><span class="{{x.cls}}" style="left: {{x.left}}%">{{x.label}}</span></sc-for></div>
</div>`;
}

const legend = (x) => `<sc-for list="{{${x}.legend}}" as="lg" hint-placeholder-count="2"><span class="lgi"><i style="background: {{lg.color}}"></i>{{lg.name}}</span></sc-for>`;

const txrow = (x) => `<button type="button" class="row click" onClick="{{${x}.open}}">`
  + `<span class="tx-ico {{${x}.cls}}"><svg class="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="{{${x}.ic}}"></path></svg></span>`
  + `<span class="grow"><span class="t">{{${x}.desc}}</span><span class="tiny dim t">{{${x}.meta}}</span></span>`
  + `<span class="amt"><span class="num {{${x}.cls}}">{{${x}.amt}}</span><span class="tiny dim num">{{${x}.sub}}</span></span></button>`;

const plant = (x, size) => `<svg class="psvg" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 14h64v72H18z" style="fill: none; stroke: {{${x}.c}}; stroke-dasharray: 3 3; opacity: {{${x}.frameOp}}"></path><g class="{{${x}.sway}}"><path d="{{${x}.stem}}" style="fill: none; stroke: {{${x}.c}}; stroke-width: 2.2; stroke-linecap: round; filter: {{${x}.glow}}"></path><path d="{{${x}.leaves}}" style="fill: {{${x}.c}}; opacity: {{${x}.leafOp}}"></path><path d="{{${x}.head}}" style="fill: {{${x}.c}}; filter: {{${x}.glowH}}"></path><path d="{{${x}.core}}" style="fill: #E7EEF8"></path><path d="{{${x}.ring}}" style="fill: none; stroke: {{${x}.c}}; opacity: .45"></path><path d="{{${x}.mark}}" style="fill: none; stroke: {{${x}.c}}; stroke-width: 1.8"></path><text x="60" y="{{${x}.zY}}" style="font-size: 9px; font-family: monospace; fill: {{${x}.c}}; opacity: {{${x}.zOp}}">z z</text></g><path d="M34 82h32l-4 10h-24z" style="fill: rgba(79,195,255,.08); stroke: {{${x}.c}}; stroke-width: 1; opacity: .8"></path></svg>`;

const kv = (x, a) => `<dl class="kv"><sc-for list="{{${x}}}" as="${a}" hint-placeholder-count="4"><dt>{{${a}.k}}</dt><dd class="{{${a}.cls}}">{{${a}.v}}</dd></sc-for></dl>`;

function bars(x, a, click) {
  const inner = `<span class="bl">{{${a}.label}}</span><span class="track"><span class="fill" style="display: block; width: {{${a}.w}}%; background: {{${a}.color}}"></span></span>`
    + `<span class="bv">{{${a}.val}}<small>{{${a}.pct}}</small></span>`;
  const el = click ? `<button type="button" class="bar click" onClick="{{${a}.pick}}">${inner}</button>` : `<div class="bar">${inner}</div>`;
  return `<div class="bars"><sc-for list="{{${x}}}" as="${a}" hint-placeholder-count="4">${el}</sc-for></div>`;
}

const picks = (x, a, sub = false) => `<sc-for list="{{${x}}}" as="${a}" hint-placeholder-count="4"><button type="button" class="pk {{${a}.cls}}" `
  + `aria-pressed="{{${a}.pressed}}" onClick="{{${a}.pick}}">{{${a}.label}}${sub ? ` <small>{{${a}.sub}}</small>` : ''}</button></sc-for>`;

const seg = (x, a, aria) => `<div class="seg" role="group" aria-label="${aria}"><sc-for list="{{${x}}}" as="${a}" hint-placeholder-count="3">`
  + `<button type="button" class="{{${a}.cls}}" aria-pressed="{{${a}.pressed}}" onClick="{{${a}.pick}}">{{${a}.label}}</button></sc-for></div>`;

const errs = (p) => `<sc-if value="{{${p}.hasErrs}}" hint-placeholder-val="{{ false }}"><div class="errs" role="alert">`
  + `<sc-for list="{{${p}.errs}}" as="er" hint-placeholder-count="1"><span>{{er.t}}</span></sc-for></div></sc-if>`;

const alloc = (p) => `<div class="alloc">
<div class="flex between"><span class="small mut">專案分攤（同一筆成本可分攤至多個專案，總和 ≤ 100%）</span><span class="small num {{${p}.allocCls}}">{{${p}.allocSum}}</span></div>
<sc-for list="{{${p}.allocRows}}" as="ar" hint-placeholder-count="0"><div class="alloc-row"><div class="chips">@@PICKS:ar.projects:c@@</div><div class="flex" style="flex-wrap: nowrap"><label class="f" style="flex-direction: row; align-items: center; gap: 8px">比例<input class="inp num" style="max-width: 110px" type="number" min="1" max="100" value="{{ar.pct}}" onChange="{{ar.onPct}}">%</label><span class="sp"></span><button type="button" class="btn ghost sm" onClick="{{ar.remove}}">@@IS:x@@移除</button></div></div></sc-for>
<sc-if value="{{${p}.allocCan}}" hint-placeholder-val="{{ true }}"><div><button type="button" class="btn sm" onClick="{{${p}.allocAdd}}">@@IS:plus@@新增分攤</button></div></sc-if>
<sc-if value="{{${p}.allocNone}}" hint-placeholder-val="{{ false }}"><span class="tiny dim">尚無可分攤的專案。</span></sc-if>
</div>`;

const energy = (p) => `<div class="sect"><span class="lab"><span>心力評分（主觀，-5 ～ +5）</span><span class="num">{{${p}.energyLabel}}</span></span>`
  + `<div class="energy" role="radiogroup" aria-label="心力評分"><sc-for list="{{${p}.energy}}" as="en" hint-placeholder-count="11">`
  + `<button type="button" class="ebtn {{en.cls}}" role="radio" aria-checked="{{en.on}}" aria-label="{{en.aria}}" style="background: {{en.bg}}" onClick="{{en.pick}}">{{en.label}}</button>`
  + `</sc-for></div></div>`;

const dlg = (kind, title, wide) => `<sc-if value="{{md.is_${kind}}}" hint-placeholder-val="{{ false }}">\n<div class="scrim" onClick="{{h.scrim}}" onKeyDown="{{h.dlgKey}}">\n`
  + `<div class="dlg${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${title}">\n`
  + `<div class="dlg-h"><h2>${title}</h2><button type="button" class="btn ghost sm" aria-label="關閉" onClick="{{h.close}}">${ico('x', 'ico sm')}</button></div>`;

const arc = (k) => {
  const b = `dash.donut.${k}`;
  return `<circle class="arc" cx="90" cy="90" r="62" transform="rotate(-90 90 90)" style="stroke: {{${b}.color}}; stroke-width: {{${b}.sw}}; `
    + `stroke-dasharray: {{${b}.da}}; stroke-dashoffset: {{${b}.off}}" onClick="{{${b}.pick}}"><title>{{${b}.label}}</title></circle>`;
};

const rlabel = (i) => {
  const b = `dash.radar.a${i}`;
  return `<text x="{{${b}.x}}" y="{{${b}.y}}" class="rl" style="text-anchor: {{${b}.anchor}}">{{${b}.label}}</text>`;
};

const MACROS = [
  [/@@DLG:(\w+):(.*?):(\w*)@@/g, (m, k, t, w) => dlg(k, t, w === 'wide')],
  [/@@\/DLG@@/g, () => '</div>\n</div>\n</sc-if>'],
  [/@@I:(\w+)@@/g, (m, n) => ico(n)],
  [/@@IS:(\w+)@@/g, (m, n) => ico(n, 'ico sm')],
  [/@@CHART:([\w.]+)@@/g, (m, x) => chart(x)],
  [/@@LEGEND:([\w.]+)@@/g, (m, x) => legend(x)],
  [/@@TXROW:([\w.]+)@@/g, (m, x) => txrow(x)],
  [/@@PLANT:([\w.]+):(\d+)@@/g, (m, x, s) => plant(x, s)],
  [/@@KV:([\w.]+):(\w+)@@/g, (m, x, a) => kv(x, a)],
  [/@@BARSC:([\w.]+):(\w+)@@/g, (m, x, a) => bars(x, a, true)],
  [/@@BARS:([\w.]+):(\w+)@@/g, (m, x, a) => bars(x, a, false)],
  [/@@PICKS:([\w.]+):(\w+)@@/g, (m, x, a) => picks(x, a)],
  [/@@ACCTS:([\w.]+):(\w+)@@/g, (m, x, a) => picks(x, a, true)],
  [/@@SEG:([\w.]+):(\w+):([^@]+)@@/g, (m, x, a, aria) => seg(x, a, aria)],
  [/@@ERRS:([\w.]+)@@/g, (m, p) => errs(p)],
  [/@@ALLOC:([\w.]+)@@/g, (m, p) => alloc(p)],
  [/@@ENERGY:([\w.]+)@@/g, (m, p) => energy(p)],
  [/@@ARC:(\w+)@@/g, (m, k) => arc(k)],
  [/@@RLABEL:(\d)@@/g, (m, i) => rlabel(i)]
];

function expand(s) {
  for (let pass = 0; pass < 6; pass++) {
    const before = s;
    for (const [rx, fn] of MACROS) s = s.replace(rx, fn);
    if (s === before) break;
  }
  const left = s.match(/@@[A-Z/][^@]*@@/g);
  if (left) throw new Error('unexpanded macros: ' + [...new Set(left)].join(', '));
  return s;
}

function sparksCss() {
  const out = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * 2 * Math.PI) / 10;
    const f = (v) => { const r = Math.round(v); return String(Object.is(r, -0) ? 0 : r); };
    out.push(`.sparks i:nth-child(${i + 1}){--dx:${f(60 * Math.cos(a))}px;--dy:${f(40 * Math.sin(a))}px}`);
  }
  return out.join('\n');
}

export function templateBody() {
  const body = read('template.html').replace('@@PAGES@@', () => read('pages.html')).replace('@@DIALOGS@@', () => read('dialogs.html'))
    .replace(/@@GREENHOUSE@@/g, () => read('greenhouse.html'));
  return expand(body);
}

/* ---------------- build ---------------- */

async function main() {
  mkdirSync(GEN, { recursive: true });
  const body = templateBody();
  const css = read('styles.css').replace('@SPARKS@', sparksCss());
  writeFileSync(join(GEN, 'template.gen.js'), `export default ${JSON.stringify(body)};\n`);
  writeFileSync(join(GEN, 'logic.gen.js'),
    `/* generated by scripts/build.mjs from src/ui/logic.js — do not edit */\n`
    + `import * as WGE from '../src/engine/index.ts';\nimport { DCLogic } from '../src/runtime/dc-runtime.js';\n`
    + read('logic.js') + `\nexport { Component };\n`);

  const res = await build({
    entryPoints: [join(ROOT, 'src', 'main.js')],
    bundle: true, minify: true, format: 'iife', target: 'es2020',
    define: { 'process.env.NODE_ENV': '"production"', __APP_VERSION__: JSON.stringify(pkg.version) },
    legalComments: 'eof', write: false, logLevel: 'warning'
  });
  const js = res.outputFiles[0].text;
  const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);
  const jsName = `app.${hash(js)}.js`, cssName = `app.${hash(css)}.css`;

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, 'assets'), { recursive: true });
  if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), OUT, { recursive: true });
  writeFileSync(join(OUT, 'assets', jsName), js);
  writeFileSync(join(OUT, 'assets', cssName), css);
  writeFileSync(join(OUT, 'favicon.svg'), readFileSync(join(ROOT, 'src', 'favicon.svg'), 'utf8'));
  writeFileSync(join(OUT, 'index.html'), indexHtml(jsName, cssName));
  const files = readdirSync(join(OUT, 'assets')).map((f) => `${f} ${(readFileSync(join(OUT, 'assets', f)).length / 1024).toFixed(0)} KB`);
  console.log(`built ${OUT}\n  ${files.join('\n  ')}`);
}

const indexHtml = (js, css) => `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#060E30">
<meta name="color-scheme" content="dark">
<meta name="description" content="財富花園 NEON CITY：金錢、時間、心力三維紀錄的個人財富網頁版。示範模式使用虛構資料，資料只存在你的瀏覽器。">
<meta name="application-name" content="財富花園">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="財富花園">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<!-- Own scripts only. Web fonts from Google Fonts (no financial data is ever sent); offline falls back to system fonts. -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
<title>財富花園 NEON CITY · Wealth Garden</title>
<link rel="manifest" href="./manifest.webmanifest">
<link rel="icon" type="image/svg+xml" href="./favicon.svg">
<link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="./icons/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&amp;family=Noto+Sans+TC:wght@400;500;700;900&amp;family=Oxanium:wght@500;600;700&amp;display=swap">
<link rel="stylesheet" href="./assets/${css}">
<style>
#boot{min-height:100vh;display:grid;place-items:center;background:radial-gradient(60% 46% at 50% -10%,rgba(70,140,255,.42),transparent 70%),linear-gradient(180deg,#0A1848,#040A22);color:#9AA8D2;font:14px/1.6 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em}
#boot b{color:#FFD84D;text-shadow:0 0 14px rgba(255,190,60,.55);font-weight:600}
</style>
</head>
<body>
<div id="root"><div id="boot"><div><b>WEALTH GARDEN</b> · 載入中…</div></div></div>
<noscript><div style="padding:24px;color:#F2F6FF;background:#040A22;font-family:sans-serif">財富花園需要啟用 JavaScript 才能使用。</div></noscript>
<script src="./assets/${js}"></script>
</body>
</html>
`;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
