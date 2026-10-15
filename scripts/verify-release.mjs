// Verifies the release APK BEFORE it is shared:
//  - file exists with the expected name and version
//  - signed (v2/v3) and verifiable with apksigner
//  - NOT signed with the Android debug certificate
//  - package id / versionName / versionCode / debuggable=false (via aapt2 badging)
// Writes release/verify.json used by package-line.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const apk = path.join(root, 'android/app/build/outputs/apk/release', `WealthGarden-v${pkg.version}.apk`);
const fail = m => { console.error('✖ ' + m); process.exit(1); };
if (!fs.existsSync(apk)) fail(`找不到 ${path.relative(root, apk)}。請先執行 npm run android:release。`);

const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdk) fail('請設定 ANDROID_HOME（Android SDK 路徑）以使用 apksigner 驗證簽章。');
const bt = path.join(sdk, 'build-tools');
const ver = fs.readdirSync(bt).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
const exe = n => path.join(bt, ver, process.platform === 'win32' ? (n === 'apksigner' ? 'apksigner.bat' : n + '.exe') : n);

let certs;
try { certs = execFileSync(exe('apksigner'), ['verify', '--verbose', '--print-certs', apk], { encoding: 'utf8' }); }
catch (e) { fail('apksigner 驗證失敗：APK 未正確簽署。\n' + (e.stdout || e.message)); }
if (!/Verified using v2 scheme \(APK Signature Scheme v2\): true|Verified using v3 scheme[^:]*: true/.test(certs)) fail('APK 沒有 v2/v3 簽章。');
if (/CN=Android Debug/i.test(certs)) fail('APK 使用 Android Debug 憑證簽署，不可作為正式版本。');
const sha256Cert = (/Signer #1 certificate SHA-256 digest: ([0-9a-f]+)/i.exec(certs) || [])[1];
const dn = (/Signer #1 certificate DN: (.+)/.exec(certs) || [])[1];

const badging = execFileSync(exe('aapt2'), ['dump', 'badging', apk], { encoding: 'utf8' });
const m = /package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'/.exec(badging);
if (!m) fail('無法讀取 APK 套件資訊。');
const [, id, code, name] = m;
if (id !== 'com.wealthgarden.app') fail(`Package ID 為 ${id}，應為 com.wealthgarden.app`);
if (name !== pkg.version) fail(`versionName ${name} 與 package.json ${pkg.version} 不一致`);
if (/application-debuggable/.test(badging)) fail('APK 為 debuggable，不可作為正式版本。');

const sha256 = crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
const out = { file: path.basename(apk), size: fs.statSync(apk).size, sha256, packageId: id, versionName: name, versionCode: Number(code), signerDN: dn, signerCertSha256: sha256Cert, verifiedAt: new Date().toISOString(), buildTools: ver };
fs.mkdirSync(path.join(root, 'release'), { recursive: true });
fs.writeFileSync(path.join(root, 'release/verify.json'), JSON.stringify(out, null, 2));
console.log('✔ 正式 APK 驗證通過');
console.log(JSON.stringify(out, null, 2));
