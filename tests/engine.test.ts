/**
 * Financial-engine acceptance tests. Run: npm test
 * These cover the money rules that must behave identically on web and Android.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  seed, blankState, compute, buildTransaction, balancesAt, flowOf, decideSuggestion, ingestAISuggestion,
  canUseAI, migrate, analyzeImport, importRowsToTx, parseC, projectMetrics, stageOf, validateAlloc, addDays,
  type State, type Transaction,
} from '../src/engine/index';

const T = '2026-10-15';
const fresh = (): State => seed(T);
const add = (S: State, tx: Transaction) => { S.txs.push(tx); return S; };
const mustBuild = (S: State, draft: any, existing?: Transaction) => {
  const r = buildTransaction(S, draft, existing);
  assert.deepEqual(r.errors, [], 'unexpected validation errors: ' + r.errors.join(' / '));
  return r.tx!;
};

test('money parsing uses integer cents (no float drift)', () => {
  assert.equal(parseC('0.1') + parseC('0.2'), parseC('0.3'));
  assert.equal(parseC('1,234.56'), 123456);
  assert.ok(Number.isNaN(parseC('12abc')));
  assert.ok(Number.isNaN(parseC('')));
});

test('1. adding income updates monthly income immediately', () => {
  const S = fresh(); const before = compute(S, T).month.inc;
  add(S, mustBuild(S, { type: 'income', date: T, amt: '1500', cat: '接案', acct: 'a_bank', desc: '測試收入' }));
  assert.equal(compute(S, T).month.inc - before, 150000);
});

test('2. adding an expense updates category statistics; editing recomputes', () => {
  const S = fresh(); const before = compute(S, T).month.ec['健康'] || 0;
  const tx = mustBuild(S, { type: 'expense', date: T, amt: '300', cat: '健康', acct: 'a_cash', desc: '藥局' });
  add(S, tx);
  assert.equal((compute(S, T).month.ec['健康'] || 0) - before, 30000);
  const edited = mustBuild(S, { type: 'expense', date: T, amt: '500', cat: '健康', acct: 'a_cash', desc: '藥局' }, tx);
  S.txs[S.txs.findIndex(t => t.id === tx.id)] = edited;
  assert.equal(edited.id, tx.id, 'edit keeps the same record id');
  assert.equal((compute(S, T).month.ec['健康'] || 0) - before, 50000);
});

test('3. account transfer creates no income/expense and keeps net worth', () => {
  const S = fresh(); const D0 = compute(S, T);
  add(S, mustBuild(S, { type: 'transfer', date: T, amt: '2000', from: 'a_bank', to: 'a_pay', desc: '儲值' }));
  const D1 = compute(S, T);
  assert.equal(D1.month.inc, D0.month.inc); assert.equal(D1.month.exp, D0.month.exp);
  assert.equal(D1.now.net, D0.now.net);
  assert.equal(D1.bal.a_bank - D0.bal.a_bank, -200000); assert.equal(D1.bal.a_pay - D0.bal.a_pay, 200000);
});

test('4. credit-card payment does not count the purchase twice', () => {
  const S = fresh(); const D0 = compute(S, T);
  add(S, mustBuild(S, { type: 'expense', date: T, amt: '3000', cat: '學習', acct: 'a_cc', desc: '課程' }));
  const D1 = compute(S, T);
  assert.equal(D1.month.exp - D0.month.exp, 300000, 'purchase recognised once at swipe');
  assert.equal(D1.now.liab - D0.now.liab, 300000, 'card payable grows');
  add(S, mustBuild(S, { type: 'ccpay', date: T, amt: '3000', from: 'a_bank', to: 'a_cc', desc: '繳卡費' }));
  const D2 = compute(S, T);
  assert.equal(D2.month.exp, D1.month.exp, 'payment is not an expense');
  assert.equal(D2.now.liab, D0.now.liab, 'payable back to previous level');
  assert.equal(D2.now.net, D1.now.net, 'paying the card does not change net worth');
  const bad = buildTransaction(S, { type: 'ccpay', date: T, amt: '10', from: 'a_bank', to: 'a_pay' });
  assert.ok(bad.errors.length, 'ccpay to a non-card account is rejected');
});

test('5. FX keeps original amount, actual rate and TWD base', () => {
  const S = fresh();
  const tx = mustBuild(S, { type: 'fx', date: T, amt: '16000', toAmt: '500', from: 'a_bank', to: 'a_usd', desc: '換匯' });
  assert.equal(tx.amt, 1600000); assert.equal(tx.toAmt, 50000); assert.equal(tx.toCur, 'USD');
  assert.equal(tx.base, 1600000); assert.ok(Math.abs(tx.amt / tx.toAmt! - 32) < 1e-9);
  const D0 = compute(S, T); add(S, tx); const D1 = compute(S, T);
  assert.equal(D1.month.inc, D0.month.inc); assert.equal(D1.month.exp, D0.month.exp);
});

test('6. time opportunity cost never touches cash balances', () => {
  const S = fresh(); const before = balancesAt(S, null);
  S.activities.push({ id: 'x', date: T, title: '加班', minutes: 600, kind: '工作', energy: -4, saved: 0, alloc: [], created: T });
  assert.deepEqual(balancesAt(S, null), before);
});

test('7. energy is not double counted when an activity spans projects', () => {
  const S = blankState(); S.projects = [
    { id: 'p1', name: 'A', desc: '', goal: '', status: '培育', created: T, due: '', budget: 0, expected: '', expectedAmt: 0, riskFlag: false, risks: '', tasks: [], milestones: [], history: [] },
    { id: 'p2', name: 'B', desc: '', goal: '', status: '培育', created: T, due: '', budget: 0, expected: '', expectedAmt: 0, riskFlag: false, risks: '', tasks: [], milestones: [], history: [] }];
  S.activities = [{ id: 'a', date: T, title: '創作', minutes: 100, kind: '專案', energy: 4, saved: 0, alloc: [{ pid: 'p1', pct: 60 }, { pid: 'p2', pct: 40 }], created: T }];
  const D = compute(S, T);
  assert.equal(D.a1.count, 1); assert.equal(D.a1.avg, 4);
  assert.equal(D.a1.dist[4], 1, 'one score in the distribution, not two');
  assert.equal(D.pm.p1.time + D.pm.p2.time, 100, 'time split by ratio, total preserved');
});

test('8. project cost allocation cannot exceed the original amount', () => {
  assert.ok(validateAlloc([{ pid: 'a', pct: 70 }, { pid: 'b', pct: 40 }]).length);
  assert.ok(validateAlloc([{ pid: 'a', pct: 50 }, { pid: 'a', pct: 10 }]).length);
  const S = fresh(); const D = compute(S, T);
  const projectExpense = S.txs.filter(t => t.type === 'expense' && t.alloc.length).reduce((s, t) => s + t.base, 0);
  assert.ok(D.allocatedCost <= projectExpense);
});

test('9. plants grow only from verified outcomes, never from forecasts', () => {
  const S = fresh(); const p = S.projects.find(x => x.id === 'p_illus')!;
  const pm = projectMetrics(S, T); const st0 = stageOf(p, pm[p.id]);
  p.expectedAmt = 99_999_900; p.expected = '預估超高收益';
  assert.equal(stageOf(p, projectMetrics(S, T)[p.id]), st0, 'forecast change does not change stage');
  p.milestones.forEach(m => { m.done = true; m.verified = true; });
  assert.equal(stageOf(p, projectMetrics(S, T)[p.id]), 'bloom');
  p.status = '暫停'; assert.equal(stageOf(p, projectMetrics(S, T)[p.id]), 'dormant');
  p.status = '終止'; assert.equal(stageOf(p, projectMetrics(S, T)[p.id]), 'specimen');
});

test('10. AI output can only become a pending draft; approval never edits money records', () => {
  const S = fresh();
  const snapshot = JSON.stringify({ txs: S.txs, accounts: S.accounts, assets: S.assets, liabilities: S.liabilities });
  const s = ingestAISuggestion({ title: '新收入構想', benefit: '每月 3 萬', txs: [{ type: 'income', amt: 9e9 }], deleteAccount: 'a_bank', setAssetValue: 1 }, 'Gemini');
  assert.ok(s); assert.equal(s!.status, 'pending');
  assert.ok(!('txs' in (s as any)) && !('deleteAccount' in (s as any)));
  assert.match(s!.benefit, /預估值|未經驗證/);
  S.suggestions.push(s!);
  const { state, projectId } = decideSuggestion(S, s!.id, 'approve');
  assert.ok(projectId); assert.equal(state.projects.find(p => p.id === projectId)!.status, '構想');
  assert.equal(JSON.stringify({ txs: state.txs, accounts: state.accounts, assets: state.assets, liabilities: state.liabilities }), snapshot);
  assert.equal(decideSuggestion(state, s!.id, 'approve').state, state, 'an already-decided draft cannot be re-applied');
  assert.equal(ingestAISuggestion({ nope: 1 }, 'OpenAI'), null);
});

test('11. AI data scopes default to denied for a new user', () => {
  const S = blankState();
  assert.equal(canUseAI(S, 'summary'), false); assert.equal(canUseAI(S, 'raw'), false);
});

test('12. upgrading v1 data keeps every balance and record (APK update path)', () => {
  const S = fresh(); const v1: any = JSON.parse(JSON.stringify(S)); v1.version = 1; delete v1.aiUsage; delete v1.flags;
  const m = migrate(v1)!;
  assert.equal(m.version, 2); assert.equal(m.txs.length, S.txs.length);
  assert.deepEqual(balancesAt(m, null), balancesAt(S, null));
  assert.deepEqual(m.aiUsage, []); assert.equal(migrate({ junk: true }), null);
});

test('13. history import skips duplicates and does not double count snapshot-era rows', () => {
  const S = fresh(); const existing = S.txs.find(t => t.type === 'income')!;
  const csv = ['日期,類型,金額,幣別,類別,帳戶,說明',
    `${existing.date},收入,${existing.amt / 100},TWD,${existing.cat},示範銀行活存,${existing.desc}`,
    `${T},支出,120,TWD,飲食,錢包現金,午餐`, `${T},支出,120,TWD,飲食,錢包現金,午餐`,
    `${addDays(S.settings.snapshotDate, -10)},支出,999,TWD,飲食,錢包現金,舊紀錄`, `bad,支出,1,TWD,飲食,錢包現金,x`].join('\n');
  const { rows } = analyzeImport(S, csv, 'a_cash');
  assert.deepEqual(rows!.map(r => r.status), ['dup', 'ok', 'dup', 'snap', 'err']);
  const before = balancesAt(S, null).a_cash;
  S.txs.push(...importRowsToTx(S, rows!));
  assert.equal(balancesAt(S, null).a_cash - before, -12000, 'only the new in-period row moves the balance');
  assert.equal(flowOf(S.txs, '2000-01-01', '2100-01-01').ec['飲食'] > 0, true);
});

test('14. soft-deleted records leave all statistics', () => {
  const S = fresh(); const D0 = compute(S, T);
  const tx = mustBuild(S, { type: 'expense', date: T, amt: '700', cat: '娛樂', acct: 'a_cash', desc: '電影' });
  add(S, tx); tx.deleted = true;
  const D1 = compute(S, T);
  assert.equal(D1.month.exp, D0.month.exp); assert.deepEqual(D1.bal, D0.bal);
});

test('15. demo data is internally consistent', () => {
  const S = fresh(); const D = compute(S, T);
  for (const a of S.accounts) if (a.kind !== 'credit') assert.ok(D.bal[a.id] >= 0, `${a.name} should not be negative`);
  assert.ok(S.txs.every(t => t.demo), 'every demo record is flagged as demo');
  const f = flowOf(S.txs, '2000-01-01', '2100-01-01');
  const manual = S.txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.base, 0) - S.txs.filter(t => t.type === 'refund').reduce((s, t) => s + t.base, 0);
  assert.equal(f.exp, manual);
});

test('16. validation blocks unsafe drafts', () => {
  const S = fresh();
  assert.ok(buildTransaction(S, { type: 'expense', date: T, amt: '-5', cat: '飲食', acct: 'a_cash' }).errors.length);
  assert.ok(buildTransaction(S, { type: 'transfer', date: T, amt: '5', from: 'a_bank', to: 'a_usd' }).errors.length, 'cross-currency transfer must use FX');
  assert.ok(buildTransaction(S, { type: 'valuation', date: T, amt: '5', acct: 'a_cash' }).errors.length, 'valuation only on investment accounts');
  assert.ok(buildTransaction(S, { type: 'transfer', date: T, amt: '5', from: 'a_bank', to: 'a_pay', alloc: [{ pid: 'p_illus', pct: 10 }] }).errors.length, 'transfers cannot be allocated');
});
