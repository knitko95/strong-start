import fs from 'node:fs';
import {Rig,V,M} from '../animation-authoring/rig.mjs';
import {pose} from '../animation-authoring/poses.mjs';
import {Equipment} from '../animation-authoring/equipment.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const setups=read('animation-authoring/accepted-setups.json'),recipes=read('animation-authoring/recipes.json'),inventory=read('output/technique-audit/inventory.json');
const results=[];
for(const e of inventory.capture){const s=recipes.find(x=>x.id===e.id);if(s.family==='accepted')continue;
 const rig=new Rig(setups.templates['dumbbell-romanian-deadlift'].clip);const initial=pose(rig,s,0),equipment=new Equipment(s,rig,initial,{},setups),samples=[];
 for(let i=0;i<=40;i++){const t=i/40,meta=pose(rig,s,t),props=equipment.sample(meta,t);const socket=side=>equipment.socket(side);
 const handL=socket('l'),handR=socket('r');const worldProps=props.map(p=>({name:p.name,p:p.matrix?.slice(12,15),scale:p.matrix?[0,1,2].map(j=>Math.hypot(p.matrix[j*4],p.matrix[j*4+1],p.matrix[j*4+2])):null}));
 const wrists={};for(const side of ['l','r']){const local=rig.heads['middle_01_'+side].clone().applyMatrix4(rig.bind[rig.ids['hand_'+side]].clone().invert()).normalize(),palm=local.transformDirection(rig.world(rig.ids['hand_'+side])),forearm=rig.point('hand_'+side).sub(rig.point('lowerarm_'+side)).normalize();wrists[side]=Math.acos(Math.max(-1,Math.min(1,palm.dot(forearm))))*180/Math.PI;}
 samples.push({t,hip:meta.hip.toArray(),leftHand:handL.toArray(),rightHand:handR.toArray(),leftFoot:rig.point('foot_l').toArray(),rightFoot:rig.point('foot_r').toArray(),leftKnee:rig.point('calf_l').toArray(),rightKnee:rig.point('calf_r').toArray(),wrists,props:worldProps});
 }
 const span=(values)=>Math.max(...values)-Math.min(...values),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const names=equipment.props.map(x=>x.name),landmine=samples.map(x=>x.props.find(p=>p.name==='Landmine bar')?.scale?.[1]).filter(x=>x!==undefined);
 results.push({id:s.id,family:s.family,eq:s.eq,sampleCount:samples.length,props:names,dynamicProps:equipment.dynamic.map(d=>equipment.props[d.i].name),maximumPalmForearmAxisAngle:Math.max(...samples.flatMap(x=>Object.values(x.wrists))),leftFootTravel:Math.max(...samples.map(x=>distance(x.leftFoot,samples[0].leftFoot))),rightFootTravel:Math.max(...samples.map(x=>distance(x.rightFoot,samples[0].rightFoot))),...(landmine.length?{landmineLengthMin:Math.min(...landmine),landmineLengthMax:Math.max(...landmine),landmineLengthVariation:span(landmine)}:{}),...(s.id.includes('smith')?{barDepthMin:Math.min(...samples.map(x=>x.props.find(p=>p.name==='Reusable barbell shaft').p[2])),barDepthMax:Math.max(...samples.map(x=>x.props.find(p=>p.name==='Reusable barbell shaft').p[2])),railDepth:0}:{}),samples});
}
fs.writeFileSync(new URL('../output/technique-audit/measurements.json',import.meta.url),JSON.stringify({note:'Geometric diagnostics of authored recipes, not anatomical joint measurements or medical thresholds. Accepted clips measured separately in playback.',results},null,2));
console.log(JSON.stringify({clips:results.length,samples:results.reduce((n,x)=>n+x.sampleCount,0),landmines:results.filter(x=>x.landmineLengthVariation!==undefined).map(({samples,...x})=>x),smith:results.filter(x=>x.railDepth!==undefined).map(({samples,...x})=>x)},null,2));
