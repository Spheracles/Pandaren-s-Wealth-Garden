/**
 * WEALTH GARDEN — NEON CITY UI (React + htm, no build-time JSX needed).
 * Financial rules live in ../engine (TypeScript, unit-tested); this file only renders
 * and collects input. Platform behaviour (back button, storage, share, haptics)
 * comes from ../platform so the same UI runs on the web and inside the Android app.
 */
import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import htm from 'htm';
import {
  pad, todayISO, addDays, monthKey, addMonths, monthEnd, daysBetween, fmtD, uid, nowTs, fmt, fmtK, parseC, fmtMin,
  TYPES, TWO_LEG, ACC_KINDS, ASSET_TYPES, ACT_KINDS, P_STATUS, ELABEL, STAGES, STAGE_COL, CAT_COL, catColor,
  allCats, rateOf, mulberry32, compute, seed, blankState, defaultOps, ruleAnalyses, draftFromData, toCSV,
  validateAlloc, buildTransaction, summTx, decideSuggestion, analyzeImport, importRowsToTx, STATE_VERSION, migrate as migrateState,
} from '../engine/index';
import { REDUCED, lowPower as LOWPOWER, isNative, platform, haptic, onBackButton, leaveApp, onAppState, getOnline, onNetwork, installKeyboardAssist, shareTextFile, hideSplash } from '../platform/native';
import { saveState, flush, saveUi } from '../platform/storage';
import { useBackHandler, runBack } from '../platform/back';
import { apiConfigured, checkHealth } from '../platform/api';
import { isPwaInstalled, isIosBrowser, canPromptPwaInstall, promptPwaInstall, listenPwaInstallChange } from '../platform/pwa';

const html = htm.bind(React.createElement);
const VERSION = __APP_VERSION__;
const BUILD_LABEL = '內部測試版';

/* ---------- context ---------- */
const Ctx=createContext(null);
const useCtx=()=>useContext(Ctx);

/* ---------- icons ---------- */
const IC={grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',triad:'M12 3l9 16H3z M12 10v4',vault:'M3 7h18v13H3z M3 7l3-4h12l3 4 M12 11v5 M9 13.5h6',leaf:'M5 21c0-9 5-15 15-16-1 10-7 15-15 16z M5 21l8-8',flag:'M4 21V4 M4 4h12l-2 4 2 4H4',chip:'M7 7h10v10H7z M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3',chart:'M3 21h18 M6 17v-6 M11 17V7 M16 17v-9 M21 17v-3',bell:'M6 16v-5a6 6 0 1112 0v5l2 2H4z M10 21h4',gear:'M12 15a3 3 0 100-6 3 3 0 000 6z M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',plus:'M12 5v14M5 12h14',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 100-6 3 3 0 000 6z',eyeoff:'M3 3l18 18 M10.6 6.1A9.8 9.8 0 0112 6c6 0 10 6 10 6a17 17 0 01-3.2 3.8 M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 004.4-1',search:'M11 18a7 7 0 100-14 7 7 0 000 14z M21 21l-5-5',x:'M6 6l12 12M18 6L6 18',menu:'M4 7h16M4 12h16M4 17h16',panel:'M3 4h18v16H3z M15 4v16',check:'M5 12l5 5L20 7',undo:'M9 14L4 9l5-5 M4 9h11a5 5 0 010 10h-3',edit:'M4 20h4L19 9l-4-4L4 16z',trash:'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',swap:'M7 4L3 8l4 4 M3 8h14 M17 20l4-4-4-4 M21 16H7',bolt:'M13 2L4 14h7l-1 8 9-12h-7z',clock:'M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l3 2',coin:'M12 21a9 9 0 100-18 9 9 0 000 18z M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1.3 1.6 3 2 3 1 3 2-1.3 1.8-3 1.8-3-.8-3-1.8 M12 6v12',up:'M12 19V5M5 12l7-7 7 7',down:'M12 5v14M5 12l7 7 7-7',star:'M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z',terminal:'M4 5h16v14H4z M7 9l3 3-3 3 M12 15h5',upload:'M12 16V4 M7 9l5-5 5 5 M4 20h16',copy:'M8 8h12v12H8z M4 16V4h12',more:'M5 12h.01M12 12h.01M19 12h.01',shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'};
function Icon({n,s=18}){return html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style=${{flex:'none'}}><path d=${IC[n]||''}/></svg>`}

/* ---------- small UI pieces ---------- */
function useAnimated(v){const [d,setD]=useState(v);const prev=useRef(v);
  useEffect(()=>{if(REDUCED||LOWPOWER){setD(v);prev.current=v;return}const from=prev.current,to=v,t0=performance.now();let raf;
    const step=t=>{const k=Math.min(1,(t-t0)/650),e=1-Math.pow(1-k,3);setD(Math.round(from+(to-from)*e));if(k<1)raf=requestAnimationFrame(step);else prev.current=to};
    raf=requestAnimationFrame(step);return()=>{cancelAnimationFrame(raf);prev.current=to}},[v]);return d}
function Money({c,cur='TWD',sign=false,anim=false,color=false}){const {mask}=useCtx();const a=useAnimated(c||0);
  if(mask)return html`<span className="masked mono">••••••</span>`;
  const v=anim?a:c;const cls=color?(c>0?'pos':c<0?'neg':''):'';return html`<span className=${'num '+cls}>${fmt(v,cur,sign)}</span>`}
function Field({label,children,full,hint}){return html`<label className=${'f'+(full?' full':'')}>${label}${children}${hint&&html`<span className="tiny muted">${hint}</span>`}</label>`}
function Chip({tone='',children}){return html`<span className=${'chip '+tone}>${children}</span>`}
function Empty({text,action}){return html`<div className="empty"><div>${text}</div>${action}</div>`}
function Panel({title,eyebrow,right,children,glow,className=''}){return html`<section className=${'panel '+(glow?'glow ':'')+className}>${(title||right)&&html`<div className="panel-h"><div>${eyebrow&&html`<div className="eyebrow">${eyebrow}</div>`}${title&&html`<h2>${title}</h2>`}</div>${right}</div>`}${children}</section>`}
function Seg({opts,v,on,label}){return html`<div className="seg" role="group" aria-label=${label}>${opts.map(([k,l])=>html`<button key=${k} type="button" aria-pressed=${v===k} onClick=${()=>on(k)}>${l}</button>`)}</div>`}
function Modal({title,children,footer,onClose,wide}){
  useBackHandler(onClose); // Android back / Esc closes the top-most dialog first
  return html`<div className="scrim" onMouseDown=${e=>{if(e.target===e.currentTarget)onClose()}}><div className=${'modal'+(wide?' wide':'')} role="dialog" aria-modal="true" aria-label=${title}>
    <div className="modal-h"><h2>${title}</h2><button className="btn ghost sm" onClick=${onClose} aria-label="關閉"><${Icon} n="x"/></button></div>
    ${children}${footer&&html`<div className="modal-f">${footer}</div>`}</div></div>`}

/* ---------- charts ---------- */
function niceTicks(mn,mx,n=4){const span=mx-mn||1;const raw=span/n;const mag=Math.pow(10,Math.floor(Math.log10(raw)));const st=[1,2,2.5,5,10].map(x=>x*mag).find(x=>x>=raw);const lo=Math.floor(mn/st)*st,hi=Math.ceil(mx/st)*st;const t=[];for(let v=lo;v<=hi+st/2;v+=st)t.push(Math.round(v));return t}
function LineChart({labels,series,h=230,area=true,yfmt=fmtK}){
  const {mask}=useCtx();const W=640,H=h,P={l:52,r:14,t:14,b:28};
  const all=series.flatMap(s=>s.values.filter(v=>v!=null));let mn=Math.min(0,...all),mx=Math.max(0,...all);if(mx===mn)mx=mn+100;
  const ticks=niceTicks(mn,mx,4);mn=ticks[0];mx=ticks[ticks.length-1];
  const n=labels.length,x=i=>P.l+(n<=1?(W-P.l-P.r)/2:i*(W-P.l-P.r)/(n-1)),y=v=>P.t+(mx-v)*(H-P.t-P.b)/(mx-mn);
  const [hi,setHi]=useState(null);const ref=useRef();
  const move=e=>{const r=ref.current.getBoundingClientRect();const px=(e.clientX-r.left)*W/r.width;const i=Math.round((px-P.l)/((W-P.l-P.r)/Math.max(1,n-1)));setHi(Math.max(0,Math.min(n-1,i)))};
  const every=Math.ceil(n/7);
  const path=vals=>vals.map((v,i)=>v==null?null:`${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(' L');
  return html`<div style=${{position:'relative'}}>
    <svg ref=${ref} className="chart" viewBox=${`0 0 ${W} ${H}`} onPointerMove=${move} onPointerLeave=${()=>setHi(null)} role="img" aria-label=${series.map(s=>s.name).join('、')+' 趨勢圖'}>
      <defs>${series.map((s,i)=>html`<linearGradient key=${i} id=${'lg'+s.key} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor=${s.color} stopOpacity="0.32"/><stop offset="1" stopColor=${s.color} stopOpacity="0"/></linearGradient>`)}</defs>
      ${ticks.map(t=>html`<g key=${t}><line x1=${P.l} x2=${W-P.r} y1=${y(t)} y2=${y(t)} stroke=${t===0?'rgba(154,172,200,.45)':'rgba(154,172,200,.1)'} strokeDasharray=${t===0?'':'3 4'}/><text x=${P.l-8} y=${y(t)+4} textAnchor="end" fontSize="10" fill="#62728C">${mask?'•••':yfmt(t)}</text></g>`)}
      ${labels.map((l,i)=>i%every===0||i===n-1?html`<text key=${i} x=${x(i)} y=${H-8} textAnchor="middle" fontSize="10" fill="#62728C">${l}</text>`:null)}
      ${series.map(s=>{const p=path(s.values);if(!p)return null;const first=s.values.findIndex(v=>v!=null),last=s.values.length-1-[...s.values].reverse().findIndex(v=>v!=null);
        return html`<g key=${s.key}>${area&&s.area!==false&&html`<path d=${`M${x(first)},${y(Math.max(mn,0))} L${p} L${x(last)},${y(Math.max(mn,0))} Z`} fill=${`url(#lg${s.key})`}/>`}
          <path d=${'M'+p} fill="none" stroke=${s.color} strokeWidth=${s.width||2} strokeDasharray=${s.dash||''} style=${{filter:`drop-shadow(0 0 4px ${s.color})`}}/>
          ${s.values[last]!=null&&html`<circle cx=${x(last)} cy=${y(s.values[last])} r="3.5" fill=${s.color}/>`}</g>`})}
      ${hi!=null&&html`<line x1=${x(hi)} x2=${x(hi)} y1=${P.t} y2=${H-P.b} stroke="rgba(230,241,255,.35)"/>`}
    </svg>
    ${hi!=null&&html`<div style=${{position:'absolute',top:6,left:`${Math.min(70,x(hi)/W*100)}%`,background:'var(--panel2)',border:'1px solid var(--line)',borderRadius:6,padding:'6px 10px',fontSize:12,pointerEvents:'none',whiteSpace:'nowrap'}}>
      <div className="muted tiny">${labels[hi]}</div>${series.map(s=>html`<div key=${s.key} className="flex" style=${{gap:6}}><i style=${{width:8,height:8,borderRadius:2,background:s.color,display:'inline-block'}}></i>${s.name} <b className="num">${mask?'•••':(s.fmt?s.fmt(s.values[hi]):fmt(s.values[hi]))}</b></div>`)}</div>`}
  </div>`}
function Spark({values,color='var(--cyan)'}){const W=90,H=26;const v=values.filter(x=>x!=null);if(v.length<2)return null;const mn=Math.min(...v),mx=Math.max(...v),sp=mx-mn||1;
  const pts=values.map((x,i)=>`${(i/(values.length-1)*W).toFixed(1)},${(H-2-(x-mn)/sp*(H-4)).toFixed(1)}`).join(' ');
  return html`<svg width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} aria-hidden="true"><polyline points=${pts} fill="none" stroke=${color} strokeWidth="1.5"/><circle cx=${W} cy=${H-2-(v[v.length-1]-mn)/sp*(H-4)} r="2.5" fill=${color}/></svg>`}
function Donut({items,picked,onPick,center}){const {mask}=useCtx();const tot=items.reduce((s,i)=>s+Math.max(0,i.value),0);const R=62,Cc=2*Math.PI*R;let acc=0;
  return html`<svg viewBox="0 0 180 180" style=${{width:'100%',maxWidth:200,display:'block',margin:'0 auto'}} role="img" aria-label="資產結構環形圖">
    <circle cx="90" cy="90" r=${R} fill="none" stroke="rgba(154,172,200,.1)" strokeWidth="20"/>
    ${tot>0&&items.map(it=>{const len=Math.max(0,it.value)/tot*Cc;const el=html`<circle key=${it.key} cx="90" cy="90" r=${R} fill="none" stroke=${it.color} strokeWidth=${picked===it.key?26:20} strokeDasharray=${`${Math.max(0,len-1.5)} ${Cc}`} strokeDashoffset=${-acc} transform="rotate(-90 90 90)" style=${{cursor:'pointer',filter:`drop-shadow(0 0 5px ${it.color})`,transition:'stroke-width .2s'}} onClick=${()=>onPick(picked===it.key?null:it.key)}><title>${it.label}</title></circle>`;acc+=len;return el})}
    <text x="90" y="84" textAnchor="middle" fontSize="10" fill="#9AACC8">${center.label}</text>
    <text x="90" y="104" textAnchor="middle" fontSize="15" fill="#E6F1FF" fontWeight="600">${mask?'•••':center.value}</text></svg>`}
function Radar({axes}){const N=axes.length,R=78,cx=110,cy=100;const pt=(i,r)=>[cx+r*Math.sin(2*Math.PI*i/N),cy-r*Math.cos(2*Math.PI*i/N)];
  const poly=axes.map((a,i)=>pt(i,R*a.value).join(',')).join(' ');
  return html`<svg viewBox="0 0 220 205" style=${{width:'100%',maxWidth:300,display:'block',margin:'0 auto'}} role="img" aria-label="三維資源雷達（正規化相對指標）">
    ${[0.25,0.5,0.75,1].map(k=>html`<polygon key=${k} points=${axes.map((_,i)=>pt(i,R*k).join(',')).join(' ')} fill="none" stroke="rgba(154,172,200,.15)"/>`)}
    ${axes.map((a,i)=>{const [x,y]=pt(i,R);const [lx,ly]=pt(i,R+16);return html`<g key=${i}><line x1=${cx} y1=${cy} x2=${x} y2=${y} stroke="rgba(154,172,200,.15)"/><text x=${lx} y=${ly+3} textAnchor=${Math.abs(lx-cx)<5?'middle':lx>cx?'start':'end'} fontSize="9.5" fill="#9AACC8">${a.label}</text></g>`})}
    <polygon points=${poly} fill="rgba(168,85,247,.22)" stroke="#A855F7" strokeWidth="1.8" style=${{filter:'drop-shadow(0 0 6px #A855F7)'}}/>
    ${axes.map((a,i)=>{const [x,y]=pt(i,R*a.value);return html`<circle key=${i} cx=${x} cy=${y} r="3" fill="#00F5D4"/>`})}</svg>`}
function Bars({items,total,colorFn,onPick}){const {mask}=useCtx();const mx=Math.max(1,...items.map(i=>Math.abs(i[1])));
  if(!items.length)return html`<div className="muted small">此期間沒有資料。</div>`;
  return html`<div className="bars">${items.map(([k,v])=>html`<div key=${k} className="bar" style=${{cursor:onPick?'pointer':'default'}} onClick=${()=>onPick&&onPick(k)}><span className="t" style=${{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>${k}</span><div className="track"><div className="fill" style=${{width:`${Math.abs(v)/mx*100}%`,background:colorFn(k),boxShadow:`0 0 8px ${colorFn(k)}`}}></div></div><span className="v">${mask?'•••':fmt(v)}${total?html`<span className="muted tiny"> ${Math.round(v/total*100)}%</span>`:''}</span></div>`)}</div>`}

/* ---------- plant ---------- */
function Plant({stage,size=90,animate=true}){const c=STAGE_COL[stage];
  const h={seed:14,sprout:34,bud:44,bloom:48,stable:52,dormant:28,amber:36,specimen:34}[stage];
  const leaves={seed:1,sprout:3,bud:4,bloom:4,stable:6,dormant:2,amber:3,specimen:2}[stage];
  const base=82,top=base-h;const L=[];for(let i=0;i<leaves;i++){const yy=base-6-(i+1)*(h-8)/(leaves+1);const dir=i%2?1:-1;L.push(html`<path key=${i} d=${`M50 ${yy} q ${dir*10} -8 ${dir*16} -2 q ${-dir*8} 6 ${-dir*16} 2z`} fill=${c} opacity=${stage==='dormant'||stage==='specimen'?0.35:0.75}/>`)}
  const sway=animate&&!REDUCED&&!LOWPOWER&&!['dormant','specimen'].includes(stage);
  return html`<svg width=${size} height=${size} viewBox="0 0 100 100" className="plant-svg" aria-hidden="true">
    ${stage==='specimen'&&html`<rect x="18" y="14" width="64" height="72" rx="4" fill="none" stroke=${c} strokeDasharray="3 3" opacity=".6"/>`}
    <g className=${sway?'sway':''} style=${{transformOrigin:'50px 82px'}}>
      <path d=${`M50 ${base} C 48 ${base-h/2}, 52 ${base-h/2}, 50 ${top}`} stroke=${c} strokeWidth="2.2" fill="none" style=${{filter:stage==='dormant'?'none':`drop-shadow(0 0 3px ${c})`}}/>
      ${L}
      ${stage==='seed'&&html`<circle cx="50" cy=${top} r="4" fill=${c} style=${{filter:`drop-shadow(0 0 6px ${c})`}}/>`}
      ${stage==='bud'&&html`<ellipse cx="50" cy=${top-4} rx="5" ry="8" fill=${c} style=${{filter:`drop-shadow(0 0 8px ${c})`}}/>`}
      ${stage==='bloom'&&html`<g style=${{filter:`drop-shadow(0 0 8px ${c})`}}>${[0,60,120,180,240,300].map(a=>html`<ellipse key=${a} cx="50" cy=${top-9} rx="4.5" ry="9" fill=${c} opacity=".85" transform=${`rotate(${a} 50 ${top})`}/>`)}<circle cx="50" cy=${top} r="4" fill="#E6F1FF"/></g>`}
      ${stage==='stable'&&html`<g><circle cx="50" cy=${top-4} r="9" fill=${c} style=${{filter:`drop-shadow(0 0 12px ${c})`}}/><circle cx="50" cy=${top-4} r="15" fill="none" stroke=${c} opacity=".4"/></g>`}
      ${stage==='amber'&&html`<path d=${`M50 ${top-12} l7 12 h-14z`} fill="none" stroke=${c} strokeWidth="1.8"/>`}
      ${stage==='dormant'&&html`<text x="60" y=${top-2} fontSize="9" fill=${c}>z z</text>`}
    </g>
    <path d="M34 82 h32 l-4 10 h-24z" fill="rgba(0,245,212,.08)" stroke=${c} strokeWidth="1" opacity=".8"/>
  </svg>`}

/* ============ FORMS ============ */
function AllocEditor({alloc,set,projects}){
  const sum=alloc.reduce((s,a)=>s+Number(a.pct||0),0);
  return html`<div className="stack full">
    <div className="flex between"><span className="small muted">專案分攤（同一筆成本分攤至多個專案，總和 ≤ 100%）</span><span className=${'small num '+(sum>100?'neg':'muted')}>${sum}% / 100%</span></div>
    ${alloc.map((a,i)=>html`<div key=${i} className="flex" style=${{flexWrap:'nowrap'}}>
      <select className="inp" aria-label="專案" value=${a.pid} onChange=${e=>set(alloc.map((x,j)=>j===i?{...x,pid:e.target.value}:x))}><option value="">選擇專案</option>${projects.map(p=>html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}</select>
      <input className="inp" style=${{maxWidth:90}} type="number" min="1" max="100" aria-label="比例 %" value=${a.pct} onChange=${e=>set(alloc.map((x,j)=>j===i?{...x,pct:e.target.value}:x))}/>
      <span className="muted">%</span><button type="button" className="btn ghost sm" aria-label="移除分攤" onClick=${()=>set(alloc.filter((_,j)=>j!==i))}><${Icon} n="x" s=${14}/></button></div>`)}
    ${projects.length?html`<button type="button" className="btn sm" style=${{alignSelf:'flex-start'}} onClick=${()=>set([...alloc,{pid:'',pct:Math.max(0,100-sum)||''}])}><${Icon} n="plus" s=${14}/>新增分攤</button>`:html`<span className="tiny muted">尚無專案可分攤。</span>`}
  </div>`}

function TxForm({init={},onDone}){
  const {S,act}=useCtx();const edit=!!init.id;const accs=S.accounts.filter(a=>!a.archived);
  const [f,setF]=useState(()=>({type:'expense',date:todayISO(),cat:'',acct:accs[0]?accs[0].id:'',from:'',to:'',desc:'',alloc:[],recurringAttr:false,reusable:false,withAct:false,minutes:'',energy:0,kind:'其他',saveTpl:false,...init,amt:init.amt!=null?String(init.amt/100):'',toAmt:init.toAmt!=null?String(init.toAmt/100):''}));
  const [errs,setErrs]=useState([]);
  const set=k=>e=>{const v=e&&e.target?(e.target.type==='checkbox'?e.target.checked:e.target.value):e;setF(o=>({...o,[k]:v}))};
  const T=f.type,two=TWO_LEG.includes(T);
  const cats=T==='income'?allCats(S,'income'):T==='realized'?['投資損益']:T==='valuation'?['資產評價']:allCats(S,'expense');
  const accOf=id=>S.accounts.find(a=>a.id===id);
  const a1=two?accOf(f.from):accOf(f.acct),a2=two?accOf(f.to):null;
  const activeProj=S.projects.filter(p=>p.status!=='終止');
  function submit(e){e.preventDefault();
    const old=edit?S.txs.find(t=>t.id===init.id):undefined;
    const {errors,tx}=buildTransaction(S,f,old); // shared, unit-tested rules (src/engine/mutations.ts)
    const err=[...errors];if(f.withAct&&!(Number(f.minutes)>0))err.push('活動時間需大於 0 分鐘。');
    if(err.length){setErrs(err);haptic.warn();return}
    act.update(s=>{if(edit){const i=s.txs.findIndex(t=>t.id===tx.id);s.txs[i]=tx}else s.txs.push(tx);
      if(f.withAct&&!edit)s.activities.push({id:uid(),created:nowTs(),demo:false,date:f.date,title:tx.desc,minutes:Number(f.minutes),kind:f.kind,energy:Number(f.energy),saved:0,txId:tx.id,alloc:tx.alloc});
      if(f.saveTpl)s.templates.push({id:uid(),name:tx.desc,type:T,amt:tx.amt,cat:tx.cat,acct:tx.acct,desc:tx.desc});
    },{action:edit?'編輯交易':'新增交易',entity:'transactions',detail:`${TYPES[T]}｜${tx.desc}｜${fmt(tx.amt,tx.cur)}`,before:old?summTx(old):undefined,after:summTx(tx)});
    haptic.success();act.toast(edit?'已更新紀錄，所有統計已重新計算。':`已新增${TYPES[T]}。`);onDone()}
  const accOpts=list=>list.map(a=>html`<option key=${a.id} value=${a.id}>${a.name}（${a.cur}）</option>`);
  return html`<form className="stack" onSubmit=${submit} noValidate>
    ${errs.length>0&&html`<div className="errs" role="alert">${errs.map((e,i)=>html`<div key=${i}>${e}</div>`)}</div>`}
    <div className="form">
      <${Field} label="交易類型" full><select id="tx-type" className="inp" value=${T} onChange=${e=>setF(o=>({...o,type:e.target.value,cat:''}))}>${Object.entries(TYPES).map(([k,v])=>html`<option key=${k} value=${k}>${v}</option>`)}</select><//>
      <${Field} label="日期"><input id="tx-date" className="inp" type="date" value=${f.date} onChange=${set('date')}/><//>
      <${Field} label=${T==='fx'?`兌出金額（${a1?a1.cur:'原幣'}）`:`金額（${a1?a1.cur:'原幣'}）`} hint=${T==='valuation'||T==='realized'?'損失或評價下降請輸入負數':''}><input id="tx-amt" className="inp num" inputMode="decimal" value=${f.amt} onChange=${set('amt')} placeholder="0"/><//>
      ${two?html`
        <${Field} label="轉出帳戶"><select id="tx-from" className="inp" value=${f.from} onChange=${set('from')}><option value="">選擇</option>${accOpts(accs)}</select><//>
        <${Field} label=${T==='ccpay'?'信用卡（轉入）':'轉入帳戶'}><select id="tx-to" className="inp" value=${f.to} onChange=${set('to')}><option value="">選擇</option>${accOpts(accs.filter(a=>T==='ccpay'?a.kind==='credit':true))}</select><//>
        ${T==='fx'&&html`<${Field} label=${`實際入帳金額（${a2?a2.cur:'目標幣別'}）`} hint=${(()=>{const x=parseC(f.amt),y=parseC(f.toAmt);return x>0&&y>0&&a1&&a2?`實際成交匯率：1 ${a2.cur} = ${(x/y).toFixed(4)} ${a1.cur}（保存原幣、匯率與日期）`:'系統以實際入帳金額計算成交匯率'})()}><input id="tx-toamt" className="inp num" inputMode="decimal" value=${f.toAmt} onChange=${set('toAmt')}/><//>`}
      `:html`
        <${Field} label="帳戶"><select id="tx-acct" className="inp" value=${f.acct} onChange=${set('acct')}>${accOpts(accs.filter(a=>T==='valuation'?a.kind==='invest':true))}</select><//>
        ${!['valuation','realized'].includes(T)&&html`<${Field} label="類別"><select id="tx-cat" className="inp" value=${f.cat} onChange=${set('cat')}><option value="">選擇類別</option>${cats.map(c=>html`<option key=${c} value=${c}>${c}</option>`)}</select><//>`}
      `}
      <${Field} label="說明" full><input id="tx-desc" className="inp" value=${f.desc} onChange=${set('desc')} placeholder="例如：午餐、房租、接案尾款"/><//>
      ${a1&&a1.cur!=='TWD'&&T!=='fx'&&html`<div className="full note c">外幣帳戶：系統會保存原幣金額、記帳當下的手動匯率（1 ${a1.cur} = ${rateOf(S,a1.cur)} TWD，${(S.settings.rates[a1.cur]||{}).date||'未設定日期'}）與換算後金額。</div>`}
      ${T==='ccpay'&&html`<div className="full note c">信用卡繳款只會減少銀行存款與信用卡應付款，不會再次認列消費。</div>`}
      ${T==='transfer'&&html`<div className="full note c">帳戶轉帳不會產生收入或支出。</div>`}
      ${T==='valuation'&&html`<div className="full note">未實現評價變動只影響資產價值與淨資產，不計入收入或現金流。</div>`}
      ${(T==='expense')&&html`<div className="full flex" style=${{gap:16}}>
        <label className="chk"><input id="tx-rec" type="checkbox" checked=${f.recurringAttr} onChange=${set('recurringAttr')}/>持續性支出</label>
        <label className="chk"><input id="tx-reuse" type="checkbox" checked=${f.reusable} onChange=${set('reusable')}/>可能轉化為可重複利用資產</label></div>`}
      ${['expense','income','refund','realized'].includes(T)&&html`<${AllocEditor} alloc=${f.alloc} set=${v=>setF(o=>({...o,alloc:v}))} projects=${activeProj}/>`}
      ${!edit&&html`<div className="full stack">
        <label className="chk"><input id="tx-withact" type="checkbox" checked=${f.withAct} onChange=${set('withAct')}/>同時記錄這項活動的時間與心力（三維紀錄）</label>
        ${f.withAct&&html`<div className="form">
          <${Field} label="花費時間（分鐘）"><input id="tx-min" className="inp num" type="number" min="1" value=${f.minutes} onChange=${set('minutes')}/><//>
          <${Field} label="活動類型"><select id="tx-kind" className="inp" value=${f.kind} onChange=${set('kind')}>${ACT_KINDS.map(k=>html`<option key=${k}>${k}</option>`)}</select><//>
          <${EnergyPicker} v=${Number(f.energy)} on=${v=>setF(o=>({...o,energy:v}))}/></div>`}
        <label className="chk"><input id="tx-tpl" type="checkbox" checked=${f.saveTpl} onChange=${set('saveTpl')}/>儲存為常用範本</label></div>`}
    </div>
    <div className="modal-f"><button type="button" className="btn ghost" onClick=${onDone}>取消</button><button type="submit" className="btn pri"><${Icon} n="check" s=${16}/>${edit?'確認修改':'確認新增'}</button></div>
  </form>`}
function EnergyPicker({v,on}){return html`<div className="full stack" style=${{gap:6}}>
  <div className="flex between"><span className="small muted">心力評分（主觀，-5 ～ +5）</span><span className=${'small num '+(v>0?'pos':v<0?'neg':'muted')}>${v>0?'+':''}${v}　${ELABEL[v]}</span></div>
  <div style=${{display:'grid',gridTemplateColumns:'repeat(11,1fr)',gap:3}} role="radiogroup" aria-label="心力評分">${Array.from({length:11},(_,i)=>i-5).map(n=>html`<button key=${n} type="button" role="radio" aria-checked=${v===n} aria-label=${`${n}：${ELABEL[n]}`} onClick=${()=>on(n)} style=${{height:34,borderRadius:5,border:'1px solid '+(v===n?'var(--fg)':'transparent'),cursor:'pointer',fontFamily:'var(--f-mono)',fontSize:12,color:v===n?'#070B14':'var(--fg)',background:n<0?`rgba(251,113,133,${0.12+Math.abs(n)*0.13})`:n>0?`rgba(52,211,153,${0.12+n*0.13})`:'rgba(154,172,200,.2)'}}>${n>0?'+':''}${n}</button>`)}</div></div>`}

function ActivityForm({init={},onDone}){
  const {S,act}=useCtx();const edit=!!init.id;
  const [f,setF]=useState(()=>({date:todayISO(),title:'',minutes:'',kind:'其他',energy:0,saved:'',alloc:[],...init}));const [errs,setErrs]=useState([]);
  const set=k=>e=>setF(o=>({...o,[k]:e.target.value}));
  function submit(e){e.preventDefault();const err=[];if(!f.title.trim())err.push('請輸入活動名稱。');if(!(Number(f.minutes)>0))err.push('時間需大於 0 分鐘。');err.push(...validateAlloc(f.alloc));if(err.length)return setErrs(err);
    const old=edit?S.activities.find(a=>a.id===init.id):null;
    const a={...(old||{id:uid(),created:nowTs(),demo:false}),date:f.date,title:f.title.trim(),minutes:Number(f.minutes),kind:f.kind,energy:Number(f.energy),saved:Number(f.saved)||0,alloc:f.alloc.map(x=>({pid:x.pid,pct:Number(x.pct)}))};
    act.update(s=>{if(edit){s.activities[s.activities.findIndex(x=>x.id===a.id)]=a}else s.activities.push(a)},{action:edit?'編輯活動':'新增活動',entity:'activities',detail:`${a.title}｜${fmtMin(a.minutes)}｜心力 ${a.energy}`});
    act.toast(edit?'活動已更新。':'已記錄活動的時間與心力。');onDone()}
  const cost=S.settings.hourly*(Number(f.minutes)||0)/60;
  return html`<form className="stack" onSubmit=${submit} noValidate>
    ${errs.length>0&&html`<div className="errs" role="alert">${errs.map((e,i)=>html`<div key=${i}>${e}</div>`)}</div>`}
    <div className="form">
      <${Field} label="活動名稱" full><input id="act-title" className="inp" value=${f.title} onChange=${set('title')} placeholder="例如：學習新技能、散步、加班"/><//>
      <${Field} label="日期"><input id="act-date" className="inp" type="date" value=${f.date} onChange=${set('date')}/><//>
      <${Field} label="活動類型"><select id="act-kind" className="inp" value=${f.kind} onChange=${set('kind')}>${ACT_KINDS.map(k=>html`<option key=${k}>${k}</option>`)}</select><//>
      <${Field} label="花費時間（分鐘）" hint=${S.settings.hourly?`參考機會成本 ${fmt(Math.round(cost))}（不計入現金或帳戶餘額）`:'未設定參考時薪'}><input id="act-min" className="inp num" type="number" min="1" value=${f.minutes} onChange=${set('minutes')}/><//>
      <${Field} label="實際節省時間（分鐘，選填）"><input id="act-saved" className="inp num" type="number" min="0" value=${f.saved} onChange=${set('saved')}/><//>
      <${EnergyPicker} v=${Number(f.energy)} on=${v=>setF(o=>({...o,energy:v}))}/>
      <${AllocEditor} alloc=${f.alloc} set=${v=>setF(o=>({...o,alloc:v}))} projects=${S.projects.filter(p=>p.status!=='終止')}/>
      <div className="full tiny muted">心力分數只記錄一次：關聯多個專案時，時間依比例分攤，但心力不會在整體統計中重複計入。</div>
    </div>
    <div className="modal-f"><button type="button" className="btn ghost" onClick=${onDone}>取消</button><button type="submit" className="btn pri">${edit?'確認修改':'確認新增'}</button></div></form>`}

function ProjectForm({init={},onDone}){
  const {S,act}=useCtx();const edit=!!init.id;
  const [f,setF]=useState(()=>({name:'',desc:'',goal:'',due:'',status:'構想',expected:'',riskFlag:false,risks:'',...init,budget:init.budget!=null?String(init.budget/100):'',expectedAmt:init.expectedAmt!=null?String(init.expectedAmt/100):''}));const [err,setErr]=useState('');
  const set=k=>e=>setF(o=>({...o,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));
  function submit(e){e.preventDefault();if(!f.name.trim())return setErr('請輸入專案名稱。');const budget=f.budget?parseC(f.budget):0;if(isNaN(budget)||budget<0)return setErr('預算格式不正確。');
    const old=edit?S.projects.find(p=>p.id===init.id):null;
    const p={...(old||{id:uid(),created:todayISO(),tasks:[],milestones:[],history:[{date:todayISO(),text:'建立計畫'}]}),name:f.name.trim(),desc:f.desc,goal:f.goal,due:f.due,status:f.status,budget,expected:f.expected,expectedAmt:parseC(f.expectedAmt)||0,riskFlag:f.riskFlag,risks:f.risks};
    if(old&&old.status!==p.status)p.history=[...p.history,{date:todayISO(),text:`狀態變更：${old.status} → ${p.status}`}];
    else if(old)p.history=[...p.history,{date:todayISO(),text:'計畫內容調整'}];
    act.update(s=>{if(edit)s.projects[s.projects.findIndex(x=>x.id===p.id)]=p;else s.projects.push(p)},{action:edit?'編輯專案':'建立專案',entity:'projects',detail:p.name});
    act.toast(edit?'專案已更新。':'已建立培育計畫。');onDone(p.id)}
  return html`<form className="stack" onSubmit=${submit} noValidate>${err&&html`<div className="errs" role="alert">${err}</div>`}
    <div className="form">
      <${Field} label="專案名稱" full><input id="pj-name" className="inp" value=${f.name} onChange=${set('name')}/><//>
      <${Field} label="專案說明" full><textarea id="pj-desc" className="inp" value=${f.desc} onChange=${set('desc')}></textarea><//>
      <${Field} label="目標" full><input id="pj-goal" className="inp" value=${f.goal} onChange=${set('goal')}/><//>
      <${Field} label="狀態"><select id="pj-status" className="inp" value=${f.status} onChange=${set('status')}>${P_STATUS.map(s=>html`<option key=${s}>${s}</option>`)}</select><//>
      <${Field} label="預計完成日"><input id="pj-due" className="inp" type="date" value=${f.due} onChange=${set('due')}/><//>
      <${Field} label="預算（TWD）"><input id="pj-budget" className="inp num" inputMode="decimal" value=${f.budget} onChange=${set('budget')}/><//>
      <${Field} label="預期月收益（TWD，預測值）"><input id="pj-exp-amt" className="inp num" inputMode="decimal" value=${f.expectedAmt} onChange=${set('expectedAmt')}/><//>
      <${Field} label="預期成果與假設" full hint="預測不會被計入實際收入，也不會讓植物成長。"><textarea id="pj-exp" className="inp" value=${f.expected} onChange=${set('expected')}></textarea><//>
      <${Field} label="主要風險" full><textarea id="pj-risks" className="inp" value=${f.risks} onChange=${set('risks')}></textarea><//>
      <label className="chk full"><input id="pj-risk" type="checkbox" checked=${f.riskFlag} onChange=${set('riskFlag')}/>標記為需要檢視的風險狀態</label>
    </div><div className="modal-f"><button type="button" className="btn ghost" onClick=${()=>onDone()}>取消</button><button type="submit" className="btn pri">${edit?'確認修改':'建立計畫'}</button></div></form>`}

/* ============ PAGES ============ */
function PageHead({en,title,children}){return html`<div className="page-head"><div><div className="eyebrow">${en}</div><h1>${title}</h1></div><div className="flex">${children}</div></div>`}

function Dashboard(){
  const {S,D,act}=useCtx();const [range,setRange]=useState('30');const [pick,setPick]=useState(null);
  const empty=!S.accounts.length&&!S.txs.length;
  const sparks=D.months.slice(-6);
  const groups=[['cash','現金','#00F5D4'],['bank','銀行存款','#A855F7'],['invest','投資資產','#FF3CAC'],['realestate','不動產','#F59E0B'],['other','其他資产'.replace('产','產'),'#60A5FA']].map(([k,l,c])=>({key:k,label:l,color:c,value:D.now.groups[k]}));
  const cf=useMemo(()=>cashSeries(D,range),[D,range]);
  if(empty)return html`<div className="page"><${PageHead} en="WEALTH GARDEN // FINANCIAL COMMAND CENTER" title="財富總覽控制台"/><${Empty} text="尚無財務資料。系統不會填入看似真實的數字；請先建立帳戶或新增第一筆紀錄。" action=${html`<div className="flex"><button className="btn pri" onClick=${()=>act.wizard()}>開始設定精靈</button><button className="btn" onClick=${()=>act.nav('assets')}>新增帳戶</button></div>`}/></div>`;
  return html`<div className="page">
    <${PageHead} en="WEALTH GARDEN // FINANCIAL COMMAND CENTER" title="財富總覽控制台"><button className="btn hide-m" onClick=${()=>act.addActivity()}><${Icon} n="clock" s=${16}/>記錄時間與心力</button><button className="btn pri hide-m" onClick=${()=>act.addTx({type:'expense'})}><${Icon} n="plus" s=${16}/>快速記帳</button><//>
    <section aria-label="財富脈動 Wealth Pulse">
      <div className="pulse">
        <div className="kpi big"><div className="lab">淨資產<${Spark} values=${sparks.map(m=>m.netWorth)}/></div><div className="val"><${Money} c=${D.now.net} anim/></div><div className="sub">總資產 − 總負債（外幣依手動匯率）</div></div>
        <div className="kpi"><div className="lab">總資產</div><div className="val"><${Money} c=${D.now.assets} anim/></div><div className="sub">含未實現評價</div></div>
        <div className="kpi"><div className="lab">總負債</div><div className="val neg"><${Money} c=${D.now.liab} anim/></div><div className="sub">信用卡未繳 ${S.privacy?'•••':fmt(D.now.ccOwed)}＋貸款</div></div>
        <div className="kpi"><div className="lab">本月現金流<${Spark} values=${sparks.map(m=>m.net)} color="var(--violet)"/></div><div className="val"><${Money} c=${D.month.net} sign color anim/></div><div className="sub">收入＋已實現損益 − 支出</div></div>
        <div className="kpi"><div className="lab">本月實際收入<${Spark} values=${sparks.map(m=>m.inc)} color="var(--ok)"/></div><div className="val pos"><${Money} c=${D.month.inc} anim/></div><div className="sub">不含轉帳與評價變動</div></div>
        <div className="kpi"><div className="lab">本月支出<${Spark} values=${sparks.map(m=>m.exp)} color="var(--bad)"/></div><div className="val"><${Money} c=${D.month.exp} anim/></div><div className="sub">已扣退款；信用卡於刷卡時認列</div></div>
        <div className="kpi"><div className="lab">持續性收入</div><div className="val"><${Money} c=${D.recInc}/></div><div className="sub">依定期收入設定／月</div></div>
        <div className="kpi"><div className="lab">每月固定支出</div><div className="val"><${Money} c=${D.recExp}/></div><div className="sub">依定期支出設定／月</div></div>
      </div>
    </section>
    <div className="grid g-dash">
      <${Panel} eyebrow="CASH FLOW" title="現金流趨勢" right=${html`<${Seg} label="檢視區間" v=${range} on=${setRange} opts=${[['7','7 日'],['30','30 日'],['90','90 日'],['365','年度']]}/>`}>
        <${LineChart} labels=${cf.labels} series=${[{key:'inc',name:'收入',color:'#34D399',values:cf.inc},{key:'exp',name:'支出',color:'#FB7185',values:cf.exp,area:false},{key:'net',name:'淨現金流',color:'#00F5D4',values:cf.net,area:false,dash:'4 3'}]}/>
        <div className="flex small muted" style=${{marginTop:6,gap:14}}><span><i className="dot" style=${{color:'#34D399'}}></i> 收入</span><span><i className="dot" style=${{color:'#FB7185'}}></i> 支出</span><span><i className="dot" style=${{color:'#00F5D4'}}></i> 淨現金流</span><span>${cf.unit}</span></div>
      <//>
      <${Panel} eyebrow="ASSET STRUCTURE" title="資產結構">
        <${Donut} items=${groups} picked=${pick} onPick=${setPick} center=${{label:pick?groups.find(g=>g.key===pick).label:'總資產',value:fmtK(pick?groups.find(g=>g.key===pick).value:D.now.assets)}}/>
        <div className="rows" style=${{marginTop:8}}>${groups.map(g=>html`<div key=${g.key} className="row click" onClick=${()=>setPick(pick===g.key?null:g.key)} style=${{padding:'5px 4px',background:pick===g.key?'rgba(0,245,212,.06)':''}}><i style=${{width:10,height:10,borderRadius:3,background:g.color,boxShadow:`0 0 6px ${g.color}`}}></i><span className="grow">${g.label}</span><${Money} c=${g.value}/><span className="muted tiny num" style=${{width:36,textAlign:'right'}}>${D.now.assets?Math.round(g.value/D.now.assets*100):0}%</span></div>`)}</div>
        ${pick&&html`<${AssetDrill} k=${pick}/>`}
      <//>
    </div>
    <div className="grid g3">
      <${Panel} eyebrow="RESOURCE RADAR" title="三維資源雷達" right=${html`<button className="btn ghost sm" onClick=${()=>act.nav('resources')}>詳細</button>`}>
        <${Radar} axes=${D.radar}/>
        <details className="fold small" style=${{marginTop:6}}><summary className="muted">指標定義（正規化相對值，非可直接比較的實際數量）</summary>
          <div className="rows">${D.radar.map(r=>html`<div key=${r.label} className="row" style=${{padding:'4px 0'}}><span className="grow">${r.label}<div className="tiny muted">${r.def}</div></span><b className="num">${r.raw}</b></div>`)}</div></details>
      <//>
      <${Panel} eyebrow="WEALTH GARDEN" title="財富花園概覽" right=${html`<button className="btn ghost sm" onClick=${()=>act.nav('garden')}>進入花園</button>`}>
        <div className="plants" style=${{gridTemplateColumns:'repeat(auto-fill,minmax(96px,1fr))'}}>${D.plants.slice(0,6).map(p=>html`<button key=${p.id} className="plant" title=${STAGES[p.stage]} onClick=${()=>act.nav('garden',p.id)}><${Plant} stage=${p.stage} size=${62}/><span className="nm">${p.name}</span><span className="tiny" style=${{color:STAGE_COL[p.stage]}}>${STAGES[p.stage]}</span></button>`)}</div>
        ${!D.plants.length&&html`<div className="muted small">尚無收入來源或培育計畫。</div>`}
      <//>
      <${Panel} eyebrow="INSIGHTS" title="AI 財富洞察" right=${html`<${Chip} tone="w">AI 未連線 · 規則式</${Chip}>`}>
        <${InsightList}/>
      <//>
    </div>
    <div className="grid g2">
      <${Panel} eyebrow="RECENT" title="最近交易" right=${html`<button className="btn ghost sm" onClick=${()=>act.nav('ledger')}>全部紀錄</button>`}>
        <div className="rows">${D.txs.slice(0,6).map(t=>html`<${TxRow} key=${t.id} t=${t}/>`)}</div>
      <//>
      <${Panel} eyebrow="ACHIEVEMENTS" title="成長成就" right=${html`<span className="tiny muted">非金融成就，不代表收益</span>`}>
        <div className="rows">${D.ach.map(a=>html`<div key=${a.id} className="row"><span style=${{color:a.done?'var(--pink)':'var(--dim)'}}><${Icon} n="star"/></span><span className="grow"><div>${a.name}</div><div className="tiny muted">${a.desc}</div></span>${a.done?html`<${Chip} tone="p">已達成</${Chip}>`:html`<${Chip}>未達成</${Chip}>`}</div>`)}</div>
      <//>
    </div>
  </div>`}
function AssetDrill({k}){const {S,D}=useCtx();
  const accs=S.accounts.filter(a=>!a.archived&&a.kind!=='credit'&&({cash:['cash','epay'],bank:['bank'],invest:['invest'],other:['custom']}[k]||[]).includes(a.kind));
  const ass=S.assets.filter(a=>(a.type==='realestate'?'realestate':a.type==='invest'?'invest':'other')===k);
  return html`<div className="stack" style=${{marginTop:8,borderTop:'1px solid var(--line)',paddingTop:8}}><div className="tiny muted">明細</div>
    ${accs.map(a=>html`<div key=${a.id} className="flex between small"><span>${a.name}</span><span><${Money} c=${D.bal[a.id]} cur=${a.cur}/>${a.cur!=='TWD'&&html` <span className="muted">≈ <${Money} c=${D.tw(a.id)}/></span>`}</span></div>`)}
    ${ass.map(a=>html`<div key=${a.id} className="flex between small"><span>${a.name}</span><${Money} c=${a.value}/></div>`)}
    ${!accs.length&&!ass.length&&html`<div className="small muted">此類別沒有項目。</div>`}</div>`}
function cashSeries(D,range){const T=D.T;
  if(range==='365'){const m=D.months;return {labels:m.map(x=>x.k.slice(2).replace('-','/')),inc:m.map(x=>x.inc+x.real),exp:m.map(x=>x.exp),net:m.map(x=>x.net),unit:'單位：月'}}
  const days=Number(range),bucket=range==='90'?7:1;const labels=[],inc=[],exp=[],net=[];
  for(let s=days-1;s>=0;s-=bucket){const to=addDays(T,-s+bucket-1>0?-(s-bucket+1):-s),from=addDays(T,-s);const end=addDays(from,bucket-1)>T?T:addDays(from,bucket-1);const f=D.flow(from,end);labels.push(from.slice(5).replace('-','/'));inc.push(f.inc+f.real);exp.push(f.exp);net.push(f.net)}
  return {labels,inc,exp,net,unit:bucket===7?'單位：週':'單位：日'}}
function InsightList(){const {D,act}=useCtx();
  if(!D.insights.length)return html`<div className="muted small">資料不足，暫無洞察。</div>`;
  return html`<div className="stack">${D.insights.map(i=>html`<button key=${i.id} className="ins" style=${{textAlign:'left',cursor:'pointer',color:'var(--fg)'}} onClick=${()=>act.nav(i.page)}>
    <div className="flex between"><b>${i.title}</b><${Chip} tone=${i.tone}>建議</${Chip}></div><div className="small">${i.body}</div><div className="tiny muted">${i.basis}</div></button>`)}
    <div className="tiny muted">以上由規則式統計產生；連線 AI 後才會顯示 AI 分析。</div></div>`}
function TxRow({t,onClick}){const {S,act}=useCtx();const a=S.accounts.find(x=>x.id===(t.acct||t.from));const b=t.to&&S.accounts.find(x=>x.id===t.to);
  const sign=['income','refund','realized'].includes(t.type)?1:t.type==='expense'?-1:t.type==='valuation'?(t.amt>=0?1:-1):0;
  const col=sign>0?'var(--ok)':sign<0?'var(--bad)':'var(--cyan)';
  const ic={income:'up',expense:'down',refund:'undo',transfer:'swap',ccpay:'swap',fx:'swap',invest:'swap',realized:'coin',valuation:'chart'}[t.type];
  return html`<div className="row click" onClick=${onClick||(()=>act.openTx(t))} role="button" tabIndex="0" onKeyDown=${e=>{if(e.key==='Enter')(onClick||(()=>act.openTx(t)))()}}>
    <span className="tx-ico" style=${{color:col,borderColor:col+'55'}}><${Icon} n=${ic} s=${15}/></span>
    <div className="grow"><div className="t">${t.desc}</div><div className="tiny muted t">${fmtD(t.date)} · ${TYPES[t.type]}${t.cat?' · '+t.cat:''} · ${a?a.name:'?'}${b?' → '+b.name:''}${t.snapshotCovered?' · 快照前紀錄':''}</div></div>
    <div style=${{textAlign:'right'}}>${sign===0?html`<span className="num neu">${S.privacy?'•••':fmt(t.amt,t.cur)}</span>`:html`<${Money} c=${sign*Math.abs(t.amt)} cur=${t.cur} sign color/>`}
      ${t.type==='fx'&&html`<div className="tiny muted num">${S.privacy?'':'→ '+fmt(t.toAmt,t.toCur)}</div>`}${t.cur!=='TWD'&&t.type!=='fx'&&html`<div className="tiny muted num">${S.privacy?'':'≈ '+fmt(t.base)}</div>`}</div></div>`}

function Ledger(){
  const {S,D,act}=useCtx();
  const [q,setQ]=useState('');const [type,setType]=useState('');const [cat,setCat]=useState('');const [acct,setAcct]=useState('');
  const [from,setFrom]=useState(addDays(D.T,-89));const [to,setTo]=useState(D.T);const [tab,setTab]=useState('list');
  const list=D.txs.filter(t=>(!type||t.type===type)&&(!cat||t.cat===cat)&&(!acct||t.acct===acct||t.from===acct||t.to===acct)&&t.date>=from&&t.date<=to&&(!q||(t.desc+(t.cat||'')).toLowerCase().includes(q.toLowerCase())));
  const f=D.flow(from,to);const ecats=allCats(S,'expense'),icats=allCats(S,'income');
  const [limit,setLimit]=useState(60);
  return html`<div className="page">
    <${PageHead} en="LEDGER" title="收入與支出"><button className="btn" onClick=${()=>act.addTx({type:'income'})}><${Icon} n="up" s=${16}/>新增收入</button><button className="btn pri" onClick=${()=>act.addTx({type:'expense'})}><${Icon} n="plus" s=${16}/>新增支出</button><//>
    <div className="flex"><span className="small muted">常用範本：</span>${S.templates.map(tp=>html`<button key=${tp.id} className="btn sm" onClick=${()=>act.addTx({type:tp.type,amt:tp.amt,cat:tp.cat,acct:tp.acct,desc:tp.desc})}>${tp.name} <span className="muted num">${S.privacy?'':fmt(tp.amt)}</span></button>`)}${!S.templates.length&&html`<span className="small muted">新增紀錄時勾選「儲存為常用範本」</span>`}</div>
    <${Seg} label="分頁" v=${tab} on=${setTab} opts=${[['list','交易紀錄'],['charts','收支圖表'],['recurring','重複紀錄'],['reconcile','對帳'],['bin','回收區']]}/>
    ${tab==='list'&&html`<${Panel}>
      <div className="form" style=${{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',marginBottom:12}}>
        <${Field} label="搜尋"><input id="lg-q" className="inp" value=${q} onChange=${e=>setQ(e.target.value)} placeholder="說明或類別"/><//>
        <${Field} label="類型"><select id="lg-type" className="inp" value=${type} onChange=${e=>setType(e.target.value)}><option value="">全部</option>${Object.entries(TYPES).map(([k,v])=>html`<option key=${k} value=${k}>${v}</option>`)}</select><//>
        <${Field} label="類別"><select id="lg-cat" className="inp" value=${cat} onChange=${e=>setCat(e.target.value)}><option value="">全部</option><optgroup label="收入">${icats.map(c=>html`<option key=${c}>${c}</option>`)}</optgroup><optgroup label="支出">${ecats.map(c=>html`<option key=${'e'+c}>${c}</option>`)}</optgroup></select><//>
        <${Field} label="帳戶"><select id="lg-acct" className="inp" value=${acct} onChange=${e=>setAcct(e.target.value)}><option value="">全部</option>${S.accounts.map(a=>html`<option key=${a.id} value=${a.id}>${a.name}</option>`)}</select><//>
        <${Field} label="起"><input id="lg-from" className="inp" type="date" value=${from} onChange=${e=>setFrom(e.target.value)}/><//>
        <${Field} label="迄"><input id="lg-to" className="inp" type="date" value=${to} onChange=${e=>setTo(e.target.value)}/><//>
      </div>
      <div className="flex small" style=${{marginBottom:8,gap:16}}><span className="muted">${list.length} 筆</span><span>收入 <${Money} c=${f.inc}/></span><span>支出 <${Money} c=${f.exp}/></span><span>淨額 <${Money} c=${f.net} sign color/></span><span className="tiny muted">（轉帳、繳卡費、換匯、本金移動不計入收支）</span></div>
      <div className="rows">${list.slice(0,limit).map(t=>html`<${TxRow} key=${t.id} t=${t}/>`)}</div>
      ${list.length>limit&&html`<button className="btn" style=${{marginTop:10}} onClick=${()=>setLimit(limit+100)}>顯示更多（尚有 ${list.length-limit} 筆）</button>`}
      ${!list.length&&html`<${Empty} text="沒有符合條件的紀錄。"/>`}
    <//>`}
    ${tab==='charts'&&html`<div className="grid g2">
      <${Panel} title="支出分類統計" eyebrow=${`${fmtD(from)} – ${fmtD(to)}`}><${Bars} items=${Object.entries(f.ec).filter(x=>x[1]!==0).sort((a,b)=>b[1]-a[1])} total=${f.exp} colorFn=${c=>catColor(c,ecats)} onPick=${c=>{setCat(c);setType('');setTab('list')}}/><//>
      <${Panel} title="收入分類統計" eyebrow=${`${fmtD(from)} – ${fmtD(to)}`}><${Bars} items=${Object.entries(f.ic).sort((a,b)=>b[1]-a[1])} total=${f.inc} colorFn=${c=>catColor(c,icats)} onPick=${c=>{setCat(c);setType('');setTab('list')}}/><//>
      <${Panel} title="月收支" eyebrow="12 MONTHS" className="full" ><${LineChart} labels=${D.months.map(m=>m.k.slice(2).replace('-','/'))} series=${[{key:'mi',name:'收入',color:'#34D399',values:D.months.map(m=>m.inc+m.real)},{key:'me',name:'支出',color:'#FB7185',values:D.months.map(m=>m.exp)}]}/><//>
    </div>`}
    ${tab==='recurring'&&html`<${Recurring}/>`}
    ${tab==='reconcile'&&html`<${Reconcile}/>`}
    ${tab==='bin'&&html`<${RecycleBin}/>`}
  </div>`}
function Recurring(){const {S,act}=useCtx();const [form,setForm]=useState(null);
  const gen=r=>act.addTx({type:r.kind,amt:r.amt,cat:r.cat,acct:r.acct,desc:r.desc,recurringAttr:r.kind==='expense',date:`${monthKey(todayISO())}-${pad(Math.min(r.day,28))}`});
  return html`<${Panel} title="重複紀錄" right=${html`<button className="btn sm" onClick=${()=>setForm({kind:'expense',desc:'',amt:'',cat:'',acct:S.accounts[0]&&S.accounts[0].id,day:1})}><${Icon} n="plus" s=${14}/>新增定期項目</button>`}>
    <div className="note c" style=${{marginBottom:10}}>定期項目不會自動入帳。按「產生本期紀錄」會開啟預填表單，經你確認後才寫入。</div>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>項目</th><th>類型</th><th>類別</th><th>每月</th><th className="r">金額</th><th>狀態</th><th></th></tr></thead><tbody>
    ${S.recurring.map(r=>html`<tr key=${r.id}><td>${r.desc}</td><td>${TYPES[r.kind]}</td><td>${r.cat}</td><td className="num">${r.day} 日</td><td className="r"><${Money} c=${r.amt}/></td><td><button className="btn ghost sm" onClick=${()=>act.update(s=>{const x=s.recurring.find(y=>y.id===r.id);x.active=!x.active},{action:r.active?'停用定期項目':'啟用定期項目',entity:'recurring_entries',detail:r.desc})}>${r.active?html`<${Chip} tone="ok">啟用</${Chip}>`:html`<${Chip}>停用</${Chip}>`}</button></td><td><button className="btn sm" onClick=${()=>gen(r)}>產生本期紀錄</button></td></tr>`)}
    </tbody></table></div>
    ${form&&html`<${Modal} title="新增定期項目" onClose=${()=>setForm(null)}><form className="form" onSubmit=${e=>{e.preventDefault();const amt=parseC(form.amt);if(!(amt>0)||!form.desc||!form.cat)return act.toast('請填寫名稱、類別與大於 0 的金額。');act.update(s=>{s.recurring.push({...form,id:uid(),amt,day:Number(form.day),active:true})},{action:'新增定期項目',entity:'recurring_entries',detail:form.desc});setForm(null)}}>
      <${Field} label="類型"><select id="rc-kind" className="inp" value=${form.kind} onChange=${e=>setForm({...form,kind:e.target.value,cat:''})}><option value="expense">支出</option><option value="income">收入</option></select><//>
      <${Field} label="名稱"><input id="rc-desc" className="inp" value=${form.desc} onChange=${e=>setForm({...form,desc:e.target.value})}/><//>
      <${Field} label="類別"><select id="rc-cat" className="inp" value=${form.cat} onChange=${e=>setForm({...form,cat:e.target.value})}><option value="">選擇</option>${allCats(S,form.kind).map(c=>html`<option key=${c}>${c}</option>`)}</select><//>
      <${Field} label="帳戶"><select id="rc-acct" className="inp" value=${form.acct} onChange=${e=>setForm({...form,acct:e.target.value})}>${S.accounts.map(a=>html`<option key=${a.id} value=${a.id}>${a.name}</option>`)}</select><//>
      <${Field} label="金額"><input id="rc-amt" className="inp num" value=${form.amt} onChange=${e=>setForm({...form,amt:e.target.value})}/><//>
      <${Field} label="每月日期"><input id="rc-day" className="inp num" type="number" min="1" max="31" value=${form.day} onChange=${e=>setForm({...form,day:e.target.value})}/><//>
      <div className="modal-f full"><button type="submit" className="btn pri">儲存</button></div></form><//>`}
  <//>`}
function Reconcile(){const {S,D,act}=useCtx();const [vals,setVals]=useState({});
  return html`<${Panel} title="交易對帳" eyebrow="RECONCILIATION">
    <div className="note c" style=${{marginBottom:10}}>輸入銀行或信用卡對帳單上的實際餘額，系統會比對帳本餘額。差額不會自動調整，請找出遺漏或重複的紀錄後再標記已對帳。</div>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>帳戶</th><th className="r">帳本餘額</th><th>對帳單餘額</th><th className="r">差額</th><th>上次對帳</th><th></th></tr></thead><tbody>
    ${S.accounts.filter(a=>!a.archived).map(a=>{const st=parseC(vals[a.id]);const diff=isNaN(st)?null:st-D.bal[a.id];
      return html`<tr key=${a.id}><td>${a.name}<div className="tiny muted">${ACC_KINDS[a.kind]} · ${a.cur}</div></td><td className="r"><${Money} c=${D.bal[a.id]} cur=${a.cur}/></td>
      <td><input id=${'rc-'+a.id} className="inp num" style=${{maxWidth:150}} inputMode="decimal" placeholder=${a.kind==='credit'?'欠款填負數':''} value=${vals[a.id]||''} onChange=${e=>setVals({...vals,[a.id]:e.target.value})}/></td>
      <td className="r">${diff==null?'—':diff===0?html`<${Chip} tone="ok">一致</${Chip}>`:html`<${Money} c=${diff} cur=${a.cur} sign color/>`}</td>
      <td className="small muted">${a.reconciled?`${fmtD(a.reconciled.date)}${a.reconciled.diff?' · 差額 '+fmt(a.reconciled.diff,a.cur):' · 一致'}`:'—'}</td>
      <td><button className="btn sm" disabled=${diff==null} onClick=${()=>act.update(s=>{s.accounts.find(x=>x.id===a.id).reconciled={date:todayISO(),stmt:st,diff}},{action:'標記對帳',entity:'accounts',detail:`${a.name}｜對帳單 ${fmt(st,a.cur)}｜差額 ${fmt(diff,a.cur)}`})}>標記已對帳</button></td></tr>`})}
    </tbody></table></div><//>`}
function RecycleBin(){const {S,act}=useCtx();const del=S.txs.filter(t=>t.deleted);
  return html`<${Panel} title="回收區" eyebrow="SOFT DELETE">${del.length?html`<div className="rows">${del.map(t=>html`<${TxRow} key=${t.id} t=${t} onClick=${()=>act.update(s=>{s.txs.find(x=>x.id===t.id).deleted=false},{action:'還原交易',entity:'transactions',detail:t.desc})}/>`)}</div><div className="tiny muted" style=${{marginTop:8}}>點擊紀錄即可還原。刪除採軟刪除，原始資料保留並記錄在異動紀錄中。</div>`:html`<${Empty} text="回收區是空的。"/>`}<//>`}

function TxDetail({t,onClose}){
  const {S,D,act}=useCtx();const a=S.accounts.find(x=>x.id===(t.acct||t.from));const b=t.to&&S.accounts.find(x=>x.id===t.to);
  const acts=S.activities.filter(x=>x.txId===t.id);
  const isExp=t.type==='expense';
  return html`<${Modal} title=${isExp?'支出透視 EXPENSE X-RAY':'交易明細'} onClose=${onClose} footer=${html`
    <button className="btn danger" onClick=${()=>act.confirm('刪除這筆紀錄？',`「${t.desc}」會移到回收區，統計會立即重新計算；可在「收入與支出 → 回收區」還原。`,()=>{act.update(s=>{s.txs.find(x=>x.id===t.id).deleted=true},{action:'刪除交易（軟刪除）',entity:'transactions',detail:`${t.desc}｜${fmt(t.amt,t.cur)}`});onClose();act.toast('已移到回收區。',{label:'復原',fn:()=>act.update(s=>{s.txs.find(x=>x.id===t.id).deleted=false},{action:'復原刪除',entity:'transactions',detail:t.desc})})})}><${Icon} n="trash" s=${15}/>刪除</button>
    ${isExp&&html`<button className="btn" onClick=${()=>{onClose();act.newProject({name:`${t.desc} 轉化計畫`,desc:`由支出「${t.desc}」（${fmtD(t.date)}，${fmt(t.base)}）發現的培育機會。`,status:'構想'})}}>以此建立培育計畫</button>`}
    <button className="btn pri" onClick=${()=>{onClose();act.addTx({...t})}}><${Icon} n="edit" s=${15}/>編輯</button>`}>
    <dl className="kv">
      <dt>類型</dt><dd>${TYPES[t.type]}</dd>
      <dt>金額</dt><dd><${Money} c=${t.amt} cur=${t.cur}/>${t.cur!=='TWD'&&t.type!=='fx'&&html` · 匯率 ${t.rate} · 換算 <${Money} c=${t.base}/>`}</dd>
      ${t.type==='fx'&&html`<dt>兌換</dt><dd><${Money} c=${t.amt} cur=${t.cur}/> → <${Money} c=${t.toAmt} cur=${t.toCur}/>　成交匯率 1 ${t.toCur} = ${(t.amt/t.toAmt).toFixed(4)} ${t.cur}（${fmtD(t.date)}）</dd>`}
      ${t.cat&&html`<dt>類別</dt><dd>${t.cat}</dd>`}
      <dt>帳戶</dt><dd>${a?a.name:'—'}${b?' → '+b.name:''}</dd>
      <dt>發生時間</dt><dd>${fmtD(t.date)}　<span className="tiny muted">建立 ${t.created.slice(0,16).replace('T',' ')}</span></dd>
      ${isExp&&html`<dt>持續性支出</dt><dd>${t.recurringAttr?html`<${Chip} tone="w">是</${Chip}>`:'否'}</dd>
      <dt>可轉化資產</dt><dd>${t.reusable?html`<${Chip} tone="v">可能轉化為可重複利用資產</${Chip}>`:'未標記'}</dd>`}
      <dt>關聯專案</dt><dd>${(t.alloc||[]).length?t.alloc.map(x=>{const p=S.projects.find(p=>p.id===x.pid);return html`<div key=${x.pid}>${p?p.name:'已刪除專案'} · ${x.pct}% · <${Money} c=${Math.round(t.base*x.pct/100)}/></div>`}):'無'}</dd>
      <dt>相關活動</dt><dd>${acts.length?acts.map(x=>html`<div key=${x.id}>${x.title} · ${fmtMin(x.minutes)} · 心力 ${x.energy>0?'+':''}${x.energy}</div>`):'無'}</dd>
      ${t.snapshotCovered&&html`<dt>匯入規則</dt><dd className="warn">早於初始快照日，僅計入歷史統計，不影響帳戶餘額（避免重複計算）。</dd>`}
      ${t.demo&&html`<dt>資料來源</dt><dd><${Chip} tone="w">示範資料</${Chip}></dd>`}
    </dl><//>`}

function Resources(){
  const {S,D,act}=useCtx();const [win,setWin]=useState('30');const [sel,setSel]=useState(null);
  const st=win==='1'?D.a1:win==='7'?D.a7:D.a30;
  const from=addDays(D.T,-(Number(win)-1));const f=D.flow(from,D.T);
  const linkedTx=D.txs.filter(t=>t.date>=from&&['expense','income'].includes(t.type)).slice(0,8);
  return html`<div className="page">
    <${PageHead} en="RESOURCE MATRIX" title="三維資源：金錢・時間・心力"><${Seg} label="期間" v=${win} on=${setWin} opts=${[['1','今日'],['7','7 日'],['30','30 日']]}/><button className="btn pri" onClick=${()=>act.addActivity()}><${Icon} n="plus" s=${16}/>記錄活動</button><//>
    <div className="grid g3">
      <${Panel} eyebrow="MONEY" title="金錢投入" glow>
        <div className="kpi" style=${{padding:0,background:'none'}}><div className="lab">期間支出</div><div className="val"><${Money} c=${f.exp}/></div><div className="sub">收入 ${S.privacy?'•••':fmt(f.inc)}</div></div>
        <div className="hr"></div><div className="rows">${linkedTx.map(t=>html`<${TxRow} key=${t.id} t=${t}/>`)}</div>
      <//>
      <${Panel} eyebrow="TIME" title="時間投入" glow>
        <div className="kpi" style=${{padding:0,background:'none'}}><div className="lab">已記錄時間</div><div className="val">${fmtMin(st.min)}</div><div className="sub">專案投入 ${fmtMin(st.projMin)}・實際節省 ${fmtMin(st.saved)}</div></div>
        <div className="hr"></div>
        <${Bars} items=${Object.entries(st.byKind).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v*100])} colorFn=${k=>CAT_COL[ACT_KINDS.indexOf(k)%CAT_COL.length]}/>
        <div className="tiny muted" style=${{marginTop:8}}>以上數值單位為分鐘（條長為相對比例）。參考機會成本 <b>${S.privacy?'•••':fmt(Math.round(S.settings.hourly*st.min/60))}</b>，依時薪 ${S.privacy?'•••':fmt(S.settings.hourly)} 換算，<b>不計入現金或帳戶餘額</b>。</div>
      <//>
      <${Panel} eyebrow="ENERGY" title="心力變化" glow>
        <div className="flex" style=${{gap:18}}>
          ${[['今日',D.a1.avg],['7 日',D.a7.avg],['30 日',D.a30.avg]].map(([l,v])=>html`<div key=${l}><div className="tiny muted">${l}平均</div><div className=${'num '+(v>0?'pos':v<0?'neg':'')} style=${{fontSize:20,fontWeight:600}}>${v==null?'—':(v>0?'+':'')+v.toFixed(1)}</div></div>`)}
        </div>
        <div className="hr"></div>
        <div className="tiny muted" style=${{marginBottom:4}}>評分分布（${st.count} 項活動）</div>
        <div style=${{display:'grid',gridTemplateColumns:'repeat(11,1fr)',gap:3,alignItems:'end',height:70}}>${Array.from({length:11},(_,i)=>i-5).map(n=>{const mx=Math.max(1,...Object.values(st.dist));return html`<div key=${n} title=${`${n}: ${st.dist[n]} 項`} style=${{height:`${Math.max(3,st.dist[n]/mx*100)}%`,borderRadius:'3px 3px 0 0',background:n<0?'#FB7185':n>0?'#34D399':'#9AACC8',opacity:st.dist[n]?0.85:0.2}}></div>`})}</div>
        <div style=${{display:'grid',gridTemplateColumns:'repeat(11,1fr)',gap:3}} className="tiny muted num">${Array.from({length:11},(_,i)=>i-5).map(n=>html`<span key=${n} style=${{textAlign:'center'}}>${n}</span>`)}</div>
      <//>
    </div>
    <${Panel} eyebrow="ENERGY TREND · 30 DAYS" title="每日平均心力">
      <${LineChart} h=${180} labels=${D.energyDaily.map(x=>x.d.slice(5).replace('-','/'))} series=${[{key:'en',name:'平均心力',color:'#A855F7',values:D.energyDaily.map(x=>x.avg==null?null:Math.round(x.avg*100)),area:false,fmt:v=>v==null?'—':(v/100).toFixed(1)}]} yfmt=${v=>(v/100).toFixed(0)}/>
      <div className="tiny muted">心力是主觀序位評分，只呈現平均與分布，不加總、不換算成金錢。</div>
      <div className="grid g2" style=${{marginTop:12}}>
        <div><h3 style=${{marginBottom:6}}>主要消耗活動</h3>${st.drains.map(a=>html`<div key=${a.id} className="flex between small"><span>${a.title}</span><span className="neg num">${a.energy}</span></div>`)}${!st.drains.length&&html`<div className="small muted">無</div>`}</div>
        <div><h3 style=${{marginBottom:6}}>主要恢復活動</h3>${st.recov.map(a=>html`<div key=${a.id} className="flex between small"><span>${a.title}</span><span className="pos num">+${a.energy}</span></div>`)}${!st.recov.length&&html`<div className="small muted">無</div>`}</div>
      </div>
    <//>
    <${Panel} eyebrow="ACTIVITIES" title="活動三維紀錄">
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>日期</th><th>活動</th><th>類型</th><th className="r">金錢</th><th className="r">時間</th><th className="r">機會成本（參考）</th><th className="r">心力</th><th>專案</th></tr></thead><tbody>
      ${st.list.slice(0,80).map(a=>{const tx=a.txId&&D.txs.find(t=>t.id===a.txId);return html`<tr key=${a.id} className="click" onClick=${()=>setSel(a)}><td className="num small">${a.date.slice(5)}</td><td>${a.title}</td><td><${Chip}>${a.kind}</${Chip}></td><td className="r">${tx?html`<${Money} c=${tx.base}/>`:html`<span className="muted">—</span>`}</td><td className="r num">${fmtMin(a.minutes)}</td><td className="r muted"><${Money} c=${Math.round(S.settings.hourly*a.minutes/60)}/></td><td className=${'r num '+(a.energy>0?'pos':a.energy<0?'neg':'')}>${a.energy>0?'+':''}${a.energy}</td><td className="small">${(a.alloc||[]).map(x=>{const p=S.projects.find(p=>p.id===x.pid);return p?`${p.name} ${x.pct}%`:''}).join('、')||'—'}</td></tr>`})}
      </tbody></table></div>
      ${!st.list.length&&html`<${Empty} text="此期間沒有活動紀錄。" action=${html`<button className="btn pri" onClick=${()=>act.addActivity()}>記錄第一項活動</button>`}/>`}
    <//>
    ${sel&&html`<${Modal} title="活動明細" onClose=${()=>setSel(null)} footer=${html`<button className="btn danger" onClick=${()=>act.confirm('刪除活動？','這項活動的時間與心力會從統計中移除。',()=>{act.update(s=>{s.activities.find(x=>x.id===sel.id).deleted=true},{action:'刪除活動',entity:'activities',detail:sel.title});setSel(null)})}>刪除</button><button className="btn pri" onClick=${()=>{const a=sel;setSel(null);act.addActivity(a)}}>編輯</button>`}>
      <dl className="kv"><dt>活動</dt><dd>${sel.title}</dd><dt>日期</dt><dd>${fmtD(sel.date)}</dd><dt>時間</dt><dd>${fmtMin(sel.minutes)}（參考機會成本 <${Money} c=${Math.round(S.settings.hourly*sel.minutes/60)}/>，不計入現金）</dd><dt>心力</dt><dd>${sel.energy>0?'+':''}${sel.energy}　${ELABEL[sel.energy]}</dd><dt>節省時間</dt><dd>${fmtMin(sel.saved)}</dd>
      <dt>專案分攤</dt><dd>${(sel.alloc||[]).map(x=>{const p=S.projects.find(p=>p.id===x.pid);return html`<div key=${x.pid}>${p?p.name:'?'} · ${x.pct}% · ${fmtMin(sel.minutes*x.pct/100)}</div>`})}${!(sel.alloc||[]).length&&'無'}</dd></dl><//>`}
  </div>`}

function Assets(){
  const {S,D,act}=useCtx();const [m,setM]=useState(null);
  const sh=D.now;
  return html`<div className="page">
    <${PageHead} en="ASSETS & LIABILITIES" title="資產與負債"><button className="btn" onClick=${()=>setM({k:'account'})}><${Icon} n="plus" s=${16}/>新增帳戶</button><button className="btn" onClick=${()=>setM({k:'asset'})}>新增資產</button><button className="btn" onClick=${()=>setM({k:'liab'})}>新增負債</button><//>
    <div className="pulse" style=${{gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
      <div className="kpi big"><div className="lab">淨資產</div><div className="val"><${Money} c=${sh.net}/></div></div>
      <div className="kpi"><div className="lab">總資產</div><div className="val"><${Money} c=${sh.assets}/></div></div>
      <div className="kpi"><div className="lab">總負債</div><div className="val neg"><${Money} c=${sh.liab}/></div></div>
      <div className="kpi"><div className="lab">初始快照日</div><div className="val" style=${{fontSize:18}}>${fmtD(S.settings.snapshotDate)}</div><div className="sub">期初餘額以此日為準</div></div>
    </div>
    <${Panel} eyebrow="ACCOUNTS" title="帳戶">
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>帳戶</th><th>類型</th><th>幣別</th><th className="r">期初（快照）</th><th className="r">目前餘額（原幣）</th><th className="r">換算 TWD</th><th></th></tr></thead><tbody>
      ${S.accounts.filter(a=>!a.archived).map(a=>html`<tr key=${a.id}><td>${a.name}${a.demo&&html` <${Chip} tone="w">示範</${Chip}>`}</td><td>${ACC_KINDS[a.kind]}</td><td className="mono">${a.cur}</td><td className="r"><${Money} c=${a.opening} cur=${a.cur}/></td><td className="r"><${Money} c=${D.bal[a.id]} cur=${a.cur} color=${a.kind==='credit'}/>${a.kind==='credit'&&D.bal[a.id]<0&&html`<div className="tiny warn">應付款</div>`}</td><td className="r"><${Money} c=${D.tw(a.id)}/></td>
        <td><button className="btn ghost sm" onClick=${()=>act.confirm('封存帳戶？',`「${a.name}」會從列表與總額中隱藏，交易紀錄保留。`,()=>act.update(s=>{s.accounts.find(x=>x.id===a.id).archived=true},{action:'封存帳戶',entity:'accounts',detail:a.name}))}>封存</button></td></tr>`)}
      </tbody></table></div>
      ${!S.accounts.length&&html`<${Empty} text="尚未建立帳戶。" action=${html`<button className="btn pri" onClick=${()=>setM({k:'account'})}>新增帳戶</button>`}/>`}
    <//>
    <div className="grid g2">
      <${Panel} eyebrow="OTHER ASSETS" title="其他資產">
        <div className="rows">${S.assets.map(a=>html`<div key=${a.id} className="row"><div className="grow"><div>${a.name} <${Chip}>${ASSET_TYPES[a.type]}</${Chip}></div><div className="tiny muted">評價日 ${fmtD(a.date)}${a.monthlyIncome?` · 定期收入 ${fmt(a.monthlyIncome)}/月`:''}${a.maintenance?` · 維護支出 ${fmt(a.maintenance)}/月`:''}</div></div><${Money} c=${a.value}/><button className="btn sm" onClick=${()=>setM({k:'value',a})}>更新評價</button></div>`)}</div>
        ${!S.assets.length&&html`<div className="small muted">沒有登錄其他資產（不動產、器材、收藏等）。</div>`}
      <//>
      <${Panel} eyebrow="LIABILITIES" title="負債">
        <div className="rows">${S.liabilities.map(l=>html`<div key=${l.id} className="row"><div className="grow"><div>${l.name}</div><div className="tiny muted">年利率 ${l.rate}% · 分期 ${S.privacy?'•••':fmt(l.installment)} · 每月 ${l.dueDay} 日到期</div></div><${Money} c=${l.balance}/><button className="btn sm" onClick=${()=>setM({k:'lbal',l})}>更新餘額</button></div>`)}
        ${D.now.ccOwed>0&&html`<div className="row"><div className="grow"><div>信用卡未繳餘額</div><div className="tiny muted">由信用卡帳戶自動計算</div></div><${Money} c=${D.now.ccOwed}/></div>`}</div>
        <div className="note" style=${{marginTop:8}}>貸款繳款：本金部分請以「帳戶轉帳」以外的方式記錄後更新餘額；利息請記為「支出」。自動拆分本息為後續功能。</div>
      <//>
    </div>
    <${Panel} eyebrow="EXCHANGE RATES" title="匯率（手動設定）">
      <${Rates}/>
    <//>
    ${m&&m.k==='account'&&html`<${Modal} title="新增帳戶" onClose=${()=>setM(null)}><${AccountForm} onDone=${()=>setM(null)}/><//>`}
    ${m&&m.k==='asset'&&html`<${Modal} title="新增資產" onClose=${()=>setM(null)}><${AssetForm} onDone=${()=>setM(null)}/><//>`}
    ${m&&m.k==='liab'&&html`<${Modal} title="新增負債" onClose=${()=>setM(null)}><${LiabForm} onDone=${()=>setM(null)}/><//>`}
    ${m&&m.k==='value'&&html`<${Modal} title=${'更新評價：'+m.a.name} onClose=${()=>setM(null)}><${ValueForm} a=${m.a} onDone=${()=>setM(null)}/><//>`}
    ${m&&m.k==='lbal'&&html`<${Modal} title=${'更新餘額：'+m.l.name} onClose=${()=>setM(null)}><${LiabBalForm} l=${m.l} onDone=${()=>setM(null)}/><//>`}
  </div>`}
function Rates(){const {S,act}=useCtx();const [r,setR]=useState(()=>Object.fromEntries(Object.entries(S.settings.rates).map(([k,v])=>[k,{rate:String(v.rate),date:v.date}])));const [nc,setNc]=useState('');
  const save=()=>{const out={};for(const [k,v] of Object.entries(r)){const x=parseFloat(v.rate);if(!(x>0))return act.toast(`${k} 匯率需大於 0。`);out[k]={rate:x,date:v.date||todayISO()}}act.update(s=>{s.settings.rates=out},{action:'更新手動匯率',entity:'exchange_rates',detail:Object.entries(out).map(([k,v])=>`${k}=${v.rate}`).join(', ')});act.toast('匯率已更新，淨資產換算已重新計算。')};
  return html`<div className="stack"><div className="tbl-wrap"><table className="tbl"><thead><tr><th>幣別</th><th>1 單位 = ? TWD</th><th>匯率日期</th></tr></thead><tbody>
    <tr><td className="mono">TWD</td><td className="num">1（主要幣別）</td><td>—</td></tr>
    ${Object.entries(r).map(([k,v])=>html`<tr key=${k}><td className="mono">${k}</td><td><input id=${'fx-'+k} className="inp num" style=${{maxWidth:140}} value=${v.rate} onChange=${e=>setR({...r,[k]:{...v,rate:e.target.value}})}/></td><td><input id=${'fxd-'+k} className="inp" type="date" style=${{maxWidth:170}} value=${v.date} onChange=${e=>setR({...r,[k]:{...v,date:e.target.value}})}/></td></tr>`)}</tbody></table></div>
    <div className="flex"><input id="fx-new" className="inp" style=${{maxWidth:140}} placeholder="新增幣別如 EUR" value=${nc} onChange=${e=>setNc(e.target.value.toUpperCase().slice(0,3))}/><button className="btn sm" onClick=${()=>{if(nc.length===3&&!r[nc]&&nc!=='TWD'){setR({...r,[nc]:{rate:'',date:todayISO()}});setNc('')}}}>新增自訂幣別</button><span className="spacer" style=${{flex:1}}></span><button className="btn pri" onClick=${save}>儲存匯率</button></div>
    <div className="tiny muted">交易保存當時的匯率與換算金額；這裡的匯率只用於目前餘額換算。自動市場報價為後續擴充。</div></div>`}
function AccountForm({onDone,inline}){const {S,act}=useCtx();const [f,setF]=useState({name:'',kind:'bank',cur:'TWD',opening:''});const [err,setErr]=useState('');
  const curs=['TWD',...Object.keys(S.settings.rates)];
  return html`<form className="form" onSubmit=${e=>{e.preventDefault();if(!f.name.trim())return setErr('請輸入帳戶名稱。');let op=f.opening===''?0:parseC(f.opening);if(isNaN(op))return setErr('期初餘額格式不正確。');if(f.kind==='credit'&&op>0)op=-op;
      act.update(s=>{s.accounts.push({id:uid(),name:f.name.trim(),kind:f.kind,cur:f.cur,opening:op})},{action:'新增帳戶',entity:'accounts',detail:`${f.name}｜${ACC_KINDS[f.kind]}｜期初 ${fmt(op,f.cur)}`});onDone()}}>
    ${err&&html`<div className="errs full">${err}</div>`}
    <${Field} label="帳戶名稱"><input id="ac-name" className="inp" value=${f.name} onChange=${e=>setF({...f,name:e.target.value})}/><//>
    <${Field} label="類型"><select id="ac-kind" className="inp" value=${f.kind} onChange=${e=>setF({...f,kind:e.target.value})}>${Object.entries(ACC_KINDS).map(([k,v])=>html`<option key=${k} value=${k}>${v}</option>`)}</select><//>
    <${Field} label="幣別"><select id="ac-cur" className="inp" value=${f.cur} onChange=${e=>setF({...f,cur:e.target.value})}>${curs.map(c=>html`<option key=${c}>${c}</option>`)}</select><//>
    <${Field} label=${f.kind==='credit'?'目前未繳金額':'期初餘額（快照日）'}><input id="ac-op" className="inp num" inputMode="decimal" value=${f.opening} onChange=${e=>setF({...f,opening:e.target.value})}/><//>
    <div className="modal-f full"><button type="submit" className="btn pri">新增帳戶</button></div></form>`}
function AssetForm({onDone}){const {act}=useCtx();const [f,setF]=useState({name:'',type:'other',value:'',monthlyIncome:'',maintenance:''});
  return html`<form className="form" onSubmit=${e=>{e.preventDefault();const v=parseC(f.value);if(!f.name||!(v>=0))return act.toast('請輸入名稱與評價。');const a={id:uid(),name:f.name,type:f.type,value:v,monthlyIncome:parseC(f.monthlyIncome)||0,maintenance:parseC(f.maintenance)||0,date:todayISO(),history:[{date:todayISO(),value:v}]};act.update(s=>{s.assets.push(a)},{action:'新增資產',entity:'assets',detail:`${a.name}｜${fmt(v)}`});onDone()}}>
    <${Field} label="名稱"><input id="as-name" className="inp" value=${f.name} onChange=${e=>setF({...f,name:e.target.value})}/><//>
    <${Field} label="類型"><select id="as-type" className="inp" value=${f.type} onChange=${e=>setF({...f,type:e.target.value})}>${Object.entries(ASSET_TYPES).map(([k,v])=>html`<option key=${k} value=${k}>${v}</option>`)}</select><//>
    <${Field} label="目前評價（TWD）"><input id="as-val" className="inp num" value=${f.value} onChange=${e=>setF({...f,value:e.target.value})}/><//>
    <${Field} label="定期收入／月"><input id="as-inc" className="inp num" value=${f.monthlyIncome} onChange=${e=>setF({...f,monthlyIncome:e.target.value})}/><//>
    <${Field} label="維護支出／月"><input id="as-mt" className="inp num" value=${f.maintenance} onChange=${e=>setF({...f,maintenance:e.target.value})}/><//>
    <div className="full tiny muted">房產等資產可能有評價，但持有期間也可能是負現金流；定期收入與維護支出請另以交易記錄。</div>
    <div className="modal-f full"><button type="submit" className="btn pri">新增資產</button></div></form>`}
function LiabForm({onDone}){const {act}=useCtx();const [f,setF]=useState({name:'',balance:'',rate:'',installment:'',dueDay:''});
  return html`<form className="form" onSubmit=${e=>{e.preventDefault();const b=parseC(f.balance);if(!f.name||!(b>=0))return act.toast('請輸入名稱與餘額。');const l={id:uid(),name:f.name,balance:b,rate:Number(f.rate)||0,installment:parseC(f.installment)||0,dueDay:Number(f.dueDay)||0,history:[{date:todayISO(),balance:b}]};act.update(s=>{s.liabilities.push(l)},{action:'新增負債',entity:'liabilities',detail:`${l.name}｜${fmt(b)}`});onDone()}}>
    <${Field} label="名稱"><input id="lb-name" className="inp" value=${f.name} onChange=${e=>setF({...f,name:e.target.value})}/><//>
    <${Field} label="目前餘額（TWD）"><input id="lb-bal" className="inp num" value=${f.balance} onChange=${e=>setF({...f,balance:e.target.value})}/><//>
    <${Field} label="年利率 %"><input id="lb-rate" className="inp num" value=${f.rate} onChange=${e=>setF({...f,rate:e.target.value})}/><//>
    <${Field} label="每期分期金額"><input id="lb-inst" className="inp num" value=${f.installment} onChange=${e=>setF({...f,installment:e.target.value})}/><//>
    <${Field} label="每月到期日"><input id="lb-due" className="inp num" type="number" min="1" max="31" value=${f.dueDay} onChange=${e=>setF({...f,dueDay:e.target.value})}/><//>
    <div className="modal-f full"><button type="submit" className="btn pri">新增負債</button></div></form>`}
function ValueForm({a,onDone}){const {act}=useCtx();const [v,setV]=useState(String(a.value/100));
  return html`<form className="stack" onSubmit=${e=>{e.preventDefault();const x=parseC(v);if(!(x>=0))return;act.update(s=>{const y=s.assets.find(z=>z.id===a.id);y.value=x;y.date=todayISO();y.history=[...(y.history||[]),{date:todayISO(),value:x}]},{action:'更新資產評價',entity:'assets',detail:`${a.name}｜${fmt(a.value)} → ${fmt(x)}`});act.toast('評價已更新（未實現變動，不計入收入）。');onDone()}}>
    <${Field} label="新評價（TWD）"><input id="val-new" className="inp num" value=${v} onChange=${e=>setV(e.target.value)}/><//>
    <div className="tiny muted">評價變動屬於未實現資產評價，只影響淨資產，不計入收入或現金流。</div>
    <div className="modal-f"><button className="btn pri" type="submit">確認更新</button></div></form>`}
function LiabBalForm({l,onDone}){const {act}=useCtx();const [v,setV]=useState(String(l.balance/100));
  return html`<form className="stack" onSubmit=${e=>{e.preventDefault();const x=parseC(v);if(!(x>=0))return;act.update(s=>{const y=s.liabilities.find(z=>z.id===l.id);y.balance=x;y.history=[...(y.history||[]),{date:todayISO(),balance:x}]},{action:'更新負債餘額',entity:'liabilities',detail:`${l.name}｜${fmt(l.balance)} → ${fmt(x)}`});onDone()}}>
    <${Field} label="新餘額（TWD）"><input id="lbal-new" className="inp num" value=${v} onChange=${e=>setV(e.target.value)}/><//>
    <div className="modal-f"><button className="btn pri" type="submit">確認更新</button></div></form>`}

function Garden({focus}){
  const {S,D,act}=useCtx();const [sel,setSel]=useState(focus||(D.plants[0]&&D.plants[0].id));
  useEffect(()=>{if(focus)setSel(focus)},[focus]);
  const p=D.plants.find(x=>x.id===sel);
  const groups=[['income','收入來源'],['project','培育計畫']];
  return html`<div className="page">
    <${PageHead} en="WEALTH GARDEN" title="財富花園"><button className="btn" onClick=${()=>act.newProject({})}><${Icon} n="plus" s=${16}/>種下新計畫</button><//>
    <div className="note c">植物只依「已確認」的里程碑、作品、實際收入與實際節省時間成長；預估收益不會讓植物成長，重複點擊或重複記帳也不會。這是視覺對應，不代表保證收益。</div>
    <div className="grid g-dash">
      <div className="stack" style=${{gap:16}}>
        ${groups.map(([k,l])=>{const list=D.plants.filter(x=>x.kind===k);return html`<${Panel} key=${k} eyebrow=${k==='income'?'INCOME SOURCES · 90 DAYS':'CULTIVATION PROJECTS'} title=${l}>
          <div className="plants">${list.map(x=>html`<button key=${x.id} className="plant" aria-pressed=${sel===x.id} title=${'生長階段：'+STAGES[x.stage]} onClick=${()=>setSel(x.id)}><div key=${x.stage} className=${REDUCED?'':'grow'}><${Plant} stage=${x.stage}/></div><span className="nm">${x.name}</span><span className="tiny" style=${{color:STAGE_COL[x.stage]}}>${STAGES[x.stage]}</span></button>`)}</div>
          ${!list.length&&html`<div className="small muted">${k==='income'?'近 90 天沒有未分攤至專案的收入。':'尚無培育計畫。'}</div>`}<//>`})}
        <${Panel} eyebrow="INCOME CONSTELLATION" title="收入星系"><${Constellation}/><//>
        <${Panel} eyebrow="GROWTH TIMELINE" title="財富成長時間軸"><${GrowthTimeline}/><//>
      </div>
      <div>${p?html`<${PlantCard} p=${p}/>`:html`<${Empty} text="選擇一株植物查看資料。"/>`}
        <${Panel} eyebrow="LEGEND" title="植物階段" className="" ><div className="rows">${Object.entries(STAGES).map(([k,v])=>html`<div key=${k} className="row" style=${{padding:'3px 0'}}><${Plant} stage=${k} size=${34} animate=${false}/><span className="grow small">${v}</span><span className="tiny muted">${{seed:'新建立或構想',sprout:'持續投入中',bud:'有已驗證的階段成果',bloom:'所有里程碑已驗證',stable:'近期有實際持續收入',dormant:'暫停中',amber:'超出預算或標記風險',specimen:'已終止，保留紀錄'}[k]}</span></div>`)}</div><//>
      </div>
    </div></div>`}
function PlantCard({p}){const {S,D,act}=useCtx();
  if(p.kind==='income'){const s=p.ref;return html`<${Panel} glow eyebrow="INCOME SOURCE" title=${s.cat}>
    <div style=${{display:'grid',placeItems:'center'}}><${Plant} stage=${p.stage} size=${140}/></div>
    <dl className="kv"><dt>所屬</dt><dd>收入來源（類別：${s.cat}）</dd><dt>首次紀錄</dt><dd>${fmtD(s.first)}</dd><dt>目前階段</dt><dd style=${{color:STAGE_COL[p.stage]}}>${STAGES[p.stage]}</dd><dt>近 90 日已實現</dt><dd><${Money} c=${s.total}/>（${s.txs.length} 筆，${s.months.size} 個月份）</dd><dt>最近更新</dt><dd>${fmtD(s.last)}</dd><dt>判定依據</dt><dd className="small muted">近 90 日有 2 個以上月份收到此類收入 → 穩定發光；否則為發光花苞。</dd></dl><//>`}
  const pr=p.ref,m=D.pm[pr.id];const ms=pr.milestones||[];
  return html`<${Panel} glow eyebrow="CULTIVATION PROJECT" title=${pr.name} right=${html`<button className="btn sm" onClick=${()=>act.nav('projects',pr.id)}>開啟專案</button>`}>
    <div style=${{display:'grid',placeItems:'center'}}><div key=${p.stage} className=${REDUCED?'':'grow'}><${Plant} stage=${p.stage} size=${140}/></div></div>
    <dl className="kv">
      <dt>所屬計畫</dt><dd>${pr.desc||'—'}</dd><dt>建立日期</dt><dd>${fmtD(pr.created)}</dd>
      <dt>目前階段</dt><dd><span style=${{color:STAGE_COL[p.stage]}}>${STAGES[p.stage]}</span> · 狀態 ${pr.status}</dd>
      <dt>已投入金錢</dt><dd><${Money} c=${m.money}/>${pr.budget?html` / 預算 <${Money} c=${pr.budget}/>`:''}</dd>
      <dt>已投入時間</dt><dd>${fmtMin(m.time)}</dd>
      <dt>心力紀錄</dt><dd>${m.energy.length?`${m.energy.length} 項活動，平均 ${(m.energy.reduce((a,b)=>a+b,0)/m.energy.length).toFixed(1)}`:'無'}</dd>
      <dt>預期收益</dt><dd><span className="muted">（預測）</span> ${pr.expected||'未設定'}</dd>
      <dt>已實現收益</dt><dd><${Money} c=${m.income}/></dd>
      <dt>階段目標</dt><dd>${pr.goal||'—'}</dd>
      <dt>已完成里程碑</dt><dd>${ms.filter(x=>x.verified).length} / ${ms.length} 已驗證${ms.filter(x=>x.done&&!x.verified).length?html` · <span className="warn">${ms.filter(x=>x.done&&!x.verified).length} 項待驗證</span>`:''}</dd>
      <dt>最近更新</dt><dd>${(pr.history||[]).length?fmtD(pr.history[pr.history.length-1].date)+' '+pr.history[pr.history.length-1].text:'—'}</dd>
      <dt>風險與行動</dt><dd>${pr.risks||'—'}${(pr.tasks||[]).filter(t=>!t.done)[0]?html`<div className="small">下一步：${pr.tasks.filter(t=>!t.done)[0].text}</div>`:''}</dd>
    </dl><//>`}
function Constellation(){const {S,D}=useCtx();const [pick,setPick]=useState(null);const [win,setWin]=useState('90');
  const f=D.flow(addDays(D.T,-(Number(win)-1)),D.T);const items=Object.entries(f.ic).sort((a,b)=>b[1]-a[1]);const mx=Math.max(1,...items.map(i=>i[1]));const icats=allCats(S,'income');
  const W=600,H=260;const pos=items.map((_,i)=>{const ang=i*2.399963,r=i===0?0:40+Math.sqrt(i)*42;return [W/2+r*Math.cos(ang)*1.6,H/2+r*Math.sin(ang)*0.8]});
  const rng=mulberry32(7);const bg=Array.from({length:LOWPOWER?20:50},()=>[rng()*W,rng()*H,rng()*1.2+0.3]);
  const sel=pick&&D.txs.filter(t=>t.type==='income'&&t.cat===pick&&t.date>=addDays(D.T,-(Number(win)-1)));
  return html`<div className="stack"><div className="flex between"><span className="tiny muted">星點大小 = 期間實際收入；顏色 = 收入類別。星星數量不代表財務健康。</span><${Seg} label="期間" v=${win} on=${setWin} opts=${[['30','30 日'],['90','90 日'],['365','一年']]}/></div>
    <svg className="chart stars" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="收入星系"><rect width=${W} height=${H} fill="#03060C" rx="8"/>${bg.map((b,i)=>html`<circle key=${'b'+i} cx=${b[0]} cy=${b[1]} r=${b[2]} fill="#E6F1FF" opacity=".25" style=${{cursor:'default'}}/>`)}
      ${items.map(([c,v],i)=>{const r=6+Math.sqrt(v/mx)*30,col=catColor(c,icats);const [x,y]=pos[i];return html`<g key=${c} onClick=${()=>setPick(pick===c?null:c)}>
        ${i>0&&html`<line x1=${W/2} y1=${H/2} x2=${x} y2=${y} stroke=${col} opacity=".15"/>`}
        <circle cx=${x} cy=${y} r=${r} fill=${col} opacity=${pick&&pick!==c?0.35:0.9} style=${{filter:`drop-shadow(0 0 ${r/2}px ${col})`}}><title>${c}</title></circle>
        <text x=${x} y=${y+r+13} textAnchor="middle" fontSize="11" fill="#E6F1FF">${c}</text></g>`})}
      ${!items.length&&html`<text x=${W/2} y=${H/2} textAnchor="middle" fill="#9AACC8" fontSize="12">此期間沒有收入</text>`}</svg>
    ${sel&&html`<div className="rows">${sel.slice(0,8).map(t=>html`<${TxRow} key=${t.id} t=${t}/>`)}</div>`}</div>`}
function projectEvents(S,D,p){const m=D.pm[p.id];const ev=[];
  (p.history||[]).forEach(h=>ev.push({date:h.date,text:h.text,c:'var(--violet)',k:'計畫調整'}));
  (p.milestones||[]).forEach(x=>{if(x.verified)ev.push({date:x.date,text:`里程碑已驗證：${x.name}`,c:'var(--pink)',k:'成果驗證'})});
  (p.tasks||[]).forEach(t=>{if(t.done&&t.doneDate)ev.push({date:t.doneDate,text:`完成任務：${t.text}`,c:'var(--cyan)',k:'任務完成'})});
  m.txs.forEach(({t,pct,part})=>ev.push({date:t.date,text:`${t.type==='income'||t.type==='realized'?'收入產生':'金錢投入'}：${t.desc}（${pct}%）`,amt:part,c:t.type==='income'||t.type==='realized'?'var(--ok)':'var(--bad)',k:t.type==='income'?'收入產生':'投入'}));
  m.acts.forEach(({a,pct})=>ev.push({date:a.date,text:`時間投入：${a.title} ${fmtMin(a.minutes*pct/100)}`,c:'var(--cyan)',k:'投入時間'}));
  S.suggestions.filter(s=>s.projectId===p.id).forEach(s=>ev.push({date:s.decided||s.created,text:`AI／規則式建議核准：${s.title}`,c:'var(--warn)',k:'AI 建議'}));
  return ev.sort((a,b)=>a.date<b.date?1:-1)}
function GrowthTimeline(){const {S,D}=useCtx();const ev=[];
  S.projects.forEach(p=>projectEvents(S,D,p).filter(e=>['收入產生','成果驗證','計畫調整'].includes(e.k)).forEach(e=>ev.push({...e,text:`【${p.name}】${e.text}`})));
  ev.sort((a,b)=>a.date<b.date?1:-1);
  return ev.length?html`<div className="timeline">${ev.slice(0,14).map((e,i)=>html`<div key=${i} className="tl" style=${{'--c':e.c}}><div className="tiny muted num">${fmtD(e.date)} · ${e.k}</div><div>${e.text}${e.amt!=null?html` <${Money} c=${e.amt}/>`:''}</div></div>`)}</div>`:html`<div className="small muted">尚無成長事件。</div>`}

function Projects({focus}){
  const {S,D,act}=useCtx();const [sel,setSel]=useState(focus||null);useEffect(()=>{if(focus)setSel(focus)},[focus]);
  const p=sel&&S.projects.find(x=>x.id===sel);
  if(p)return html`<${ProjectDetail} p=${p} back=${()=>setSel(null)}/>`;
  return html`<div className="page"><${PageHead} en="CULTIVATION PROJECTS" title="資產培育計畫"><button className="btn pri" onClick=${()=>act.newProject({},id=>id&&setSel(id))}><${Icon} n="plus" s=${16}/>建立計畫</button><//>
    <div className="flex small muted" style=${{gap:6}}>流程：${['投入','發現機會','建立計畫','執行','驗證','持續改善'].map((s,i)=>html`<span key=${s} className="flex" style=${{gap:6}}>${i>0&&'→'}<${Chip} tone="c">${s}</${Chip}></span>`)}</div>
    <div className="small muted">已分攤至專案的總成本 <${Money} c=${D.allocatedCost}/>（每筆交易分攤 ≤ 100%，不會重複計入總成本）</div>
    <div className="grid g3">${S.projects.map(p=>{const m=D.pm[p.id];const st=D.stageOf(p);const ms=p.milestones||[];return html`<button key=${p.id} className="panel" style=${{textAlign:'left',cursor:'pointer',display:'flex',flexDirection:'column',gap:8,color:'var(--fg)'}} onClick=${()=>setSel(p.id)}>
      <div className="flex between" style=${{flexWrap:'nowrap'}}><div style=${{minWidth:0}}><div className="eyebrow">${p.status}</div><h2 className="t" style=${{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>${p.name}</h2></div><${Plant} stage=${st} size=${54}/></div>
      <div className="small muted" style=${{minHeight:40}}>${p.goal}</div>
      <div className="prog" title="已驗證里程碑"><i style=${{width:`${ms.length?ms.filter(x=>x.verified).length/ms.length*100:0}%`}}></i></div>
      <div className="flex small" style=${{gap:12}}><span>投入 <${Money} c=${m.money}/></span><span>${fmtMin(m.time)}</span><span>實現 <${Money} c=${m.income}/></span></div>
      ${p.demo&&html`<div><${Chip} tone="w">示範</${Chip}></div>`}</button>`})}</div>
    ${!S.projects.length&&html`<${Empty} text="還沒有培育計畫。從一筆學習或工具支出開始，把它轉成可驗證的計畫。" action=${html`<button className="btn pri" onClick=${()=>act.newProject({})}>建立第一個計畫</button>`}/>`}
  </div>`}
function ProjectDetail({p,back}){
  useBackHandler(back);
  const {S,D,act}=useCtx();const m=D.pm[p.id];const [task,setTask]=useState('');const [msn,setMsn]=useState('');const st=D.stageOf(p);
  const up=(fn,detail)=>act.update(s=>{const x=s.projects.find(y=>y.id===p.id);fn(x)},{action:'更新專案',entity:'projects',detail:`${p.name}｜${detail}`});
  const ev=projectEvents(S,D,p);
  const verify=ms=>act.confirm('確認並驗證里程碑？',`「${ms.name}」將標記為已驗證成果，植物會依此成長。請確認你能提出可檢查的成果（作品、連結、收據等）。`,()=>{up(x=>{const y=x.milestones.find(z=>z.id===ms.id);y.done=true;y.verified=true;y.date=todayISO();x.history=[...(x.history||[]),{date:todayISO(),text:`里程碑「${ms.name}」經使用者確認驗證`}]},`驗證里程碑 ${ms.name}`);act.toast('里程碑已驗證，植物已更新。',null,true)});
  return html`<div className="page">
    <div><button className="btn ghost sm" onClick=${back}>← 返回計畫列表</button></div>
    <${PageHead} en=${'PROJECT // '+p.status} title=${p.name}><button className="btn" onClick=${()=>act.newProject(p)}><${Icon} n="edit" s=${15}/>編輯</button>
      <select id="pd-status" className="inp" style=${{width:'auto'}} aria-label="變更狀態" value=${p.status} onChange=${e=>{const v=e.target.value;act.confirm('變更專案狀態？',`${p.status} → ${v}。${v==='終止'?'終止後仍保留所有既有成本與成果。':''}`,()=>up(x=>{x.history=[...(x.history||[]),{date:todayISO(),text:`狀態變更：${x.status} → ${v}`}];x.status=v},`狀態 ${v}`))}}>${P_STATUS.map(s=>html`<option key=${s}>${s}</option>`)}</select><//>
    <div className="grid g-dash">
      <div className="stack" style=${{gap:16}}>
        <${Panel} title="計畫內容"><dl className="kv"><dt>說明</dt><dd>${p.desc||'—'}</dd><dt>目標</dt><dd>${p.goal||'—'}</dd><dt>預計完成</dt><dd>${fmtD(p.due)}</dd><dt>預算</dt><dd><${Money} c=${p.budget}/>（已用 ${p.budget?Math.round(m.money/p.budget*100):0}%）</dd><dt>時間投入</dt><dd>${fmtMin(m.time)}</dd><dt>心力評估</dt><dd>${m.energy.length?`平均 ${(m.energy.reduce((a,b)=>a+b,0)/m.energy.length).toFixed(1)}（${m.energy.length} 項活動）`:'無紀錄'}</dd><dt>預期成果</dt><dd><${Chip}>預測</${Chip}> ${p.expected||'—'}</dd><dt>實際成果</dt><dd><${Chip} tone="ok">已實現</${Chip}> 收入 <${Money} c=${m.income}/> · 已驗證里程碑 ${(p.milestones||[]).filter(x=>x.verified).length} 項</dd><dt>風險</dt><dd>${p.risks||'—'}${p.riskFlag?html` <${Chip} tone="w">需檢視</${Chip}>`:''}</dd></dl><//>
        <${Panel} title="里程碑" right=${html`<span className="tiny muted">只有驗證過的里程碑會讓植物成長</span>`}>
          <div className="rows">${(p.milestones||[]).map(x=>html`<div key=${x.id} className="row"><span style=${{color:x.verified?'var(--pink)':x.done?'var(--warn)':'var(--dim)'}}><${Icon} n=${x.verified?'star':'flag'}/></span><div className="grow"><div>${x.name}</div><div className="tiny muted">${x.verified?'已驗證 '+fmtD(x.date):x.done?'已完成、待驗證':'未完成'}</div></div>${!x.verified&&html`<button className="btn sm pri" onClick=${()=>verify(x)}>確認並驗證</button>`}</div>`)}</div>
          <form className="flex" style=${{marginTop:8,flexWrap:'nowrap'}} onSubmit=${e=>{e.preventDefault();if(!msn.trim())return;up(x=>{x.milestones=[...(x.milestones||[]),{id:uid(),name:msn.trim(),done:false,verified:false}]},`新增里程碑 ${msn}`);setMsn('')}}><input id="pd-ms" className="inp" placeholder="新增里程碑" value=${msn} onChange=${e=>setMsn(e.target.value)}/><button className="btn" type="submit">新增</button></form>
        <//>
        <${Panel} title="任務清單">
          <div className="rows">${(p.tasks||[]).map(t=>html`<label key=${t.id} className="row chk"><input type="checkbox" checked=${t.done} onChange=${()=>up(x=>{const y=x.tasks.find(z=>z.id===t.id);y.done=!y.done;y.doneDate=y.done?todayISO():undefined},`${t.done?'取消完成':'完成'}任務 ${t.text}`)}/><span className="grow" style=${{textDecoration:t.done?'line-through':'',color:t.done?'var(--muted)':''}}>${t.text}</span>${t.due&&html`<span className="tiny muted num">${fmtD(t.due)}</span>`}</label>`)}</div>
          <form className="flex" style=${{marginTop:8,flexWrap:'nowrap'}} onSubmit=${e=>{e.preventDefault();if(!task.trim())return;up(x=>{x.tasks=[...(x.tasks||[]),{id:uid(),text:task.trim(),done:false}]},`新增任務 ${task}`);setTask('')}}><input id="pd-task" className="inp" placeholder="新增任務" value=${task} onChange=${e=>setTask(e.target.value)}/><button className="btn" type="submit">新增</button></form>
        <//>
        <${Panel} title="成本分攤明細"><div className="rows">${m.txs.map(({t,pct,part})=>html`<div key=${t.id} className="row"><div className="grow"><div className="t">${t.desc}</div><div className="tiny muted">${fmtD(t.date)} · ${TYPES[t.type]} · 原始 ${S.privacy?'•••':fmt(t.base)} × ${pct}%</div></div><${Money} c=${t.type==='expense'?-part:part} sign color/></div>`)}${!m.txs.length&&html`<div className="small muted">尚無分攤。編輯交易時可分攤至此專案。</div>`}</div><//>
      </div>
      <div className="stack" style=${{gap:16}}>
        <${Panel} glow><div style=${{display:'grid',placeItems:'center'}}><div key=${st} className=${REDUCED?'':'grow'}><${Plant} stage=${st} size=${150}/></div><div style=${{color:STAGE_COL[st]}}>${STAGES[st]}</div></div><//>
        <${Panel} eyebrow="TIMELINE" title="互動式專案時間軸">${ev.length?html`<div className="timeline">${ev.map((e,i)=>html`<div key=${i} className="tl" style=${{'--c':e.c}}><div className="tiny muted num">${fmtD(e.date)} · ${e.k}</div><div className="small">${e.text}${e.amt!=null?html` <${Money} c=${e.amt}/>`:''}</div></div>`)}</div>`:html`<div className="small muted">尚無事件。</div>`}<//>
      </div>
    </div></div>`}

function AIPage(){
  const {S,D,act}=useCtx();
  const [lines,setLines]=useState(()=>[{c:'sys',t:'WEALTH STRATEGIST // AI INTELLIGENCE CORE'},{c:'sys',t:`PROVIDER: ${S.settings.provider==='none'?'未連線':S.settings.provider} · MODE: ${S.mode==='demo'?'DEMO':'USER'}`},{c:'dim',t:'此預覽版沒有後端，因此不會呼叫 Gemini 或 OpenAI。以下分析由「規則式引擎」依你的資料計算，不是 AI 回答。'}]);
  const [q,setQ]=useState('');const [busy,setBusy]=useState(false);const termRef=useRef();
  useEffect(()=>{if(termRef.current)termRef.current.scrollTop=termRef.current.scrollHeight},[lines]);
  const consentOk=S.settings.aiConsent.summary;
  const A=useMemo(()=>ruleAnalyses(S,D),[S,D]);
  const run=key=>{if(busy)return;if(!consentOk){setLines(l=>[...l,{c:'sys',t:'[拒絕] 尚未授權「彙總統計資料」用於分析。請到「系統設定 → AI 資料使用授權」開啟。'}]);return}
    const a=A[key];setBusy(true);const out=[{c:'usr',t:`> ${a.title}`},{c:'sys',t:'[規則式引擎 // 非 AI 回應]'},...a.lines.map(t=>({c:'',t}))];
    if(REDUCED){setLines(l=>[...l,...out]);setBusy(false);return}
    let i=0;const tick=()=>{setLines(l=>[...l,out[i]]);i++;if(i<out.length)setTimeout(tick,90);else setBusy(false)};setLines(l=>[...l,{c:'dim',t:'COMPUTING …'}]);setTimeout(tick,350)};
  const ask=e=>{e.preventDefault();const s=q.trim();if(!s)return;setQ('');
    const map=[['收入','income'],['支出','income'],['訂閱','recurring'],['固定','recurring'],['持續','recurring'],['時間','time'],['心力','energy'],['累','energy'],['精神','energy'],['轉化','convert'],['資產','convert'],['技能','convert']];
    const hit=map.find(([k])=>s.includes(k));
    if(hit)return run(hit[1]);
    setLines(l=>[...l,{c:'usr',t:`> ${s}`},{c:'sys',t:'[AI 未連線] 自由提問需要 Gemini 或 OpenAI。規則式引擎可處理的主題：收入、支出、訂閱／固定支出、時間、心力、支出轉化資產。'}])};
  const draft=()=>{if(!consentOk)return act.toast('請先授權彙總資料使用。');const d=draftFromData(S,D);if(!d)return act.toast('沒有進行中的專案可產生草案。');act.update(s=>{s.suggestions.unshift(d)},{action:'建立待核准草案',entity:'ai_suggestions',detail:d.title});act.toast('已建立待核准草案。尚未寫入任何正式資料。')};
  const pending=S.suggestions.filter(s=>s.status==='pending'),done=S.suggestions.filter(s=>s.status!=='pending');
  return html`<div className="page">
    <${PageHead} en="WEALTH STRATEGIST // AI INTELLIGENCE CORE" title="AI 財富策略師"><${Chip} tone="w"><i className="dot"></i>AI 未連線</${Chip}><${Chip} tone="c">規則式引擎可用</${Chip}><//>
    <div className="grid g-dash">
      <div className="stack" style=${{gap:16}}>
        <div className="term" ref=${termRef} aria-live="polite">${lines.map((l,i)=>html`<div key=${i} className=${'ln '+l.c}>${l.t}</div>`)}<div className=${busy?'ln caret':'ln dim'}>${busy?'':'_'}</div></div>
        <form className="flex" style=${{flexWrap:'nowrap'}} onSubmit=${ask}><input id="ai-q" className="inp mono" placeholder="輸入問題，例如：我的時間花在哪裡？" value=${q} onChange=${e=>setQ(e.target.value)}/><button className="btn pri" type="submit" disabled=${busy}>送出</button></form>
        <div className="flex">${[['income','分析收入與支出'],['recurring','持續性支出'],['time','時間配置'],['energy','心力消耗與恢復'],['convert','支出轉化資產']].map(([k,l])=>html`<button key=${k} className="btn sm" disabled=${busy} onClick=${()=>run(k)}>${l}</button>`)}<button className="btn sm pri" onClick=${draft}>產生培育計畫草案</button></div>
        <div className="note">AI 只能提出建議、產生專案草案與待核准任務；不會修改交易、刪除帳戶或專案、修改資產價值、把預測寫成實際收入，或執行任何金融交易。所有正式寫入都需你核准，並記錄在異動紀錄。</div>
      </div>
      <div className="stack" style=${{gap:16}}>
        <${Panel} eyebrow="PROVIDERS" title="多模型架構">
          <div className="rows">${[['Google Gemini','第一版串接'],['OpenAI','第一版串接'],['Claude','預留供應商']].map(([n,s])=>html`<div key=${n} className="row"><span className="grow">${n}<div className="tiny muted">${s}</div></span><${Chip} tone="w">未連線</${Chip}></div>`)}</div>
          <div className="tiny muted" style=${{marginTop:8}}>正式版經由伺服器端 AI Provider Interface 呼叫，金鑰只存在伺服器環境，不會進入前端。本月 AI 呼叫：0 次 · 費用 NT$0。</div>
        <//>
        <${Panel} eyebrow="DATA ACCESS" title="資料授權">
          <div className="rows">${[['summary','彙總統計資料'],['projects','專案與里程碑'],['raw','逐筆交易明細']].map(([k,l])=>html`<div key=${k} className="row"><span className="grow small">${l}</span>${S.settings.aiConsent[k]?html`<${Chip} tone="ok">已授權</${Chip}>`:html`<${Chip}>未授權</${Chip}>`}</div>`)}</div>
          <button className="btn sm" style=${{marginTop:8}} onClick=${()=>act.nav('settings')}>變更授權</button>
        <//>
      </div>
    </div>
    <${Panel} eyebrow="APPROVAL QUEUE" title=${`待核准草案（${pending.length}）`}>
      <div className="stack">${pending.map(s=>html`<${SuggestionCard} key=${s.id} s=${s}/>`)}${!pending.length&&html`<div className="small muted">沒有待核准的草案。</div>`}</div>
    <//>
    ${done.length>0&&html`<${Panel} title="已處理草案"><div className="rows">${done.map(s=>html`<div key=${s.id} className="row"><span className="grow">${s.title}<div className="tiny muted">${s.source} · ${fmtD(s.decided)}</div></span>${s.status==='approved'?html`<${Chip} tone="ok">已核准</${Chip}>`:html`<${Chip} tone="b">已駁回</${Chip}>`}</div>`)}</div><//>`}
  </div>`}
function SuggestionCard({s}){const {act}=useCtx();
  const decide=d=>act.update(st=>{const r=decideSuggestion(st,s.id,d);Object.assign(st,r.state)},null); // audit entry is written by the engine
  const approve=()=>act.confirm('核准並建立正式計畫？',`會建立專案「${s.title}」，狀態為「構想」。預估效益只會記為預測，不會寫成實際收入；任何交易、帳戶與資產數值都不會被修改。`,()=>{decide('approve');haptic.success();act.toast('已核准並建立計畫。')});
  return html`<div className="sugg">
    <div className="flex between"><div><div className="eyebrow" style=${{color:'var(--violet)'}}>${s.source}</div><h2>${s.title}</h2></div><${Chip} tone="v">草案 · 待核准</${Chip}></div>
    <dl className="kv"><dt>發現</dt><dd>${s.finding}</dd><dt>資料依據</dt><dd>${s.basis}</dd><dt>建議原因</dt><dd>${s.reason}</dd><dt>可行方案</dt><dd>${s.plan}</dd><dt>預估金錢</dt><dd><${Money} c=${s.money}/></dd><dt>預估時間</dt><dd>${fmtMin(s.timeMin)}</dd><dt>心力負擔</dt><dd>${s.energy}</dd><dt>潛在效益</dt><dd>${s.benefit}</dd><dt>主要風險</dt><dd>${s.risks}</dd><dt>執行步驟</dt><dd><ol style=${{margin:0,paddingLeft:18}}>${(s.steps||[]).map((x,i)=>html`<li key=${i}>${x}</li>`)}</ol></dd><dt>衡量方法</dt><dd>${s.measure}</dd></dl>
    <div className="flex" style=${{justifyContent:'flex-end'}}><button className="btn danger" onClick=${()=>decide('reject')}>駁回</button><button className="btn pri" onClick=${approve}><${Icon} n="check" s=${15}/>核准並建立計畫</button></div></div>`}

function Reports(){
  const {S,D,act}=useCtx();const [mk,setMk]=useState(addMonths(monthKey(D.T),-1));const [gen,setGen]=useState(false);
  const f=D.flow(mk+'-01',monthEnd(mk));const prev=D.flow(addMonths(mk,-1)+'-01',monthEnd(addMonths(mk,-1)));
  const as=D.actStats(mk+'-01',monthEnd(mk));const wk=D.a7;const wf=D.flow(addDays(D.T,-6),D.T);
  const months=D.months.map(m=>m.k).reverse();
  const make=()=>{setGen(true);if(!(S.flags&&S.flags.monthlyReport))act.update(s=>{s.flags={...(s.flags||{}),monthlyReport:true}},{action:'產生月報',entity:'reports',detail:mk},true)};
  const delta=(a,b)=>b?Math.round((a-b)/Math.abs(b)*100):null;
  return html`<div className="page">
    <${PageHead} en="ANALYTICS" title="分析報告"><select id="rp-month" className="inp" style=${{width:'auto'}} value=${mk} onChange=${e=>{setMk(e.target.value);setGen(false)}}>${months.map(m=>html`<option key=${m} value=${m}>${m.replace('-',' 年 ')} 月</option>`)}</select><button className="btn pri" onClick=${make}>產生月報</button><//>
    <div className="note">AI 分析：未連線。以下為規則式統計報告，不是 AI 報告。週報與月報的自動排程與 Email 寄送需正式後端（第三階段）。</div>
    <${Panel} eyebrow="WEEKLY INSPECTION" title="每週資源巡檢（近 7 日）">
      <div className="grid g3"><div><div className="tiny muted">金錢</div><div>收入 <${Money} c=${wf.inc}/> · 支出 <${Money} c=${wf.exp}/></div></div><div><div className="tiny muted">時間</div><div>${fmtMin(wk.min)}，專案 ${fmtMin(wk.projMin)}</div></div><div><div className="tiny muted">心力</div><div>平均 ${wk.avg==null?'—':wk.avg.toFixed(1)}，恢復活動占 ${wk.posShare==null?'—':Math.round(wk.posShare*100)+'%'}</div></div></div>
    <//>
    ${gen?html`<div className="grid g2">
      <${Panel} eyebrow=${'MONTHLY REPORT · '+mk} title="每月財務報告">
        <dl className="kv"><dt>實際收入</dt><dd><${Money} c=${f.inc}/> ${delta(f.inc,prev.inc)!=null?html`<span className="tiny muted">較前月 ${delta(f.inc,prev.inc)>0?'+':''}${delta(f.inc,prev.inc)}%</span>`:''}</dd><dt>已實現投資損益</dt><dd><${Money} c=${f.real}/></dd><dt>支出</dt><dd><${Money} c=${f.exp}/> ${delta(f.exp,prev.exp)!=null?html`<span className="tiny muted">較前月 ${delta(f.exp,prev.exp)>0?'+':''}${delta(f.exp,prev.exp)}%</span>`:''}</dd><dt>淨現金流</dt><dd><${Money} c=${f.net} sign color/></dd><dt>月底淨資產</dt><dd><${Money} c=${(D.months.find(m=>m.k===mk)||{}).netWorth}/> <span className="tiny muted">（其他資產與負債以目前值近似）</span></dd></dl>
      <//>
      <${Panel} title="收入來源比較"><${Bars} items=${Object.entries(f.ic).sort((a,b)=>b[1]-a[1])} total=${f.inc} colorFn=${c=>catColor(c,allCats(S,'income'))}/><//>
      <${Panel} title="支出分類統計"><${Bars} items=${Object.entries(f.ec).filter(x=>x[1]).sort((a,b)=>b[1]-a[1])} total=${f.exp} colorFn=${c=>catColor(c,allCats(S,'expense'))}/><//>
      <${Panel} title="資產負債摘要（目前）"><dl className="kv"><dt>總資產</dt><dd><${Money} c=${D.now.assets}/></dd><dt>總負債</dt><dd><${Money} c=${D.now.liab}/></dd><dt>淨資產</dt><dd><${Money} c=${D.now.net}/></dd></dl><//>
      <${Panel} title="時間使用分析"><${Bars} items=${Object.entries(as.byKind).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v*100])} colorFn=${k=>CAT_COL[ACT_KINDS.indexOf(k)%CAT_COL.length]}/><div className="tiny muted" style=${{marginTop:6}}>單位：分鐘（合計 ${fmtMin(as.min)}）</div><//>
      <${Panel} title="心力變化分析"><div>平均 ${as.avg==null?'—':as.avg.toFixed(2)} · ${as.count} 項活動</div><div className="small muted">消耗：${as.drains.map(a=>a.title).join('、')||'—'}</div><div className="small muted">恢復：${as.recov.map(a=>a.title).join('、')||'—'}</div><//>
      <${Panel} title="專案培育成果" className="full"><div className="tbl-wrap"><table className="tbl"><thead><tr><th>專案</th><th>狀態</th><th className="r">累計投入</th><th className="r">時間</th><th className="r">實際收益</th><th>預測收益（非實際）</th></tr></thead><tbody>${S.projects.map(p=>html`<tr key=${p.id}><td>${p.name}</td><td>${p.status}</td><td className="r"><${Money} c=${D.pm[p.id].money}/></td><td className="r num">${fmtMin(D.pm[p.id].time)}</td><td className="r"><${Money} c=${D.pm[p.id].income}/></td><td className="small muted">${p.expectedAmt?fmt(p.expectedAmt)+'／月（預測）':'—'}</td></tr>`)}</tbody></table></div><//>
    </div>`:html`<${Empty} text=${`選擇月份後按「產生月報」，依 ${mk} 的資料即時計算。`}/>`}
    <${Panel} eyebrow="TREND" title="淨資產趨勢（12 個月）"><${LineChart} labels=${D.months.map(m=>m.k.slice(2).replace('-','/'))} series=${[{key:'nw',name:'淨資產',color:'#00F5D4',values:D.months.map(m=>m.netWorth)}]}/><//>
  </div>`}

function Notifications(){const {S,D,act}=useCtx();const read=new Set(S.notifRead);
  return html`<div className="page"><${PageHead} en="ALERTS" title="通知中心"><button className="btn" onClick=${()=>act.update(s=>{s.notifRead=[...new Set([...s.notifRead,...D.notes.map(n=>n.id)])]},{action:'全部標為已讀',entity:'notifications',detail:`${D.notes.length} 則`},true)}>全部標為已讀</button><//>
    <div className="rows">${D.notes.map(n=>html`<div key=${n.id} className="row click" style=${{opacity:read.has(n.id)?0.6:1}} onClick=${()=>{if(!read.has(n.id))act.update(s=>{s.notifRead.push(n.id)},null,true);if(n.page)act.nav(n.page)}}><${Chip} tone=${n.tone}>${n.type}</${Chip}><span className="grow small">${S.privacy&&n.sensitive?n.text.replace(/(NT\$|US\$|HK\$|¥)[\d,.]+/g,'•••'):n.text}</span>${!read.has(n.id)&&html`<i className="dot" style=${{color:'var(--pink)'}}></i>`}</div>`)}</div>
    ${!D.notes.length&&html`<${Empty} text="目前沒有通知。"/>`}
    <div className="note">Email 通知需要正式後端與寄信服務（第三階段）。預設會隱藏敏感金額；可在設定調整隱私程度。</div></div>`}

function Settings(){
  const {S,D,act}=useCtx();
  const doExport=async k=>{const stamp=todayISO();const name=k==='json'?`WealthGarden-backup-${stamp}.json`:`WealthGarden-transactions-${stamp}.csv`;const t=k==='json'?JSON.stringify({app:'wealth-garden',exportedAt:nowTs(),state:S},null,1):toCSV(S);
    try{if(await shareTextFile(name,t)){act.update(()=>{},{action:k==='json'?'匯出完整備份':'匯出交易 CSV',entity:'export',detail:name});return}}catch(x){if(!/cancel/i.test(String(x&&x.message||x)))act.toast('無法開啟分享選單，改以文字顯示。')}
    setExp({k,t})};const [hr,setHr]=useState(String(S.settings.hourly/100));const [exp,setExp]=useState(null);const [imp,setImp]=useState(null);const [newCat,setNewCat]=useState({kind:'expense',name:''});
  const [bud,setBud]=useState(()=>Object.fromEntries(Object.entries(S.budgets).map(([k,v])=>[k,String(v/100)])));const [bk,setBk]=useState('');
  const ops=S.settings.opsBudget||defaultOps();const opsSum=ops.items.reduce((s,i)=>s+i.v,0);
  return html`<div className="page"><${PageHead} en="SETTINGS" title="系統設定"/>
    <${PwaInstallPanel}/>
    <${CloudPanel}/>
    <div className="grid g2">
      <${Panel} title="基本偏好">
        <div className="form">
          <${Field} label="主要幣別"><select id="st-cur" className="inp" disabled><option>TWD 新臺幣</option></select><//>
          <${Field} label="參考時薪（TWD）" hint="只用於時間機會成本參考"><div className="flex" style=${{flexWrap:'nowrap'}}><input id="st-hr" className="inp num" value=${hr} onChange=${e=>setHr(e.target.value)}/><button className="btn" onClick=${()=>{const v=parseC(hr);if(!(v>=0))return;act.update(s=>{s.settings.hourly=v},{action:'更新參考時薪',entity:'user_preferences',detail:fmt(v)});act.toast('已更新參考時薪。')}}>儲存</button></div><//>
          <${Field} label="初始快照日" hint="早於此日的匯入交易只計入歷史統計"><input id="st-snap" className="inp" type="date" value=${S.settings.snapshotDate} onChange=${e=>act.update(s=>{s.settings.snapshotDate=e.target.value},{action:'變更快照日',entity:'user_preferences',detail:e.target.value})}/><//>
          <${Field} label="Email 通知隱私"><select id="st-mail" className="inp" value=${S.settings.emailPrivacy} onChange=${e=>act.update(s=>{s.settings.emailPrivacy=e.target.value},{action:'變更 Email 隱私',entity:'user_preferences',detail:e.target.value})}><option value="hide">隱藏敏感金額（預設）</option><option value="partial">只顯示百分比</option><option value="full">顯示完整金額</option></select><//>
        </div>
      <//>
      <${Panel} title="AI 資料使用授權">
        <div className="stack">${[['summary','允許使用彙總統計資料（收支總額、分類比例、時間與心力平均）'],['projects','允許使用專案、里程碑與成果'],['raw','允許傳送逐筆交易明細（含說明文字）']].map(([k,l])=>html`<label key=${k} className="chk"><input type="checkbox" checked=${S.settings.aiConsent[k]} onChange=${e=>{const v=e.target.checked;act.update(s=>{s.settings.aiConsent[k]=v},{action:'變更 AI 資料授權',entity:'user_preferences',detail:`${l}：${v?'允許':'拒絕'}`})}}/>${l}</label>`)}
        <div className="tiny muted">授權設定在正式版會由伺服器端強制執行；此預覽版沒有資料會被送出。</div></div>
      <//>
      <${Panel} title="預算">
        <div className="rows">${Object.entries(bud).map(([k,v])=>html`<div key=${k} className="row"><span className="grow">${k}<div className="tiny muted">本月已用 ${S.privacy?'•••':fmt(D.month.ec[k]||0)}</div></span><input id=${'bd-'+k} className="inp num" style=${{maxWidth:120}} value=${v} onChange=${e=>setBud({...bud,[k]:e.target.value})}/><button className="btn ghost sm" aria-label="移除" onClick=${()=>{const b={...bud};delete b[k];setBud(b)}}><${Icon} n="x" s=${14}/></button></div>`)}</div>
        <div className="flex" style=${{marginTop:8}}><select id="bd-new" className="inp" style=${{maxWidth:160}} value=${bk} onChange=${e=>setBk(e.target.value)}><option value="">新增類別預算</option>${allCats(S,'expense').filter(c=>!(c in bud)).map(c=>html`<option key=${c}>${c}</option>`)}</select><button className="btn sm" onClick=${()=>{if(bk){setBud({...bud,[bk]:''});setBk('')}}}>加入</button><span style=${{flex:1}}></span><button className="btn pri sm" onClick=${()=>{const o={};for(const [k,v] of Object.entries(bud)){const x=parseC(v);if(x>0)o[k]=x}act.update(s=>{s.budgets=o},{action:'更新預算',entity:'budgets',detail:Object.keys(o).join('、')});act.toast('預算已儲存。')}}>儲存預算</button></div>
      <//>
      <${Panel} title="自訂類別">
        <div className="flex">${['income','expense'].map(k=>(S.customCats[k]||[]).map(c=>html`<${Chip} key=${k+c} tone=${k==='income'?'ok':'b'}>${c}</${Chip}>`))}</div>
        <form className="flex" style=${{marginTop:8}} onSubmit=${e=>{e.preventDefault();const n=newCat.name.trim();if(!n||allCats(S,newCat.kind).includes(n))return;act.update(s=>{s.customCats[newCat.kind]=[...(s.customCats[newCat.kind]||[]),n]},{action:'新增自訂類別',entity:'categories',detail:n});setNewCat({...newCat,name:''})}}><select id="cc-kind" className="inp" style=${{maxWidth:110}} value=${newCat.kind} onChange=${e=>setNewCat({...newCat,kind:e.target.value})}><option value="expense">支出</option><option value="income">收入</option></select><input id="cc-name" className="inp" style=${{maxWidth:180}} placeholder="類別名稱" value=${newCat.name} onChange=${e=>setNewCat({...newCat,name:e.target.value})}/><button className="btn sm" type="submit">新增</button></form>
      <//>
    </div>
    <${Panel} eyebrow="OPERATIONS BUDGET" title="營運預算管理（目標每月 NT$1,000）">
      <div className="note" style=${{marginBottom:10}}>正式雲端供應商尚未核准。下列為你自行填入的預估，系統不會宣稱任何方案的實際價格。順序：先保留安全、資料庫、備份與必要服務，再分配 AI 預算。應用程式內的 AI 呼叫限制，不能保證第三方雲端平台的所有外部帳單都會自動停止。</div>
      <div className="tbl-wrap"><table className="tbl"><tbody>${ops.items.map((it,i)=>html`<tr key=${it.k}><td>${it.k}</td><td className="r"><input id=${'ops-'+i} className="inp num" style=${{maxWidth:120,marginLeft:'auto'}} value=${it.v/100} onChange=${e=>{const v=parseC(e.target.value)||0;act.update(s=>{const o=s.settings.opsBudget||(s.settings.opsBudget=defaultOps());o.items[i].v=v},null,true)}}/></td></tr>`)}
        <tr><td><b>合計</b></td><td className="r"><b className=${'num '+(opsSum>ops.total?'neg':opsSum>ops.total*0.8?'warn':'pos')}>${fmt(opsSum)} / ${fmt(ops.total)}</b></td></tr></tbody></table></div>
      ${opsSum>ops.total&&html`<div className="errs" style=${{marginTop:8}}>預估超出每月預算。正式版會限制非必要 AI 呼叫並保留帳務功能；超出預算的方案需你核准。</div>`}
    <//>
    <div className="grid g2">
      <${Panel} title="資料匯入（CSV／Excel）"><${Importer}/><//>
      <${Panel} title="資料匯出與重設">
        <div className="flex"><button className="btn" onClick=${()=>doExport('json')}>匯出完整備份（JSON）</button><button className="btn" onClick=${()=>doExport('csv')}>匯出交易 CSV</button><${RestoreBackup}/></div>
        <div className="tiny muted" style=${{marginTop:6}}>${isNative?'匯出會開啟 Android 分享選單，可存到雲端硬碟或傳給自己。備份檔含財務資料，請妥善保管，不要傳到公開群組。':'PWA／瀏覽器版會下載 JSON 或 CSV；若下載不受支援，會提供文字複製備援。備份含個人財務資料，請自行妥善保管。'}</div>
        <div className="hr" style=${{margin:'12px 0'}}></div>
        <div className="flex"><button className="btn" onClick=${()=>act.confirm('重新載入示範資料？','目前瀏覽器中的所有資料會被示範資料取代。',()=>act.replace(seed(),'重新載入示範資料'))}>重新載入示範資料</button><button className="btn danger" onClick=${()=>act.confirm('清除所有資料並開始設定？','會刪除此瀏覽器中的所有紀錄（包含示範資料），然後開啟首次使用設定精靈。',()=>{act.replace(blankState(),'清除全部資料');act.wizard()})}>清除資料並開始設定</button></div>
      <//>
    </div>
    <${Panel} eyebrow="AUDIT LOG" title="異動紀錄"><div className="tbl-wrap" style=${{maxHeight:320,overflow:'auto'}}><table className="tbl"><thead><tr><th>時間</th><th>動作</th><th>資料表</th><th>內容</th></tr></thead><tbody>${S.audit.slice().reverse().slice(0,200).map(a=>html`<tr key=${a.id}><td className="num small">${a.ts.slice(0,16).replace('T',' ')}</td><td>${a.action}</td><td className="mono small">${a.entity}</td><td className="small">${S.privacy?a.detail.replace(/(NT\$|US\$|HK\$|¥)[\d,.]+/g,'•••'):a.detail}${a.before&&html`<details><summary className="tiny muted">修改前／後</summary><pre className="tiny mono" style=${{whiteSpace:'pre-wrap'}}>${JSON.stringify({before:a.before,after:a.after})}</pre></details>`}</td></tr>`)}</tbody></table></div><//>
    <${FeatureStatus}/>
    ${exp&&html`<${Modal} wide title=${exp.k==='json'?'匯出 JSON':'匯出 CSV'} onClose=${()=>setExp(null)} footer=${html`<button className="btn pri" onClick=${e=>{const ta=document.getElementById('exp-ta');navigator.clipboard&&navigator.clipboard.writeText(exp.t).then(()=>act.toast('已複製到剪貼簿。'),()=>{ta.select();act.toast('請按 Ctrl/Cmd + C 複製已選取的文字。')})}}><${Icon} n="copy" s=${15}/>複製</button>`}><textarea id="exp-ta" className="inp mono" style=${{minHeight:300,fontSize:12}} readOnly value=${exp.t} onFocus=${e=>e.target.select()}></textarea><//>`}
  </div>`}
function Importer(){const {S,act}=useCtx();const [rows,setRows]=useState(null);const [def,setDef]=useState(S.accounts[0]?S.accounts[0].id:'');const [err,setErr]=useState('');const [paste,setPaste]=useState('');
  const analyze=text=>{setErr('');const r=analyzeImport(S,text,def);if(r.error)return setErr(r.error);setRows(r.rows)}; // dedupe + snapshot rules: src/engine/csv.ts
  const file=async e=>{const fl=e.target.files[0];if(!fl)return;try{if(/\.xlsx?$/i.test(fl.name)){const XLSX=await import('xlsx');const wb=XLSX.read(await fl.arrayBuffer(),{type:'array',cellDates:false});analyze(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]],{rawNumbers:true}))}else analyze(await fl.text())}catch(x){setErr('無法讀取檔案：'+(x&&x.message||x))}e.target.value=''};
  const commit=()=>{const txs=importRowsToTx(S,rows);act.update(s=>{s.txs.push(...txs)},{action:'匯入歷史交易',entity:'transactions',detail:`${txs.length} 筆（略過重複 ${rows.filter(r=>r.status==='dup').length}、錯誤 ${rows.filter(r=>r.status==='err').length}）`});haptic.success();act.toast(`已匯入 ${txs.length} 筆。`);setRows(null)};
  return html`<div className="stack">
    <div className="small muted">欄位：日期, 類型(收入/支出/退款), 金額, 幣別, 類別, 帳戶, 說明。避免重複計算的規則：① 與既有紀錄相同（日期＋類型＋金額＋說明）者略過；② 檔案內重複者略過；③ 早於初始快照日者只計入歷史統計、不改變帳戶餘額。</div>
    <div className="flex"><label className="btn" htmlFor="imp-file"><${Icon} n="upload" s=${15}/>選擇 CSV／Excel 檔</label><input id="imp-file" type="file" accept=".csv,.txt,.xlsx,.xls" hidden onChange=${file}/>
      <select id="imp-def" className="inp" style=${{maxWidth:200}} aria-label="預設帳戶" value=${def} onChange=${e=>setDef(e.target.value)}>${S.accounts.map(a=>html`<option key=${a.id} value=${a.id}>預設帳戶：${a.name}</option>`)}</select></div>
    <details className="fold"><summary className="small muted">或貼上 CSV 文字</summary><textarea id="imp-paste" className="inp mono" style=${{marginTop:6,fontSize:12}} value=${paste} onChange=${e=>setPaste(e.target.value)} placeholder=${'日期,類型,金額,幣別,類別,帳戶,說明\n2026-06-01,支出,120,TWD,飲食,錢包現金,午餐'}></textarea><button className="btn sm" style=${{marginTop:6}} onClick=${()=>analyze(paste)}>分析</button></details>
    ${err&&html`<div className="errs">${err}</div>`}
    ${rows&&html`<${Modal} wide title="匯入預覽" onClose=${()=>setRows(null)} footer=${html`<button className="btn ghost" onClick=${()=>setRows(null)}>取消</button><button className="btn pri" disabled=${!rows.some(r=>r.status==='ok'||r.status==='snap')} onClick=${commit}>確認匯入 ${rows.filter(r=>r.status==='ok'||r.status==='snap').length} 筆</button>`}>
      <div className="tbl-wrap" style=${{maxHeight:'50vh',overflow:'auto'}}><table className="tbl"><thead><tr><th>列</th><th>日期</th><th>類型</th><th className="r">金額</th><th>帳戶</th><th>說明</th><th>處理</th></tr></thead><tbody>${rows.map(r=>html`<tr key=${r.line}><td className="num">${r.line}</td><td className="num">${r.date}</td><td>${TYPES[r.type]||'?'}</td><td className="r num">${isNaN(r.amt)?'—':fmt(r.amt)}</td><td>${r.accName}</td><td>${r.desc}</td><td>${r.status==='ok'?html`<${Chip} tone="ok">匯入</${Chip}>`:r.status==='snap'?html`<${Chip} tone="w">歷史參考</${Chip}>`:r.status==='dup'?html`<${Chip}>略過</${Chip}>`:html`<${Chip} tone="b">錯誤</${Chip}>`}<div className="tiny muted">${r.note}</div></td></tr>`)}</tbody></table></div><//>`}
  </div>`}
function RestoreBackup(){const {act}=useCtx();const [pending,setPending]=useState(null);
  const pick=async e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;try{const j=JSON.parse(await fl.text());const st=migrateBackup(j);if(!st)return act.toast('這不是有效的財富花園備份檔。');setPending({st,name:fl.name})}catch{act.toast('備份檔無法讀取。')}};
  return html`<label className="btn" htmlFor="restore-file"><${Icon} n="upload" s=${15}/>從備份還原</label><input id="restore-file" type="file" accept="application/json,.json" hidden onChange=${pick}/>
    ${pending&&html`<${Modal} title="從備份還原？" onClose=${()=>setPending(null)} footer=${html`<button className="btn ghost" onClick=${()=>setPending(null)}>取消</button><button className="btn danger" onClick=${()=>{act.replace(pending.st,'從備份還原：'+pending.name);setPending(null);act.toast('已從備份還原。')}}>以備份取代目前資料</button>`}>
      <p style=${{margin:0}}>備份「${pending.name}」包含 ${pending.st.txs.length} 筆交易、${pending.st.accounts.length} 個帳戶。目前裝置上的資料會被取代；建議先匯出一份目前的備份。</p><//>`}`}
function migrateBackup(j){const raw=j&&j.app==='wealth-garden'&&j.state?j.state:j;return migrateState(raw)}
function PwaInstallPanel(){
  const [installable,setInstallable]=useState(canPromptPwaInstall());
  const [status,setStatus]=useState('');
  useEffect(()=>listenPwaInstallChange(()=>setInstallable(canPromptPwaInstall())),[]);
  if(isNative)return null;
  const installed=isPwaInstalled();
  const ios=isIosBrowser();
  const install=async()=>{
    const outcome=await promptPwaInstall();
    setStatus(outcome==='accepted'?'已接受安裝，請稍候查看主畫面。':outcome==='dismissed'?'已取消安裝，稍後仍可從瀏覽器選單安裝。':'請使用瀏覽器選單的「安裝應用程式」或「加入主畫面」。');
  };
  return html`<${Panel} eyebrow="INSTALLABLE WEB APP" title="安裝財富花園 PWA">
    <p className="small muted" style=${{margin:'0 0 8px'}}>安裝後可從手機主畫面啟動，首次完整連線載入後可離線使用主要記帳功能。PWA 不需 APK，但必須從 HTTPS 網站安裝。</p>
    ${installed?html`<${Chip} tone="ok">目前已在 PWA 模式</${Chip}>`:installable?html`<button className="btn pri" onClick=${install}>安裝財富花園</button>`:ios?html`<div className="note c">iPhone／iPad：請用 Safari 開啟本站，點選「分享」，再選擇「加入主畫面」並確認新增。部分系統版本的選單位置略有不同。</div>`:html`<div className="note c">Android Chrome／Edge：從瀏覽器選單選擇「安裝應用程式」或「加入主畫面」。若沒有選項，請確認你使用 HTTPS 網站且已完成首次載入。</div>`}
    ${status&&html`<div className="small muted" role="status" style=${{marginTop:8}}>${status}</div>`}
    <div className="tiny muted" style=${{marginTop:8}}>帳務資料不會因安裝 PWA 而自動同步。請定期在「系統設定 → 資料匯出與重設」下載 JSON 備份。</div>
  <//>`}
function CloudPanel(){const {S,act}=useCtx();const [st,setSt]=useState(null);
  return html`<${Panel} eyebrow="ACCOUNT & CLOUD" title="帳號與雲端">
    <div className="note" style=${{marginBottom:10}}>這是${BUILD_LABEL}：目前沒有帳號登入，${isNative?'資料只保存在 Android App 私有儲存區':'資料只保存在目前網站來源／已安裝 PWA 的瀏覽器本機儲存空間'}，不會主動上傳，也不會跨裝置同步。多人帳號、資料隔離與雲端備份需要部署後端後才會開放，本版不宣稱具備正式多人服務。</div>
    <dl className="kv"><dt>雲端服務</dt><dd>${apiConfigured?'已設定（HTTPS）':'未設定'}</dd><dt>登入狀態</dt><dd>未登入（內部測試版不提供帳號）</dd><dt>資料位置</dt><dd>${isNative?'Android App 私有儲存區（已排除系統自動備份）':'此瀏覽器的 localStorage'}</dd><dt>版本</dt><dd>v${VERSION}（資料格式 v${STATE_VERSION}）· ${platform}</dd></dl>
    <div className="flex" style=${{marginTop:10}}><button className="btn" onClick=${async()=>{setSt({loading:true});const r=await checkHealth();setSt(r)}}>測試雲端連線</button>${st&&(st.loading?html`<span className="small muted">連線中…</span>`:st.ok?html`<${Chip} tone="ok">連線正常</${Chip}>`:html`<span className="small warn">${st.error.message}</span>`)}</div>
    <div className="hr" style=${{margin:'12px 0'}}></div>
    <button className="btn danger" onClick=${()=>act.confirm('刪除此裝置／瀏覽器中的所有財富花園資料？','所有交易、帳戶、專案與設定都會從此裝置永久刪除，無法復原。建議先匯出備份。',()=>{act.replace(blankState(),'刪除本機全部資料');act.wizard()})}>刪除本機全部資料</button>
    <details className="fold" style=${{marginTop:10}}><summary className="small muted">隱私說明</summary><div className="small stack" style=${{marginTop:6,gap:6}}>
      <div>• ${isNative?'資料存於 Android 私有儲存區；系統備份已排除':'資料存於這個網站來源的 localStorage；清除網站資料、部分瀏覽器儲存空間清理或移除 PWA 可能導致遺失。請定期匯出 JSON 備份'}。</div>
      <div>• App 不要求存取聯絡人、位置、相機或公開儲存空間；僅使用網路權限（未來的 HTTPS 雲端服務）。</div>
      <div>• ${isNative?'Android 正式版遮蔽最近使用畫面及截圖':'PWA 受瀏覽器與作業系統控制，無法保證阻擋截圖；請妥善保管裝置並啟用隱私遮罩'}。</div>
      <div>• App 內沒有任何 AI 或雲端 API 金鑰；AI 功能未來將透過伺服器端代理呼叫，並依你在下方的授權範圍傳送資料。</div>
      <div>• 你可以隨時匯出全部資料，或刪除本機全部資料。完整說明見原始碼中的 docs/PRIVACY.md。</div></div></details>
  <//>`}
function FeatureStatus(){const done=['主控制台（Wealth Pulse、資產結構、現金流、三維雷達、花園概覽、洞察）','收支管理：新增／編輯／軟刪除與復原、搜尋與篩選、範本、重複紀錄、對帳、回收區','帳務規則（已有 17 項自動測試）：轉帳、信用卡應付與繳款、換匯（原幣＋成交匯率）、退款、投資本金、已實現與未實現損益','多帳戶、多幣別、手動匯率、資產與負債、評價更新','三維資源紀錄（金錢／時間／心力），日／7 日／30 日心力統計','專案成本與時間分攤（≤100%），心力不重複計入','財富花園植物卡、成長規則、收入星系、成長時間軸','AI 策略師介面、資料授權、草案核准流程（AI 無寫入路徑）、規則式分析（明確標示非 AI）','分析報告（週巡檢、月報）、通知中心、成就','CSV／Excel 匯入（去重與快照規則）、JSON 備份匯出與還原、CSV 匯出（Android 分享選單／PWA 下載）','Android：返回鍵、系統列安全邊界、鍵盤避讓、觸覺回饋；PWA：加入主畫面、離線快取、手動確認更新；共用本機資料與錯誤復原'];
  const todo=['雲端資料庫、跨裝置同步與每日加密備份（目前只存在各個裝置／瀏覽器的本機儲存空間）','帳號、Email／Google 登入、多因素驗證、多人資料隔離（後端結構已撰寫，尚未部署）','Gemini／OpenAI 串接（伺服器端代理已撰寫，尚未部署與測試）、AI 用量與費用控管','週報／月報後端排程、Email 通知','自動市場匯率、貸款本息自動拆分','Google Play 上架用 App Bundle 與商店審查'];
  return html`<${Panel} eyebrow=${'BUILD v'+VERSION} title="已完成／未完成功能"><div className="grid g2"><div><h3 className="pos" style=${{marginBottom:6}}>v1.0.0 已完成（內部測試版）</h3><ul className="small" style=${{margin:0,paddingLeft:18}}>${done.map(x=>html`<li key=${x}>${x}</li>`)}</ul></div><div><h3 className="warn" style=${{marginBottom:6}}>尚未完成（需部署後端）</h3><ul className="small" style=${{margin:0,paddingLeft:18}}>${todo.map(x=>html`<li key=${x}>${x}</li>`)}</ul></div></div><//>`}

/* ---------- wizard ---------- */
function Wizard({onClose}){
  const {S,act}=useCtx();const [i,setI]=useState(0);
  const [w,setW]=useState({cur:'TWD',hourly:'',accounts:[{name:'',kind:'bank',cur:'TWD',opening:''}],assets:[{name:'',type:'other',value:''}],liabs:[{name:'',balance:''}],importLater:true,goal:'',consent:{summary:false,projects:false,raw:false}});
  const steps=['歡迎進入財富花園','選擇主要幣別','設定參考時薪','建立金融帳戶','設定初始帳戶餘額','初始資產與負債快照','歷史交易匯入','財務目標','AI 資料使用授權','進入主控制台'];
  const finish=()=>{act.update(s=>{s.mode='user';s.settings.setupDone=true;s.settings.snapshotDate=todayISO();s.settings.hourly=parseC(w.hourly)||0;s.settings.aiConsent=w.consent;
      for(const a of w.accounts){if(!a.name.trim())continue;let op=parseC(a.opening)||0;if(a.kind==='credit'&&op>0)op=-op;s.accounts.push({id:uid(),name:a.name.trim(),kind:a.kind,cur:a.cur,opening:op})}
      for(const a of w.assets){const v=parseC(a.value);if(a.name.trim()&&v>=0)s.assets.push({id:uid(),name:a.name.trim(),type:a.type,value:v,monthlyIncome:0,maintenance:0,date:todayISO(),history:[{date:todayISO(),value:v}]})}
      for(const l of w.liabs){const v=parseC(l.balance);if(l.name.trim()&&v>=0)s.liabilities.push({id:uid(),name:l.name.trim(),balance:v,rate:0,installment:0,dueDay:0,history:[{date:todayISO(),balance:v}]})}
      if(w.goal.trim())s.settings.goals=[{name:w.goal.trim(),target:0}]},{action:'完成設定精靈',entity:'users',detail:'建立初始快照'});onClose();act.nav(w.importLater?'dashboard':'settings');act.toast('設定完成，已建立初始快照。',null,true)};
  const upd=(k,idx,f,v)=>setW(o=>({...o,[k]:o[k].map((x,j)=>j===idx?{...x,[f]:v}:x)}));
  const body=[
    html`<div className="stack"><p>財富花園協助你同時管理金錢、時間與心力，並把投入培育成可驗證的成果。</p><p className="muted small">資料只會保存在${isNative?'這台裝置的 Android App 私有儲存區':'目前網站／PWA 的瀏覽器本機儲存空間'}，目前不是雲端資料庫，也沒有帳號同步。非必要步驟可以略過，略過的部分會顯示空白狀態，不會填入假數字。</p></div>`,
    html`<${Field} label="主要幣別"><select id="wz-cur" className="inp" value=${w.cur} onChange=${e=>setW({...w,cur:e.target.value})}><option value="TWD">TWD 新臺幣</option></select><//><div className="tiny muted">第一版以新臺幣為主要幣別；外幣帳戶可在下一步建立。</div>`,
    html`<${Field} label="參考時薪（TWD）" hint="用於換算時間機會成本，不影響現金"><input id="wz-hr" className="inp num" value=${w.hourly} onChange=${e=>setW({...w,hourly:e.target.value})} placeholder="例如 300"/><//>`,
    html`<div className="stack">${w.accounts.map((a,j)=>html`<div key=${j} className="form"><${Field} label="帳戶名稱"><input id=${'wz-an'+j} className="inp" value=${a.name} onChange=${e=>upd('accounts',j,'name',e.target.value)}/><//><${Field} label="類型"><select id=${'wz-ak'+j} className="inp" value=${a.kind} onChange=${e=>upd('accounts',j,'kind',e.target.value)}>${Object.entries(ACC_KINDS).map(([k,v])=>html`<option key=${k} value=${k}>${v}</option>`)}</select><//><${Field} label="幣別"><select id=${'wz-ac'+j} className="inp" value=${a.cur} onChange=${e=>upd('accounts',j,'cur',e.target.value)}>${['TWD',...Object.keys(S.settings.rates)].map(c=>html`<option key=${c}>${c}</option>`)}</select><//></div>`)}<button className="btn sm" style=${{alignSelf:'flex-start'}} onClick=${()=>setW({...w,accounts:[...w.accounts,{name:'',kind:'bank',cur:'TWD',opening:''}]})}>再新增一個帳戶</button></div>`,
    html`<div className="stack">${w.accounts.filter(a=>a.name).map((a,j)=>html`<${Field} key=${j} label=${`${a.name}（${a.cur}）${a.kind==='credit'?'目前未繳金額':'目前餘額'}`}><input id=${'wz-ao'+j} className="inp num" value=${a.opening} onChange=${e=>upd('accounts',w.accounts.indexOf(a),'opening',e.target.value)}/><//>`)}${!w.accounts.some(a=>a.name)&&html`<div className="muted small">上一步沒有建立帳戶，可略過。</div>`}<div className="tiny muted">今天會成為初始快照日；之後匯入的較早交易不會重複影響餘額。</div></div>`,
    html`<div className="stack"><h3>資產</h3>${w.assets.map((a,j)=>html`<div key=${j} className="form"><${Field} label="名稱"><input id=${'wz-sn'+j} className="inp" value=${a.name} onChange=${e=>upd('assets',j,'name',e.target.value)}/><//><${Field} label="類型"><select id=${'wz-st'+j} className="inp" value=${a.type} onChange=${e=>upd('assets',j,'type',e.target.value)}>${Object.entries(ASSET_TYPES).map(([k,v])=>html`<option key=${k} value=${k}>${v}</option>`)}</select><//><${Field} label="評價"><input id=${'wz-sv'+j} className="inp num" value=${a.value} onChange=${e=>upd('assets',j,'value',e.target.value)}/><//></div>`)}<h3>負債</h3>${w.liabs.map((l,j)=>html`<div key=${j} className="form"><${Field} label="名稱"><input id=${'wz-ln'+j} className="inp" value=${l.name} onChange=${e=>upd('liabs',j,'name',e.target.value)}/><//><${Field} label="餘額"><input id=${'wz-lb'+j} className="inp num" value=${l.balance} onChange=${e=>upd('liabs',j,'balance',e.target.value)}/><//></div>`)}</div>`,
    html`<div className="stack"><label className="chk"><input id="wz-imp" type="radio" name="imp" checked=${w.importLater} onChange=${()=>setW({...w,importLater:true})}/>先不匯入，之後再說</label><label className="chk"><input id="wz-imp2" type="radio" name="imp" checked=${!w.importLater} onChange=${()=>setW({...w,importLater:false})}/>完成後前往匯入頁面</label></div>`,
    html`<${Field} label="你的第一個財務目標（選填）"><input id="wz-goal" className="inp" value=${w.goal} onChange=${e=>setW({...w,goal:e.target.value})} placeholder="例如：建立 6 個月緊急預備金"/><//>`,
    html`<div className="stack">${[['summary','允許 AI 使用彙總統計資料'],['projects','允許 AI 使用專案與成果'],['raw','允許傳送逐筆交易明細']].map(([k,l])=>html`<label key=${k} className="chk"><input type="checkbox" checked=${w.consent[k]} onChange=${e=>setW({...w,consent:{...w.consent,[k]:e.target.checked}})}/>${l}</label>`)}<div className="tiny muted">預設全部不授權。隨時可在設定變更。</div></div>`,
    html`<div className="stack"><p>準備好了。按「完成」後會建立初始快照並進入主控制台。</p><div className="small muted">帳戶 ${w.accounts.filter(a=>a.name).length} 個 · 資產 ${w.assets.filter(a=>a.name).length} 項 · 負債 ${w.liabs.filter(a=>a.name).length} 項</div></div>`,
  ];
  return html`<${Modal} title=${`設定精靈 ${i+1}/10：${steps[i]}`} onClose=${onClose} footer=${html`${i>0&&html`<button className="btn ghost" onClick=${()=>setI(i-1)}>上一步</button>`}${i<9&&i>0&&html`<button className="btn" onClick=${()=>setI(i+1)}>略過</button>`}${i<9?html`<button className="btn pri" onClick=${()=>setI(i+1)}>下一步</button>`:html`<button className="btn pri" onClick=${finish}>完成</button>`}`}>
    <div className="wiz-steps" aria-hidden="true">${steps.map((_,j)=>html`<i key=${j} className=${j<=i?'on':''}></i>`)}</div>${body[i]}<//>`}

/* ---------- command palette ---------- */
function CommandPalette({onClose}){useBackHandler(onClose);const {act}=useCtx();const [q,setQ]=useState('');const [ix,setIx]=useState(0);
  const cmds=[['/dashboard','總覽控制台',()=>act.nav('dashboard')],['/income','新增收入',()=>act.addTx({type:'income'})],['/expense','新增支出',()=>act.addTx({type:'expense'})],['/activity','記錄時間與心力',()=>act.addActivity()],['/ledger','收入與支出',()=>act.nav('ledger')],['/resources','三維資源',()=>act.nav('resources')],['/assets','資產與負債',()=>act.nav('assets')],['/garden','財富花園',()=>act.nav('garden')],['/projects','資產培育計畫',()=>act.nav('projects')],['/ai','AI 財富策略師',()=>act.nav('ai')],['/reports','分析報告',()=>act.nav('reports')],['/alerts','通知中心',()=>act.nav('notifications')],['/settings','系統設定',()=>act.nav('settings')],['/privacy','切換隱私遮罩',()=>act.togglePrivacy()],['/setup','開啟設定精靈',()=>act.wizard()],['/help','說明與快捷鍵',()=>act.help()]];
  const list=cmds.filter(c=>!q||c[0].includes(q.toLowerCase().replace(/^\/?/,'/').trim())||c[1].includes(q));
  const run=c=>{onClose();setTimeout(c[2],0)};
  return html`<div className="scrim" onMouseDown=${e=>{if(e.target===e.currentTarget)onClose()}}><div className="cmdk" role="dialog" aria-label="指令面板">
    <input id="cmdk-in" autoFocus placeholder="> 輸入指令，例如 /expense" value=${q} onChange=${e=>{setQ(e.target.value);setIx(0)}} onKeyDown=${e=>{if(e.key==='ArrowDown'){e.preventDefault();setIx(Math.min(list.length-1,ix+1))}else if(e.key==='ArrowUp'){e.preventDefault();setIx(Math.max(0,ix-1))}else if(e.key==='Enter'&&list[ix])run(list[ix])}}/>
    <ul role="listbox">${list.map((c,j)=>html`<li key=${c[0]}><button aria-selected=${j===ix} onMouseEnter=${()=>setIx(j)} onClick=${()=>run(c)}><code>${c[0]}</code><span>${c[1]}</span></button></li>`)}${!list.length&&html`<li className="muted small" style=${{padding:10}}>沒有符合的指令</li>`}</ul></div></div>`}

/* ---------- shell ---------- */
const NAV=[['dashboard','總覽控制台','DASH','grid'],['ledger','收入與支出','LEDGER','list'],['resources','三維資源','MATRIX','triad'],['assets','資產與負債','ASSETS','vault'],['garden','財富花園','GARDEN','leaf'],['projects','資產培育計畫','PROJECTS','flag'],['ai','AI 財富策略師','AI','chip'],['reports','分析報告','REPORTS','chart'],['notifications','通知中心','ALERTS','bell'],['settings','系統設定','SYS','gear']];
export function App({initial,initialPage,bootWarning}){
  const [S,setS]=useState(initial);const D=useMemo(()=>compute(S),[S]);
  const [page,setPage]=useState(()=>{const h=(location.hash||'').slice(1);const want=NAV.some(n=>n[0]===h)?h:initialPage;return NAV.some(n=>n[0]===want)?want:'dashboard'});
  const [online,setOnline]=useState(true);
  const pageRef=useRef(page);pageRef.current=page;const [focus,setFocus]=useState(null);
  const [modal,setModal]=useState(null);const [toasts,setToasts]=useState([]);const [cmdk,setCmdk]=useState(false);const [rail,setRail]=useState(true);const [more,setMore]=useState(false);
  const contentRef=useRef();
  useEffect(()=>{saveState(S)},[S]);
  useEffect(()=>{saveUi({page})},[page]);
  // Android: hardware/gesture back closes the top dialog, then returns to the dashboard, then leaves the app (session kept).
  useEffect(()=>onBackButton(()=>{if(runBack())return;if(pageRef.current!=='dashboard'){act.nav('dashboard');return}flush().finally(leaveApp)}),[]);
  useEffect(()=>{const h=e=>{if(e.key==='Escape')runBack()};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[]);
  useEffect(()=>onAppState(active=>{if(!active)flush()}),[]); // save immediately when the app is backgrounded
  useEffect(()=>{getOnline().then(setOnline);return onNetwork(o=>{setOnline(o);toast(o?'已恢復網路連線。':'目前離線：記帳功能照常運作，資料存在本機。')})},[]);
  useEffect(()=>installKeyboardAssist(),[]);
  useEffect(()=>{hideSplash();if(bootWarning)toast(bootWarning)},[]);
  const prevAch=useRef(null);
  useEffect(()=>{const done=D.ach.filter(a=>a.done).map(a=>a.id);if(prevAch.current){done.filter(x=>!prevAch.current.includes(x)).forEach(id=>toast('成就達成：'+D.ach.find(a=>a.id===id).name,null,true))}prevAch.current=done},[D]);
  useEffect(()=>{const h=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCmdk(c=>!c)}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[]);
  function toast(msg,action,ach){const id=uid();setToasts(t=>[...t,{id,msg,action,ach}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),action?7000:3800)}
  const act={
    update(fn,audit,silent){setS(prev=>{const s=JSON.parse(JSON.stringify(prev));fn(s);if(audit)s.audit.push({id:uid(),ts:nowTs(),...audit});return s})},
    replace(next,label){next.audit=[...(next.audit||[]),{id:uid(),ts:nowTs(),action:'系統',entity:'system',detail:label}];setS(next);setPage('dashboard')},
    toast,
    nav(p,f){setPage(p);setFocus(f||null);setModal(null);setMore(false);try{history.replaceState(null,'','#'+p)}catch(e){}if(contentRef.current)contentRef.current.scrollTop=0},
    addTx(init){if(!S.accounts.filter(a=>!a.archived).length){toast('請先建立帳戶。');setPage('assets');return}setModal({title:init&&init.id?'編輯紀錄':'新增紀錄',node:'tx',init})},
    addActivity(init){setModal({title:init&&init.id?'編輯活動':'記錄時間與心力',node:'act',init})},
    openTx(t){setModal({node:'txd',t})},
    newProject(init,cb){setModal({title:init&&init.id?'編輯專案':'建立培育計畫',node:'proj',init,cb})},
    confirm(title,body,ok){setModal({node:'confirm',title,body,ok})},
    wizard(){setModal({node:'wizard'})},
    help(){setModal({node:'help'})},
    togglePrivacy(){setS(s=>({...s,privacy:!s.privacy}))},
  };
  const close=()=>setModal(null);
  const unread=D.notes.filter(n=>!S.notifRead.includes(n.id)).length;
  const ctx={S,D,act,mask:!!S.privacy};
  const Page={dashboard:Dashboard,ledger:Ledger,resources:Resources,assets:Assets,garden:Garden,projects:Projects,ai:AIPage,reports:Reports,notifications:Notifications,settings:Settings}[page];
  return html`<${Ctx.Provider} value=${ctx}><div className="app">
    <aside className="rail" aria-label="主要導覽">
      <div className="brand"><b>WEALTH GARDEN</b><span>NEON CITY // 財富花園</span></div>
      <nav className="nav">${NAV.map(([id,l,en,ic])=>html`<button key=${id} aria-current=${page===id?'page':undefined} onClick=${()=>act.nav(id)}><${Icon} n=${ic}/>${l}${id==='notifications'&&unread?html`<span className="badge">${unread}</span>`:html`<span className="en">${en}</span>`}</button>`)}</nav>
      <div className="rail-foot"><div className="flex between"><span>指令面板</span><kbd className="mono">Ctrl/⌘ K</kbd></div><div style=${{marginTop:6}}>v${VERSION} · ${BUILD_LABEL}</div></div>
    </aside>
    <div className="main">
      <header className="topbar">
        <span className="show-m" style=${{fontFamily:'var(--f-display)',fontWeight:700,letterSpacing:'.06em'}}>WEALTH GARDEN</span>
        ${S.mode==='demo'?html`<span className="demo-pill" title="所有數字皆為虛構示範資料"><i className="dot"></i>示範<span className="hide-m">模式 · 虛構資料</span></span>`:html`<span className="chip c"><i className="dot"></i>個人模式</span>`}
        <span className="chip w" title="沒有帳號與雲端同步；不是正式多人服務">${BUILD_LABEL}</span>
        <span className="chip hide-m" title="資料只存在這個裝置，不是雲端資料庫">${isNative?'儲存：本機 App（非雲端）':'儲存：本機瀏覽器（非雲端）'}</span>
        <span className="chip w hide-m"><i className="dot"></i>AI 未連線</span>
        <span className="spacer"></span>
        <button className="btn ghost sm hide-m" onClick=${()=>setCmdk(true)}><${Icon} n="search" s=${15}/>搜尋指令<kbd className="mono tiny muted">⌘K</kbd></button>
        <button className="btn sm" aria-pressed=${!!S.privacy} onClick=${act.togglePrivacy} title="隱私遮罩">${S.privacy?html`<${Icon} n="eyeoff" s=${15}/>已遮罩`:html`<${Icon} n="eye" s=${15}/><span className="hide-m">隱私遮罩</span>`}</button>
        ${S.mode==='demo'&&html`<button className="btn sm pri hide-m" onClick=${()=>act.confirm('開始使用自己的資料？','會清除示範資料並開啟設定精靈。',()=>{act.replace(blankState(),'清除示範資料，開始設定');act.wizard()})}>使用我的資料</button>`}
        <button className="btn ghost sm hide-m" aria-label="切換 AI 洞察面板" onClick=${()=>setRail(!rail)}><${Icon} n="panel" s=${16}/></button>
      </header>
      ${!online&&html`<div className="offline-bar" role="status"><${Icon} n="bolt" s=${14}/>離線中：記帳、分析與花園照常運作，資料保存在本機；雲端與 AI 功能暫停。</div>`}
      <main className="content" ref=${contentRef}><${ErrorBoundary}><${Page} focus=${focus}/><//></main>
    </div>
    ${rail&&html`<aside className="insight-rail" aria-label="AI 洞察面板"><div className="panel-h" style=${{padding:'14px 14px 0',margin:0}}><div><div className="eyebrow">INSIGHTS</div><h2>AI 洞察</h2></div><button className="btn ghost sm" aria-label="收合" onClick=${()=>setRail(false)}><${Icon} n="x" s=${15}/></button></div>
      <div className="in"><div className="note">AI 未連線。下列洞察由規則式統計產生，是建議而非已實現成果。</div><${InsightList}/>
        <div className="hr"></div><div className="eyebrow">QUICK STATUS</div>
        <div className="kv small"><dt>本月收入</dt><dd><${Money} c=${D.month.inc}/></dd><dt>本月支出</dt><dd><${Money} c=${D.month.exp}/></dd><dt>7 日心力</dt><dd>${D.a7.avg==null?'—':D.a7.avg.toFixed(1)}</dd><dt>待核准草案</dt><dd>${S.suggestions.filter(s=>s.status==='pending').length}</dd></div>
        <button className="btn" onClick=${()=>act.nav('ai')}><${Icon} n="terminal" s=${15}/>開啟策略師</button></div></aside>`}
  </div>
  <nav className="bottom-nav" aria-label="手機導覽">${[['dashboard','控制台','grid'],['ledger','記帳','list'],['garden','花園','leaf'],['ai','策略師','chip']].map(([id,l,ic])=>html`<button key=${id} aria-current=${page===id?'page':undefined} onClick=${()=>act.nav(id)}><${Icon} n=${ic} s=${20}/>${l}</button>`)}<button aria-current=${!['dashboard','ledger','garden','ai'].includes(page)?'page':undefined} onClick=${()=>setMore(true)}><${Icon} n="more" s=${20}/>更多${unread?html`<span className="badge" style=${{position:'absolute',marginLeft:22,marginTop:-4}}>${unread}</span>`:''}</button></nav>
  <button className="fab" aria-label="快速記帳" onClick=${()=>setModal({node:'quick'})}><${Icon} n="plus" s=${26}/></button>
  ${more&&html`<${Modal} title="更多功能" onClose=${()=>setMore(false)}><div className="rows">${NAV.filter(n=>!['dashboard','ledger','garden','ai'].includes(n[0])).map(([id,l,en,ic])=>html`<button key=${id} className="row click" style=${{background:'none',border:0,borderBottom:'1px solid var(--line)',color:'var(--fg)',minHeight:48}} onClick=${()=>act.nav(id)}><${Icon} n=${ic}/><span className="grow" style=${{textAlign:'left'}}>${l}</span>${id==='notifications'&&unread?html`<span className="badge">${unread}</span>`:''}</button>`)}<button className="row click" style=${{background:'none',border:0,color:'var(--fg)',minHeight:48}} onClick=${()=>{setMore(false);setCmdk(true)}}><${Icon} n="search"/><span className="grow" style=${{textAlign:'left'}}>指令面板</span></button></div><//>`}
  ${modal&&modal.node==='tx'&&html`<${Modal} title=${modal.title} onClose=${close} wide><${TxForm} init=${modal.init||{}} onDone=${close}/><//>`}
  ${modal&&modal.node==='act'&&html`<${Modal} title=${modal.title} onClose=${close}><${ActivityForm} init=${modal.init||{}} onDone=${close}/><//>`}
  ${modal&&modal.node==='proj'&&html`<${Modal} title=${modal.title} onClose=${close}><${ProjectForm} init=${modal.init||{}} onDone=${id=>{close();modal.cb&&modal.cb(id)}}/><//>`}
  ${modal&&modal.node==='txd'&&html`<${TxDetail} t=${modal.t} onClose=${close}/>`}
  ${modal&&modal.node==='wizard'&&html`<${Wizard} onClose=${close}/>`}
  ${modal&&modal.node==='confirm'&&html`<${Modal} title=${modal.title} onClose=${close} footer=${html`<button className="btn ghost" onClick=${close}>取消</button><button className="btn pri" autoFocus onClick=${()=>{const ok=modal.ok;close();ok()}}>確認</button>`}><p style=${{margin:0}}>${modal.body}</p><//>`}
  ${modal&&modal.node==='quick'&&html`<${Modal} title="快速記錄" onClose=${close}><div className="grid g2"><button className="btn pri" style=${{minHeight:56}} onClick=${()=>act.addTx({type:'expense'})}><${Icon} n="down"/>支出</button><button className="btn" style=${{minHeight:56}} onClick=${()=>act.addTx({type:'income'})}><${Icon} n="up"/>收入</button><button className="btn" style=${{minHeight:56}} onClick=${()=>act.addTx({type:'transfer'})}><${Icon} n="swap"/>轉帳／繳卡費</button><button className="btn" style=${{minHeight:56}} onClick=${()=>act.addActivity()}><${Icon} n="clock"/>時間與心力</button></div><div className="flex" style=${{marginTop:6}}>${S.templates.map(tp=>html`<button key=${tp.id} className="btn sm" onClick=${()=>act.addTx({type:tp.type,amt:tp.amt,cat:tp.cat,acct:tp.acct,desc:tp.desc})}>${tp.name}</button>`)}</div><//>`}
  ${modal&&modal.node==='help'&&html`<${Modal} title="說明" onClose=${close}><div className="stack small"><div><b>快捷鍵</b>：Ctrl/⌘ + K 開啟指令面板；Esc 關閉視窗。</div><div><b>帳務規則</b>：信用卡消費在刷卡時認列支出並增加應付款；「信用卡繳款」只減少銀行存款與應付款。帳戶轉帳、換匯、投資本金移動不產生收入或支出。未實現評價只影響淨資產。</div><div><b>時間</b>：機會成本依參考時薪換算，只供參考，不計入現金。</div><div><b>心力</b>：-5 ～ +5 的主觀序位評分，只看平均與分布，不加總、不換算金錢。</div><div><b>資料</b>：${BUILD_LABEL}把資料存在這台裝置，不是雲端資料庫。${isNative?'解除安裝 App 或清除 App 資料可能一併刪除，更新同一簽章的 App 通常會保留資料。':'PWA 清除網站資料、移除主畫面 App 或瀏覽器清理空間可能遺失資料；更新網頁通常不清除 localStorage，但不保證永久保存。'}請定期在「系統設定」匯出 JSON 備份。</div><div><b>返回鍵</b>：先關閉視窗，再回到總覽，最後離開 App（不會遺失資料）。</div><div><b>AI</b>：目前未連線；畫面上的分析都是規則式統計，並明確標示。</div></div><//>`}
  ${cmdk&&html`<${CommandPalette} onClose=${()=>setCmdk(false)}/>`}
  <div className="toasts" aria-live="polite">${toasts.map(t=>html`<div key=${t.id} className=${'toast'+(t.ach?' ach':'')}>${t.ach&&!REDUCED&&Array.from({length:10},(_,i)=>html`<i key=${i} className="spark" style=${{left:'20%',top:'50%','--dx':`${Math.cos(i*0.63)*60}px`,'--dy':`${Math.sin(i*0.63)*40}px`}}></i>`)}<span>${t.msg}</span>${t.action&&html`<button className="btn sm" onClick=${()=>{t.action.fn();setToasts(x=>x.filter(y=>y.id!==t.id))}}>${t.action.label}</button>`}</div>`)}</div>
  <//>`}



/* ---------- crash recovery ---------- */
class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={err:null}}
  static getDerivedStateFromError(err){return {err}}
  componentDidCatch(err){try{const log=JSON.parse(localStorage.getItem('wg-crash')||'[]');log.push({ts:new Date().toISOString(),msg:String(err&&err.message||err).slice(0,300),v:VERSION});localStorage.setItem('wg-crash',JSON.stringify(log.slice(-20)))}catch{}}
  render(){if(!this.state.err)return this.props.children;
    return html`<div className="page"><div className="panel glow stack"><h1>這個畫面發生錯誤</h1><p className="muted">你的財務資料仍安全保存在本機，沒有被修改。可以重新載入這個畫面，或回到總覽。錯誤只記錄訊息與版本，不含任何金額。</p>
      <div className="mono small" style=${{color:'var(--bad)',overflowWrap:'anywhere'}}>${String(this.state.err&&this.state.err.message||this.state.err).slice(0,200)}</div>
      <div className="flex"><button className="btn pri" onClick=${()=>this.setState({err:null})}>重新載入畫面</button><button className="btn" onClick=${()=>{location.hash='#dashboard';location.reload()}}>重新啟動 App</button></div></div></div>`}}
