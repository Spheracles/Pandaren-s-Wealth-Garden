/**
 * Generate an app-shell service worker AFTER Vite has emitted hashed assets.
 * No extra dependency. The worker precaches ONLY immutable static files and
 * the app shell; financial data and API responses are NEVER placed in CacheStorage.
 *
 * Usage: node scripts/generate-pwa.mjs [dist-dir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const indexFile = path.join(dist, 'index.html');
if (!fs.existsSync(indexFile)) throw new Error('找不到 dist/index.html。請先執行 vite build。');
const html = fs.readFileSync(indexFile, 'utf8');
if (/src\s*=\s*["']\/?src\//.test(html)) {
  throw new Error('偵測到未編譯的 /src/ 引用。請執行 Vite 正式建置，不可直接複製原始碼 index.html。');
}
if (!/assets\/[^"']+\.js/.test(html)) throw new Error('index.html 缺少已建置 JavaScript。');
if (!fs.existsSync(path.join(dist, 'manifest.webmanifest'))) throw new Error('缺少 PWA manifest。');

const all = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, f.name);
    if (f.isDirectory()) walk(abs);
    else if (f.isFile() && f.name !== 'sw.js') all.push(path.relative(dist, abs).split(path.sep).join('/'));
  }
}
walk(dist);
all.sort();
// Include the HTML shell, manifest, icons, Vite JS/CSS and all bundled fonts.
const digest = createHash('sha256');
for (const f of all) {
  digest.update(f).update('\0');
  digest.update(fs.readFileSync(path.join(dist, f)));
}
const hash = digest.digest('hex').slice(0, 14);
const key = `wg-static-${pkg.version}-${hash}`;
const urls = all.map(f => './' + f);
const worker = `/* Wealth Garden static app shell. Build: ${pkg.version} (${hash}).
 * No private financial data, API responses, or cross-origin URLs are cached. */
const CACHE_NAME = ${JSON.stringify(key)};
const APP_SHELL = new URL('./index.html', self.registration.scope).href;
const PRECACHE = ${JSON.stringify(urls, null, 2)};
const STATIC_URLS = new Set(PRECACHE.map(file => new URL(file, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Atomic installation: do not activate an incomplete offline build.
    await cache.addAll(PRECACHE.map(p => new Request(new URL(p, self.registration.scope), { cache: 'reload' })));
    // First-ever install activates immediately. Updates require the user's consent.
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('wg-static-') && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  if (req.mode === 'navigate') {
    // Always use the version-matched HTML shell. Prevent new HTML with stale JS
    // when a website is updated while a PWA is running offline/online.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(APP_SHELL) || fetch(req);
    })());
    return;
  }
  if (STATIC_URLS.has(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(url.href) || fetch(req);
    })());
  }
  // All other GETs are network-only; requests containing user data are never cached.
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
`;
fs.writeFileSync(path.join(dist, 'sw.js'), worker);
console.log(`✔ PWA service worker: ${urls.length} files, ${key}`);
