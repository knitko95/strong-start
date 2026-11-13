import * as T from '../exercise-guides/shared/vendor/three.module.js';
export {T};
export const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),Q=()=>new T.Quaternion(),M=()=>new T.Matrix4();
export const clone=x=>JSON.parse(JSON.stringify(x));
export const rad=d=>d*Math.PI/180;
export function matrix(n){return n.matrix?M().fromArray(n.matrix):M().compose(V().fromArray(n.translation||[0,0,0]),Q().fromArray(n.rotation||[0,0,0,1]),V().fromArray(n.scale||[1,1,1]));}
export class Rig{
 constructor(clip){
  this.clip=clip;this.parents=new Map();clip.nodes.forEach((n,i)=>(n.children||[]).forEach(j=>this.parents.set(j,i)));
  this.ids=Object.fromEntries(clip.nodes.map((n,i)=>[n.name,i]));this.rest=clip.nodes.map(matrix);this.locals=this.rest.map(m=>m.clone());
  this.bind=clip.nodes.map((_,i)=>this.world(i));this.heads=Object.fromEntries(clip.jointNames.map(n=>[n,V().setFromMatrixPosition(this.bind[this.ids[n]])]));
  this.scales=this.bind.map(m=>V().setFromMatrixScale(m));this.pivot=this.heads.pelvis.clone();
 }
 reset(){this.locals=this.rest.map(m=>m.clone());}
 world(i){return this.parents.has(i)?this.world(this.parents.get(i)).multiply(this.locals[i]):this.locals[i].clone();}
 point(n){return V().setFromMatrixPosition(this.world(this.ids[n]));}
 rotation(n){return Q().setFromRotationMatrix(this.world(this.ids[n]).clone().extractRotation(this.world(this.ids[n])));}
 set(n,world){const i=this.ids[n],p=this.parents.get(i);this.locals[i]=p===undefined?world:this.world(p).invert().multiply(world);}
 orient(n,point,rotation){const i=this.ids[n];this.set(n,M().compose(point,rotation,this.scales[i]));}
 aim(n,a,b){const i=this.ids[n],rest=this.bind[i],old=V(0,1,0).transformDirection(rest),dir=b.clone().sub(a).normalize(),q=Q().setFromUnitVectors(old,dir).multiply(Q().setFromRotationMatrix(M().extractRotation(rest)));this.orient(n,a,q);}
 length(a,b){return this.heads[a].distanceTo(this.heads[b]);}
 trunk(hip,pitch=0,yaw=0,roll=0,axial=0){
  const r=M().makeRotationFromEuler(new T.Euler(rad(pitch),rad(yaw),rad(roll),'YXZ')).multiply(M().makeRotationY(rad(axial)));
  const transform=M().makeTranslation(...hip.toArray()).multiply(r).multiply(M().makeTranslation(...this.pivot.clone().negate().toArray()));
  for(const n of ['pelvis','spine_01','spine_02','spine_03','neck_01','head','clavicle_l','clavicle_r'])this.set(n,transform.clone().multiply(this.bind[this.ids[n]]));
  return transform;
 }
 solve(a,b,l1,l2,pole){
  let d=a.distanceTo(b);const end=b.clone();if(d>l1+l2-.0001){end.copy(a).add(b.clone().sub(a).setLength(l1+l2-.0001));d=l1+l2-.0001;}
  d=Math.max(.0001,d);const u=end.clone().sub(a).normalize(),along=(l1*l1-l2*l2+d*d)/(2*d);let p=pole.clone().addScaledVector(u,-pole.dot(u));
  if(p.length()<.001)p=V(0,0,1).addScaledVector(u,-u.z);p.normalize();return [a.clone().addScaledVector(u,along).addScaledVector(p,Math.sqrt(Math.max(0,l1*l1-along*along))),end];
 }
 leg(side,ankle,pole=V(0,0,1),footPitch=0,footYaw=0){
  const thigh='thigh_'+side,calf='calf_'+side,foot='foot_'+side,hip=this.point(thigh),[knee,end]=this.solve(hip,ankle,this.length(thigh,calf),this.length(calf,foot),pole);
  this.aim(thigh,hip,knee);this.aim(calf,knee,end);const q=Q().setFromAxisAngle(V(0,1,0),rad(footYaw)).multiply(Q().setFromAxisAngle(V(1,0,0),rad(footPitch))).multiply(Q().setFromRotationMatrix(M().extractRotation(this.bind[this.ids[foot]])));this.orient(foot,end,q);
  return {hip,knee,ankle:end};
 }
 arm(side,wrist,pole=V(side==='l'?1:-1,0,-.3),grip='neutral',longitudinal=null){
  const upper='upperarm_'+side,lower='lowerarm_'+side,hand='hand_'+side,shoulder=this.point(upper),[elbow,end]=this.solve(shoulder,wrist,this.length(upper,lower),this.length(lower,hand),pole);
  this.aim(upper,shoulder,elbow);this.aim(lower,elbow,end);
  this.aim('lowerarm_proximal_'+side,elbow,end);
  // Align a palm frame to an explicit handle axis. Equipment uses the identical frame.
  const sign=side==='l'?1:-1,hi=this.ids[hand],inv=this.bind[hi].clone().invert();
  const y0=this.heads['middle_01_'+side].clone().applyMatrix4(inv).normalize(),x0=this.heads['pinky_01_'+side].clone().applyMatrix4(inv).sub(this.heads['index_01_'+side].clone().applyMatrix4(inv)).multiplyScalar(sign);x0.addScaledVector(y0,-x0.dot(y0)).normalize();
  const frame=M().makeBasis(x0,y0,x0.clone().cross(y0).normalize());
  // Wrist follows the forearm. Project the chosen handle axis, rather than
  // projecting away most of the forearm direction (which bent some wrists 80°).
  let y=(longitudinal?.clone()||end.clone().sub(elbow)).normalize();
  const desired=grip?.isVector3?grip.clone():grip==='bar'?V(1,0,0):grip==='underhand'?V(-1,0,0):grip==='vertical'?V(0,1,0):V(0,0,sign);
  let axis=desired.addScaledVector(y,-desired.dot(y));if(axis.length()<.01)axis=V(sign,0,0).addScaledVector(y,-sign*y.x);axis.normalize();
  const rotation=Q().setFromRotationMatrix(M().makeBasis(axis,y,axis.clone().cross(y).normalize()).multiply(frame.invert()));this.orient(hand,end,rotation);
  return {shoulder,elbow,wrist:end,axis};
 }
 palmPoint(side){const i=this.ids['hand_'+side],local=this.heads['middle_01_'+side].clone().applyMatrix4(this.bind[i].clone().invert()).normalize().multiplyScalar(.04);return local.applyMatrix4(this.world(i));}
 grasp(side,target,pole,grip='neutral'){
  let sh=this.point('upperarm_'+side);const l1=this.length('upperarm_'+side,'lowerarm_'+side),l2=this.length('lowerarm_'+side,'hand_'+side),offset=.04*this.scales[this.ids['hand_'+side]].y;
  const excess=sh.distanceTo(target)-(l1+l2+offset-.0002);if(excess>0&&excess<.025){const n='clavicle_'+side,p=this.point(n).add(target.clone().sub(sh).setLength(excess));this.orient(n,p,this.rotation(n));sh=this.point('upperarm_'+side);}
  const [el,end]=this.solve(sh,target,l1,l2+offset,pole),wrist=el.clone().lerp(end,l2/(l2+offset));return this.arm(side,wrist,el.clone().sub(sh),grip);
 }
 closeHands(amount=1){for(const s of ['l','r']){const a=typeof amount==='object'?amount[s]??0:amount;for(const f of ['index','middle','ring','pinky'])for(let j=1;j<=3;j++){const n=`${f}_0${j}_${s}`,i=this.ids[n];if(i===undefined)continue;this.locals[i]=this.rest[i].clone().multiply(M().makeRotationX(rad([0,38,62,38][j]*a)));}}}
}
