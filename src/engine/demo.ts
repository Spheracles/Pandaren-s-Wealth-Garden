import type { State, Transaction, Activity } from './types';
import { addDays, addMonths, monthEnd, monthKey, mulberry32, nowTs, pad, todayISO, uid } from './core';

export const STATE_VERSION = 2;

export function defaultOps(): State['settings']['opsBudget'] {
  return { total: 100000, items: [{ k: '網站託管', v: 0 }, { k: '資料庫', v: 0 }, { k: '必要後端服務', v: 0 }, { k: '備份（每日、保留 30 天）', v: 0 }, { k: 'Email 服務', v: 0 }, { k: 'Gemini API', v: 0 }, { k: 'OpenAI API', v: 0 }] };
}

/** Empty personal state. No figures are invented: an empty account list shows designed empty states. */
export function blankState(): State {
  const T = todayISO();
  return {
    version: STATE_VERSION, mode: 'user', privacy: false,
    settings: {
      hourly: 0, base: 'TWD',
      rates: { USD: { rate: 32.4, date: T }, HKD: { rate: 4.15, date: T }, JPY: { rate: 0.214, date: T } },
      snapshotDate: T, aiConsent: { summary: false, raw: false, projects: false }, provider: 'none', setupDone: false,
      goals: [], emailPrivacy: 'hide', opsBudget: defaultOps(),
    },
    accounts: [], txs: [], activities: [], projects: [], assets: [], liabilities: [], recurring: [], templates: [],
    suggestions: [], budgets: {}, customCats: { income: [], expense: [] }, audit: [], notifRead: [], flags: {}, aiUsage: [],
  };
}

/** Fictional demo data, clearly flagged `demo: true`. Never presented as the user's own finances. */
export function seed(T = todayISO()): State {
  const d = (n: number) => addDays(T, -n), ym = monthKey(T), C = (x: number) => Math.round(x * 100);
  const md = (off: number, day: number) => { const k = addMonths(ym, -off); const last = Number(monthEnd(k).slice(8)); return `${k}-${pad(Math.min(day, last))}`; };
  const r = mulberry32(20261015);
  const S = blankState(); S.mode = 'demo';
  Object.assign(S.settings, {
    hourly: C(400), snapshotDate: d(121), aiConsent: { summary: true, raw: false, projects: true }, setupDone: true,
    goals: [{ name: '緊急預備金 6 個月生活費', target: C(300000) }, { name: '建立 3 項非薪資收入來源', target: 0 }],
    rates: { USD: { rate: 32.4, date: d(1) }, HKD: { rate: 4.15, date: d(1) }, JPY: { rate: 0.214, date: d(1) } },
  });
  S.accounts = ([
    { id: 'a_cash', name: '錢包現金', kind: 'cash', cur: 'TWD', opening: C(5000) },
    { id: 'a_bank', name: '示範銀行活存', kind: 'bank', cur: 'TWD', opening: C(180000) },
    { id: 'a_usd', name: '示範外幣帳戶', kind: 'bank', cur: 'USD', opening: 0 },
    { id: 'a_pay', name: '示範電子支付', kind: 'epay', cur: 'TWD', opening: C(2000) },
    { id: 'a_cc', name: '示範信用卡', kind: 'credit', cur: 'TWD', opening: 0 },
    { id: 'a_inv', name: '示範證券帳戶', kind: 'invest', cur: 'TWD', opening: C(250000) },
  ] as const).map(a => ({ ...a, demo: true }));
  const P1 = 'p_illus', P2 = 'p_portfolio', P3 = 'p_podcast', P4 = 'p_camera';
  const txs: Transaction[] = [];
  const add = (o: Partial<Transaction> & Pick<Transaction, 'type' | 'date' | 'amt' | 'desc'>) => {
    if (o.date > T) return;
    txs.push({ id: uid(), demo: true, created: o.date + 'T12:00:00.000Z', cur: 'TWD', rate: 1, base: o.amt, alloc: [], ...o } as Transaction);
  };
  for (let off = 0; off <= 3; off++) {
    add({ type: 'income', date: md(off, 5), amt: C(58000), cat: '薪資', acct: 'a_bank', desc: '月薪（示範公司）' });
    add({ type: 'expense', date: md(off, 1), amt: C(15000), cat: '住宿', acct: 'a_bank', desc: '房租', recurringAttr: true });
    add({ type: 'expense', date: md(off, 12), amt: C(390), cat: '訂閱服務', acct: 'a_cc', desc: '影音串流訂閱', recurringAttr: true });
    if (off <= 1) add({ type: 'expense', date: md(off, 18), amt: C(270), cat: '訂閱服務', acct: 'a_cc', desc: '雲端儲存空間', recurringAttr: true });
    add({ type: 'expense', date: md(off, 2), amt: C(1280), cat: '交通', acct: 'a_pay', desc: '通勤月票', recurringAttr: true });
    add({ type: 'transfer', date: md(off, 6), amt: C(4000), from: 'a_bank', to: 'a_cash', desc: 'ATM 提款' });
    add({ type: 'transfer', date: md(off, 6), amt: C(3000), from: 'a_bank', to: 'a_pay', desc: '電子支付自動儲值' });
  }
  add({ type: 'income', date: md(1, 21), amt: C(46), cat: '利息', acct: 'a_bank', desc: '活存利息' });
  const foods = ['早餐', '午餐便當', '晚餐', '咖啡', '手搖飲', '超商', '麵店', '滷味'];
  for (let n = 118; n >= 0; n--) {
    if (r() < 0.72) { const acct = ['a_cash', 'a_pay', 'a_cc'][Math.floor(r() * 3)]; add({ type: 'expense', date: d(n), amt: C(Math.round((60 + r() * 260) / 5) * 5), cat: '飲食', acct, desc: foods[Math.floor(r() * foods.length)] }); }
    if (r() < 0.08) add({ type: 'expense', date: d(n), amt: C(Math.round((200 + r() * 900) / 10) * 10), cat: '娛樂', acct: 'a_cc', desc: ['電影', '桌遊店', '展覽門票', 'KTV'][Math.floor(r() * 4)] });
    if (r() < 0.06) add({ type: 'expense', date: d(n), amt: C(Math.round((80 + r() * 600) / 10) * 10), cat: '生活用品', acct: 'a_pay', desc: ['日用品', '清潔用品', '文具'][Math.floor(r() * 3)] });
  }
  add({ type: 'expense', date: d(47), amt: C(680), cat: '健康', acct: 'a_cash', desc: '牙科洗牙自付額' });
  add({ type: 'expense', date: d(40), amt: C(3000), cat: '學習', acct: 'a_cc', desc: '線上插畫課程（信用卡）', reusable: true, alloc: [{ pid: P1, pct: 100 }] });
  add({ type: 'expense', date: d(38), amt: C(1490), cat: '工具與設備', acct: 'a_cc', desc: '繪圖板筆尖與配件', reusable: true, alloc: [{ pid: P1, pct: 100 }] });
  add({ type: 'expense', date: d(8), amt: C(450), cat: '學習', acct: 'a_cash', desc: '理財書籍', reusable: false });
  add({ type: 'income', date: d(20), amt: C(15000), cat: '接案', acct: 'a_bank', desc: '網站切版接案（示範客戶）', alloc: [{ pid: P2, pct: 100 }] });
  add({ type: 'income', date: d(33), amt: C(3200), cat: '股利', acct: 'a_inv', desc: 'ETF 現金股利（示範）' });
  add({ type: 'transfer', date: d(30), amt: C(3000), from: 'a_bank', to: 'a_pay', desc: '電子支付儲值' });
  add({ type: 'fx', date: d(25), amt: C(32000), from: 'a_bank', to: 'a_usd', toAmt: C(1000), toCur: 'USD', rate: 1000 / 32000, base: C(32000), desc: '換匯 USD（實際成交 1 USD = 32.00 TWD）' });
  add({ type: 'invest', date: d(60), amt: C(20000), from: 'a_bank', to: 'a_inv', desc: '定期定額投入本金' });
  add({ type: 'valuation', date: d(3), amt: C(12000), acct: 'a_inv', desc: '持股市價評價（手動輸入）', cat: '資產評價' });
  add({ type: 'expense', date: md(2, 8), amt: C(2000), cat: '工具與設備', acct: 'a_bank', desc: '相機維修（轉售準備）', alloc: [{ pid: P4, pct: 100 }] });
  add({ type: 'income', date: md(2, 26), amt: C(1500), cat: '其他收入', acct: 'a_bank', desc: '二手鏡頭轉售', alloc: [{ pid: P4, pct: 100 }] });
  add({ type: 'expense', date: md(2, 15), amt: C(1800), cat: '工具與設備', acct: 'a_cc', desc: 'USB 麥克風', reusable: true, alloc: [{ pid: P3, pct: 100 }] });
  add({ type: 'refund', date: d(10), amt: C(590), cat: '生活用品', acct: 'a_cc', desc: '退貨退款：收納箱' });
  // credit-card statements: pay the previous month's net card charges on the 20th
  for (let off = 3; off >= 1; off--) {
    const k = addMonths(ym, -off), due = `${addMonths(k, 1)}-20`;
    if (due > T) continue;
    const owed = txs.filter(t => t.acct === 'a_cc' && monthKey(t.date) === k).reduce((s, t) => s + (t.type === 'expense' ? t.amt : -t.amt), 0);
    if (owed > 0) add({ type: 'ccpay', date: due, amt: owed, from: 'a_bank', to: 'a_cc', desc: `繳清 ${k.replace('-', '/')} 信用卡帳單` });
  }
  S.txs = txs;

  const acts: Activity[] = [];
  const aa = (o: Partial<Activity> & Pick<Activity, 'date' | 'title' | 'minutes' | 'kind' | 'energy'>) => {
    if (o.date > T) return;
    acts.push({ id: uid(), demo: true, created: o.date + 'T20:00:00.000Z', alloc: [], saved: 0, ...o } as Activity);
  };
  aa({ date: d(2), title: '加班整理季度報表', minutes: 180, kind: '工作', energy: -4 });
  aa({ date: d(12), title: '線上課程：插畫進階第 3 堂', minutes: 120, kind: '學習', energy: -2, alloc: [{ pid: P1, pct: 100 }] });
  aa({ date: d(5), title: '河堤散步', minutes: 40, kind: '休息', energy: 2 });
  aa({ date: d(9), title: '按摩放鬆', minutes: 60, kind: '休息', energy: 3 });
  aa({ date: d(6), title: '完成插畫素材第一組', minutes: 150, kind: '專案', energy: 4, alloc: [{ pid: P1, pct: 70 }, { pid: P2, pct: 30 }] });
  aa({ date: d(21), title: '接案網站開發', minutes: 300, kind: '工作', energy: -3, alloc: [{ pid: P2, pct: 100 }] });
  aa({ date: d(14), title: '建立自動化報價範本', minutes: 90, kind: '專案', energy: 1, saved: 120, alloc: [{ pid: P2, pct: 100 }] });
  aa({ date: d(1), title: '插畫素材整理與命名', minutes: 75, kind: '專案', energy: 1, alloc: [{ pid: P1, pct: 100 }] });
  for (let n = 29; n >= 0; n--) {
    const wd = new Date(d(n) + 'T00:00:00').getDay();
    if (wd > 0 && wd < 6) aa({ date: d(n), title: '正職工作', minutes: 480, kind: '工作', energy: -Math.floor(r() * 3) });
    if (r() < 0.35) aa({ date: d(n), title: ['晚間慢跑', '瑜伽', '和朋友晚餐', '看電影放空', '整理房間'][Math.floor(r() * 5)], minutes: 30 + Math.floor(r() * 6) * 15, kind: ['運動', '運動', '社交', '休息', '家務'][Math.floor(r() * 5)], energy: Math.floor(r() * 5) - 1 });
  }
  // normalise -0 from Math.floor(...)*-1
  acts.forEach(a => { a.energy = a.energy + 0; });
  S.activities = acts;

  S.projects = [
    { id: P1, demo: true, name: '插畫素材包', desc: '把學習插畫的練習作品整理成可授權的素材包。', goal: '完成 20 張可商用素材並上架一個素材平台', status: '培育', created: d(45), due: addDays(T, 60), budget: C(8000), expected: '預估每月授權收入 NT$500–2,000（假設：上架後 3 個月內有穩定下載；高度不確定）', expectedAmt: C(1000), riskFlag: false,
      tasks: [{ id: 't1', text: '完成第二組 10 張', done: false, due: addDays(T, 5) }, { id: 't2', text: '研究平台授權條款', done: true }, { id: 't3', text: '製作預覽圖', done: false, due: addDays(T, 14) }],
      milestones: [{ id: 'm1', name: '完成 3 堂插畫進階課程', done: true, verified: true, date: d(12) }, { id: 'm2', name: '完成第一組 10 張素材', done: true, verified: false, date: d(6) }, { id: 'm3', name: '上架素材平台', done: false, verified: false }],
      risks: '平台審核可能退件；授權收入不保證。', history: [{ date: d(45), text: '建立計畫（由學習支出轉化）' }, { date: d(40), text: '刷卡購買線上插畫課程 NT$3,000，分攤 100%' }, { date: d(12), text: '里程碑「完成 3 堂插畫進階課程」經使用者確認' }] },
    { id: P2, demo: true, name: '接案作品集網站', desc: '建立個人作品集網站以承接網站切版案件。', goal: '取得第一筆接案收入', status: '驗證', created: d(70), due: d(10), budget: C(3000), expected: '預估每季 1–2 件案子', expectedAmt: C(15000), riskFlag: false,
      tasks: [{ id: 't1', text: '補上兩個案例說明', done: false, due: addDays(T, 10) }],
      milestones: [{ id: 'm1', name: '作品集網站上線', done: true, verified: true, date: d(32) }, { id: 'm2', name: '取得第一筆接案收入', done: true, verified: true, date: d(20) }],
      risks: '案源不穩定；時間與正職衝突。', history: [{ date: d(70), text: '建立計畫' }, { date: d(32), text: '網站上線（已驗證）' }, { date: d(20), text: '收到第一筆接案收入 NT$15,000' }] },
    { id: P3, demo: true, name: '理財 Podcast 節目', desc: '每週一集的個人理財分享節目。', goal: '累積 10 集並評估贊助可能', status: '暫停', created: md(2, 10), due: '', budget: C(3000), expected: '未設定', expectedAmt: 0, riskFlag: false, tasks: [], milestones: [{ id: 'm1', name: '錄製第 1 集', done: true, verified: true, date: md(2, 20) }],
      risks: '錄製心力負擔高（平均評分 -3）。', history: [{ date: md(2, 10), text: '建立計畫' }, { date: md(1, 3), text: '使用者將狀態改為「暫停」：正職繁忙' }] },
    { id: P4, demo: true, name: '二手攝影器材轉售', desc: '整理閒置器材維修後轉售。', goal: '回收閒置資金', status: '終止', created: md(2, 1), due: '', budget: C(2000), expected: '預估轉售 NT$3,000', expectedAmt: C(3000), riskFlag: false, tasks: [], milestones: [{ id: 'm1', name: '完成維修並上架', done: true, verified: true, date: md(2, 12) }],
      risks: '實際成交價低於預估。', history: [{ date: md(2, 1), text: '建立計畫' }, { date: md(2, 26), text: '成交 NT$1,500，低於預估' }, { date: md(2, 28), text: '使用者終止計畫，保留成本與成果紀錄' }] },
  ];
  S.recurring = [
    { id: 'r1', kind: 'income', desc: '月薪', amt: C(58000), cat: '薪資', acct: 'a_bank', day: 5, active: true },
    { id: 'r2', kind: 'expense', desc: '房租', amt: C(15000), cat: '住宿', acct: 'a_bank', day: 1, active: true },
    { id: 'r3', kind: 'expense', desc: '影音串流訂閱', amt: C(390), cat: '訂閱服務', acct: 'a_cc', day: 12, active: true },
    { id: 'r4', kind: 'expense', desc: '雲端儲存空間', amt: C(270), cat: '訂閱服務', acct: 'a_cc', day: 18, active: true },
    { id: 'r5', kind: 'expense', desc: '通勤月票', amt: C(1280), cat: '交通', acct: 'a_pay', day: 2, active: true },
  ];
  S.templates = [
    { id: 'tp1', name: '早餐', type: 'expense', amt: C(80), cat: '飲食', acct: 'a_cash', desc: '早餐' },
    { id: 'tp2', name: '午餐', type: 'expense', amt: C(120), cat: '飲食', acct: 'a_pay', desc: '午餐便當' },
    { id: 'tp3', name: '咖啡', type: 'expense', amt: C(65), cat: '飲食', acct: 'a_pay', desc: '咖啡' },
  ];
  S.assets = [{ id: 'as1', demo: true, name: '攝影器材組', type: 'other', value: C(18000), monthlyIncome: 0, maintenance: 0, date: d(30), history: [{ date: d(30), value: C(18000) }] }];
  S.liabilities = [{ id: 'l1', demo: true, name: '示範就學貸款', balance: C(120000), rate: 1.2, installment: C(3500), dueDay: 20, history: [{ date: d(30), balance: C(120000) }] }];
  S.budgets = { 飲食: C(9000), 娛樂: C(3000), 訂閱服務: C(800) };
  S.suggestions = [{ id: 's_demo', status: 'pending', source: '示範草案（非真實 AI 產生）', created: d(4), title: '把學習筆記整理成付費電子書', finding: '學習類支出持續發生，且已有插畫素材與課程筆記等可重複利用成果。', basis: '近 90 天「學習」與標記可重複利用的支出、專案「插畫素材包」的已驗證里程碑。', reason: '既有投入已產生內容素材，再整理的邊際成本較低。', plan: '將課程筆記與插畫練習整理為 30 頁入門電子書，於自有作品集網站販售。', money: C(1500), timeMin: 1200, energy: '中（預估 -2）', benefit: '不確定。假設每月售出 5–15 本、定價 NT$199，月收入約 NT$1,000–3,000，未經驗證。', risks: '需求未驗證；版權須確認課程內容不可直接轉載；可能排擠休息時間。', steps: ['列出 10 個讀者最常問的問題', '完成目錄與 1 章試閱', '在作品集網站放預購登記，觀察 2 週'], measure: '2 週內預購登記人數 ≥ 20 才進入完整製作。' }];
  S.audit = [{ id: uid(), ts: nowTs(), action: '系統', entity: 'system', detail: '載入示範資料（Demo Data Adapter，全部為虛構資料）' }];
  return S;
}
