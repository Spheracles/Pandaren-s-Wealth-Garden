// Builds release/WealthGarden-Source-v<ver>.zip: full source without dependencies,
// build outputs, local SDK paths or any signing material.
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { walk, assertClean } from './lib/secrets.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const v = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'release', '.gradle', '.idea', '.vscode', '.cxx', 'capacitor-cordova-android-plugins']);
const skip = (rel, name) => SKIP_DIRS.has(name)
  || /^android\/app\/build(\/|$)/.test(rel) || /^android\/build(\/|$)/.test(rel)
  || /^android\/app\/src\/main\/assets\/(public|capacitor\.config\.json|capacitor\.plugins\.json)/.test(rel)
  || /^android\/(capacitor\.settings\.gradle|app\/capacitor\.build\.gradle)$/.test(rel)
  || name === '.DS_Store';
const entries = walk(root, skip);
assertClean(entries, '原始碼包');
const zip = new JSZip();
const top = `WealthGarden-Source-v${v}`;
for (const e of entries) zip.file(`${top}/${e.path}`, e.read(), { unixPermissions: /gradlew$/.test(e.path) ? 0o755 : 0o644 });
fs.mkdirSync(path.join(root, 'release'), { recursive: true });
const out = path.join(root, 'release', `${top}.zip`);
fs.writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', platform: 'UNIX' }));
console.log(`✔ ${path.relative(root, out)}  (${entries.length} files, ${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
