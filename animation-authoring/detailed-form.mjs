// Pose constraints traced to docs/exercise-technique/{catalog,guides,cardio}.json.
// Distances fit this instructor mesh; they are not exercise prescriptions.
import {V,Q,rad,T} from './rig.mjs';
const each=fn=>[['l',1],['r',-1]].forEach(([s,k])=>fn(s,k));
const mix=T.MathUtils.lerp,phase=t=>{const x=t<.5?t*2:(1-t)*2;return x*x*(3-2*x);};
export function detailTargets(r,s,t,o,m){
 const n=s.name.toLowerCase(),f=s.family,q=phase(t),{hip,hand,pole,feet}=o;
 const hinge=(ss,upper,fore)=>{const sh=r.point('upperarm_'+ss),u=upper.clone().setLength(r.length('upperarm_'+ss,'lowerarm_'+ss)),el=sh.clone().add(u);hand[ss]=el.clone().add(fore.clone().setLength(r.length('lowerarm_'+ss,'hand_'+ss)));pole[ss]=u;return el;};
 if(s.unilateral&&!m.handModes?.r)m.close.r=0;
 if(s.eq.includes('cb')&&!/barbell|lat pulldown|crunch/.test(n)&&!['curl','pushdown'].includes(f))o.grip='neutral';
 if(s.eq.includes('mc')&&m.levers)o.grip=/pec deck/.test(n)?'vertical':f==='raise'?'neutral':'bar';
 if(s.eq.includes('mc')&&/pec deck/.test(n))m.grips={l:V(0,-1,0),r:V(0,1,0)};
 if(s.eq.includes('bd'))o.grip='neutral';
 if(s.eq.includes('pl')&&/halo|russian twist|front raise/.test(n))o.grip='neutral';
 if(s.eq.includes('kb')&&/halo/.test(n))o.grip='neutral';
 if(f==='swing')o.grip='bar';
 if(f==='pulldown'&&/close.grip|single.arm/.test(n))o.grip='neutral';
 // A chest-height cable press is not the overhead press family used by its old recipe.
 if(n==='half-kneeling single-arm cable press'){
  o.pitch=0;o.yaw=0;hip.set(0,.47,.024);r.trunk(hip,0);const sh=r.point('upperarm_l');
  hand.l=sh.clone().add(V(.055,-.04,mix(.22,.56,q)));pole.l=V(.5,-.6,-.2);o.grip='neutral';m.graspTargets={l:hand.l.clone()};
 }
 // Bar path towards lower chest on descent and back towards shoulders on ascent.
 if(['flatPress','inclinePress'].includes(f)&&!s.eq.includes('mc')){
  r.trunk(hip,o.pitch);const sh=r.point('upperarm_l'),floor=/floor/.test(n),incline=f==='inclinePress';
  const center=V(0,sh.y+mix(floor?.16:.17,.54,q),sh.z+mix(incline?.12:.23,.025,q));
  m.graspTargets={};each((ss,k)=>{if(s.unilateral&&ss==='r')return;const x=/close.grip/.test(n)?.20:.29;hand[ss]=center.clone().setX(k*x);m.graspTargets[ss]=hand[ss].clone();pole[ss]=V(k*.2,-1,.20);});o.grip='bar';
 }
 // Quiet upper arms: author the elbow hinge, not an arbitrary wrist path + IK pole.
 if(f==='curl'&&!s.eq.includes('mc')){
  m.explicitArmHinge=true;
  r.trunk(hip,o.pitch,o.yaw,o.roll);m.elbows={};m.graspTargets={};
  each((ss,k)=>{if(s.unilateral&&ss==='r')return;const sh=r.point('upperarm_'+ss);let upper=V(k*.025,-1,.015),angle=mix(8,115,q);
   if(/preacher/.test(n))upper=V(k*.025,-.82,.57);
   if(/concentration/.test(n)){feet.l.x=.34;feet.r.x=-.34;upper=V(k*.23,-.97,.10);m.legPoles={l:V(.2,0,1),r:V(-.2,0,1)};m.footYaw={l:15,r:-15};}
   if(/bayesian/.test(n))upper=V(k*.03,-.98,-.16);
   upper.setLength(r.length('upperarm_'+ss,'lowerarm_'+ss));const el=sh.clone().add(upper),fore=upper.clone().normalize().applyAxisAngle(V(k,0,0),-k*rad(angle));
   hand[ss]=el.clone().addScaledVector(fore,r.length('lowerarm_'+ss,'hand_'+ss));pole[ss]=upper;m.elbows[ss]=el;
  });o.grip=/hammer|rope/.test(n)?'neutral':'underhand';
 }
 if(['pushdown','skull','tricepsOverhead','kickback'].includes(f)&&!s.eq.includes('mc')&&!/tate/.test(n)){
  m.explicitArmHinge=true;
  r.trunk(hip,o.pitch,o.yaw,o.roll);m.graspTargets={};
  each((ss,k)=>{if(s.unilateral&&ss==='r')return;let upper,fore;
   if(f==='pushdown'){upper=V(k*.025,-1,.35);fore=V(0,-Math.sin(rad(8+54*q)),Math.cos(rad(8+54*q)));}
   if(f==='skull'){upper=V(k*.015,1,-.12);fore=upper.clone().applyAxisAngle(V(1,0,0),-rad(5+108*q));}
   if(f==='tricepsOverhead'){upper=V(-k*.16,1,-.10);fore=upper.clone().applyAxisAngle(V(1,0,0),-rad(5+110*(1-q)));}
   if(f==='kickback'){upper=V(k*.02,-Math.cos(rad(o.pitch)),-Math.sin(rad(o.pitch)));fore=upper.clone().applyAxisAngle(V(1,0,0),-rad(5+85*(1-q)));}
   hinge(ss,upper,fore);
  });o.grip=s.eq.includes('bb')?'bar':'neutral';
  if(f==='kickback'){m.supportPost=V(-.40,.84,.32);hand.r=V(-.40,.88,.32);m.graspTargets.r=hand.r.clone();m.close.r=.65;}
 }
 if(f==='skull'&&/tate/.test(n)){
  m.explicitArmHinge=true;
  r.trunk(hip,o.pitch);m.grips={};each((ss,k)=>{const upper=V(k*.75*q,mix(1,.66,q),0).normalize(),fore=upper.clone().applyAxisAngle(V(0,0,1),k*rad(5+125*q));hinge(ss,upper,fore);m.grips[ss]=fore.clone().cross(V(0,0,1)).normalize();});
 }
 if((f==='fly'&&!s.eq.includes('mc'))||(f==='rearFly'&&!s.eq.includes('mc')&&!/face|y-t-w|band pull/.test(n))){
  m.explicitArmHinge=true;
  r.trunk(hip,o.pitch,o.yaw,o.roll);const reverse=f==='rearFly',theta=rad(reverse?mix(100,5,q):mix(5,95,q)),slope=/high to low/.test(n)?mix(.10,-.65,q):/low to high/.test(n)?mix(-.65,.25,q):0,forward=o.floor?V(0,1,0):V(0,slope,1).normalize();
  each((ss,k)=>{const across=V(k,0,0),dir=a=>across.clone().multiplyScalar(Math.cos(a)).addScaledVector(forward,Math.sin(a));hinge(ss,dir(theta),dir(theta+rad(20)));});o.grip='neutral';
 }
 if(f==='raise'&&s.eq.includes('mc')){
  m.explicitArmHinge=true;
  r.trunk(hip,o.pitch);m.padLevers={};delete m.levers;m.graspTargets={};
  each((ss,k)=>{const angle=rad(k*75*q),upper=V(0,-1,0).applyAxisAngle(V(0,0,1),angle),fore=V(0,.12,.20).applyAxisAngle(V(0,0,1),angle),el=hinge(ss,upper,fore),sh=r.point('upperarm_'+ss);m.padLevers[ss]={pivot:sh,end:sh.clone().lerp(el,.84).add(V(k*.045,0,0).applyAxisAngle(V(0,0,1),angle)),angle};});o.grip='neutral';
 }
 if(f==='raise'&&!s.eq.includes('mc')&&!s.eq.includes('pl')){
  m.explicitArmHinge=true;
  r.trunk(hip,o.pitch,o.yaw,o.roll);const angle=(10+(/lu|y-raise/.test(n)?150:75)*q)*Math.PI/180;
  each((ss,k)=>{if(s.unilateral&&ss==='r')return;const upper=V(k*Math.sin(angle),-Math.cos(angle),.15*Math.sin(angle)).normalize(),axis=V(-upper.y,upper.x,0).normalize(),fore=upper.clone().applyAxisAngle(axis,-12*Math.PI/180);hinge(ss,upper,fore);});o.grip='neutral';
 }
 if(f==='squat'||f==='lunge'||f==='lateral'||f==='hinge'||f==='singleHinge'){
  m.legPoles={...m.legPoles};each((ss,k)=>{if(m.legPoles[ss])return;const toe=/sumo|cossack/.test(n)?k*25:0,turn=m.footYaw?.[ss]??toe;m.footYaw={...m.footYaw,[ss]:turn};m.legPoles[ss]=V(Math.sin(rad(turn)),0,Math.cos(rad(turn)));});
 }
 if(f==='swing'){r.trunk(hip,o.pitch);each(ss=>{const sh=r.point('upperarm_'+ss),d=hand[ss].clone().sub(sh);if(d.length()>.54)hand[ss]=sh.clone().add(d.setLength(.54));});m.graspTargets={l:hand.l.clone(),r:hand.r.clone()};}
 if(f==='hinge'&&/conventional|sumo/.test(n)){
  hip.y=mix(.91,.495,q)-.025*Math.sin(Math.PI*q);o.pitch=55*q;hip.z=mix(.024,-.12,q);m.graspTargets={};each((ss,k)=>{hand[ss]=V(k*(/sumo/.test(n)?.19:.26),mix(.82,.22,q),.15);m.graspTargets[ss]=hand[ss].clone();pole[ss]=V(k*.1,-.5,.1);});o.grip='bar';
 }
 if(s.eq.includes('bb')&&!s.eq.includes('lm')&&['bentRow','proneRow'].includes(f)){
  if(/pendlay/.test(n)){hip.set(0,.66,-.14);o.pitch=80;}
  r.trunk(hip,o.pitch);m.graspTargets={};each((ss,k)=>{const sh=r.point('upperarm_'+ss);if(!/pendlay/.test(n))hand[ss]=sh.clone().add(V(k*.07,mix(-.54,-.20,q),mix(0,-.18,q)));m.graspTargets[ss]=hand[ss].clone();pole[ss]=V(k*.1,1,-.4);});o.grip='bar';
 }
 if(f==='singleHinge'&&s.eq.includes('lm')&&/romanian/.test(n)){r.trunk(hip,o.pitch);const p=V(1.72,.05,.10),len=m.landmine.length,y=r.point('upperarm_l').y-.535,z=.15,x=p.x-Math.sqrt(len*len-(y-p.y)**2-(z-p.z)**2);m.landmine.pivot=p;m.landmine.end=V(x,y,z);}
 if((f==='squat'&&/barbell back|box squat/.test(n)||f==='hinge'&&/good morning/.test(n))&&s.eq.includes('bb')){
  r.trunk(hip,o.pitch);const sh=r.point('upperarm_l');m.bodyBar=V(0,sh.y+.035,sh.z-.04);m.graspTargets={};each((ss,k)=>{hand[ss]=m.bodyBar.clone().setX(k*.34);m.graspTargets[ss]=hand[ss].clone();pole[ss]=V(k*.4,-1,-.4);});o.grip='bar';
 }
 if(f==='crunch'&&/cable/.test(n)){o.pitch=20;m.crunch=rad(7*q);m.ropeAtTemples=true;}
 if(['pushup','inclinePush','ballPlank','rollout','downwardDog','inchworm','catcow','birdDog','quadCircle','thoracicQuad','threadNeedle','child','cobra','renegade'].includes(f))m.legPoles={l:V(0,-1,.1),r:V(0,-1,.1)};
 if(f==='sidePlank')m.legPoles={l:V(1,0,0),r:V(1,0,0)};
 if(['hanging','pullup'].includes(f)&&!/commando|monkey/.test(n)){
  hip.y-=/archer/.test(n)?0:.13;if(f==='pullup')each(ss=>{feet[ss].y-=.03;feet[ss].z=-.14;});
  if(/neutral-grip/.test(n))each((ss,k)=>hand[ss]=V(k*.34,1.91,.065));
  m.graspTargets={l:hand.l.clone(),r:hand.r.clone()};const axis=/neutral-grip/.test(n)?V(0,0,1):/chin.up/.test(n)?V(-1,0,0):V(1,0,0);m.grips={l:axis,r:/neutral-grip/.test(n)?axis.clone().negate():axis};
 }
 if(f==='hanging'&&!/dead hang|wiper|scap/.test(n)){
  r.trunk(hip,o.pitch);const bent=/knee|oblique/.test(n),angle=rad((bent?105:/toes/.test(n)?170:110)*q);m.legPoles={};each((ss,k)=>{const h=r.point('thigh_'+ss),upper=V(0,-Math.cos(angle),Math.sin(angle)),lower=bent?V(0,-Math.cos(rad(-15+25*q)),Math.sin(rad(-15+25*q))):V(0,-Math.cos(angle-rad(8)),Math.sin(angle-rad(8)));feet[ss]=h.clone().addScaledVector(upper,r.length('thigh_'+ss,'calf_'+ss)).addScaledVector(lower,r.length('calf_'+ss,'foot_'+ss));m.legPoles[ss]=upper;});
 }
 if(['birdDog','thoracicQuad','threadNeedle'].includes(f)){
  delete m.handModes.l;hand.l.y=mix(.017,hand.l.y,q);m.freePalm={l:q};
  if(f==='birdDog'){feet.r=V(-.14,mix(.075,.47,q),mix(-.58,-.98,q));o.footPitch.r=mix(180,90,q);}
  if(f==='thoracicQuad'||f==='threadNeedle'){m.chestRotation=(f==='threadNeedle'?-28:35)*q;o.yaw=0;}
 }
 if(n==='trx anti-rotation press'){
  o.yaw=0;o.pitch=0;o.roll=7;hip.set(-.03,.91,.024);feet.l=V(.13,.074,-.12);feet.r=V(-.13,.074,.12);
  const anchor=V(.90,2.14,.35),length=1.35,z=mix(.22,.50,q),joinY=1.28,x=anchor.x-Math.sqrt(length*length-(anchor.y-joinY)**2-(anchor.z-z)**2),center=V(x,1.20,z);
  delete m.suspension;m.singleSuspension={anchor,length,join:center.clone().add(V(0,.08,0)),center};
  hand.l=center.clone().add(V(0,.033,0));hand.r=center.clone().add(V(0,-.033,0));m.graspTargets={l:hand.l.clone(),r:hand.r.clone()};m.close={l:1,r:1};o.grip='vertical';pole.l=V(.4,-1,0);pole.r=V(-.4,-1,0);
 }
 if(f==='suspensionPress'&&n!=='trx anti-rotation press'){
  const fly=/fly/.test(n),tri=/triceps/.test(n),fall=/fallout/.test(n),x=fly?mix(.24,.53,q):tri?.18:.24,y=tri?1.50:fall?mix(1.48,1.56,q):1.14,length=tri?1.40:fall?1.50:1.75,z=-.70+Math.sqrt(length*length-(2.14-y)**2-(x-.12)**2);
  let angle=tri?mix(9,20,q):fall?mix(12,33,q):mix(12,25,q);
  if(fly){let lo=0,hi=30;for(let j=0;j<24;j++){const mid=(lo+hi)/2,shoulder=V(.164,.074+1.29*Math.cos(rad(mid)),.025+1.29*Math.sin(rad(mid))),distance=shoulder.distanceTo(V(x,y,z));if(distance>.565)lo=mid;else hi=mid;}angle=(lo+hi)/2;}
  o.pitch=angle;o.yaw=0;hip.set(0,.074+.84*Math.cos(rad(angle)),.025+.84*Math.sin(rad(angle)));feet.l=V(.17,.074,.025);feet.r=V(-.17,.074,.025);o.footPitch={l:0,r:0};m.suspension={};
  each((ss,k)=>{hand[ss]=V(k*x,y,z);pole[ss]=tri?V(k*.1,1,0):V(k*.5,-.5,-.5);m.suspension[ss]={anchor:V(k*.12,2.14,-.70),length,feet:false};});o.grip='neutral';
 }
 // Stack the side-lying body; the upper leg abducts at the hip, not the knee.
 if(f==='sideLeg'){
  o.pitch=90;o.axial=90;o.yaw=0;hip.set(0,.16,0);r.trunk(hip,90,0,0,90);const top=r.point('thigh_l');
  feet.l=top.clone().add(V(0,.808*Math.sin(rad(28*q)),-.808*Math.cos(rad(28*q))));
  m.legPoles={l:V(1,0,0),r:V(1,0,0)};hand.l=V(.12,.22,.20);hand.r=V(.09,.11,.40);m.close={l:0,r:0};
 }
 if(f==='skull'&&!/tate/.test(n))o.grip='neutral';
 if(f==='overhead'&&/arnold/.test(n)){
  r.trunk(hip,o.pitch);const sh=r.point('upperarm_l');each((ss,k)=>{hand[ss]=V(k*mix(.18,.21,q),sh.y+mix(.13,.46,q),mix(.24,.04,q));pole[ss]=V(k*mix(.15,1,q),-.4,.25);});
 }
 if(f==='halo'&&s.eq.includes('kb')){const a=t*2*Math.PI,center=V(.32*Math.sin(a),1.48-.17*Math.cos(a),.32*Math.cos(a));m.halo={center};hand.l=center.clone().add(V(.055,0,0));hand.r=center.clone().add(V(-.055,0,0));m.graspTargets={l:hand.l.clone(),r:hand.r.clone()};}
 if(f==='medThrow'&&/shot put/.test(n)){m.ballPath.z+=.14;hand.l.z+=.14;if(m.graspTargets?.l)m.graspTargets.l.z+=.14;}
 if(f==='medThrow'&&/slam/.test(n)){
  // Follow the released ball in front of the chest, rather than driving the
  // hands through the shoulder as the trunk hinges into retrieval.
  const u=/rotational/.test(n)?(t% .5)*2:t,smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);},window=smooth((u-.30)/.10)*smooth((.68-u)/.10);
  r.trunk(hip,o.pitch,o.yaw);each(ss=>{const sh=r.point('upperarm_'+ss),dz=.22*Math.exp(-Math.pow((hand[ss].y-sh.y)/.20,4))*window;hand[ss].z+=dz;});m.graspTargets={l:hand.l.clone(),r:hand.r.clone()};
 }
 return o;
}
export function detailPose(r,s,t,m,o){
 if(m.freePalm)for(const [ss,amount]of Object.entries(m.freePalm)){const wrist=r.point('hand_'+ss),fore=wrist.clone().sub(r.point('lowerarm_'+ss)).normalize(),long=V(0,0,1).lerp(fore,amount).normalize(),axis=V(1,0,0).addScaledVector(long,-long.x).normalize();m[ss]=r.arm(ss,wrist,r.bendPole(ss,wrist),axis,long);if(amount<.25)r.flattenHand(ss);}
 if(m.ropeAtTemples){const head=r.point('head');each((ss,k)=>{const target=head.clone().add(V(k*.11,-.07,.035));m[ss]=r.grasp(ss,target,V(k*.3,-1,.1),'neutral');});}
 if(m.halo&&s.eq.includes('kb')){const axis=m.l.axis.clone().sub(m.r.axis).normalize();each((ss,k)=>{m[ss]=r.grasp(ss,o.hand[ss],o.pole[ss]||V(k,-.3,.1),axis.clone().multiplyScalar(k));});}
 for(const ss of ['l','r'])if(m.handModes?.[ss]==='palm'&&o.hand[ss].y<=.12){
  const direction=V(0,0,1),wrist=o.hand[ss].clone().setY(.014*r.scales[r.ids['hand_'+ss]].y).addScaledVector(direction,-.04*r.scales[r.ids['hand_'+ss]].y);
  m[ss]=r.arm(ss,wrist,o.pole[ss]||V(ss==='l'?1:-1,0,-1),'bar',direction);r.flattenHand(ss);
 }
 // Rotation must be distributed into the forearm skin, rather than a hand-only spin.
 if(m.gripTurn!==undefined){each(ss=>{const a=r.point('lowerarm_'+ss),b=r.point('hand_'+ss),axis=b.clone().sub(a).normalize(),hand=r.world(r.ids['hand_'+ss]),lower=r.rotation('lowerarm_'+ss),prox=r.rotation('lowerarm_proximal_'+ss);r.orient('lowerarm_'+ss,a,Q().setFromAxisAngle(axis,m.gripTurn).multiply(lower));r.orient('lowerarm_proximal_'+ss,a,Q().setFromAxisAngle(axis,m.gripTurn*.65).multiply(prox));r.set('hand_'+ss,hand);});}
}
