// Mechanical/contact regression checks, independent of rendered appearance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Rig,V,M} from '../animation-authoring/rig.mjs';
import {pose} from '../animation-authoring/poses.mjs';
import {Equipment} from '../animation-authoring/equipment.mjs';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root))),setups=read('animation-authoring/accepted-setups.json'),recipes=read('animation-authoring/recipes.json');
const result={clips:0,poses:0,maximumGripGap:0,maximumObservedHandForearmAngle:0,maximumRigidLengthDrift:0,maximumLimbLengthDrift:0,maximumLoopDifference:0,maximumFootTargetGap:0};
for(const s of recipes.filter(s=>s.family!=='accepted')){
 const r=new Rig(setups.templates['dumbbell-romanian-deadlift'].clip),m0=pose(r,s,0),equipment=new Equipment(s,r,m0,{},setups),fixed=new Map(),first=r.locals.map(m=>m.clone());
 for(let i=0;i<=40;i++){
  const m=pose(r,s,i/40),props=equipment.sample(m,i/40);result.poses++;
  for(const mat of r.locals)assert(mat.elements.every(Number.isFinite),s.id+' nonfinite pose');
  for(const ss of ['l','r']){
   for(const [a,b]of [['upperarm','lowerarm'],['lowerarm','hand'],['thigh','calf'],['calf','foot']]){
    const drift=Math.abs(r.point(a+'_'+ss).distanceTo(r.point(b+'_'+ss))-r.length(a+'_'+ss,b+'_'+ss));result.maximumLimbLengthDrift=Math.max(result.maximumLimbLengthDrift,drift);assert(drift<1e-8,s.id+' limb length changed');
   }
   const p=r.gripPoint(ss);let target=m.levers?.[ss]?.end;
   if(m.landmineContacts?.[ss])target=m.landmineContacts[ss];
   if(target){const gap=p.distanceTo(target);result.maximumGripGap=Math.max(result.maximumGripGap,gap);assert(gap<.002,s.id+' hand/rigid-handle gap '+gap);}
   if(m.graspTargets?.[ss]){const gap=p.distanceTo(m.graspTargets[ss]);result.maximumGripGap=Math.max(result.maximumGripGap,gap);assert(gap<.002,s.id+' support/held-load contact gap '+gap);}
   if(m.suspension?.[ss]){const a=m.suspension[ss],gap=Math.abs((a.feet?r.point('foot_'+ss):p).distanceTo(a.anchor)-a.length);result.maximumGripGap=Math.max(result.maximumGripGap,gap);assert(gap<.002,s.id+' strap contact gap '+gap);}
   if(m.smithZ!==undefined)assert(Math.abs(p.z-m.smithZ)<.002,s.id+' palm leaves the guided shaft');
   // Neutral-wrist requirements are exercise-specific (a front rack and floor
   // support deliberately extend the wrist). Detailed form tests cover them.
   if(!m.handModes?.[ss]&&m.wristStretch===undefined&&(m.close?.[ss]??m.close)>0){const fore=r.point('hand_'+ss).sub(r.point('lowerarm_'+ss)).normalize(),axis=r.handFrames[ss].y.clone().transformDirection(r.world(r.ids['hand_'+ss])),angle=Math.acos(Math.max(-1,Math.min(1,fore.dot(axis))))*180/Math.PI;result.maximumObservedHandForearmAngle=Math.max(result.maximumObservedHandForearmAngle,angle);}
  }
  for(const c of m.contacts){const gap=V().fromArray(c.actual).distanceTo(V().fromArray(c.requested));result.maximumFootTargetGap=Math.max(result.maximumFootTargetGap,gap);assert(gap<.0002,s.id+' foot misses the authored support');}
  if(m.ballPath)assert(m.ballPath.y>=.125-1e-8,s.id+' thrown ball passes through the floor');
  for(const d of equipment.dynamic){const p=props[d.i];if(!/Rigid landmine shaft|Rigid pivoting machine arm|Rigid knee machine lever|Hip pad swing arm|Fixed-length suspension strap|Linked air-bike arm|Air-bike pedal crank/.test(p.name))continue;const length=V().setFromMatrixScale(M().fromArray(p.matrix)).y;if(!fixed.has(d.i))fixed.set(d.i,length);const drift=Math.abs(length-fixed.get(d.i));result.maximumRigidLengthDrift=Math.max(result.maximumRigidLengthDrift,drift);assert(drift<1e-8,s.id+' telescoping '+p.name);}
 }
 for(let j=0;j<r.locals.length;j++){const diff=Math.max(...r.locals[j].elements.map((x,k)=>Math.abs(x-first[j].elements[k])));result.maximumLoopDifference=Math.max(result.maximumLoopDifference,diff);assert(diff<1e-6,s.id+' loop discontinuity '+diff);}
 result.clips++;
}
const air=recipes.find(s=>s.id==='air-bike');assert(air);const r=new Rig(setups.templates['dumbbell-romanian-deadlift'].clip);assert(pose(r,air,.25).airBike);
fs.mkdirSync(new URL('output/correction-verified/',root),{recursive:true});fs.writeFileSync(new URL('output/correction-verified/mechanical-checks.json',root),JSON.stringify(result,null,2));console.log('PASS mechanical constraints',JSON.stringify(result));
