import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fixture(run) {
  const dist = mkdtempSync(path.join(tmpdir(), 'wealthgarden-pwa-'));
  try {
    mkdirSync(path.join(dist, 'assets'));
    mkdirSync(path.join(dist, 'icons'));
    writeFileSync(path.join(dist, 'index.html'), '<html><head><link rel="manifest" href="./manifest.webmanifest"></head><body><script type="module" src="./assets/app-hash.js"></script></body></html>');
    writeFileSync(path.join(dist, 'assets/app-hash.js'), 'console.log("PWA test asset")');
    cpSync(path.join(root, 'public/manifest.webmanifest'), path.join(dist, 'manifest.webmanifest'));
    for (const f of ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png']) cpSync(path.join(root, 'public/icons', f), path.join(dist, 'icons', f));
    return run(dist);
  } finally { rmSync(dist, { recursive: true, force: true }); }
}

test('Manifest includes all required install icons and relative scope', () => {
  const m = JSON.parse(readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.scope, './');
  assert.equal(m.start_url, './');
  assert.ok(m.icons.find(x => x.sizes === '192x192'));
  assert.ok(m.icons.find(x => x.sizes === '512x512' && x.purpose === 'maskable'));
});

test('Builder creates a parsable, verifiable offline worker with no API caching', () => fixture(dist => {
  const build = spawnSync(process.execPath, ['scripts/generate-pwa.mjs', dist], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr);
  const result = spawnSync(process.execPath, ['scripts/verify-pwa.mjs', dist], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const sw = readFileSync(path.join(dist, 'sw.js'), 'utf8');
  assert.ok(sw.includes('./assets/app-hash.js'));
  assert.ok(sw.includes('CACHE_NAME'));
  assert.ok(sw.includes("req.mode === 'navigate'"));
  assert.ok(!sw.includes('localStorage'));
  new vm.Script(sw);
}));

test('The generator refuses an unbuilt /src/main.js index.html', () => fixture(dist => {
  writeFileSync(path.join(dist, 'index.html'), '<script type="module" src="/src/main.js"></script>');
  const result = spawnSync(process.execPath, ['scripts/generate-pwa.mjs', dist], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /未編譯|缺少/);
}));
