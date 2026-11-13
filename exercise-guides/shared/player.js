import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {gunzip} from './vendor/fflate.js';
import {MeshoptDecoder} from './vendor/meshopt_decoder.module.js';
import {createVolumeSkinning} from './volume-skinning.js';

const host=document.createElement('div');host.className='ss-player';host.innerHTML=`<div class="ss-status" id="status" role="status">Loading demonstration…</div><div class="ss-selection"><label for="exercise-search">Find a demonstration</label><input id="exercise-search" type="search" placeholder="Search all exercises"><select id="exercise" aria-label="Exercise demonstration"></select></div><div id="person" class="ss-stage" role="img"></div><div class="ss-toolbar"><button id="play" type="button">Pause</button><label>Speed <select id="speed"><option value="1">Normal</option><option value="0.5">Half speed</option></select></label><button id="highlights" type="button" aria-pressed="true">Muscles on</button></div><div class="ss-detail"><strong id="phase-label"></strong><p id="main-label"></p><p id="supporting-label"></p><label>Movement <output id="position-value"></output><input id="position" type="range" min="0" max="5" step=".01" value="0" aria-label="Scrub demonstration"></label><div class="ss-angles"><button type="button" data-angle="0deg 78deg">Front</button><button type="button" data-angle="-90deg 78deg">Side</button><button type="button" data-angle="180deg 78deg">Back</button></div><p class="ss-review" id="review-status"></p><a class="ss-notices" href="exercise-guides/shared/NOTICES.html" target="_blank" rel="noopener">Model and library credits</a></div>`;const $=s=>host.querySelector(s),stage=$('#person'),select=$('#exercise');const assetBase=new URL('./',import.meta.url);let externalPause=false;
const rawCache=new Map(),geometryCache=new Map(),resolvedGeometry=new Map(),textureCache=new Map(),materialCache=new Map();
const stats={networkBytes:0,networkRequests:0,persistentHits:0,characterLoads:0};
const pinnedAssets=new Set();
let cacheWrites=Promise.resolve();
async function bytes(asset){
 if(rawCache.has(asset.url))return rawCache.get(asset.url);
 const promise=(async()=>{
  let cache;
  try{cache=await caches.open('strong-start-shared-assets-v1');const saved=await cache.match(new URL(asset.url,assetBase));if(saved){stats.persistentHits++;return new Uint8Array(await saved.arrayBuffer());}}catch{}
  const response=await fetch(new URL(asset.url,assetBase));if(!response.ok)throw Error('Asset download failed');
  const data=new Uint8Array(await response.arrayBuffer());
  if(asset.bytes!==data.byteLength)throw Error('Incomplete asset download');
  if(asset.sha256&&crypto.subtle){const digest=await crypto.subtle.digest('SHA-256',data);const hex=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');if(hex!==asset.sha256)throw Error('Asset checksum mismatch');}
  stats.networkBytes+=data.length;stats.networkRequests++;
  if(cache){cacheWrites=cacheWrites.then(async()=>{
   try{
    const keys=await cache.keys();let total=data.length;
    let entries=await Promise.all(keys.map(async key=>({key,size:Number((await cache.match(key)).headers.get('X-Asset-Bytes')||0)})));
    total+=entries.reduce((sum,e)=>sum+e.size,0);
    let count=keys.length;entries=entries.filter(e=>!pinnedAssets.has(e.key.url));
    while(entries.length&&(total>40*1024*1024||count>=256)){const e=entries.shift();await cache.delete(e.key);total-=e.size;count--;}
    await cache.put(new URL(asset.url,assetBase),new Response(data,{headers:{'X-Asset-Bytes':String(data.length)}}));
   }catch{/* Storage denial/quota must not prevent playback. */}
  });}
  return data;
 })();rawCache.set(asset.url,promise);promise.catch(()=>rawCache.delete(asset.url));return promise;
}
async function json(asset){return JSON.parse(new TextDecoder().decode(await bytes(asset)));}
const constructors={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
async function unpack(pack){
 const zipped=await bytes(pack.asset);
 const data=typeof DecompressionStream!=='undefined'?new Uint8Array(await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()):await new Promise((resolve,reject)=>gunzip(zipped,(error,out)=>error?reject(error):resolve(out)));
 if(data.length!==(pack.encoding==='meshopt'?pack.encodedBytes:pack.decodedBytes))throw Error('Invalid decoded asset size');
 if(pack.encoding==='meshopt')await MeshoptDecoder.ready;
 const result={};
 for(const [name,desc] of Object.entries(pack.arrays)){
  let buffer=data,offset=desc.offset;
  if(pack.encoding==='meshopt'){buffer=new Uint8Array(desc.length);offset=0;MeshoptDecoder.decodeGltfBuffer(buffer,desc.count,desc.length/desc.count,data.subarray(desc.encodedOffset,desc.encodedOffset+desc.encodedLength),desc.mode);}
  let values=new constructors[desc.componentType](buffer.buffer,buffer.byteOffset+offset,desc.length/constructors[desc.componentType].BYTES_PER_ELEMENT);
  if(desc.quantized){const q=desc.quantized;values=Float32Array.from(values,(v,i)=>q.offset[i%desc.size]+v*q.scale[i%desc.size]);}
  result[name]={array:values,desc};
 }
 return result;
}
function attribute(item){return new THREE.BufferAttribute(item.array,item.desc.size,item.desc.normalized);}
function characterAttribute(key){const item=characterArrays[key];return item.attribute||(item.attribute=attribute(item));}
const semantics={POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv',JOINTS_0:'skinIndex',WEIGHTS_0:'skinWeight'};
function geometry(arrays){const g=new THREE.BufferGeometry();for(const [name,item] of Object.entries(arrays))if(name==='index')g.setIndex(attribute(item));else if(semantics[name])g.setAttribute(semantics[name],attribute(item));return g;}
async function propGeometry(id){if(!geometryCache.has(id)){const promise=unpack(library.geometries[id]).then(arrays=>{const result=geometry(arrays);resolvedGeometry.set(id,result);return result;});geometryCache.set(id,promise);promise.catch(()=>geometryCache.delete(id));}return geometryCache.get(id);}
async function texture(asset){
 if(textureCache.has(asset.url)){const value=textureCache.get(asset.url);textureCache.delete(asset.url);textureCache.set(asset.url,value);return value;}
 const raw=await bytes(asset),blobUrl=URL.createObjectURL(new Blob([raw],{type:'image/png'}));
 let map;try{map=await new THREE.TextureLoader().loadAsync(blobUrl);}finally{URL.revokeObjectURL(blobUrl);}
 map.flipY=false;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=renderer.capabilities.getMaxAnisotropy();textureCache.set(asset.url,map);
 // Keep at most two decoded 2048px role maps, plus the currently displayed one.
 for(const [key,value] of textureCache){if(textureCache.size<=2)break;if(value!==body?.material.map&&value!==map){textureCache.delete(key);value.dispose();}}
 return map;
}
function material(spec,map=null){
 const p=spec.pbrMetallicRoughness||{},factor=p.baseColorFactor||[1,1,1,1];
 return new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(...factor.slice(0,3),THREE.LinearSRGBColorSpace),opacity:factor[3],transparent:spec.alphaMode==='BLEND',alphaTest:spec.alphaMode==='MASK'?(spec.alphaCutoff??.5):0,metalness:p.metallicFactor??1,roughness:p.roughnessFactor??1,side:spec.doubleSided?THREE.DoubleSide:THREE.FrontSide,map});
}
function propMaterial(spec){const key=JSON.stringify(spec);if(!materialCache.has(key))materialCache.set(key,material(spec));return materialCache.get(key);}
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=.9;stage.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.01,50),orbit=new OrbitControls(camera,renderer.domElement);orbit.enablePan=false;orbit.minDistance=.4;orbit.maxDistance=8;orbit.minPolarAngle=THREE.MathUtils.degToRad(20);orbit.maxPolarAngle=THREE.MathUtils.degToRad(100);orbit.enableDamping=true;renderer.domElement.style.touchAction='pan-y';
const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(environment,.04);scene.environment=env.texture;scene.environmentIntensity=.65;const contourKey=new THREE.DirectionalLight(0xfff8f0,1.4);contourKey.position.set(-3,4,5);scene.add(contourKey);const backKey=new THREE.DirectionalLight(0xf1f5ff,1.15);backKey.position.set(3,3,-5);scene.add(backKey);environment.dispose();pmrem.dispose();
let manifest,library,characterArrays,body,skeleton,bones,volumeSkinning,exerciseRoot,mixer,action,nodes=[],currentSpec,loaded=false,wantsPlay=!matchMedia('(prefers-reduced-motion: reduce)').matches,highlights=true,generation=0,roleMap,bodyMaterial;
function controls(enabled){host.querySelectorAll('button,input,#speed').forEach(c=>c.disabled=!enabled);}
function cameraView(angle){
 const target=currentSpec.target.split(' ').map(parseFloat),angles=angle.split(' ').map(parseFloat),radius=Math.min(7.5,currentSpec.radius*(currentSpec.floor||currentSpec.wide?Math.max(1,420/stage.clientWidth):1));
 orbit.target.fromArray(target);camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(radius,THREE.MathUtils.degToRad(angles[1]),THREE.MathUtils.degToRad(angles[0]))));orbit.update();
}
function paint(){if(!bodyMaterial)return;bodyMaterial.map=highlights?roleMap:null;bodyMaterial.color.setRGB(...(highlights?[1,1,1]:[.665,.686,.70]),THREE.LinearSRGBColorSpace);bodyMaterial.needsUpdate=true;$('#highlights').textContent=highlights?'Muscles on':'Muscles off';$('#highlights').setAttribute('aria-pressed',String(highlights));}
function playback(){ $('#play').textContent=wantsPlay?'Pause':'Play';if(loaded)$('#status').textContent=wantsPlay&&!(document.hidden||externalPause)?'Playing':'Paused';}
function transform(obj,node){
 if(node.matrix){obj.matrix.fromArray(node.matrix);obj.matrix.decompose(obj.position,obj.quaternion,obj.scale);}else{obj.position.fromArray(node.translation||[0,0,0]);obj.quaternion.fromArray(node.rotation||[0,0,0,1]);obj.scale.fromArray(node.scale||[1,1,1]);}
}
async function load(id){
 if(loaded&&currentSpec.id===id)return;
 const token=++generation,spec=manifest.exercises.find(e=>e.id===id);loaded=false;controls(false);$('#status').textContent='Loadingâ€¦';
 try{
  let data=await json(spec.scene);if(data.schemaVersion===2){const delta=data;data=structuredClone(await json(delta.base));data.id=delta.id;data.animation=delta.animation;data.tracks=delta.tracks;data.nodes[data.bodyNode].parts[0].material.pbrMetallicRoughness.baseColorTexture.asset=delta.roleMap;for(const prop of delta.props){const node=structuredClone(prop),index=data.nodes.length;delete node.parent;data.nodes.push(node);if(prop.parent){const parent=data.nodes.find(n=>n.name===prop.parent);if(!parent)throw Error('Invalid attachment');(parent.children??=[]).push(index);}else data.roots.push(index);}}if(data.schemaVersion!==1||data.id!==id)throw Error('Incompatible exercise configuration');
  const bodyPart=data.nodes[data.bodyNode].parts[0];
  const [tracks,map]=await Promise.all([unpack(data.animation),texture(bodyPart.material.pbrMetallicRoughness.baseColorTexture.asset),...data.nodes.flatMap(n=>(n.parts||[]).filter(p=>!p.character).map(p=>propGeometry(p.geometry)))]);
  if(token!==generation)return;
  mixer?.stopAllAction();if(mixer&&exerciseRoot)mixer.uncacheRoot(exerciseRoot);
  if(exerciseRoot)scene.remove(exerciseRoot);body.removeFromParent();for(const bone of bones.values()){bone.removeFromParent();bone.clear();}
  for(const [semantic,key] of Object.entries(data.bodyAttributes)){if(semantic==='index')body.geometry.setIndex(characterAttribute(key));else body.geometry.setAttribute(semantics[semantic],characterAttribute(key));}
  if(bodyMaterial)bodyMaterial.dispose();roleMap=map;bodyMaterial=material(bodyPart.material,map);body.material=bodyMaterial;
  nodes=data.nodes.map((node,i)=>{
   const obj=i===data.bodyNode?body:node.bone?bones.get(node.name):new THREE.Group();obj.name=node.name||'node-'+i;transform(obj,node);
   if(!node.bone&&i!==data.bodyNode)for(const p of node.parts||[])obj.add(new THREE.Mesh(resolvedGeometry.get(p.geometry),propMaterial(p.material)));
   return obj;
  });
  data.nodes.forEach((node,i)=>{for(const child of node.children||[])nodes[i].add(nodes[child]);});
  exerciseRoot=new THREE.Group();for(const i of data.roots)exerciseRoot.add(nodes[i]);scene.add(exerciseRoot);
  skeleton.bones=data.jointNodes.map(i=>nodes[i]);skeleton.boneInverses=data.inverseBindMatrices.map(a=>new THREE.Matrix4().fromArray(a));body.bind(skeleton,new THREE.Matrix4());volumeSkinning??=createVolumeSkinning(body);volumeSkinning.attach(bodyMaterial);
  const paths={translation:'position',rotation:'quaternion',scale:'scale'};
  const keyframes=data.tracks.map(track=>{
   if(!['LINEAR','STEP'].includes(track.interpolation))throw Error('Unsupported interpolation');
   const Track=track.path==='rotation'?THREE.QuaternionKeyframeTrack:THREE.VectorKeyframeTrack;
   return new Track(nodes[track.node].uuid+'.'+paths[track.path],tracks[track.input].array,tracks[track.output].array,track.interpolation==='STEP'?THREE.InterpolateDiscrete:THREE.InterpolateLinear);
  });
  mixer=new THREE.AnimationMixer(exerciseRoot);action=mixer.clipAction(new THREE.AnimationClip(id,-1,keyframes));action.play();mixer.setTime(0);scene.updateMatrixWorld(true);skeleton.update();
  currentSpec=spec;loaded=true;$('#phase-label').textContent=spec.name;$('#review-status').textContent=spec.reviewStatus==='awaiting-owner-review'?'Draft · awaiting your movement review':'Previously reviewed animation';$('#main-label').textContent='Main Â· '+spec.mainLabel;$('#supporting-label').textContent='Supporting Â· '+spec.supportingLabel;$('#position').max=String(action.getClip().duration-.01);$('#position').value='0';
  stage.setAttribute('aria-label',`${spec.name}: muscular gray instructor with main and supporting muscle highlights.`);controls(true);paint();cameraView(spec.orbit);playback();
 }catch(error){if(token!==generation)return;loaded=false;controls(false);$('#status').textContent='Could not load this exercise. Select it again to retry.';host.dispatchEvent(new CustomEvent('ss-error',{detail:error.message}));throw error;}
}
select.onchange=()=>load(select.value).catch(()=>{});$('#play').onclick=()=>{wantsPlay=!wantsPlay;playback();};$('#position').oninput=()=>{wantsPlay=false;mixer.setTime(Number($('#position').value));scene.updateMatrixWorld(true);skeleton.update();playback();};$('#highlights').onclick=()=>{highlights=!highlights;paint();};
host.querySelectorAll('[data-angle]').forEach(button=>button.onclick=()=>cameraView(button.dataset.angle.split(' ').slice(0,2).join(' ')));
function resize(){if(!stage.clientWidth||!stage.clientHeight)return;renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);
let last=performance.now();function draw(now){if(!host.isConnected||!loaded)return;const delta=Math.min(.05,(now-last)/1000);last=now;if(loaded&&wantsPlay&&!(document.hidden||externalPause))mixer.update(delta*Number($('#speed').value));orbit.update();if(loaded){scene.updateMatrixWorld(true);volumeSkinning.update();}renderer.render(scene,camera);if(loaded){if(document.activeElement!==$('#position'))$('#position').value=String(action.time);$('#position-value').textContent=action.time.toFixed(2)+' / '+action.getClip().duration.toFixed(2)+' s';}}renderer.setAnimationLoop(draw);
document.addEventListener('visibilitychange',playback);
window.sharedExerciseDebug={stats,state:()=>({id:currentSpec?.id,loaded,time:action?.time,duration:action?.getClip().duration,bodyUUID:body?.uuid,skeletonUUID:skeleton?.uuid,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,roleTexture:roleMap?.uuid,highlighted:highlights,volumeSkinning:volumeSkinning?.stats}),pose:(indices=[])=>{
 scene.updateMatrixWorld(true);skeleton.update();volumeSkinning.update();return {nodes:Object.fromEntries(nodes.map(n=>[n.name,n.matrixWorld.toArray()])),vertices:indices.map(i=>{const v=new THREE.Vector3().fromBufferAttribute(body.geometry.attributes.position,i);volumeSkinning.apply(i,v);return body.localToWorld(v).toArray();})};
},reviewCamera:(target,theta=30,phi=75,radius=.6)=>{orbit.target.fromArray(target);camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(radius,THREE.MathUtils.degToRad(phi),THREE.MathUtils.degToRad(theta))));orbit.update();},cacheSettled:()=>cacheWrites};
let ready;
function initialize(){return ready??=(async()=>{
 manifest=await (await fetch(new URL('manifest.json',assetBase),{cache:'no-cache'})).json();if(manifest.schemaVersion!==1)throw Error('Unsupported manifest');pinnedAssets.add(new URL(manifest.library.url,assetBase).href);library=await json(manifest.library);pinnedAssets.add(new URL(library.character.asset.url,assetBase).href);characterArrays=await unpack(library.character);stats.characterLoads++;
 bones=new Map(library.jointNames.map(name=>[name,new THREE.Bone()]));skeleton=new THREE.Skeleton([...bones.values()]);body=new THREE.SkinnedMesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial());body.frustumCulled=false;
 select.replaceChildren(...manifest.exercises.map(e=>{const option=document.createElement('option');option.value=e.id;option.textContent=e.name;return option;}));const requestedExercise=new URLSearchParams(location.search).get('exercise');if(manifest.exercises.some(e=>e.id===requestedExercise))select.value=requestedExercise;return manifest;
})().catch(error=>{ready=null;throw error;});}

$('#exercise-search').addEventListener('input',()=>{const search=$('#exercise-search').value.toLowerCase();for(const option of select.options)option.hidden=!option.textContent.toLowerCase().includes(search);});
export async function mount(target,id,{inline=false,gallery=false,playing=true}={}){
 host.classList.toggle('ss-inline',inline);host.classList.toggle('ss-gallery',gallery);target.append(host);externalPause=false;wantsPlay=playing;renderer.setAnimationLoop(draw);resize();
 await initialize();select.value=id||manifest.exercises[0].id;await load(select.value);resize();return host;
}
export function unmount(){externalPause=true;renderer.setAnimationLoop(null);host.remove();}
export function suspend(value){externalPause=!!value;playback();}
export function play(value){wantsPlay=!!value;playback();}
export function isPlaying(){return wantsPlay;}
export function setHighlight(value){highlights=!!value;paint();}
