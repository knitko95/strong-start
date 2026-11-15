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
  this.handFrames={};for(const side of ['l','r']){const inv=this.bind[this.ids['hand_'+side]].clone().invert(),y=this.heads['middle_01_'+side].clone().applyMatrix4(inv).normalize(),x=this.heads['pinky_01_'+side].clone().applyMatrix4(inv).sub(this.heads['index_01_'+side].clone().applyMatrix4(inv)).multiplyScalar(side==='l'?1:-1);x.addScaledVector(y,-x.dot(y)).normalize();this.handFrames[side]={x,y,z:x.clone().cross(y).normalize()};}
  this.bendPlanes={};for(const s of ['l','r'])for(const [a,b,c,names]of [['upperarm','lowerarm','hand',['upperarm','lowerarm','lowerarm_proximal']],['thigh','calf','foot',['thigh','calf']]]){const normal=this.heads[b+'_'+s].clone().sub(this.heads[a+'_'+s]).cross(this.heads[c+'_'+s].clone().sub(this.heads[b+'_'+s])).normalize();for(const n of names)this.bendPlanes[n+'_'+s]=normal;}
 }
 reset(){this.locals=this.rest.map(m=>m.clone());}
 world(i){return this.parents.has(i)?this.world(this.parents.get(i)).multiply(this.locals[i]):this.locals[i].clone();}
 point(n){return V().setFromMatrixPosition(this.world(this.ids[n]));}
 rotation(n){return Q().setFromRotationMatrix(this.world(this.ids[n]).clone().extractRotation(this.world(this.ids[n])));}
 set(n,world){const i=this.ids[n],p=this.parents.get(i);this.locals[i]=p===undefined?world:this.world(p).invert().multiply(world);}
 orient(n,point,rotation){const i=this.ids[n];this.set(n,M().compose(point,rotation,this.scales[i]));}
 aim(n,a,b,plane=null){const i=this.ids[n],rest=this.bind[i],old=V(0,1,0).transformDirection(rest),dir=b.clone().sub(a).normalize();let q=Q().setFromUnitVectors(old,dir).multiply(Q().setFromRotationMatrix(M().extractRotation(rest)));
  // Preserve the joint's bend plane in the skin, not just its joint positions.
  if(plane&&plane.length()>.001){const lateral=(this.bendPlanes[n]?.clone()||V(1,0,0).transformDirection(rest)).applyQuaternion(Q().setFromUnitVectors(old,dir));lateral.addScaledVector(dir,-lateral.dot(dir)).normalize();const wanted=plane.clone().addScaledVector(dir,-plane.dot(dir)).normalize();const angle=Math.atan2(dir.dot(lateral.clone().cross(wanted)),lateral.dot(wanted));q=Q().setFromAxisAngle(dir,angle).multiply(q);}
  this.orient(n,a,q);}
 length(a,b){return this.heads[a].distanceTo(this.heads[b]);}
 gripAxis(side,grip,long){if(grip?.isVector3)return grip.clone().normalize();if(grip==='bar')return V(1,0,0);if(grip==='underhand')return V(-1,0,0);if(grip==='vertical')return V(0,1,0);const inward=V(side==='l'?-1:1,0,0).applyQuaternion(this.rotation('pelvis'));let a=long.clone().cross(inward);if(a.length()<.02)a=V(0,0,1).cross(long);return a.normalize();}
 bendPole(side,target){const k=side==='l'?1:-1,body=this.rotation('pelvis'),forward=V(-k*.6,0,1).normalize(),bend=V(k*.25,-1,0);bend.addScaledVector(forward,-bend.dot(forward));forward.applyQuaternion(body);const dir=target.clone().sub(this.point('upperarm_'+side)).normalize(),transport=Q().setFromUnitVectors(forward,dir);return bend.applyQuaternion(body).applyQuaternion(transport).normalize();}
 trunk(hip,pitch=0,yaw=0,roll=0,axial=0){
  const r=M().makeRotationFromEuler(new T.Euler(rad(pitch),rad(yaw),rad(roll),'YXZ')).multiply(M().makeRotationY(rad(axial)));
  const transform=M().makeTranslation(...hip.toArray()).multiply(r).multiply(M().makeTranslation(...this.pivot.clone().negate().toArray()));
  for(const n of ['pelvis','spine_01','spine_02','spine_03','neck_01','head','clavicle_l','clavicle_r'])this.set(n,transform.clone().multiply(this.bind[this.ids[n]]));
  return transform;
 }
 solve(a,b,l1,l2,pole){
  let d=a.distanceTo(b);const end=b.clone();if(d>l1+l2-.0001){end.copy(a).add(b.clone().sub(a).setLength(l1+l2-.0001));d=l1+l2-.0001;}
  if(d<Math.abs(l1-l2)+.0001){d=Math.abs(l1-l2)+.0001;end.copy(a).add(b.clone().sub(a).normalize().multiplyScalar(d));}
  d=Math.max(.0001,d);const u=end.clone().sub(a).normalize(),along=(l1*l1-l2*l2+d*d)/(2*d);let p=pole.clone().addScaledVector(u,-pole.dot(u));
  if(p.length()<.001)p=V(0,0,1).addScaledVector(u,-u.z);p.normalize();return [a.clone().addScaledVector(u,along).addScaledVector(p,Math.sqrt(Math.max(0,l1*l1-along*along))),end];
 }
 leg(side,ankle,pole=V(0,0,1),footPitch=0,footYaw=0){
  const thigh='thigh_'+side,calf='calf_'+side,foot='foot_'+side,hip=this.point(thigh),[knee,end]=this.solve(hip,ankle,this.length(thigh,calf),this.length(calf,foot),pole);
  const plane=knee.clone().sub(hip).cross(end.clone().sub(knee));this.aim(thigh,hip,knee,plane);this.aim(calf,knee,end,plane);const q=Q().setFromAxisAngle(V(0,1,0),rad(footYaw)).multiply(Q().setFromAxisAngle(V(1,0,0),rad(footPitch))).multiply(Q().setFromRotationMatrix(M().extractRotation(this.bind[this.ids[foot]])));this.orient(foot,end,q);
  return {hip,knee,ankle:end};
 }
 arm(side,wrist,pole=V(side==='l'?1:-1,0,-.3),grip='neutral',longitudinal=null,elbowOverride=null,planeOverride=null){
  const upper='upperarm_'+side,lower='lowerarm_'+side,hand='hand_'+side,shoulder=this.point(upper),[elbow,end]=elbowOverride?[elbowOverride.clone(),wrist.clone()]:this.solve(shoulder,wrist,this.length(upper,lower),this.length(lower,hand),pole);
  const plane=planeOverride||elbow.clone().sub(shoulder).cross(end.clone().sub(elbow));this.aim(upper,shoulder,elbow,plane);this.aim(lower,elbow,end,plane);
  this.aim('lowerarm_proximal_'+side,elbow,end,plane);
  // Align a palm frame to an explicit handle axis. Equipment uses the identical frame.
  const sign=side==='l'?1:-1,{x:x0,y:y0}=this.handFrames[side];
  const frame=M().makeBasis(x0,y0,x0.clone().cross(y0).normalize());
  // Wrist follows the forearm. Project the chosen handle axis, rather than
  // projecting away most of the forearm direction (which bent some wrists 80°).
  let y=(longitudinal?.clone()||end.clone().sub(elbow)).normalize();
  const axis=this.gripAxis(side,grip,y);y.addScaledVector(axis,-axis.dot(y)).normalize();
  const rotation=Q().setFromRotationMatrix(M().makeBasis(axis,y,axis.clone().cross(y).normalize()).multiply(frame.invert()));this.orient(hand,end,rotation);
  return {shoulder,elbow,wrist:end,axis};
 }
 handPoint(side,y,z=0,x=0){const f=this.handFrames[side];return f.y.clone().multiplyScalar(y).addScaledVector(f.z,z).addScaledVector(f.x,x).applyMatrix4(this.world(this.ids['hand_'+side]));}
 palmPoint(side){return this.handPoint(side,.04,.014);}
 gripPoint(side){return this.handPoint(side,.076,.022);}
 flattenHand(side){const f=this.handFrames[side],world=this.world(this.ids['hand_'+side]),long=f.y.clone().transformDirection(world),across=f.x.clone().transformDirection(world);for(const [digit,spread]of [['index',-.07],['middle',0],['ring',.04],['pinky',.10]])for(let j=1;j<=3;j++){const n=`${digit}_0${j}_${side}`,p=this.point(n);this.aim(n,p,p.clone().add(long).addScaledVector(across,spread*(side==='l'?1:-1)));}}
 grasp(side,target,pole,grip='neutral'){
  let sh=this.point('upperarm_'+side);const l1=this.length('upperarm_'+side,'lowerarm_'+side),l2=this.length('lowerarm_'+side,'hand_'+side),scale=this.scales[this.ids['hand_'+side]].y,offset=.076*scale,depth=.022*scale,virtual=Math.hypot(l2+offset,depth);
  pole=this.bendPole(side,target);const excess=sh.distanceTo(target)-(l1+virtual-.0002);if(excess>0&&excess<.025){const n='clavicle_'+side,p=this.point(n).add(target.clone().sub(sh).setLength(excess));this.orient(n,p,this.rotation(n));sh=this.point('upperarm_'+side);}
  let el,end,axis=this.gripAxis(side,grip,target.clone().sub(sh));
  if(grip==='bar'||grip==='underhand'){const lateral=target.clone().sub(sh).dot(axis),upper=Math.sqrt(Math.max(.0001,l1*l1-lateral*lateral)),center=sh.clone().addScaledVector(axis,lateral),bend=V(1,0,0).cross(target.clone().sub(center)).normalize();[el,end]=this.solve(center,target,upper,virtual,bend);}
  else [el,end]=this.solve(sh,target,l1,virtual,pole);
  let d=end.clone().sub(el).normalize();if(!(grip?.isVector3)&&grip!=='vertical'&&end.distanceTo(target)<.00001&&Math.abs(el.distanceTo(sh)-l1)<.00001){axis=this.gripAxis(side,grip,d);const long=d.clone().applyAxisAngle(axis,-Math.atan2(depth,l2+offset)),wrist=el.clone().addScaledVector(long,l2),plane=el.clone().sub(sh).cross(end.clone().sub(el));return this.arm(side,wrist,pole,axis,long,el,plane);}
  // Fixed sleeve/edge axes may require wrist extension. Fit the hand with the
  // transported anatomical bend pole; keep the implement axis and bone lengths.
  let baseline=target.clone().sub(sh).addScaledVector(axis,-target.clone().sub(sh).dot(axis));if(baseline.length()<.001)baseline=pole.clone().addScaledVector(axis,-pole.dot(axis));baseline.normalize();let best={cost:Infinity};
  const evaluate=angle=>{const long=baseline.clone().applyAxisAngle(axis,angle),wrist=target.clone().addScaledVector(long,-offset).addScaledVector(axis.clone().cross(long),-depth),bend=this.bendPole(side,wrist),[el,end]=this.solve(sh,wrist,l1,l2,bend),fore=end.clone().sub(el).normalize(),cost=end.distanceToSquared(wrist)*1e8+fore.angleTo(long)**2+.0001*(1-Math.cos(angle));if(cost<best.cost)best={cost,angle,long,el,end,bend};};
  for(let j=0;j<72;j++)evaluate(j*Math.PI/36);const center=best.angle;for(let j=-10;j<=10;j++)evaluate(center+j*Math.PI/360);return this.arm(side,best.end,best.bend,axis,best.long,best.el,best.bend.clone().cross(best.end.clone().sub(sh)));
 }
 cup(side,target,normal){
  const sh=this.point('upperarm_'+side),scale=this.scales[this.ids['hand_'+side]].y,offset=.076*scale,depth=.022*scale,n=normal.clone().normalize();let baseline=target.clone().sub(sh).addScaledVector(n,-target.clone().sub(sh).dot(n));if(baseline.length()<.01)baseline=V(0,1,0).addScaledVector(n,-n.y);baseline.normalize();let best={cost:Infinity};
  const evaluate=angle=>{const long=baseline.clone().applyAxisAngle(n,angle),wrist=target.clone().addScaledVector(long,-offset).addScaledVector(n,-depth),pole=this.bendPole(side,wrist),[el,end]=this.solve(sh,wrist,this.length('upperarm_'+side,'lowerarm_'+side),this.length('lowerarm_'+side,'hand_'+side),pole),cost=end.distanceToSquared(wrist)*1e8+end.clone().sub(el).angleTo(long)**2+.001*(1-Math.cos(angle));if(cost<best.cost)best={cost,angle,long,pole,el,end};};for(let j=0;j<72;j++)evaluate(j*Math.PI/36);const center=best.angle;for(let j=-10;j<=10;j++)evaluate(center+j*Math.PI/360);return this.arm(side,best.end,best.pole,best.long.clone().cross(n),best.long,best.el,best.pole.clone().cross(best.end.clone().sub(sh)));
 }
 closeHands(amount=1){for(const s of ['l','r']){const a=typeof amount==='object'?amount[s]??0:amount;if(!a)continue;const frame=this.handFrames[s],axis=frame.x.clone().transformDirection(this.world(this.ids['hand_'+s]));
   // Flex around the palm's transverse axis. Bone-local X is different for
   // every digit and previously curled fingers sideways and left thumbs open.
   for(const f of ['index','middle','ring','pinky'])for(let j=1;j<=3;j++){const n=`${f}_0${j}_${s}`,i=this.ids[n];if(i===undefined)continue;this.orient(n,this.point(n),Q().setFromAxisAngle(axis,rad([0,47,58,32][j]*a)).multiply(this.rotation(n)));}
   const root=this.point('thumb_01_'+s),target=this.point('thumb_03_'+s).lerp(this.handPoint(s,.073,.048,(s==='l'?-1:1)*.013),a),pole=frame.z.clone().transformDirection(this.world(this.ids['hand_'+s])).addScaledVector(axis,s==='l'?-1:1),[joint,end]=this.solve(root,target,this.length('thumb_01_'+s,'thumb_02_'+s),this.length('thumb_02_'+s,'thumb_03_'+s),pole);
   for(const [name,from,to]of [['thumb_01_',root,joint],['thumb_02_',joint,end]])this.aim(name+s,from,to);
   const tipDirection=frame.x.clone().multiplyScalar(s==='l'?1:-1).addScaledVector(frame.y,.25).addScaledVector(frame.z,-.1).transformDirection(this.world(this.ids['hand_'+s]));this.aim('thumb_03_'+s,this.point('thumb_03_'+s),this.point('thumb_03_'+s).add(tipDirection));
  }}
}
