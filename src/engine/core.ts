import type { Cents, ISODate, PlantStage, State, TxType } from './types';

/* ---------- dates (local calendar, no timezone drift) ---------- */
export const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = (): ISODate => isoOf(new Date());
export const addDays = (iso: ISODate, n: number): ISODate => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoOf(d); };
export const monthKey = (iso: ISODate) => iso.slice(0, 7);
export const addMonths = (ym: string, n: number) => {
  let [y, m] = ym.split('-').map(Number);
  m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; }
  return `${y}-${pad(m)}`;
};
export const monthEnd = (ym: string): ISODate => { const [y, m] = ym.split('-').map(Number); return isoOf(new Date(y, m, 0)); };
export const daysBetween = (a: ISODate, b: ISODate) => Math.round((+new Date(b + 'T00:00:00') - +new Date(a + 'T00:00:00')) / 864e5);
export const fmtD = (iso?: string) => (iso ? iso.replace(/-/g, '/') : '—');
export const uid = () => {
  const rnd = typeof crypto !== 'undefined' && 'getRandomValues' in crypto
    ? Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(36).padStart(2, '0')).join('').slice(0, 9)
    : Math.random().toString(36).slice(2, 11);
  return rnd + Date.now().toString(36).slice(-4);
};
export const nowTs = () => new Date().toISOString();

/* ---------- money ---------- */
export const SYM: Record<string, string> = { TWD: 'NT$', USD: 'US$', HKD: 'HK$', JPY: '¥' };
export function fmt(c: Cents | null | undefined, cur = 'TWD', sign = false): string {
  if (c == null || isNaN(c)) return '—';
  const neg = c < 0, a = Math.abs(Math.round(c));
  const dec = cur === 'JPY' ? 0 : cur === 'TWD' ? (a % 100 ? 2 : 0) : 2;
  const s = (a / 100).toLocaleString('zh-TW', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return (neg ? '−' : sign && c > 0 ? '+' : '') + (SYM[cur] || cur + ' ') + s;
}
export function fmtK(c: Cents): string {
  const v = c / 100, a = Math.abs(v);
  if (a >= 1e8) return (v / 1e8).toFixed(1) + '億';
  if (a >= 1e4) return (v / 1e4).toFixed(a >= 1e5 ? 0 : 1) + '萬';
  return Math.round(v).toLocaleString('zh-TW');
}
/** Parses user input such as "1,234.5" into integer cents. Returns NaN when invalid. */
export function parseC(s: unknown): Cents {
  if (s == null) return NaN;
  const t = String(s).replace(/[,\s]/g, '');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return Math.round(parseFloat(t) * 100);
}
export const fmtMin = (m: number) => { m = Math.round(m || 0); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} 小時${r ? ` ${r} 分` : ''}` : `${r} 分`; };

/* ---------- constants ---------- */
export const TYPES: Record<TxType, string> = {
  income: '收入', expense: '支出', refund: '退款', transfer: '帳戶轉帳', ccpay: '信用卡繳款',
  fx: '外幣兌換', invest: '投資本金移動', realized: '已實現投資損益', valuation: '未實現評價變動',
};
export const TWO_LEG: TxType[] = ['transfer', 'ccpay', 'invest', 'fx'];
export const BASE_CATS = {
  income: ['薪資', '接案', '營業收入', '股利', '利息', '租金', '版權授權', '其他收入'],
  expense: ['飲食', '交通', '住宿', '生活用品', '娛樂', '學習', '健康', '工具與設備', '訂閱服務', '其他支出'],
};
export const ACC_KINDS = { cash: '現金', bank: '銀行', epay: '電子支付', credit: '信用卡', invest: '投資帳戶', custom: '自訂帳戶' } as const;
export const ASSET_TYPES = { realestate: '不動產', invest: '投資資產', other: '其他資產' } as const;
export const ACT_KINDS = ['工作', '學習', '休息', '專案', '運動', '社交', '家務', '其他'];
export const P_STATUS = ['構想', '培育', '驗證', '穩定收益', '暫停', '轉型', '終止'] as const;
export const ELABEL: Record<string, string> = {
  '-5': '極高心力消耗', '-4': '明顯疲憊', '-3': '中高度消耗', '-2': '輕中度消耗', '-1': '輕微消耗', '0': '中性',
  '1': '輕微恢復', '2': '適度放鬆', '3': '明顯恢復', '4': '高度充電', '5': '非常充實且恢復良好',
};
export const STAGES: Record<PlantStage, string> = {
  seed: '霓虹幼苗', sprout: '能量枝芽', bud: '發光花苞', bloom: '開花植物', stable: '穩定發光植物',
  dormant: '休眠植物', amber: '琥珀色風險', specimen: '數位標本',
};
export const STAGE_COL: Record<PlantStage, string> = {
  seed: '#00F5D4', sprout: '#00F5D4', bud: '#A855F7', bloom: '#FF3CAC', stable: '#34D399',
  dormant: '#62728C', amber: '#F59E0B', specimen: '#9AACC8',
};
export const CAT_COL = ['#00F5D4', '#A855F7', '#FF3CAC', '#34D399', '#F59E0B', '#60A5FA', '#F472B6', '#2DD4BF', '#C084FC', '#FBBF24', '#FB7185', '#94A3B8'];
export const catColor = (cat: string, list: string[]) => CAT_COL[Math.max(0, list.indexOf(cat)) % CAT_COL.length];

export function allCats(S: State, kind: 'income' | 'expense'): string[] {
  return [...BASE_CATS[kind], ...((S.customCats && S.customCats[kind]) || [])];
}
export function rateOf(S: State, c: string): number {
  return c === 'TWD' ? 1 : (S.settings.rates[c] && S.settings.rates[c].rate) || 0;
}
export function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
