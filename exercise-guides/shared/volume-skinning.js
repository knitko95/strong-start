import * as THREE from './vendor/three.module.js';

// Dual-quaternion blending avoids the loss of joint volume caused by averaging
// rotation matrices. A local linear blend limits bulging at the humerus/thorax
// bridge. This is geometric skinning, not simulated muscle anatomy.
export function createVolumeSkinning(body){
 const count=body.skeleton.bones.length;
 const real=Array.from({length:count},()=>new THREE.Vector4()),dual=Array.from({length:count},()=>new THREE.Vector4()),scales=new Float32Array(count);
 const uniforms={dqReal:{value:real},dqDual:{value:dual},dqScale:{value:scales},dqStrength:{value:1}};
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
 const armIndices=new Set(body.skeleton.bones.map((b,i)=>/^upperarm_[lr]$/.test(b.name)?i:-1).filter(i=>i>=0));
 const rootIndices=new Set(body.skeleton.bones.map((b,i)=>/^(spine_0[23]|clavicle_[lr]|neck_01)$/.test(b.name)?i:-1).filter(i=>i>=0));
 const lowerIndices=new Set(body.skeleton.bones.map((b,i)=>/^lowerarm_(?:proximal_)?[lr]$/.test(b.name)?i:-1).filter(i=>i>=0));
 const match=(set)=>[...set].map(i=>`i==${i}`).join('||')||'false';
 function shoulderStrength(index){let arm=0,root=0,lower=0;for(let c=0;c<4;c++){const i=body.geometry.attributes.skinIndex.array[index*4+c],w=body.geometry.attributes.skinWeight.array[index*4+c];if(armIndices.has(i))arm+=w;if(rootIndices.has(i))root+=w;if(lowerIndices.has(i))lower+=w;}return (1-.7*Math.min(1,Math.max(0,4*arm*root)))*(1-.25*Math.min(1,Math.max(0,4*arm*lower)));}
 const stats={enabled:true,maxScaleAnisotropy:0,shoulderHybrid:armIndices.size>0&&rootIndices.size>0,elbowHybrid:armIndices.size>0&&lowerIndices.size>0};
 const declarations=`
 uniform vec4 dqReal[${count}];
 uniform vec4 dqDual[${count}];
 uniform float dqScale[${count}];
 uniform float dqStrength;
 float dqShoulderStrength(){
  float arm=0.0,root=0.0,lower=0.0;
  for(int c=0;c<4;c++){int i=int(skinIndex[c]);if(${match(armIndices)})arm+=skinWeight[c];if(${match(rootIndices)})root+=skinWeight[c];if(${match(lowerIndices)})lower+=skinWeight[c];}
  return (1.0-.7*clamp(4.0*arm*root,0.0,1.0))*(1.0-.25*clamp(4.0*arm*lower,0.0,1.0));
 }
 vec4 dqProduct(vec4 a,vec4 b){return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),a.w*b.w-dot(a.xyz,b.xyz));}
 vec3 dqRotate(vec4 q,vec3 v){return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
 void dqBlend(out vec4 r,out vec4 d,out float s){
  r=vec4(0.0);d=vec4(0.0);s=0.0;
  vec4 reference=dqReal[int(skinIndex.x)];
  for(int c=0;c<4;c++){
   int i=int(skinIndex[c]);float w=skinWeight[c];float signQ=dot(reference,dqReal[i])<0.0?-1.0:1.0;
   r+=dqReal[i]*(w*signQ);d+=dqDual[i]*(w*signQ);s+=dqScale[i]*w;
  }
  float lengthQ=max(length(r),0.00001);r/=lengthQ;d/=lengthQ;d-=r*dot(r,d);
  s/=max(dot(skinWeight,vec4(1.0)),0.00001);
 }
 `;
 function attach(material){
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   // Declarations follow skinning_pars_vertex, where attributes are declared.
   shader.vertexShader=shader.vertexShader.replace('#include <skinning_pars_vertex>','#include <skinning_pars_vertex>\n'+declarations)
    .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvec3 dqOriginalNormal=objectNormal;')
    .replace('#include <skinnormal_vertex>',`#include <skinnormal_vertex>
     vec4 dqR,dqD;float dqS;dqBlend(dqR,dqD,dqS);
     objectNormal=normalize(mix(objectNormal,dqRotate(dqR,dqOriginalNormal),dqStrength*dqShoulderStrength()));`)
    .replace('#include <skinning_vertex>',`#include <skinning_vertex>
     vec3 dqTranslation=2.0*dqProduct(dqD,vec4(-dqR.xyz,dqR.w)).xyz;
     transformed=mix(transformed,dqRotate(dqR,position)*dqS+dqTranslation,dqStrength*dqShoulderStrength());`);
  };
  material.customProgramCacheKey=()=>`volume-skinning-v3-${count}-${[...armIndices].join("-")}-${[...rootIndices].join("-")}-${[...lowerIndices].join("-")}`;material.needsUpdate=true;
 }
 function update(){
  let anisotropy=0;
  body.updateWorldMatrix(true,false);
  for(let i=0;i<count;i++){
   matrix.copy(body.bindMatrixInverse).multiply(body.skeleton.bones[i].matrixWorld).multiply(body.skeleton.boneInverses[i]).multiply(body.bindMatrix);
   matrix.decompose(position,rotation,scale);anisotropy=Math.max(anisotropy,Math.abs(scale.x-scale.y),Math.abs(scale.x-scale.z));
   real[i].set(rotation.x,rotation.y,rotation.z,rotation.w);
   const t=new THREE.Quaternion(position.x,position.y,position.z,0).multiply(rotation);
   dual[i].set(t.x*.5,t.y*.5,t.z*.5,t.w*.5);scales[i]=(scale.x+scale.y+scale.z)/3;
  }
  // A future non-rigid bind must keep using matrix skinning until reviewed.
  stats.maxScaleAnisotropy=Math.max(stats.maxScaleAnisotropy,anisotropy);stats.enabled=anisotropy<.0001;uniforms.dqStrength.value=stats.enabled?1:0;
 }
 function apply(index,v){
  if(!stats.enabled)return body.applyBoneTransform(index,v);
  const strength=shoulderStrength(index),linear=strength<1?body.applyBoneTransform(index,v.clone()):null;
  const indices=body.geometry.attributes.skinIndex,weights=body.geometry.attributes.skinWeight;
  const r=new THREE.Vector4(0,0,0,0),d=new THREE.Vector4(0,0,0,0);let s=0,total=0;const ref=real[indices.getX(index)];
  for(let c=0;c<4;c++){
   const bone=indices.array[index*4+c],weight=weights.array[index*4+c],sign=ref.dot(real[bone])<0?-1:1;
   r.addScaledVector(real[bone],weight*sign);d.addScaledVector(dual[bone],weight*sign);s+=scales[bone]*weight;total+=weight;
  }
  const length=r.length();r.divideScalar(length);d.divideScalar(length);d.addScaledVector(r,-r.dot(d));
  const q=new THREE.Quaternion(r.x,r.y,r.z,r.w),translation=new THREE.Quaternion(d.x,d.y,d.z,d.w).multiply(q.clone().conjugate());
  v.applyQuaternion(q).multiplyScalar(s/total).add(new THREE.Vector3(translation.x*2,translation.y*2,translation.z*2));return linear?v.copy(linear.lerp(v,strength)):v;
 }
 return {attach,update,apply,stats};
}
