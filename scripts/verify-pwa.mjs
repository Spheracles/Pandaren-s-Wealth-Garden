/** Verify the deployable output, not the unbuilt source. No dependencies. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const file = f => path.join(dist, f);
const must = (condition, message) => { if (!condition) throw new Error(`PWA 驗證失敗：${message}`); };
const manifest = JSON.parse(fs.readFileSync(file('manifest.webmanifest'), 'utf8'));
const html = fs.readFileSync(file('index.html'), 'utf8');
const sw = fs.readFileSync(file('sw.js'), 'utf8');
must(manifest.name && manifest.display === 'standalone', 'Manifest 不完整');
must(manifest.start_url === './' && manifest.scope === './', 'PWA 路徑不支援子目錄部署');
must(manifest.icons.some(i => i.sizes === '192x192'), '缺少 192px 圖示');
must(manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'maskable'), '缺少 Maskable 圖示');
for (const { src } of manifest.icons) must(fs.existsSync(file(src.replace(/^\.\//, ''))), `圖示不存在：${src}`);
must(/rel="manifest"/.test(html), 'HTML 缺少 Manifest 連結');
must(/assets\/[^"']+\.js/.test(html), 'HTML 不含正式編譯的 JS');
must(!/src\s*=\s*["']\/?src\//.test(html), 'HTML 仍引用原始碼 /src/');
must(sw.includes('CACHE_NAME') && sw.includes('PRECACHE') && sw.includes('SKIP_WAITING'), 'Service Worker 不完整');
must(sw.includes('./index.html') && sw.includes('./manifest.webmanifest'), 'Service Worker 未快取安裝所需檔案');
require('node:vm').compileFunction(sw); // syntax check only
console.log(`✔ PWA 靜態建置驗證成功：${dist}`);
