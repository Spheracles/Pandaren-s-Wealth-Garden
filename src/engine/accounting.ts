import type { Activity, Cents, Project, State, Transaction, PlantStage } from './types';
import { addDays, addMonths, daysBetween, fmt, fmtD, monthEnd, monthKey, rateOf, todayISO } from './core';

/**
 * Effect of a transaction on account balances, in each account's own currency.
 * - expense on a credit card makes its balance more negative (= liability grows)
 * - ccpay moves money bank → card: bank down, liability down, NO expense recognised
 * - transfer / invest / fx never create income or expense
 */
export function effects(t: Transaction): { acct: string; amt: Cents }[] {
  switch (t.type) {
    case 'income': return [{ acct: t.acct!, amt: t.amt }];
    case 'expense': return [{ acct: t.acct!, amt: -t.amt }];
    case 'refund': return [{ acct: t.acct!, amt: t.amt }];
    case 'realized': return [{ acct: t.acct!, amt: t.amt }];
    case 'valuation': return [{ acct: t.acct!, amt: t.amt }];
    case 'transfer': case 'ccpay': case 'invest':
      return [{ acct: t.from!, amt: -t.amt }, { acct: t.to!, amt: t.amt }];
    case 'fx': return [{ acct: t.from!, amt: -t.amt }, { acct: t.to!, amt: t.toAmt! }];
    default: return [];
  }
}

export interface Flow { inc: Cents; exp: Cents; real: Cents; net: Cents; ic: Record<string, Cents>; ec: Record<string, Cents> }
export interface Sheet { groups: Record<'cash' | 'bank' | 'invest' | 'realestate' | 'other', Cents>; assets: Cents; liab: Cents; ccOwed: Cents; net: Cents }

/** Income / expense recognition. Two-leg movements and valuations are excluded by design. */
export function flowOf(txs: Transaction[], from: string, to: string): Flow {
  let inc = 0, exp = 0, real = 0;
  const ic: Record<string, Cents> = {}, ec: Record<string, Cents> = {};
  for (const t of txs) {
    if (t.deleted || t.date < from || t.date > to) continue;
    const c = t.cat || '';
    if (t.type === 'income') { inc += t.base; ic[c] = (ic[c] || 0) + t.base; }
    else if (t.type === 'expense') { exp += t.base; ec[c] = (ec[c] || 0) + t.base; }
    else if (t.type === 'refund') { exp -= t.base; ec[c] = (ec[c] || 0) - t.base; }
    else if (t.type === 'realized') real += t.base;
  }
  return { inc, exp, real, net: inc + real - exp, ic, ec };
}

export function balancesAt(S: State, iso: string | null): Record<string, Cents> {
  const b: Record<string, Cents> = {};
  S.accounts.forEach(a => (b[a.id] = a.opening));
  for (const t of S.txs) {
    if (t.deleted || t.snapshotCovered || (iso && t.date > iso)) continue;
    for (const e of effects(t)) if (e.acct in b) b[e.acct] += e.amt;
  }
  return b;
}

export function balanceSheet(S: State, bal: Record<string, Cents>): Sheet {
  const groups = { cash: 0, bank: 0, invest: 0, realestate: 0, other: 0 };
  let liab = 0, ccOwed = 0;
  for (const a of S.accounts) {
    if (a.archived) continue;
    const v = Math.round(bal[a.id] * rateOf(S, a.cur));
    if (a.kind === 'credit') { if (v < 0) { liab += -v; ccOwed += -v; } else groups.other += v; }
    else groups[a.kind === 'cash' || a.kind === 'epay' ? 'cash' : a.kind === 'bank' ? 'bank' : a.kind === 'invest' ? 'invest' : 'other'] += v;
  }
  for (const x of S.assets) groups[x.type === 'realestate' ? 'realestate' : x.type === 'invest' ? 'invest' : 'other'] += x.value;
  for (const l of S.liabilities) liab += l.balance;
  const assets = Object.values(groups).reduce((s, v) => s + v, 0);
  return { groups, assets, liab, ccOwed, net: assets - liab };
}

export interface ActStats {
  list: Activity[]; min: number; projMin: number; byKind: Record<string, number>; saved: number;
  avg: number | null; dist: Record<number, number>; drains: Activity[]; recov: Activity[]; count: number; posShare: number | null;
}
/** Energy is an ordinal score: averaged per activity, never summed per project, never converted to money. */
export function activityStats(acts: Activity[], from: string, to: string): ActStats {
  const L = acts.filter(a => !a.deleted && a.date >= from && a.date <= to);
  const byKind: Record<string, number> = {};
  let min = 0, projMin = 0, saved = 0;
  const dist: Record<number, number> = {};
  for (let i = -5; i <= 5; i++) dist[i] = 0;
  for (const a of L) {
    min += a.minutes; byKind[a.kind] = (byKind[a.kind] || 0) + a.minutes; saved += a.saved || 0;
    const pct = Math.min(100, (a.alloc || []).reduce((s, x) => s + x.pct, 0));
    projMin += (a.minutes * pct) / 100;
    dist[a.energy]++;
  }
  const avg = L.length ? L.reduce((s, a) => s + a.energy, 0) / L.length : null;
  return {
    list: L, min, projMin, byKind, saved, avg, dist,
    drains: L.filter(a => a.energy < 0).sort((a, b) => a.energy - b.energy).slice(0, 4),
    recov: L.filter(a => a.energy > 0).sort((a, b) => b.energy - a.energy).slice(0, 4),
    count: L.length,
    posShare: L.length ? L.filter(a => a.energy > 0).length / L.length : null,
  };
}

export interface ProjectMetrics {
  money: Cents; time: number; energy: number[]; income: Cents; incomeRecent: Cents;
  txs: { t: Transaction; pct: number; part: Cents }[]; acts: { a: Activity; pct: number }[];
}
export function projectMetrics(S: State, today = todayISO()): Record<string, ProjectMetrics> {
  const pm: Record<string, ProjectMetrics> = {};
  for (const p of S.projects) pm[p.id] = { money: 0, time: 0, energy: [], income: 0, incomeRecent: 0, txs: [], acts: [] };
  for (const t of S.txs) {
    if (t.deleted || !t.alloc) continue;
    for (const x of t.alloc) {
      const m = pm[x.pid]; if (!m) continue;
      const part = Math.round((t.base * x.pct) / 100);
      if (t.type === 'expense') m.money += part;
      else if (t.type === 'refund') m.money -= part;
      else if (t.type === 'income' || t.type === 'realized') { m.income += part; if (daysBetween(t.date, today) <= 60) m.incomeRecent += part; }
      m.txs.push({ t, pct: x.pct, part });
    }
  }
  for (const a of S.activities) {
    if (a.deleted) continue;
    for (const x of a.alloc || []) {
      const m = pm[x.pid]; if (!m) continue;
      m.time += (a.minutes * x.pct) / 100; m.energy.push(a.energy); m.acts.push({ a, pct: x.pct });
    }
  }
  return pm;
}

/** Plant growth follows confirmed outcomes only: verified milestones and real income. Forecasts never count. */
export function stageOf(p: Project, m: ProjectMetrics): PlantStage {
  const ms = p.milestones || [];
  const ver = ms.filter(x => x.verified).length;
  if (p.status === '終止') return 'specimen';
  if (p.status === '暫停') return 'dormant';
  if (p.riskFlag || (p.budget > 0 && m.money > p.budget)) return 'amber';
  if (p.status === '穩定收益' && m.incomeRecent > 0) return 'stable';
  if (ms.length && ver === ms.length) return 'bloom';
  if (ver > 0) return 'bud';
  if (p.status === '構想') return 'seed';
  return m.time > 0 || m.money > 0 ? 'sprout' : 'seed';
}

/** Everything the UI shows is derived here from the stored records; nothing is hard-coded. */
export function compute(S: State, T = todayISO()) {
  const txs = S.txs.filter(t => !t.deleted).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.created < b.created ? 1 : -1));
  const acc = Object.fromEntries(S.accounts.map(a => [a.id, a]));
  const rate = (c: string) => rateOf(S, c);
  const bal = balancesAt(S, null);
  const tw = (id: string, b?: Record<string, Cents>) => Math.round((b || bal)[id] * rate(acc[id].cur));
  const now = balanceSheet(S, bal);
  const flow = (from: string, to: string) => flowOf(txs, from, to);
  const ym = monthKey(T);
  const month = flow(ym + '-01', monthEnd(ym));
  const months: (Flow & { k: string; netWorth: Cents })[] = [];
  for (let i = 11; i >= 0; i--) {
    const k = addMonths(ym, -i);
    const end = i === 0 ? T : monthEnd(k);
    months.push({ k, ...flow(k + '-01', monthEnd(k)), netWorth: balanceSheet(S, balancesAt(S, end)).net });
  }
  const recInc = S.recurring.filter(r => r.kind === 'income' && r.active).reduce((s, r) => s + r.amt, 0);
  const recExp = S.recurring.filter(r => r.kind === 'expense' && r.active).reduce((s, r) => s + r.amt, 0);

  const acts = S.activities.filter(a => !a.deleted).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const actStats = (from: string, to: string) => activityStats(acts, from, to);
  const a30 = actStats(addDays(T, -29), T), a7 = actStats(addDays(T, -6), T), a1 = actStats(T, T);
  const energyDaily: { d: string; avg: number | null; n: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDays(T, -i);
    const L = acts.filter(a => a.date === d);
    energyDaily.push({ d, avg: L.length ? L.reduce((s, a) => s + a.energy, 0) / L.length : null, n: L.length });
  }

  const pm = projectMetrics(S, T);
  const allocatedCost = Object.values(pm).reduce((s, m) => s + m.money, 0);
  const stage = (p: Project) => stageOf(p, pm[p.id]);

  type Plant = { id: string; kind: 'project' | 'income'; ref: any; stage: PlantStage; name: string };
  const plants: Plant[] = [];
  for (const p of S.projects) plants.push({ id: 'p:' + p.id, kind: 'project', ref: p, stage: stage(p), name: p.name });
  const incSrc: Record<string, { cat: string; total: Cents; months: Set<string>; first: string; last: string; txs: Transaction[] }> = {};
  for (const t of txs) {
    if (t.type !== 'income' || daysBetween(t.date, T) > 90 || (t.alloc || []).length) continue;
    const c = t.cat || '其他收入';
    const s = incSrc[c] || (incSrc[c] = { cat: c, total: 0, months: new Set(), first: t.date, last: t.date, txs: [] });
    s.total += t.base; s.months.add(monthKey(t.date));
    if (t.date < s.first) s.first = t.date; if (t.date > s.last) s.last = t.date;
    s.txs.push(t);
  }
  for (const s of Object.values(incSrc)) plants.push({ id: 'i:' + s.cat, kind: 'income', ref: s, stage: s.months.size >= 2 ? 'stable' : 'bud', name: s.cat });

  // rule-based insights (data-backed, always labelled as suggestions)
  const insights: { id: string; tone: string; title: string; body: string; basis: string; page: string }[] = [];
  {
    const recurByMonth = (k: string) => txs.filter(t => t.type === 'expense' && t.recurringAttr && monthKey(t.date) === k).reduce((s, t) => s + t.base, 0);
    const cur = recurByMonth(addMonths(ym, -1)), old = recurByMonth(addMonths(ym, -3));
    if (old > 0 && cur > old) insights.push({ id: 'i-rec', tone: 'w', title: '持續性支出上升', body: `上月持續性支出 ${fmt(cur)}，較三個月前 ${fmt(old)} 增加 ${Math.round(((cur - old) / old) * 100)}%。`, basis: '依據：標記為「持續性支出」的交易，按月加總比較。', page: 'ledger' });
    const ms: { p: Project; m: { name: string; date?: string } }[] = [];
    for (const p of S.projects) for (const m of p.milestones || []) if (m.verified && m.date && daysBetween(m.date, T) <= 30) ms.push({ p, m });
    ms.sort((a, b) => (a.m.date! < b.m.date! ? 1 : -1));
    if (ms[0]) insights.push({ id: 'i-ms', tone: 'ok', title: '培育計畫達成里程碑', body: `「${ms[0].p.name}」於 ${fmtD(ms[0].m.date)} 確認完成「${ms[0].m.name}」。`, basis: '依據：使用者確認的里程碑紀錄。', page: 'projects' });
    const reuse = txs.filter(t => t.type === 'expense' && t.reusable && daysBetween(t.date, T) <= 90);
    if (reuse.length) { const sum = reuse.reduce((s, t) => s + t.base, 0); insights.push({ id: 'i-reuse', tone: 'v', title: '可重複利用投入', body: `近 90 天有 ${reuse.length} 筆標記為可重複利用的支出，共 ${fmt(sum)}。可評估是否形成作品或素材。這是建議，尚非已實現成果。`, basis: '依據：支出上的「可能轉化為可重複利用資產」標記。', page: 'garden' }); }
    const top = Object.entries(month.ec).sort((a, b) => b[1] - a[1])[0];
    if (insights.length < 3 && top) insights.push({ id: 'i-top', tone: 'c', title: '本月最大支出類別', body: `「${top[0]}」本月累計 ${fmt(top[1])}，占本月支出 ${month.exp > 0 ? Math.round((top[1] / month.exp) * 100) : 0}%。`, basis: '依據：本月支出分類加總（已扣除退款）。', page: 'ledger' });
  }

  // notifications (derived; read state persisted separately)
  const notes: { id: string; type: string; tone: string; text: string; sensitive?: boolean; page?: string }[] = [];
  const dom = Number(T.slice(8));
  for (const l of S.liabilities) {
    if (!l.dueDay) continue;
    let diff = l.dueDay - dom; if (diff < 0) diff += 30;
    if (diff <= 7) notes.push({ id: `due-${l.id}-${ym}`, type: '到期提醒', tone: 'w', text: `「${l.name}」本期應付 ${fmt(l.installment)}，約 ${diff} 天後到期（每月 ${l.dueDay} 日）。`, sensitive: true });
  }
  for (const a of S.accounts) if (a.kind === 'credit' && !a.archived && bal[a.id] < 0) notes.push({ id: `cc-${a.id}-${ym}`, type: '到期提醒', tone: 'w', text: `「${a.name}」目前未繳餘額 ${fmt(-bal[a.id], a.cur)}，繳款請使用「信用卡繳款」以免重複認列消費。`, sensitive: true });
  for (const [cat, lim] of Object.entries(S.budgets || {})) {
    const sp = month.ec[cat] || 0;
    if (lim > 0 && sp >= lim * 0.8) notes.push({ id: `bud-${cat}-${ym}-${sp >= lim ? 'over' : 'near'}`, type: '預算提醒', tone: sp >= lim ? 'b' : 'w', text: `「${cat}」本月已用 ${Math.round((sp / lim) * 100)}% 預算（${fmt(sp)} / ${fmt(lim)}）。`, sensitive: true });
  }
  for (const p of S.projects) {
    if (['終止', '暫停'].includes(p.status)) continue;
    for (const t of p.tasks || []) if (!t.done && t.due && daysBetween(T, t.due) <= 7) notes.push({ id: `task-${p.id}-${t.id}`, type: '培育任務提醒', tone: 'c', text: `「${p.name}」任務「${t.text}」${t.due < T ? '已逾期' : '將於 ' + fmtD(t.due) + ' 到期'}。` });
  }
  for (const s of S.suggestions) if (s.status === 'pending') notes.push({ id: `sug-${s.id}`, type: '待核准草案', tone: 'v', text: `草案「${s.title}」等待你核准或駁回。`, page: 'ai' });
  notes.push({ id: `wk-${addDays(T, -((new Date(T + 'T00:00:00').getDay() + 6) % 7))}`, type: '週報與月報', tone: 'c', text: '本週資源巡檢已可查看（規則式統計，AI 分析未連線）。', page: 'reports' });

  // achievements (non-financial)
  const userTx = S.txs.some(t => !t.demo) || S.activities.some(a => !a.demo);
  const daysWith = new Set([...S.txs.filter(t => !t.demo && !t.deleted).map(t => t.created.slice(0, 10)), ...S.activities.filter(a => !a.demo).map(a => (a.created || '').slice(0, 10))]);
  let streak = 0;
  for (let i = 0; i < 60; i++) { if (daysWith.has(addDays(T, -i))) streak++; else if (i > 0) break; }
  const ach = [
    { id: 'first', name: '首次完成紀錄', done: userTx, desc: '親手新增第一筆收支或活動紀錄' },
    { id: 'setup', name: '完成初始財務設定', done: !!S.settings.setupDone && S.mode === 'user', desc: '走完首次使用設定精靈' },
    { id: 'milestone', name: '第一次完成培育里程碑', done: S.projects.some(p => (p.milestones || []).some(m => m.verified)), desc: '確認並驗證一個專案里程碑' },
    { id: 'report', name: '完成第一份月報', done: !!(S.flags && S.flags.monthlyReport), desc: '在分析報告產生一份月報' },
    { id: 'streak', name: '連續 3 天紀錄', done: streak >= 3, desc: `目前連續 ${streak} 天` },
  ];

  // normalised radar, each axis explicitly defined
  const f30 = flow(addDays(T, -29), T);
  const fix30 = txs.filter(t => t.type === 'expense' && t.recurringAttr && t.date >= addDays(T, -29)).reduce((s, t) => s + t.base, 0);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const radar = [
    { label: '儲蓄率', value: f30.inc > 0 ? clamp(f30.net / f30.inc) : 0, raw: f30.inc > 0 ? Math.round((f30.net / f30.inc) * 100) + '%' : '無收入', def: '(收入+已實現損益−支出)÷收入，30 日' },
    { label: '固定支出占比', value: f30.exp > 0 ? clamp(fix30 / f30.exp) : 0, raw: f30.exp > 0 ? Math.round((fix30 / f30.exp) * 100) + '%' : '—', def: '持續性支出÷總支出，30 日' },
    { label: '專案時間占比', value: a30.min ? clamp(a30.projMin / a30.min) : 0, raw: a30.min ? Math.round((a30.projMin / a30.min) * 100) + '%' : '—', def: '分攤至專案的分鐘÷總記錄分鐘，30 日' },
    { label: '恢復活動占比', value: a30.posShare ?? 0, raw: a30.posShare == null ? '—' : Math.round(a30.posShare * 100) + '%', def: '心力評分 >0 的活動數÷活動數，30 日' },
    { label: '平均心力', value: a30.avg == null ? 0 : (a30.avg + 5) / 10, raw: a30.avg == null ? '—' : (a30.avg > 0 ? '+' : '') + a30.avg.toFixed(1), def: '(平均評分+5)÷10，30 日；主觀序位' },
  ];

  return { T, txs, acc, bal, tw, now, flow, month, months, recInc, recExp, acts, a30, a7, a1, actStats, energyDaily, pm, allocatedCost, plants, insights: insights.slice(0, 3), notes, ach, radar, streak, stageOf: stage };
}
export type Derived = ReturnType<typeof compute>;
