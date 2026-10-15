/**
 * All writes that change financial records go through these pure functions so the
 * rules are testable and identical on web and Android.
 */
import type { Allocation, State, Suggestion, Transaction, TxType, Project } from './types';
import { TWO_LEG, TYPES, fmt, nowTs, parseC, rateOf, todayISO, uid } from './core';
import { STATE_VERSION, blankState } from './demo';

export function validateAlloc(alloc: { pid: string; pct: number | string }[]): string[] {
  const e: string[] = [];
  const sum = alloc.reduce((s, a) => s + Number(a.pct || 0), 0);
  if (sum > 100) e.push('專案分攤比例總和不得超過 100%。');
  if (alloc.some(a => !a.pid || !(Number(a.pct) > 0))) e.push('每一列分攤都需選擇專案並填入大於 0 的比例。');
  if (new Set(alloc.map(a => a.pid)).size !== alloc.length) e.push('同一專案不可重複分攤。');
  return e;
}

export interface TxDraft {
  type: TxType; date: string; amt: string; toAmt?: string; desc?: string; cat?: string;
  acct?: string; from?: string; to?: string; alloc?: { pid: string; pct: number | string }[];
  recurringAttr?: boolean; reusable?: boolean;
}

/** Validates a user-entered transaction and builds the stored record. Never writes by itself. */
export function buildTransaction(S: State, f: TxDraft, existing?: Transaction): { errors: string[]; tx?: Transaction } {
  const err: string[] = [];
  const T = f.type, two = TWO_LEG.includes(T);
  const amt = parseC(f.amt);
  const acc = (id?: string) => S.accounts.find(a => a.id === id);
  const a1 = two ? acc(f.from) : acc(f.acct);
  const a2 = two ? acc(f.to) : undefined;
  const alloc = f.alloc || [];
  if (!TYPES[T]) err.push('交易類型不正確。');
  if (!f.date || !/^\d{4}-\d{2}-\d{2}$/.test(f.date)) err.push('請選擇日期。');
  if (T === 'valuation' || T === 'realized') { if (!amt) err.push('請輸入金額（損失或評價下降可輸入負數）。'); }
  else if (!(amt > 0)) err.push('金額需大於 0。');
  if (two) {
    if (!a1 || !a2) err.push('請選擇轉出與轉入帳戶。');
    else if (a1.id === a2.id) err.push('轉出與轉入帳戶不可相同。');
    else {
      if (T !== 'fx' && a1.cur !== a2.cur) err.push('兩個帳戶幣別不同，請改用「外幣兌換」。');
      if (T === 'fx' && a1.cur === a2.cur) err.push('外幣兌換需選擇不同幣別的帳戶。');
      if (T === 'ccpay' && a2.kind !== 'credit') err.push('信用卡繳款的轉入帳戶必須是信用卡。');
      if (T === 'invest' && a1.kind !== 'invest' && a2.kind !== 'invest') err.push('投資本金移動需包含一個投資帳戶。');
    }
  } else {
    if (!a1) err.push('請選擇帳戶。');
    if (!['valuation', 'realized'].includes(T) && !f.cat) err.push('請選擇類別。');
    if (T === 'valuation' && a1 && a1.kind !== 'invest') err.push('未實現評價變動僅適用於投資帳戶；其他資產請在「資產與負債」更新評價。');
  }
  const toAmt = T === 'fx' ? parseC(f.toAmt) : undefined;
  if (T === 'fx' && !((toAmt as number) > 0)) err.push('請輸入兌換後實際入帳金額。');
  err.push(...validateAlloc(alloc));
  if (alloc.length && !['expense', 'income', 'refund', 'realized'].includes(T)) err.push('只有收入、支出、退款、已實現損益可以分攤至專案。');
  let rate = 1, base = amt;
  if (!err.length && a1) {
    if (T === 'fx') {
      rate = (toAmt as number) / amt;
      base = a1.cur === 'TWD' ? amt : a2!.cur === 'TWD' ? (toAmt as number) : Math.round(amt * rateOf(S, a1.cur));
    } else {
      rate = rateOf(S, a1.cur);
      if (!rate) err.push(`尚未設定 ${a1.cur} 匯率，請先到「資產與負債 → 匯率」設定。`);
      base = Math.round(amt * rate);
    }
  }
  if (err.length) return { errors: err };
  const tx: Transaction = {
    ...(existing || { id: uid(), created: nowTs(), demo: false, alloc: [] as Allocation[] }),
    type: T, date: f.date, amt, cur: a1!.cur, rate, base,
    desc: (f.desc || '').trim() || TYPES[T],
    cat: two ? undefined : T === 'realized' ? '投資損益' : T === 'valuation' ? '資產評價' : f.cat,
    acct: two ? undefined : a1!.id, from: two ? a1!.id : undefined, to: two ? a2!.id : undefined,
    toAmt: T === 'fx' ? toAmt : undefined, toCur: T === 'fx' ? a2!.cur : undefined,
    alloc: alloc.map(a => ({ pid: a.pid, pct: Number(a.pct) })),
    recurringAttr: !!f.recurringAttr, reusable: !!f.reusable, updated: nowTs(),
  } as Transaction;
  if (existing) tx.demo = existing.demo;
  return { errors: [], tx };
}

export function summTx(t: Transaction) {
  return { type: t.type, date: t.date, amt: t.amt, cur: t.cur, cat: t.cat, desc: t.desc, acct: t.acct, from: t.from, to: t.to, toAmt: t.toAmt, alloc: t.alloc };
}

/* ---------- AI guard ---------- */
export type AIScope = 'summary' | 'projects' | 'raw';
export const canUseAI = (S: State, scope: AIScope) => !!S.settings.aiConsent[scope];

const SUGGESTION_TEXT_FIELDS = ['title', 'finding', 'basis', 'reason', 'plan', 'energy', 'benefit', 'risks', 'measure'] as const;
/**
 * Accepts a provider response and turns it into a PENDING draft only.
 * Any other instruction in the payload (edit transactions, delete accounts, change
 * asset values, record income) is discarded: the AI has no write path.
 */
export function ingestAISuggestion(payload: any, source: string): Suggestion | null {
  if (!payload || typeof payload !== 'object' || typeof payload.title !== 'string' || !payload.title.trim()) return null;
  const s: any = { id: uid(), status: 'pending', source, created: todayISO() };
  for (const k of SUGGESTION_TEXT_FIELDS) s[k] = typeof payload[k] === 'string' ? payload[k].slice(0, 2000) : '';
  s.money = Number.isFinite(payload.money) && payload.money >= 0 ? Math.round(payload.money) : 0;
  s.timeMin = Number.isFinite(payload.timeMin) && payload.timeMin >= 0 ? Math.round(payload.timeMin) : 0;
  s.steps = Array.isArray(payload.steps) ? payload.steps.filter((x: unknown) => typeof x === 'string').slice(0, 12) : [];
  if (!/假設|不確定|未經驗證|預估/.test(s.benefit)) s.benefit = (s.benefit ? s.benefit + '（' : '（') + '預估值，未經驗證）';
  return s as Suggestion;
}

/** Only an explicit user decision turns a draft into a project. Transactions are never touched. */
export function decideSuggestion(S: State, id: string, decision: 'approve' | 'reject'): { state: State; projectId?: string } {
  const s: State = JSON.parse(JSON.stringify(S));
  const x = s.suggestions.find(y => y.id === id);
  if (!x || x.status !== 'pending') return { state: S };
  x.status = decision === 'approve' ? 'approved' : 'rejected';
  x.decided = todayISO();
  let projectId: string | undefined;
  if (decision === 'approve') {
    projectId = uid(); x.projectId = projectId;
    const p: Project = {
      id: projectId, name: x.title, desc: x.plan, goal: x.measure, status: '構想', created: todayISO(), due: '',
      budget: x.money || 0, expected: x.benefit, expectedAmt: 0, risks: x.risks, riskFlag: false,
      tasks: (x.steps || []).map(t => ({ id: uid(), text: t, done: false })),
      milestones: [{ id: uid(), name: '達成驗證標準：' + x.measure, done: false, verified: false }],
      history: [{ date: todayISO(), text: `由草案核准建立（來源：${x.source}）` }],
    };
    s.projects.push(p);
  }
  s.audit.push({ id: uid(), ts: nowTs(), action: decision === 'approve' ? '核准 AI 草案' : '駁回 AI 草案', entity: 'ai_approvals', detail: x.title });
  return { state: s, projectId };
}

/* ---------- persistence: versioned migration ---------- */
/**
 * Upgrades stored data written by any earlier app version. It only ADDS fields;
 * it never rewrites amounts, dates or balances, so an APK update keeps data intact.
 */
export function migrate(raw: any): State | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.txs) || !Array.isArray(raw.accounts)) return null;
  const s = JSON.parse(JSON.stringify(raw));
  const b = blankState();
  if (!s.version || s.version < 1) return null;
  if (s.version < 2) {
    // v1 (web prototype) → v2 (Android 1.0.0): add containers that v1 may not have
    for (const k of Object.keys(b) as (keyof State)[]) if (s[k] === undefined) s[k] = (b as any)[k];
    s.settings = { ...b.settings, ...s.settings, aiConsent: { ...b.settings.aiConsent, ...(s.settings || {}).aiConsent } };
    s.customCats = { income: [], expense: [], ...(s.customCats || {}) };
    s.version = 2;
  }
  if (s.version > STATE_VERSION) return s; // written by a newer build: keep as-is, never truncate
  return s as State;
}

export function describeTx(t: Transaction) { return `${TYPES[t.type]}｜${t.desc}｜${fmt(t.amt, t.cur)}`; }
