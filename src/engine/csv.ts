import type { State, Transaction, TxType } from './types';
import { TYPES, nowTs, parseC, rateOf, uid } from './core';

export function toCSV(S: State): string {
  const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const an = (id?: string) => (S.accounts.find(a => a.id === id) || ({} as any)).name || '';
  return ['日期,類型,金額,幣別,類別,帳戶,轉入帳戶,兌換後金額,兌換後幣別,匯率,換算TWD,說明',
    ...S.txs.filter(t => !t.deleted).sort((a, b) => (a.date < b.date ? -1 : 1)).map(t => [t.date, TYPES[t.type], t.amt / 100, t.cur, t.cat || '', an(t.acct || t.from), an(t.to), t.toAmt != null ? t.toAmt / 100 : '', t.toCur || '', t.rate, t.base / 100, t.desc].map(esc).join(','))].join('\n');
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

export const fingerprint = (date: string, type: string, amt: number, desc?: string) => [date, type, amt, (desc || '').trim()].join('|');

export interface ImportRow { line: number; date: string; type?: TxType; amt: number; cat: string; desc: string; acct?: string; accName: string; status: 'ok' | 'snap' | 'dup' | 'err'; note: string }

/**
 * Double-counting rules for history import:
 * 1. identical to an existing record (date+type+amount+description) → skipped
 * 2. duplicated inside the same file → skipped
 * 3. dated on/before the opening snapshot → kept for history only, no balance effect
 */
export function analyzeImport(S: State, text: string, defaultAcct: string): { error?: string; rows?: ImportRow[] } {
  const r = parseCSV(text.replace(/^﻿/, ''));
  if (r.length < 2) return { error: '找不到資料列。第一列需為欄位名稱。' };
  const h = r[0].map(x => x.trim()); const ix = (n: string) => h.indexOf(n);
  if (ix('日期') < 0 || ix('金額') < 0 || ix('類型') < 0) return { error: '缺少必要欄位：日期、類型、金額。' };
  const existing = new Set(S.txs.filter(t => !t.deleted).map(t => fingerprint(t.date, t.type, t.amt, t.desc)));
  const seen = new Set<string>(); const tmap: Record<string, TxType> = { 收入: 'income', 支出: 'expense', 退款: 'refund' };
  const rows = r.slice(1).map((c, i): ImportRow => {
    const g = (n: string) => (ix(n) >= 0 ? (c[ix(n)] || '').trim() : '');
    const date = g('日期').replace(/\//g, '-'); const type = tmap[g('類型')]; const amt = parseC(g('金額'));
    const acc = S.accounts.find(a => a.name === g('帳戶')) || S.accounts.find(a => a.id === defaultAcct);
    const o: ImportRow = { line: i + 2, date, type, amt, cat: g('類別'), desc: g('說明') || g('類別'), acct: acc && acc.id, accName: acc ? acc.name : '—', status: 'ok', note: '' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { o.status = 'err'; o.note = '日期格式需為 YYYY-MM-DD'; }
    else if (!type) { o.status = 'err'; o.note = '類型僅支援 收入／支出／退款；轉帳類請手動建立'; }
    else if (!(amt > 0)) { o.status = 'err'; o.note = '金額需大於 0'; }
    else if (!acc) { o.status = 'err'; o.note = '找不到帳戶'; }
    else {
      const k = fingerprint(date, type, amt, o.desc);
      if (existing.has(k)) { o.status = 'dup'; o.note = '與既有紀錄相同，略過'; }
      else if (seen.has(k)) { o.status = 'dup'; o.note = '檔案內重複，略過'; }
      else { seen.add(k); if (date <= S.settings.snapshotDate) { o.status = 'snap'; o.note = '早於快照日：只計入歷史統計，不影響餘額'; } }
    }
    return o;
  });
  return { rows };
}

export function importRowsToTx(S: State, rows: ImportRow[]): Transaction[] {
  return rows.filter(r => r.status === 'ok' || r.status === 'snap').map(r => {
    const a = S.accounts.find(x => x.id === r.acct)!; const rate = rateOf(S, a.cur);
    return { id: uid(), created: nowTs(), demo: false, imported: true, type: r.type!, date: r.date, amt: r.amt, cur: a.cur, rate, base: Math.round(r.amt * rate), cat: r.cat || (r.type === 'income' ? '其他收入' : '其他支出'), acct: r.acct, desc: r.desc, alloc: [], snapshotCovered: r.status === 'snap' };
  });
}
