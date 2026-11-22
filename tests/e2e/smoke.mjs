/* Browser smoke test of the built site (dist/).
   Usage: npm run build && npm run test:e2e
   Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium). */
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
let chromium, devices;
try { ({ chromium, devices } = await import('playwright')); } catch {
  console.error('需要 Playwright：npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const PORT = 4300 + Math.floor(Math.random() * 500);
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'serve.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const URL_ = `http://localhost:${PORT}/`;
const fails = [];
const check = (ok, label) => { console.log(`${ok ? '✔' : '✖'} ${label}`); if (!ok) fails.push(label); };

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(URL_);
  await page.waitForSelector('.wg');

  const navCount = await page.$$eval('.rail .navi', (els) => els.length);
  check(navCount === 10, `10 個頁面導覽（實際 ${navCount}）`);
  for (let i = 0; i < navCount; i++) {
    await page.click(`.rail .navi >> nth=${i}`);
    await page.waitForTimeout(700);
    check(!(await page.$('text=這個畫面發生錯誤')), `第 ${i + 1} 頁正常顯示：${await page.$eval('.content h1', (e) => e.textContent.trim()).catch(() => '?')}`);
  }

  await page.click('.rail .navi >> nth=0');
  await page.waitForTimeout(700);
  await page.click('.phd .btn.pri');
  await page.fill('.dlg input[inputmode="decimal"]', '321');
  await page.fill('.dlg input[placeholder^="例如"]', 'E2E 測試記帳');
  await page.click('.dlg [aria-label="類別"] .pk >> nth=1');
  await page.click('.dlg button[type="submit"]');
  await page.waitForTimeout(700);
  const saved = await page.evaluate(() => (localStorage.getItem('wealth-garden-design-v2') || '').includes('E2E 測試記帳'));
  check(saved, '新增支出並保存到瀏覽器');
  await page.reload(); await page.waitForSelector('.wg');
  await page.click('.rail .navi >> nth=1');
  await page.waitForTimeout(700);
  await page.fill('.content input[placeholder="說明或類別"]', 'E2E');
  await page.waitForTimeout(200);
  check((await page.$$('.content .row.click')).length >= 1, '重新整理後資料仍在');

  await page.click('.rail .navi >> nth=6');
  await page.waitForTimeout(700);
  await page.click('button:has-text("分析收入與支出")');
  await page.waitForTimeout(2800);
  check((await page.$$('.term .ln')).length > 3 && !(await page.$('text=這個畫面發生錯誤')), 'AI 策略師規則式分析逐行輸出');
  await page.click('button:has-text("產生培育計畫草案")');
  await page.waitForTimeout(800);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('wealth-garden-design-v2')).projects.length);
  await page.click('button:has-text("核准並建立計畫") >> nth=0');
  if (await page.$('.dlg')) await page.click('.dlg .btn.pri');
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('wealth-garden-design-v2')).projects.length);
  check(after === before + 1, '草案經核准後才建立計畫');

  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!r; });
  check(sw, 'Service Worker 已註冊（離線可用）');
  check(errors.length === 0, `沒有執行錯誤${errors.length ? '：' + errors.join(' / ') : ''}`);

  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  const m = await phone.newPage();
  await m.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await m.goto(URL_); await m.waitForSelector('.wg');
  check(await m.$eval('.bnav', (e) => getComputedStyle(e).display !== 'none'), '手機底部導覽顯示');
} finally {
  await browser.close();
  server.kill();
}
if (fails.length) { console.error(`\n${fails.length} 項失敗`); process.exit(1); }
console.log('\n全部通過');
