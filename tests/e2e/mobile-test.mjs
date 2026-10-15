// Mobile touch acceptance test. Run: npm run build && npm run test:mobile
import { chromium, devices } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve('dist');
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]).replace(/\/$/,'/index.html'));if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.woff2')?'font/woff2':'text/html'});fs.createReadStream(f).pipe(r)}).listen(4173);
fs.mkdirSync('test-results',{recursive:true});const results=[];const ok=(name,pass,detail='')=>{results.push({name,pass,detail});console.log((pass?'PASS':'FAIL')+' '+name+(detail?' — '+detail:''))};
const browser=await chromium.launch();
const ctx=await browser.newContext({...devices['Pixel 7'],locale:'zh-TW'});
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://localhost:4173/');await page.waitForSelector('.pulse');
const overflow=async()=>page.evaluate(()=>{const w=innerWidth;const c=document.querySelector('.content');return {doc:document.documentElement.scrollWidth-w,content:c?c.scrollWidth-c.clientWidth:0}});
const vw=page.viewportSize().width;
ok('dashboard renders on Pixel 7 ('+vw+'px)',true);
let o=await overflow();ok('dashboard: no horizontal overflow',o.doc<=0&&o.content<=1,JSON.stringify(o));
const kpi=async()=>page.evaluate(()=>[...document.querySelectorAll('.kpi')].map(k=>k.querySelector('.val').textContent));
const before=await kpi();
// bottom nav touch targets
const nav=await page.$$eval('.bottom-nav button',bs=>bs.map(b=>b.getBoundingClientRect().height));ok('bottom nav touch targets ≥ 44px',nav.every(h=>h>=44),nav.join(','));
const fab=await page.$eval('.fab',b=>{const r=b.getBoundingClientRect();return {width:r.width,bottom:r.bottom,ih:innerHeight}});ok('quick-add button visible ≥ 48px',fab.width>=48&&fab.bottom<=fab.ih,`${fab.width}px`);
// add an expense through the FAB
await page.tap('.fab');await page.locator('.modal').getByRole('button',{name:'支出',exact:true}).tap();
await page.fill('#tx-amt','250');await page.selectOption('#tx-cat','飲食');await page.fill('#tx-desc','手機測試午餐');
const kbBox=await page.$eval('#tx-desc',e=>e.getBoundingClientRect().bottom);
await page.locator('.modal').getByRole('button',{name:'確認新增'}).tap();await page.waitForTimeout(800);
const after=await kpi();
const num=s=>Number(s.replace(/[^\d.-]/g,''));
ok('new expense updates "本月支出" immediately',num(after[5])-num(before[5])===250,`${before[5]} → ${after[5]}`);
// transfer: net worth unchanged
await page.tap('.fab');await page.locator('.modal').getByRole('button',{name:/轉帳/}).tap();
await page.selectOption('#tx-type','transfer');await page.fill('#tx-amt','1000');await page.selectOption('#tx-from','a_bank');await page.selectOption('#tx-to','a_pay');
await page.locator('.modal').getByRole('button',{name:'確認新增'}).tap();await page.waitForTimeout(800);
const after2=await kpi();ok('transfer keeps net worth, income and expense',after2[0]===after[0]&&after2[4]===after[4]&&after2[5]===after[5],`${after[0]} / ${after2[0]}`);
// validation message on bad input
await page.tap('.fab');await page.locator('.modal').getByRole('button',{name:'支出',exact:true}).tap();await page.fill('#tx-amt','-3');await page.locator('.modal').getByRole('button',{name:'確認新增'}).tap();
ok('invalid amount shows a clear error',await page.locator('.errs').isVisible(),await page.locator('.errs').innerText());
await page.keyboard.press('Escape');await page.waitForTimeout(200);ok('back/Esc closes the open dialog',await page.locator('.modal').count()===0);
// every page: overflow + tiny text
const pages=[['ledger','記帳'],['garden','花園'],['ai','策略師']];
for(const [id,label] of pages){await page.getByRole('navigation',{name:'手機導覽'}).getByRole('button',{name:label}).tap();await page.waitForTimeout(300);o=await overflow();ok(`${id}: no horizontal overflow`,o.doc<=0&&o.content<=1,JSON.stringify(o));await page.screenshot({path:`test-results/shot-${id}.png`})}
for(const id of ['resources','assets','projects','reports','notifications','settings']){await page.getByRole('navigation',{name:'手機導覽'}).getByRole('button',{name:/更多/}).tap();await page.waitForSelector('.modal');await page.locator('.modal .row').filter({hasText:{resources:'三維資源',assets:'資產與負債',projects:'資產培育計畫',reports:'分析報告',notifications:'通知中心',settings:'系統設定'}[id]}).tap();await page.waitForTimeout(300);o=await overflow();ok(`${id}: no horizontal overflow`,o.doc<=0&&o.content<=1,JSON.stringify(o));if(['assets','settings','projects'].includes(id))await page.screenshot({path:`test-results/shot-${id}.png`,fullPage:false})}
const small=await page.evaluate(()=>{let n=0,ex=[];document.querySelectorAll('body *:not(svg):not(svg *)').forEach(el=>{if(!el.childNodes.length||![...el.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))return;const fs=parseFloat(getComputedStyle(el).fontSize);const r=el.getBoundingClientRect();if(r.width&&fs<11.5){n++;if(ex.length<5)ex.push(el.className+':'+fs)}});return {n,ex}});
ok('settings: no visible text below 12px',small.n===0,JSON.stringify(small));
// offline banner
await ctx.setOffline(true);await page.evaluate(()=>dispatchEvent(new Event('offline')));await page.waitForTimeout(300);
ok('offline shows a clear banner',await page.locator('.offline-bar').isVisible());await page.screenshot({path:'test-results/shot-offline.png'});
await ctx.setOffline(false);await page.evaluate(()=>dispatchEvent(new Event('online')));
// persistence across restart
await page.waitForTimeout(700);const lastPage=await page.evaluate(()=>location.hash);await page.evaluate(()=>history.replaceState(null,'',location.pathname));await page.reload();await page.waitForTimeout(500);ok('session restore reopens the last page',await page.evaluate(()=>!!document.querySelector('[aria-current="page"]')),lastPage);await page.evaluate(()=>{location.hash='#dashboard'});await page.reload();await page.waitForSelector('.pulse');await page.waitForTimeout(400);
const after3=await kpi();ok('data survives an app restart',after3[5]===after2[5],after3[5]);
// android back stack: open project detail then back
await page.getByRole('navigation',{name:'手機導覽'}).getByRole('button',{name:/更多/}).tap();await page.locator('.modal .row').filter({hasText:'資產培育計畫'}).tap();await page.locator('.panel h2').first().tap();await page.waitForTimeout(200);
const inDetail=await page.getByText('← 返回計畫列表').isVisible();await page.keyboard.press('Escape');await page.waitForTimeout(200);
ok('back from project detail returns to the list',inDetail&&!(await page.getByText('← 返回計畫列表').isVisible()));
ok('no runtime errors in console',errors.length===0,errors.slice(0,3).join(' | '));
// small phone
const p2=await (await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:2,isMobile:true,hasTouch:true})).newPage();await p2.goto('http://localhost:4173/');await p2.waitForSelector('.pulse');
const o2=await p2.evaluate(()=>({doc:document.documentElement.scrollWidth-innerWidth}));ok('360×640 small phone: no horizontal overflow',o2.doc<=0,JSON.stringify(o2));await p2.screenshot({path:'test-results/shot-360.png'});
await page.evaluate(()=>{location.hash='#dashboard'});await page.reload();await page.waitForSelector('.pulse');await page.screenshot({path:'test-results/shot-dashboard.png'});
fs.writeFileSync('test-results/mobile-results.json',JSON.stringify(results,null,1));
console.log(`\n${results.filter(r=>r.pass).length}/${results.length} passed`);
await browser.close();srv.close();
if(results.some(r=>!r.pass))process.exitCode=1;
