// Earlier visual acceptance did not validate finger/thumb contact. Preserve the
// original body motion while replacing its open grips and wrist-base implements.
import {readFileSync as read} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {Rig,V,Q,M,clone} from './rig.mjs';
import {material} from './equipment.mjs';
export function repairReviewedGrips(original,{out,canonical,geometry,pack,jsonAsset}){
 const c=clone(JSON.parse(read(out+'/'+original.scene.url))),raw=gunzipSync(read(out+'/'+c.animation.asset.url)),arrays={};
 for(const [key,d]of Object.entries(c.animation.arrays))arrays[key]={array:new Float32Array(Array.from({length:d.length/4},(_,i)=>raw.readFloatLE(d.offset+i*4))),width:d.size,componentType:5126};
 const held=c.nodes.some(n=>/Dumbbell handle|Kettlebell handle/.test(n.name));if(!held)return original;
 const rig=new Rig(c),base=new Rig(canonical),duration=Math.max(...c.tracks.map(t=>arrays[t.input].array.at(-1))),count=Math.ceil(duration*24)+1,times=Float32Array.from({length:count},(_,i)=>duration*i/(count-1)),values=new Map();
 const modified=new Set(c.nodes.map((n,i)=>/^(index|middle|ring|pinky|thumb)_/.test(n.name)?i:null).filter(x=>x!==null));
 // The existing handle/head nodes remain parented to their original hands.
 for(const [i,n]of c.nodes.entries())if(/^Dumbbell /.test(n.name)){
  const s=/ l(?:\.|$)/.test(n.name)?'l':'r',f=base.handFrames[s],scale=rig.scales[rig.ids['hand_'+s]].y,head=!/handle/.test(n.name),sign=n.name.endsWith('.001')?1:-1;
  const p=f.y.clone().multiplyScalar(.076).addScaledVector(f.z,.022);if(head)p.addScaledVector(f.x,sign*.11/scale);
  n.matrix=M().compose(p,Q().setFromUnitVectors(V(0,1,0),f.x),head?V(.065,.065,.065).divideScalar(scale):V(.014,.17,.014).divideScalar(scale)).toArray();delete n.translation;delete n.rotation;delete n.scale;
  n.parts=[{geometry:head?geometry.hex:geometry.cylinder,material:material(head?'rubber':'chrome')}];modified.add(i);
 }
 const body= c.nodes.findIndex(n=>n.name==='Kettlebell body'),handle=c.nodes.findIndex(n=>n.name==='Kettlebell handle'),horns=[];
 if(body>=0){
  // Replace the round handle's empty middle with two graspable horns and a crown.
  c.nodes[body].parts=[{geometry:geometry.sphere,material:material('rubber')}];c.nodes[handle].parts=[];
  for(let j=0;j<3;j++){const i=c.nodes.length;c.nodes.push({name:j<2?'Goblet horn '+j:'Goblet handle crown',matrix:M().toArray(),parts:[{geometry:geometry.cylinder,material:material('chrome')}]});c.roots.push(i);horns.push(i);modified.add(i);}modified.add(body);modified.add(handle);
 }
 const record=(i,m)=>{const p=V(),q=Q(),s=V();m.decompose(p,q,s);for(const [kind,v]of [['translation',p.toArray()],['rotation',q.toArray()],['scale',s.toArray()]]){const key=i+':'+kind;if(!values.has(key))values.set(key,[]);const data=values.get(key);if(kind==='rotation'&&data.length&&v.reduce((sum,x,k)=>sum+x*data[data.length-4+k],0)<0)v.forEach((_,k)=>v[k]*=-1);data.push(...v);}};
 for(const time of times){
  rig.reset();for(const track of c.tracks){const ts=arrays[track.input].array,vs=arrays[track.output].array,width=track.path==='rotation'?4:3;let k=0;while(k<ts.length-2&&time>ts[k+1])k++;const u=ts[k+1]===ts[k]?0:Math.min(1,Math.max(0,(time-ts[k])/(ts[k+1]-ts[k]))),p=V(),q=Q(),s=V();rig.locals[track.node].decompose(p,q,s);const v=track.path==='rotation'?Q().fromArray(vs,k*width).slerp(Q().fromArray(vs,(k+1)*width),u):V().fromArray(vs,k*width).lerp(V().fromArray(vs,(k+1)*width),u);rig.locals[track.node]=M().compose(track.path==='translation'?v:p,track.path==='rotation'?v:q,track.path==='scale'?v:s);}
  for(const side of ['l','r']){rig.handFrames[side]=base.handFrames[side];for(const f of ['index','middle','ring','pinky','thumb'])for(let j=1;j<=3;j++){const n=f+'_0'+j+'_'+side;rig.locals[rig.ids[n]]=base.rest[base.ids[n]].clone();}}
  rig.closeHands(1);
  for(const i of modified)if(i<c.nodes.length&&/^Dumbbell /.test(c.nodes[i].name))rig.locals[i]=M().fromArray(c.nodes[i].matrix);
  if(body>=0){const l=rig.gripPoint('l'),r=rig.gripPoint('r'),center=l.clone().add(r).multiplyScalar(.5);rig.set(c.nodes[body].name,M().compose(center.clone().add(V(0,-.115,0)),Q(),V(.09,.09,.09)));const positions=[l,r,center.clone().add(V(0,.055,0))],sizes=[V(.014,.11,.014),V(.014,.11,.014),V(.014,l.distanceTo(r),.014)];for(let j=0;j<3;j++)rig.locals[horns[j]]=M().compose(positions[j],j===2?Q().setFromUnitVectors(V(0,1,0),l.clone().sub(r).normalize()):Q(),sizes[j]);}
  for(const i of modified)record(i,rig.locals[i]);
 }
 const tracks=c.tracks.filter(t=>!modified.has(t.node));arrays['grip-time']={array:times,width:1,componentType:5126};for(const [key,data]of values){const [node,kind]=key.split(':'),width=kind==='rotation'?4:3;arrays['grip-'+key]={array:new Float32Array(data),width,componentType:5126};tracks.push({node:Number(node),path:kind,input:'grip-time',output:'grip-'+key,interpolation:'LINEAR'});}
 c.tracks=tracks;c.animation=pack('motion-reviewed-grip',arrays);c.authoring={...c.authoring,gripRepair:'anatomical-palm-axis-and-opposed-thumb',originalSceneSHA256:original.scene.sha256};return {...original,scene:jsonAsset(c.id,c),reviewStatus:'awaiting-owner-review'};
}
