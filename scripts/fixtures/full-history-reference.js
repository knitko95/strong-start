// Frozen pre-pagination calculation reference: dev 1c2263b6. Tests only.
globalThis.fullHistoryReference=({logs,state,EX,historyArea})=>{
const e1rm=(w,r)=>w*(1+r/30);
function historyMedian(values){const a=values.slice().sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function historyMetric(entry,log){
  const ex=EX[entry.ex],sets=entry.sets||[];
  if(!ex||ex.req?.some(group=>group.includes('assist'))||ex.mode==='P') return null;
  const timed=/\bsec\b/.test(entry.plan||'')||(!entry.plan&&ex.mode==='T');
  // Added bodyweight load cannot be compared without historical body weight.
  if(ex.mode==='B'&&sets.some(s=>s.w!=null&&s.w!==''&&Number(s.w)!==0)) return null;
  if(ex.mode==='L'&&timed) return null;
  const kind=ex.mode==='L'?'load':timed?'time':'reps';
  const values=sets.map(s=>{
    const r=Number(s.r);if(!Number.isFinite(r)||r<=0) return null;
    if(kind!=='load')return r;
    const w=Number(s.w);if(!Number.isFinite(w)||w<=0||r>30) return null;
    return e1rm(w,r)*((log.units||state.settings.units)==='lb'?0.45359237:1);
  }).filter(v=>v!=null&&Number.isFinite(v)&&v>0);
  return values.length?{kind,v:Math.max(...values)}:null;
}
function historyData(){
  const groups=new Map();
  const chronological=logs.slice().filter(l=>Number.isFinite(Date.parse(l.date))).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)||String(a.id).localeCompare(String(b.id)));
  for(const l of chronological){
    const entries=new Map();
    for(const e of l.entries||[]){if(!entries.has(e.ex))entries.set(e.ex,{...e,sets:[]});entries.get(e.ex).sets.push(...(e.sets||[]));}
    for(const [id,e] of entries){
      if(!groups.has(id))groups.set(id,{id,name:EX[id]?.n||e.name,area:historyArea(id),records:[],metrics:[]});
      const g=groups.get(id),metric=historyMetric(e,l);g.records.push({l,e,metric});
      if(metric&&l.status!=='partial')g.metrics.push({d:new Date(l.date),...metric});
    }
  }
  for(const g of groups.values()){
    // A changed measurement type starts a new comparable series.
    const kind=g.metrics.at(-1)?.kind;g.points=g.metrics.filter(p=>p.kind===kind);
    g.ready=g.points.length>=4;
    if(g.ready){g.baseline=historyMedian(g.points.slice(0,2).map(p=>p.v));g.ratio=historyMedian(g.points.slice(-3).map(p=>p.v))/g.baseline;}
  }
  return [...groups.values()].sort((a,b)=>Date.parse(b.records.at(-1).l.date)-Date.parse(a.records.at(-1).l.date)||a.name.localeCompare(b.name));
}
function historyProgress(groups,area){
  const eligible=groups.filter(g=>g.ready&&(area==='overall'||g.area===area));
  if(!eligible.length)return {eligible,points:[],score:null};
  // Use the same current exercise cohort throughout the graph. Start only once
  // all its two-session baselines exist; adding a new exercise is never a zero.
  const start=Math.max(...eligible.map(g=>+g.points[1].d));
  const dates=[...new Set(eligible.flatMap(g=>g.points.map(p=>+p.d)).filter(d=>d>=start))].sort((a,b)=>a-b);
  const points=dates.map(d=>({d:new Date(d),v:eligible.reduce((sum,g)=>{
    const past=g.points.filter(p=>+p.d<=d);return sum+historyMedian(past.slice(-3).map(p=>p.v))/g.baseline*100;
  },0)/eligible.length}));
  return {eligible,points,score:points.at(-1).v};
}

const groups=historyData();return {groups,progress:area=>historyProgress(groups,area),at:(area,date)=>{const eligible=groups.filter(g=>g.ready&&(area==='overall'||g.area===area));return eligible.reduce((n,g)=>n+historyMedian(g.points.filter(p=>+p.d<=date).slice(-3).map(p=>p.v))/g.baseline*100,0)/eligible.length;}};};
