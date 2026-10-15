import type { State, Suggestion } from './types';
import type { Derived } from './accounting';
import { addDays, fmt, fmtD, fmtMin, todayISO, uid } from './core';

/** Rule-based analysis engine. Its output is ALWAYS labelled as non-AI in the UI. */
export function ruleAnalyses(S: State, D: Derived) {
  const T = D.T, f = D.flow(addDays(T, -29), T), a = D.a30;
  const topE = Object.entries(f.ec).sort((x, y) => y[1] - x[1]).slice(0, 3);
  const rec = D.txs.filter(t => t.type === 'expense' && t.recurringAttr && t.date >= addDays(T, -89));
  const recBy: Record<string, number> = {};
  rec.forEach(t => { recBy[t.desc] = (recBy[t.desc] || 0) + t.base; });
  const unlinked = D.txs.filter(t => t.type === 'expense' && (t.reusable || ['學習', '工具與設備'].includes(t.cat || '')) && !(t.alloc || []).length && t.date >= addDays(T, -89));
  return {
    income: { title: '近期收入與支出分析', lines: [`近 30 日收入 ${fmt(f.inc)}、已實現投資損益 ${fmt(f.real)}、支出 ${fmt(f.exp)}，收支淨額 ${fmt(f.net, 'TWD', true)}。`, ...topE.map(([c, v], i) => `支出第 ${i + 1} 名：${c} ${fmt(v)}（${f.exp > 0 ? Math.round((v / f.exp) * 100) : 0}%）`), '資料依據：transactions（排除帳戶轉帳、信用卡繳款、換匯、投資本金移動）。'] },
    recurring: { title: '持續性支出檢查', lines: [...Object.entries(recBy).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}：近 90 日 ${fmt(v)}`), `定期支出設定合計每月 ${fmt(D.recExp)}。`, '建議：逐項確認仍在使用；這是建議，不會自動取消任何訂閱。'] },
    time: { title: '時間配置分析', lines: [`近 30 日記錄 ${fmtMin(a.min)}，其中分攤至培育專案 ${fmtMin(a.projMin)}。`, ...Object.entries(a.byKind).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}：${fmtMin(v)}（${a.min ? Math.round((v / a.min) * 100) : 0}%）`), `實際節省時間 ${fmtMin(a.saved)}。參考時薪 ${fmt(S.settings.hourly)}，僅作機會成本參考，不計入現金。`] },
    energy: { title: '心力消耗與恢復分析', lines: [`近 30 日平均心力 ${a.avg == null ? '—' : a.avg.toFixed(2)}（主觀序位評分，非可相加的物理量）。`, '主要消耗：' + (a.drains.map(x => `${x.title}(${x.energy})`).join('、') || '無'), '主要恢復：' + (a.recov.map(x => `${x.title}(+${x.energy})`).join('、') || '無')] },
    convert: { title: '支出轉化資產的可能性', lines: unlinked.length ? [...unlinked.slice(0, 5).map(t => `${fmtD(t.date)} ${t.desc} ${fmt(t.base)}（${t.cat}，尚未關聯專案）`), '建議：若這些投入能產出作品、素材或可重複使用的技能，可建立培育計畫並分攤成本。'] : ['近 90 日的學習／工具／可重複利用支出都已關聯專案。'] },
  };
}
export type AnalysisKey = keyof ReturnType<typeof ruleAnalyses>;

export function draftFromData(S: State, D: Derived): Suggestion | null {
  const p = S.projects.filter(p => !['終止', '暫停'].includes(p.status)).sort((a, b) => D.pm[b.id].time - D.pm[a.id].time)[0];
  if (!p) return null;
  const m = D.pm[p.id];
  return {
    id: uid(), status: 'pending', source: '規則式引擎（非 AI）', created: todayISO(),
    title: `為「${p.name}」建立下一階段驗證計畫`,
    finding: `「${p.name}」已投入 ${fmt(m.money)} 與 ${fmtMin(m.time)}，已實現收益 ${fmt(m.income)}。`,
    basis: 'project_allocations、activities、已確認里程碑', reason: '已有投入但尚未轉成持續收入，需要一個可量測的小型驗證。',
    plan: '用 2 週時間做最小可行驗證（預購、試閱或詢價），依結果決定擴大或轉型。',
    money: Math.round(Math.min(p.budget || 0, 200000) / 4), timeMin: 600, energy: '中（預估 -1 ~ -2）',
    benefit: '未知；以驗證結果為準，不預設收益。', risks: '驗證樣本小；可能排擠休息時間。',
    steps: ['定義一個可量測的驗證目標', '準備最小可行內容', '觀察 14 天並記錄結果'],
    measure: '14 天內達成驗證目標即進入「驗證」或「穩定收益」評估。',
  };
}
