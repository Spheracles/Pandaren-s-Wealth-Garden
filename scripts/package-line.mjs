// Builds release/WealthGarden-Android-v<ver>.zip for sharing in LINE.
// Contents: the verified release APK + README-安裝說明.txt + CHANGELOG.txt + SHA256SUMS.txt + VERSION.txt
// Refuses to run unless verify-release.mjs has approved the APK, and scans the result for secrets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import { assertClean } from './lib/secrets.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const v = pkg.version;
const verifyFile = path.join(root, 'release/verify.json');
if (!fs.existsSync(verifyFile)) { console.error('✖ 請先執行 npm run release:verify（驗證正式簽章）。'); process.exit(1); }
const verify = JSON.parse(fs.readFileSync(verifyFile, 'utf8'));
const apkName = `WealthGarden-v${v}.apk`;
const apkPath = path.join(root, 'android/app/build/outputs/apk/release', apkName);
const apk = fs.readFileSync(apkPath);
const sha = crypto.createHash('sha256').update(apk).digest('hex');
if (sha !== verify.sha256 || verify.versionName !== v) { console.error('✖ APK 在驗證後被更動或版本不符，請重新執行 release:verify。'); process.exit(1); }

const fill = t => t.replaceAll('{{VERSION}}', v).replaceAll('{{SHA256}}', sha).replaceAll('{{CERT_SHA256}}', verify.signerCertSha256 || '（見 VERSION.txt）')
  .replaceAll('{{VERSION_CODE}}', String(verify.versionCode)).replaceAll('{{DATE}}', new Date().toISOString().slice(0, 10)).replaceAll('{{SIZE_MB}}', (apk.length / 1048576).toFixed(1));
const tpl = n => fill(fs.readFileSync(path.join(root, 'release-templates', n), 'utf8')).replace(/\r?\n/g, '\r\n'); // CRLF: readable in any phone/PC text viewer
const files = {
  [apkName]: apk,
  'README-安裝說明.txt': Buffer.from('﻿' + tpl('README-安裝說明.txt')),
  'CHANGELOG.txt': Buffer.from('﻿' + tpl('CHANGELOG.txt')),
  'VERSION.txt': Buffer.from('﻿' + tpl('VERSION.txt')),
};
const sums = Object.entries(files).map(([n, b]) => `${crypto.createHash('sha256').update(b).digest('hex')}  ${n}`).join('\r\n') + '\r\n';
files['SHA256SUMS.txt'] = Buffer.from(sums);

assertClean(Object.entries(files).map(([p, b]) => ({ path: p, read: () => b })), 'LINE 分享包');

const zip = new JSZip();
for (const [n, b] of Object.entries(files)) zip.file(n, b, { date: new Date(), compression: n.endsWith('.apk') ? 'STORE' : 'DEFLATE' });
const out = path.join(root, 'release', `WealthGarden-Android-v${v}.zip`);
fs.writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', platform: 'UNIX' }));

// Re-open the archive and prove it extracts to byte-identical files.
const check = await JSZip.loadAsync(fs.readFileSync(out));
const names = Object.keys(check.files).sort();
const expected = Object.keys(files).sort();
if (JSON.stringify(names) !== JSON.stringify(expected)) { console.error('✖ ZIP 內容不符：', names); process.exit(1); }
const back = await check.file(apkName).async('nodebuffer');
if (crypto.createHash('sha256').update(back).digest('hex') !== sha) { console.error('✖ 解壓後 APK 雜湊不符'); process.exit(1); }
console.log(`✔ ${path.relative(root, out)}  (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
console.log(`  APK SHA-256: ${sha}`);
