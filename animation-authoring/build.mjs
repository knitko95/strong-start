// Deterministic animation-only authoring. Reuses the frozen body, rig, bind fits and original clips.
import {readFileSync as read,writeFileSync as write,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';import {gzipSync} from 'node:zlib';import {fileURLToPath}from'node:url';import path from'node:path';
import {Rig,T,V,Q,M,clone}from'./rig.mjs';import {pose}from'./poses.mjs';import {Equipment}from'./equipment.mjs';import {recipeList}from'./recipes.mjs';
import {repairReviewedGrips}from'./repair-reviewed-grips.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here),out=path.join(root,'exercise-guides/shared');
const load=p=>JSON.parse(read(p,'utf8')),save=(p,o)=>write(p,JSON.stringify(o,null,2)+'\n'),hash=b=>createHash('sha256').update(b).digest('hex');
if(!existsSync(path.join(here,'accepted-manifest.json')))copyFileSync(path.join(out,'manifest.json'),path.join(here,'accepted-manifest.json'));
const accepted=load(path.join(here,'accepted-manifest.json')),setups=load(path.join(here,'accepted-setups.json')),recipes=recipeList(new Set(accepted.exercises.map(e=>e.id)));
save(path.join(here,'recipes.json'),recipes);
const roleRequests={};for(const s of recipes)if(s.draft)roleRequests[hash(s.roleKey).slice(0,16)]={main:s.main,supporting:s.supporting,side:s.side};
save(path.join(here,'role-requests.json'),roleRequests);
if(process.argv.includes('--prepare')){console.log('Prepared',recipes.length,'explicit recipes;',Object.keys(roleRequests).length,'shared role combinations');process.exit(0);}
const roleAssets=load(path.join(here,'role-assets.json'));
function asset(label,raw,suffix){const sha256=hash(raw),url=`assets/${label}.${sha256.slice(0,16)}.${suffix}`;if(!existsSync(path.join(out,url)))write(path.join(out,url),raw);return {url,bytes:raw.length,sha256};}
function jsonAsset(label,data){return asset(label,Buffer.from(JSON.stringify(data)),'json');}
function pack(label,arrays){let size=0;const descriptions={},parts=[];for(const [key,{array,width,componentType}]of Object.entries(arrays)){const b=Buffer.from(array.buffer,array.byteOffset,array.byteLength);descriptions[key]={componentType,size:width,count:array.length/width,normalized:false,offset:size,length:b.length};size+=b.length;parts.push(b);}return {asset:asset(label,gzipSync(Buffer.concat(parts),{level:9,mtime:0}),'bin.gz'),arrays:descriptions,decodedBytes:size};}
if(!existsSync(path.join(here,'accepted-library.json')))copyFileSync(path.join(out,accepted.library.url),path.join(here,'accepted-library.json'));
const library=load(path.join(here,'accepted-library.json'));const geometry={};
const shapes={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,16,1,false),hex:new T.CylinderGeometry(1,1,1,6,1,false),sphere:new T.SphereGeometry(1,24,16),torus:new T.TorusGeometry(1,.13,8,24),dome:new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2)};
for(const [name,g]of Object.entries(shapes)){const arrays={};for(const [key,attr]of Object.entries({POSITION:g.attributes.position,NORMAL:g.attributes.normal,TEXCOORD_0:g.attributes.uv,index:g.index})){arrays[key]={array:attr.array,width:attr.itemSize,componentType:attr.array instanceof Float32Array?5126:attr.array instanceof Uint16Array?5123:5125};}const p=pack('shared-'+name,arrays),id='primitive-'+name;library.geometries[id]=p;geometry[name]=id;}
const manifest={...clone(accepted),revision:'complete-exercise-drafts-2026-11-13',library:jsonAsset('library',library),enabledEnvironments:['development'],exercises:[]};
const base=clone(setups.templates['dumbbell-romanian-deadlift'].clip);delete base.sourceSHA256;delete base.templateSourceSHA256;delete base.authoring;delete base.id;
base.nodes=base.nodes.map((n,i)=>{if(i===base.bodyNode||n.bone||!n.parts)return n;const p={name:'Reusable attachment socket '+i};return p;});
const baseAsset=jsonAsset('shared-rig-setup',base),checks=[];
function simplify(times,values,width,path){
 const count=times.length,keep=new Set([0,count-1]),error=(start,end,i)=>{
  const u=(times[i]-times[start])/(times[end]-times[start]);let max=0;
  if(path==='rotation'){const a=Q().fromArray(values,start*4),b=Q().fromArray(values,end*4),actual=Q().fromArray(values,i*4);return a.slerp(b,u).angleTo(actual)/.0007;}
  for(let k=0;k<width;k++)max=Math.max(max,Math.abs(T.MathUtils.lerp(values[start*width+k],values[end*width+k],u)-values[i*width+k])/(path==='translation'?.00012:.00002));return max;
 };
 const stack=[[0,count-1]];while(stack.length){const [a,b]=stack.pop();let e=1,index=-1;for(let i=a+1;i<b;i++){const v=error(a,b,i);if(v>e){e=v;index=i;}}if(index!==-1){keep.add(index);stack.push([a,index],[index,b]);}}
 const indices=[...keep].sort((a,b)=>a-b);return {times:indices.map(i=>times[i]),values:indices.flatMap(i=>values.slice(i*width,i*width+width))};
}
for(const spec of recipes){
 const original=accepted.exercises.find(e=>e.id===spec.id);if(original){const repaired=repairReviewedGrips(original,{out,canonical:base,geometry,pack:(label,arrays)=>pack(label,arrays),jsonAsset});manifest.exercises.push({...repaired,category:'strength',reviewStatus:repaired.reviewStatus||'previously-reviewed',enabledEnvironments:['development']});continue;}
 const rig=new Rig(base),duration=spec.family==='getup'?14:/jump|medThrow/.test(spec.family)?5:spec.category==='cardio'?3.2:5;
 const count=Math.round(duration*20)+1,times=Array.from({length:count},(_,i)=>i/20),tracks=[],values=new Map(),arrays={};
 const first=pose(rig,spec,0),equipment=new Equipment(spec,rig,first,geometry,setups);equipment.sample(first,0);const props=clone(equipment.props),dynamic=new Set(equipment.dynamic.map(e=>e.i));
 let contactError=0,range={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},jointError=0;
 const record=(node,mat)=>{const p=V(),q=Q(),scale=V();mat.decompose(p,q,scale);for(const [kind,arr]of [['translation',p.toArray()],['rotation',q.toArray()],['scale',scale.toArray()]]){const key=node+':'+kind;if(!values.has(key))values.set(key,[]);const data=values.get(key);if(kind==='rotation'&&data.length&&arr.reduce((a,x,k)=>a+x*data[data.length-4+k],0)<0)for(let k=0;k<4;k++)arr[k]*=-1;data.push(...arr);}};
 for(let i=0;i<count;i++){
  const t=i/(count-1),meta=pose(rig,spec,t);equipment.sample(meta,t);
  for(const n of base.jointNames)record(rig.ids[n],rig.locals[rig.ids[n]]);
  for(const p of dynamic)record(base.nodes.length+p,M().fromArray(equipment.props[p].matrix));
  for(const c of meta.contacts)contactError=Math.max(contactError,V().fromArray(c.actual).distanceTo(V().fromArray(c.requested)));
  for(const n of ['head','hand_l','hand_r','foot_l','foot_r','pelvis']){const p=rig.point(n);p.toArray().forEach((x,k)=>{range.min[k]=Math.min(range.min[k],x);range.max[k]=Math.max(range.max[k],x);});}
  for(const side of ['l','r'])for(const [a,b]of [['upperarm','lowerarm'],['lowerarm','hand'],['thigh','calf'],['calf','foot']])jointError=Math.max(jointError,Math.abs(rig.point(a+'_'+side).distanceTo(rig.point(b+'_'+side))-rig.length(a+'_'+side,b+'_'+side)));
 }
 const timeIds=new Map();
 for(const [key,data]of values){const [nodeString,kind]=key.split(':'),node=Number(nodeString),width=kind==='rotation'?4:3,baseline=node<base.nodes.length?rig.rest[node]:M().fromArray(props[node-base.nodes.length].matrix),bp=V(),bq=Q(),bs=V();baseline.decompose(bp,bq,bs);const ref=kind==='translation'?bp.toArray():kind==='rotation'?bq.toArray():bs.toArray();
  if(data.every((x,i)=>Math.abs(x-ref[i%width])<.0000015))continue;
  const reduced=simplify(times,data,width,kind),tk=JSON.stringify(reduced.times);let timeId=timeIds.get(tk);if(!timeId){timeId='t'+timeIds.size;timeIds.set(tk,timeId);arrays[timeId]={array:new Float32Array(reduced.times),width:1,componentType:5126};}
  arrays[key]={array:new Float32Array(reduced.values),width,componentType:5126};tracks.push({node,path:kind,input:timeId,output:key,interpolation:'LINEAR'});
 }
 // Give held poses an explicit duration even when every other curve is constant.
 if(!tracks.length){arrays.time={array:new Float32Array([0,duration]),width:1,componentType:5126};arrays.root={array:new Float32Array([...base.nodes[rig.ids.Root].translation,...base.nodes[rig.ids.Root].translation]),width:3,componentType:5126};tracks.push({node:rig.ids.Root,path:'translation',input:'time',output:'root',interpolation:'LINEAR'});}
 const motion=pack('motion',arrays),roles=roleAssets[hash(spec.roleKey).slice(0,16)];
 if(!roles)throw Error('Missing role map '+spec.name);
 const clip={schemaVersion:2,id:spec.id,base:baseAsset,animation:motion,tracks,props,roleMap:roles,authoring:{type:'animation-only',recipe:spec.id,characterSHA256:library.character.asset.sha256},durationSeconds:duration};
 const centerY=(range.max[1]+range.min[1])*.5,centerZ=(range.max[2]+range.min[2])*.5;
 manifest.exercises.push({id:spec.id,name:spec.name,category:spec.category,main:spec.main,supporting:spec.supporting,mainLabel:(spec.muscles.p||[]).join(', ').replaceAll('_',' '),supportingLabel:(spec.muscles.s||[]).join(', ').replaceAll('_',' ')||'Posture and control',target:`0m ${centerY.toFixed(3)}m ${centerZ.toFixed(3)}m`,radius:spec.family==='getup'?4.6:/pullup|hanging|medThrow|jump/.test(spec.family)?4.8:4.1,orbit:'35deg 78deg',floor:first.floor,wide:first.floor,scene:jsonAsset(spec.id,clip),reviewStatus:'awaiting-owner-review',enabledEnvironments:['development']});
 checks.push({id:spec.id,family:spec.family,poses:count,tracks:tracks.length,motionBytes:motion.asset.bytes,sceneBytes:manifest.exercises.at(-1).scene.bytes,maximumFootTargetError:contactError,maximumJointLengthError:jointError,range,equipmentNodes:props.length});
 console.log('AUTHORED',spec.id,tracks.length,motion.asset.bytes,'contact',contactError.toFixed(3));
}
// Retain the accepted squat reference even though the catalogue calls its warm-up Bodyweight squats.
for(const e of accepted.exercises)if(!manifest.exercises.some(x=>x.id===e.id))manifest.exercises.push({...e,category:'reference',reviewStatus:'previously-reviewed',enabledEnvironments:['development']});
save(path.join(out,'manifest.json'),manifest);save(path.join(here,'build-checks.json'),{recipes:recipes.length,characterSHA256:library.character.asset.sha256,library:manifest.library,checks});
console.log('COMPLETE',manifest.exercises.length,'exercises;',checks.length,'new authored clips');
