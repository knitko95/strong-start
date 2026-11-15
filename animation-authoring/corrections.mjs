// Reference-guided targets. Distances are authoring geometry, not clinical limits.
import {V,Q,M,rad,T} from './rig.mjs';
import {detailTargets,detailPose} from './detailed-form.mjs';
const mix=T.MathUtils.lerp,clamp=T.MathUtils.clamp,phase=t=>{const u=t<.5?t*2:(1-t)*2;return u*u*(3-2*u);};
export function correctTargets(r,s,t,o,meta){
 const n=s.name.toLowerCase(),f=s.family,q=phase(t),a=t*Math.PI*2;
 const {hip,feet,hand,pole,footPitch}=o,each=fn=>[['l',1],['r',-1]].forEach(([ss,k])=>fn(ss,k)),hands=(x,y,z)=>each((ss,k)=>hand[ss]=V(k*x,y,z));
 meta.corrected=true;meta.handModes={};meta.close={l:s.eq.some(e=>e!=='bw'&&e!=='bn')?1:0,r:s.eq.some(e=>e!=='bw'&&e!=='bn')?1:0};
 if(s.halfKneel||f==='kneelingStretch'){hip.y=.47;feet.r=V(-.15,.075,-.51);footPitch.r=180;meta.legPoles={r:V(0,-1,0)};}
 const supported=['pushup','inclinePush','wallPush','downwardDog','inchworm','catcow','quadCircle','birdDog','thoracicQuad','threadNeedle','worldStretch','child','cobra','rollout','ballPlank','renegade'];
 if(supported.includes(f))each(ss=>{meta.handModes[ss]='palm';meta.close[ss]=0;});
 if(['pullup','hanging','dip'].includes(f))meta.close={l:1,r:1};
 // Supine reference fit from the accepted floor press: head/back stay grounded.
 if(f==='flatPress'&&/floor/.test(n)||['deadbug','figure4'].includes(f)){
  hip.set(0,.108,-.06);o.pitch=-94;each((ss,k)=>feet[ss]=V(k*.216,.074,.35));
  if(f==='deadbug'){each((ss,k)=>{const u=ss==='l'?q:1-q;feet[ss]=V(k*.16,mix(.55,.18,u),mix(.30,.72,u));hand[ss]=V(k*.17,mix(.2,.55,u),mix(-.85,-.43,u));});}
  if(f==='figure4'){feet.l=V(-.08,.40,.30);feet.r=V(-.13,.24,.43);hands(.11,.34,.28);if(/cross-body/.test(n)){feet.l=V(-.30,.32,.20);feet.r=V(-.16,.074,.60);hand.r=V(-.26,.33,.18);hand.l=V(-.12,.30,.28);}}
 }
 if(f==='flatPress'||f==='inclinePress'){
  if(!/floor/.test(n)){hip.set(0,.553,-.06);o.pitch=f==='inclinePress'?-64:-94;}
  r.trunk(hip,o.pitch);const sh=r.point('upperarm_l');
  hands(/close-grip/.test(n)?.18:.30,mix(sh.y+.16,sh.y+.45,q),sh.z+.04);
  each((ss,k)=>pole[ss]=V(k*.15,-.3,1));
  if(s.eq.includes('kb')){hand.r=r.point('upperarm_r').add(V(-.05,.02,.10));}
 }
 if(f==='overhead'){
  if(n==='z press'){hip.set(0,.108,0);o.bench=false;o.pitch=0;feet.l=V(.16,.074,.78);feet.r=V(-.16,.074,.78);}
  r.trunk(hip,o.pitch,o.yaw,o.roll);const sh=r.point('upperarm_l');hands(mix(.38,.20,q),mix(sh.y+.18,sh.y+.47,q),.08);
  each((ss,k)=>pole[ss]=V(k,-.1,0));
  if(/arnold/.test(n)){o.grip='underhand';meta.gripTurn=Math.PI*q;}
 }
 if(f==='carry'&&!/rack|overhead|sled|bear-hug/.test(n)){hands(.25,hip.y-.02,.025);each((ss,k)=>pole[ss]=V(k,0,-1));}
 if(f==='carry'&&/front rack/.test(n))hands(.23,hip.y+.37,.16);
 if(f==='raise'&&/leaning/.test(n)){meta.supportPost=V(-.55,1.1,-.02);meta.close.r=0;meta.handModes.r='support';}
 if(f==='curl'&&/concentration|preacher/.test(n)){
  const el=V(.22,.72,/preacher/.test(n)?.28:.31),angle=rad(12+108*q);hand.l=el.clone().add(V(0,-.236*Math.cos(angle),.236*Math.sin(angle)));pole.l=el.clone().sub(V(.164,.98,0));
  meta.armPad=/preacher/.test(n)?{position:V(0,.77,.25),angle:-25}:null;
  if(/concentration/.test(n)){o.pitch=55;hip.set(0,.53,-.10);const el=V(.18,.54,.28),ang=rad(10+108*q);hand.l=el.clone().add(V(0,-.236*Math.cos(ang),.236*Math.sin(ang)));pole.l=V(0,-1,0);hand.r=V(-.22,.54,.30);meta.close.r=0;}
 }
 if(f==='curl'&&/zottman/.test(n)){o.grip='underhand';meta.gripTurn=Math.PI*(t<.42?0:t<.55?(t-.42)/.13:t<.88?1:(1-t)/.12);}
 if(f==='squat'&&/heel-elevated/.test(n)){each(ss=>{feet[ss].y=.106;footPitch[ss]=10;});meta.heelWedge=true;}
 if(f==='squat'&&/front squat|zercher/.test(n)){
  r.trunk(hip,o.pitch);const sh=r.point('upperarm_l');meta.bodyBar=V(0,sh.y,sh.z+.12);
  if(n.includes('zercher')){const el=V(0,-.22,.12).setLength(r.length('upperarm_l','lowerarm_l'));meta.bodyBar.add(el).setZ(sh.z+el.z);each((ss,k)=>{const shoulder=r.point('upperarm_'+ss),elbow=shoulder.clone().add(el);hand[ss]=elbow.clone().add(V(0,.20,.125).setLength(r.length('lowerarm_'+ss,'hand_'+ss)));pole[ss]=el;});}
  else{each((ss,k)=>{hand[ss]=V(-k*.10,sh.y+.05,sh.z+.17);pole[ss]=V(0,0,1);});meta.crossRack=true;}
 }
 if(f==='hinge'&&/conventional|sumo/.test(n)||f==='bentRow'&&/pendlay/.test(n)){
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},pull=t<.12?0:t<.46?smooth((t-.12)/.34):t<.57?1:t<.94?1-smooth((t-.57)/.37):0;
  const depth=f==='hinge'?q:1-pull;if(f==='hinge'){hip.y=mix(.91,.53,depth);hip.z=mix(.024,-.12,depth);o.pitch=mix(0,45,depth);}
  r.trunk(hip,o.pitch);hands(/sumo/.test(n)?.19:.26,mix(.74,.22,depth),mix(.04,.13,depth));
 }
 if(f==='russian'&&/medicine/.test(n)){hip.set(0,.13,0);o.pitch=-20;o.yaw=25*Math.sin(a);o.floor=true;meta.ball=null;feet.l=V(.17,.074,.55);feet.r=V(-.17,.074,.55);hands(.14,.52,.28);each(ss=>hand[ss].x+=.20*Math.sin(a));}
 if(f==='bridge'){
  const raised=/thrust|glute drive/.test(n),back=V(0,raised?.535:.025,-.37);
  const theta=rad(mix(raised?32:4,raised?-8:-36,q));hip.copy(back).add(V(0,-.45*Math.sin(theta),.45*Math.cos(theta)));
  o.pitch=-90+theta*180/Math.PI;o.floor=true;
  each((ss,k)=>feet[ss]=V(k*.19,.074,.56));hands(.22,hip.y+.05,hip.z);
  meta.backContact=back;meta.close={l:0,r:0};
  if(s.eq.includes('db')||s.eq.includes('bb'))meta.close={l:1,r:1};
  if(/single-leg/.test(n)){feet.r=V(-.16,.44,.38);}
  if(/stability ball/.test(n)&&!/squeeze/.test(n)){feet.l=V(.17,.54,.79);if(!/single-leg/.test(n))feet.r=V(-.17,.54,.79);meta.ball='feet';}
  if(/squeeze/.test(n)){meta.ball='knees';meta.ballRadius=.10;feet.l=V(.12,.074,.56);feet.r=V(-.12,.074,.56);}
 }
 if(f==='legPress'){
  hip.set(0,.46,-.18);o.pitch=-25;o.bench=false;o.seated=true;
  const d=/calf/.test(n)?.035*q:.24*q,base=V(0,.65,.27),travel=V(0,1,1).normalize().multiplyScalar(d);
  each((ss,k)=>feet[ss]=base.clone().add(travel).add(V(k*.18,0,0)));if(s.unilateral)feet.r=V(-.18,.16,.15);
  each(ss=>footPitch[ss]=-45+(/calf/.test(n)?10*q:0));hands(.28,.44,-.30);meta.pressTravel=travel;meta.pressPlate=base.clone().add(travel).add(V(0,0,.144));
 }
 if(f==='squat'&&n==='hack squat'){
  o.pitch=-22;hip.set(0,.91-.30*q,-.03-.12*q);hands(.27,hip.y+.39,.09);meta.hack=true;
 }
 if(f==='legExtension'||f==='legCurl'&&/seated/.test(n)){
  hip.set(0,.53,0);o.pitch=0;const knee=V(.17,.49,.36),ang=rad(f==='legExtension'?mix(-82,-4,q):mix(-4,-98,q));
  each((ss,k)=>{feet[ss]=V(k*.17,knee.y+.407*Math.sin(ang),knee.z+.407*Math.cos(ang));footPitch[ss]=-10;});if(s.unilateral)feet.r=V(-.17,.074,.36);meta.kneePivot=V(0,knee.y,knee.z);hands(.29,.44,.05);
 }
 if(f==='legCurl'&&/standing/.test(n)){
  const knee=V(.17,.48,.03),ang=rad(105*q);feet.l=knee.clone().add(V(0,-.406*Math.cos(ang),-.406*Math.sin(ang)));meta.supportPost=V(-.44,1.1,.15);hand.r=V(-.44,1.15,.15);meta.close.r=0;
 }
 if(f==='nordic'&&/glute-ham/.test(n)){hip.y+=.50;each(ss=>feet[ss].y+=.50);meta.ghd=true;}
 if(f==='singleRow'&&!/cable|tube/.test(n)){hand.r=V(-.20,.49,.25);feet.r=V(-.20,.48,-.30);meta.handModes.r='palm';meta.close.r=0;}
 if(f==='lunge'&&/bulgarian/.test(n)){feet.r=V(-.16,.53,-.44);footPitch.r=45;meta.rearSupport={z:-.49,height:.44,box:s.eq.includes('bx')};}
 if(f==='lunge'&&/skater/.test(n)){
  hip.set(0,.90-.36*q,-.08*q);o.pitch=25*q;feet.r=V(-.14,.26-.08*q,-.47);pole.r=V(0,0,-1);meta.kneePad=V(-.14,.025,-.20);
 }
 if(f==='lunge'&&/walking|reverse lunge/.test(n)){
  const step=clamp(t/.18,0,1)*(1-clamp((t-.82)/.18,0,1));feet.r.z=mix(.025,-.43,step);feet.r.y+=.06*Math.sin(step*Math.PI);if(/walking/.test(n)){const z=.34*Math.sin(Math.PI*t)**2;hip.z+=z;feet.l.z+=z;feet.r.z+=z;}
 }
 if(f==='singleHinge'&&/hip airplane/.test(n)){o.yaw=25*Math.sin(a);o.roll=12*Math.sin(a);o.pitch=50;hip.y=.80;feet.r=V(-.13,.55,-.62);}
 if(f==='sideLeg'){
  o.pitch=90;o.axial=90;hip.set(0,.16,0);r.trunk(hip,o.pitch,0,0,90);const h=r.point('thigh_l');feet.l=h.clone().add(V(0,.80*Math.sin(rad(35*q)),-.80*Math.cos(rad(35*q))));
 }
 if(f==='openBook'){o.yaw=0;o.axial=90;o.pitch=90;hip.set(0,.15,0);feet.l=V(.02,.16,-.24);feet.r=V(.02,.08,-.24);hand.l=V(mix(.05,.55,q),.13,mix(.48,-.08,q));hand.r=V(.02,.08,.47);meta.chestRotation=-50*q;}
 if(['sidePlank'].includes(f)){meta.handModes.r='forearm';meta.close={l:0,r:0};}
 if(f==='pushup'||f==='inclinePush'||['downwardDog','inchworm','ballPlank','rollout','renegade'].includes(f)){
  // Reach the loaded supports before solving the legs. A pike moves the pelvis
  // backward/upward, not the shoulders beyond arm reach.
  if(/pike/.test(n)||f==='downwardDog'||f==='inchworm'){
   const u=/pike/.test(n)&&f==='pushup'?1:q;hip.set(0,.35+.30*u,-.18);o.pitch=86+40*u;
   feet.l.z=-.78;feet.r.z=-.78;hands(.20,.07,.43);if(f==='pushup'){hip.y-=.10*q;}
  }
  if(f==='inclinePush'){hands(.24,.49,.55);hip.set(0,.56-.12*q,-.14);o.pitch=65;}
  if(/feet-on-box/.test(n)){meta.rearSupport={z:-.96,height:.34,box:true};feet.l.y=.49;feet.r.y=.49;}
  if(/bosu.*mountain/.test(n)){hands(.20,.30,.55);hip.y+=.15;}
  if(f==='rollout'){meta.handModes={l:'grip',r:'grip'};meta.close={l:1,r:1};hands(.18,.13,.42+.28*q);hip.y=.41-.12*q;hip.z=-.16;o.pitch=64+18*q;}
  if(/stir|body saw/.test(n)){meta.handModes={l:'forearm',r:'forearm'};meta.close={l:0,r:0};}
  if(s.eq.includes('sb')&&/pike|jackknife|feet-on/.test(n)){
   meta.ball='feet';hip.set(0,.55+.25*q,-.20+.20*q);o.pitch=100+40*q;each((ss,k)=>{feet[ss]=V(k*.16,.63,-.98+.20*q);footPitch[ss]=0;});hands(.20,.047,.43);
  }
 }
 if(f==='worldStretch'){o.yaw=0;meta.handModes.l='palm';meta.handModes.r=null;hand.l=V(.27,.07,.38);hand.r=V(-.30,.45+.48*q,.35);meta.chestRotation=20*q;}
 if(f==='child'){hip.set(0,.25,-.30);o.pitch=72;hands(.18,.06,.44);}
 if(f==='cobra'){hip.set(0,.11,-.05);o.pitch=60;hands(.24,.07,.29);meta.chestRotation=-8;}
 if(f==='wallPush'||f==='wallSlide'||f==='wallStretch'||f==='ankleRock'||n==='wall sit')meta.wallPlane=f==='wallPush'||f==='ankleRock'||f==='wallStretch'?.63:-.25;
 if(f==='wallPush'){each(ss=>meta.handModes[ss]='wall');hands(.22,1.23,.60);}
 if(f==='quadStretch'){feet.l=V(.17,.49,-.24);hand.l=V(.17,.50,-.25);meta.supportPost=V(-.44,1.2,.12);hand.r=V(-.44,1.24,.12);meta.close={l:.4,r:0};}
 if(f==='shoulderStretch'&&/triceps/.test(n)){hand.l=V(.10,1.51,-.08);hand.r=V(.20,1.55,.04);pole.l=V(.1,1,0);}
 if(f==='shoulderStretch'&&/wrist/.test(n)){hand.l=V(.14,1.20,.46);hand.r=V(.14,1.20,.55);meta.wristStretch=rad(30*Math.sin(a));}
 if(f==='gluteKick'&&s.category==='guide'){meta.supportPost=V(-.42,1.15,.15);hand.r=V(-.42,1.15,.15);meta.close.r=0;}
 if(f==='boxing'){hands(.23,1.44,.12);hand.l.z+=.25*q;hand.r.z+=.25*(1-q);meta.close={l:1,r:1};}
 if(f==='jump'&&s.eq.includes('db'))hands(.25,hip.y-.02,.025);
 if(s.family==='cycle'&&/air/.test(n)){hands(.27,1.08,.47);hand.l.z+=.10*Math.sin(a);hand.r.z-=.10*Math.sin(a);meta.airBike=true;}
 // Rigid lever trajectories. The same pivots are sent to equipment authoring.
 if(s.eq.includes('mc')&&['seatedPress','overhead','raise','fly','rearFly','seatedRow','pushdown','curl','pulldown'].includes(f)){
  meta.levers={};each((ss,k)=>{if(s.unilateral&&ss==='r')return;let p=V(k*.35,1.35,-.02),v=V(k*.01,-.36,.18),axis=V(1,0,0),angle=-45*q;
   if(f==='overhead'){p=V(k*.30,1.06,-.10);v=V(k*.01,.12,.36);angle=-60*q;}
   if(f==='seatedPress'){p.x=k*.31;v.z=.23;if(/incline/.test(n)){p=V(k*.31,1.26,-.16);v=V(k*.01,-.30,.19);angle=-55*q;}}
   if(f==='pulldown'){p=V(k*.33,1.08,-.10);v=V(k*.01,.38,.14);angle=65*q;}
   if(f==='raise'){p=V(k*.164,.98,0);v=V(k*.09,-.42,0);axis=V(0,0,1);angle=k*80*q;}
   if(f==='fly'){p=V(k*.10,.97,-.08);v=V(k*.38,0,.05);axis=V(0,1,0);angle=-k*70*q;}
   if(f==='rearFly'){p=V(k*.10,.98,.08);v=V(k*.08,0,.40);axis=V(0,1,0);angle=k*75*q;}
   if(f==='seatedRow'){p=V(k*.25,1.10,.22);v=V(0,-.35,.24);angle=45*q;}
   if(f==='curl'){p=V(k*.23,.80,.20);v=V(0,-.236,0);angle=-110*q;meta.armPad={position:V(0,.87,.11),angle:45};}
   if(f==='pushdown'){p=V(k*.23,.82,.20);v=V(0,.12,.20);angle=90*q;meta.armPad={position:V(0,.89,.10),angle:45};}
   const len=v.length();hand[ss]=p.clone().add(v.applyAxisAngle(axis,rad(angle)));meta.levers[ss]={pivot:p,length:len,end:hand[ss].clone()};});
 }
 if(s.eq.includes('lm')){
  const p=V(0,.05,/single-leg.*romanian/.test(n)?1.80:1.34),len=/row/.test(n)?1.65:1.75;meta.landmine={pivot:p,length:len};const target=s.unilateral?hand.l:hand.l.clone().add(hand.r).multiplyScalar(.5);if(/rainbow/.test(n))target.y=Math.max(target.y,hip.y+.12);const end=target.clone().sub(p).setLength(len).add(p);const delta=end.clone().sub(target);hand.l.add(delta);if(!s.unilateral)hand.r.add(delta);meta.landmine.end=end;
 }
 if(/smith/.test(n)){meta.smithZ=/bench/.test(n)?-.47:/split/.test(n)?-.065:-.04;each(ss=>hand[ss].z=meta.smithZ);}
 if(s.eq.includes('trx')){
  if(f==='suspensionRow'){const high=/face|biceps/.test(n),angle=rad(mix(high?42:52,high?25:32,q));hip.set(0,.074+.80*Math.cos(angle),.90-.80*Math.sin(angle));o.pitch=-angle*180/Math.PI;feet.l=V(.17,.074,.90);feet.r=V(-.17,.074,.90);hands(high?.26:.22,high?1.25+.05*q:1.04,high?.34-.10*q:.36);if(/power pull/.test(n)){o.yaw=15*(1-q);hand.r=V(-.50,hip.y+.25,hip.z-.04);}}
  const isFeet=/body saw|pike|hamstring/.test(n);meta.suspension={};each((ss,k)=>{if(s.unilateral&&ss==='r')return;const anchor=V(k*.12,2.14,.67),target=isFeet?feet[ss]:hand[ss],len=isFeet?2.24:/face|biceps/.test(n)?.95:/triceps|fallout/.test(n)?.85:1.20;target.copy(target.clone().sub(anchor).setLength(len).add(anchor));meta.suspension[ss]={anchor,length:len,feet:isFeet};});
 }
 if(n==='inverted row'){const angle=rad(mix(52,32,q));hip.set(0,.074+.80*Math.cos(angle),.90-.80*Math.sin(angle));o.pitch=-angle*180/Math.PI;feet.l=V(.17,.074,.90);feet.r=V(-.17,.074,.90);hands(.23,1.015,.36);meta.fixedBar={y:1.05,z:.36};}
 if(f==='chop'&&/trunk rotation/.test(n)){hands(.065,1.22,.40);each(ss=>hand[ss].x+=mix(-.28,.28,q));}
 if(f==='around'){
  const ball=V(.29*Math.cos(a),.99,.29*Math.sin(a));meta.handoff=ball;
  hand.l=ball.clone();hand.r=ball.clone();const transfer=Math.abs(Math.cos(a));if(Math.cos(a)>=0)hand.r.lerp(V(-.24,.89,.03),transfer);else hand.l.lerp(V(.24,.89,.03),transfer);
 }
 if(f==='march'&&/knee hug/.test(n)){
  const left=t<.5,u=phase((t% .5)*2),ss=left?'l':'r',k=left?1:-1;each((side,sign)=>feet[side]=V(sign*.15,.074,.025));feet[ss]=V(k*.15,.074+.46*u,.025+.28*u);hands(.11,.65+.12*u,.30);meta.close={l:.2,r:.2};
 }
 if(f==='jump'&&/depth/.test(n)){
  const drop=clamp((t-.12)/.20,0,1),flight=t>.40&&t<.73?Math.sin((t-.40)/.33*Math.PI):0,reset=clamp((t-.84)/.16,0,1),y=.34*(1-drop)+.24*flight+.34*reset,z=-.45+.43*drop-.43*reset;
  hip.set(0,.91+y-.12*Math.sin(Math.PI*drop),z);each((ss,k)=>feet[ss]=V(k*.17,.074+y,z));meta.depthBox=true;
 }
 if(f==='jump'&&/lateral box/.test(n))meta.lateralBox=true;
 if(f==='inchworm'){
  const u=q;hip.set(0,.35+.34*(1-u),-.18);o.pitch=86+40*(1-u);
  hand.l=V(.20,.047,mix(.05,.45,clamp(u*1.25,0,1)));hand.r=V(-.20,.047,mix(.05,.45,clamp((u-.20)*1.25,0,1)));
 }
 if(f==='downwardDog'&&/push-up/.test(n)){
  const u=t<.45?0:phase((t-.45)/.55),dip=t<.45?.13*Math.sin(t/.45*Math.PI):0;hip.set(0,.35+.30*u-dip,-.18);o.pitch=86+40*u;
 }
 if(f==='pushup'&&/scap/.test(n)){o.pitch=86;hip.set(0,.35,-.18);hands(.20,.047,.36);meta.scapularReach=.025*q;}
 if(f==='crunch')meta.crunch=rad(10*q);
 if(f==='crunch'&&/decline/.test(n)){o.bench=false;meta.declineBench=true;hip.set(0,.48,-.05);o.pitch=-105+25*q;feet.l=V(.17,.59,.64);feet.r=V(-.17,.59,.64);}
 if(f==='dip'&&/bench/.test(n)){meta.benchDip=true;hand.l=V(.24,.49,-.05);hand.r=V(-.24,.49,-.05);meta.handModes={l:'palm',r:'palm'};meta.close={l:0,r:0};}
 if(f==='hanging'&&/toes/.test(n)){each((ss,k)=>{const angle=rad(170*q);feet[ss]=V(k*.12,1.05-.80*Math.cos(angle),.04+.80*Math.sin(angle)*(1-.8*q));footPitch[ss]=-90*q;});}
 if(s.eq.includes('pl')&&!/pinch/.test(n)){hand.l.x+=.05;hand.r.x-=.05;}
 if(f==='russian'&&eqMachine(s)){o.yaw=0;meta.chestRotation=25*Math.sin(a);meta.torsoYoke=rad(meta.chestRotation);each((ss,k)=>hand[ss]=V(k*.20,.93,.32).applyAxisAngle(V(0,1,0),meta.torsoYoke));}
 if(f==='carry'&&/sled/.test(n)){hands(.28,1.08,.64);meta.handModes={};meta.close={l:1,r:1};}
 if(f==='legSwing'){meta.supportPost=V(-.44,1.23,.10);hand.r=V(-.44,1.23,.10);if(/side to side/.test(n)){const u=Math.sin(4*Math.PI*t);feet.l=t<.5?V(.17,.074+.16*Math.abs(u),.025+.35*u):V(.17+.30*u,.074+.12*Math.abs(u),.025);footPitch.l=t<.5?-25*u:0;}}
 if(f==='cycle'&&/air/.test(n)){meta.close={l:1,r:1};meta.levers={};each((ss,k)=>{const pivot=V(k*.27,.38,.40),z=.47+k*.10*Math.sin(a);hand[ss]=V(k*.27,.38+Math.sqrt(.70**2-(z-.40)**2),z);meta.levers[ss]={pivot,length:.70,end:hand[ss].clone()};});}
 return detailTargets(r,s,t,reviewedTargets(r,s,t,o,meta),meta);
}
// Second-pass source/configuration review: use connected body lines and fitted
// support surfaces, rather than allowing IK to hide an unreachable setup.
function reviewedTargets(r,s,t,o,meta){
 const n=s.name.toLowerCase(),f=s.family,q=phase(t),a=2*Math.PI*t,{hip,feet,hand,pole,footPitch}=o;
 const each=fn=>[['l',1],['r',-1]].forEach(([ss,k])=>fn(ss,k));
 const hands=(x,y,z)=>each((ss,k)=>hand[ss]=V(k*x,y,z));
 const bodyLine=(pitch,ankleY,ankleZ)=>{o.pitch=pitch;hip.set(0,ankleY+.84*Math.cos(rad(pitch)),ankleZ+.84*Math.sin(rad(pitch)));each((ss,k)=>{feet[ss]=V(k*.16,ankleY,ankleZ);footPitch[ss]=55;});};
 if(['flatPress','inclinePress','skull','pullover'].includes(f)&&o.bench)each((ss,k)=>feet[ss]=V(k*.20,.074,.34));
 if(f==='skull'){
  hip.set(0,.553,-.06);o.pitch=-94;
  if(!/tate/.test(n)){const ang=rad(108*q);hands(.20,.772+.236*Math.cos(ang),-.51-.236*Math.sin(ang));each((ss,k)=>pole[ss]=V(k*.1,1,0));}
 }
 if(f==='bentRow'&&/gorilla/.test(n)){
  hip.set(0,.55,-.14);o.pitch=75;
  each((ss,k)=>{const u=Math.max(0,k*Math.sin(a))**2;hand[ss]=V(k*.24,.23+.25*u,.33-.12*u);pole[ss]=V(k,1,-1);});
 }
 if(f==='pushup'&&!/pike|feet-on/.test(n)||f==='renegade'||f==='ballPlank'&&/shoulder taps/.test(n)){
  bodyLine(/scap|taps|renegade/.test(n)?73:73+11*q,.15,-.80);hands(/diamond/.test(n)?.055:.20,.047,.43);
  if(/scap/.test(n))meta.scapularReach=.025*q;
  if(f==='renegade'){feet.l.x=.28;feet.r.x=-.28;hands(.22,.095,.43);each((ss,k)=>hand[ss].lerp(V(k*.22,.43,.14),Math.max(0,k*Math.sin(a))**2));meta.handModes={l:'grip',r:'grip'};meta.close={l:1,r:1};}
  if(/taps/.test(n)){hand.l.lerp(V(-.16,.49,.38),q);meta.handModes.l=null;}
  if(/medicine ball/.test(n)){hand.l=V(0,.27,.43);hand.r=V(-.27,.047,.43);}
  if(/bosu/.test(n)){bodyLine(62+10*q,.15,-.62);hands(.20,.285,.55);}
  if(/push-up on stability ball/.test(n)){bodyLine(48+10*q,.15,-.40);hands(.16,.60,.52);}
  if(/explosive/.test(n)){const fly=.065*Math.max(0,Math.sin(a));hip.y+=fly;each(ss=>hand[ss].y+=fly);}
 }
 if(f==='inclinePush'){bodyLine(50+11*q,.15,-.55);hands(.24,.49,.55);}
 if(f==='pushup'&&/feet-on-box/.test(n)){bodyLine(89+11*q,.49,-.96);hands(.20,.047,.40);}
 if(f==='pushup'&&/feet-on-ball/.test(n)){bodyLine(96+12*q,.63,-.96);hands(.20,.047,.43);each(ss=>footPitch[ss]=0);meta.ball='feet';}
 if(f==='pushup'&&/pike/.test(n)){hip.set(0,.70-.10*q,-.21);o.pitch=125+10*q;each((ss,k)=>feet[ss]=V(k*.16,.15,-.80));hands(.20,.047,.43);}
 if(f==='downwardDog'||f==='inchworm'){
  let u=q,dip=0;
  if(/push-up/.test(n)){u=t<.45?0:phase((t-.45)/.55);dip=t<.45?Math.sin(t/.45*Math.PI):0;}
  if(f==='inchworm')u=1-q;
  const p=73+11*dip;hip.set(0,mix(.15+.80*Math.cos(rad(p)),.71,u),mix(-.80+.80*Math.sin(rad(p)),-.21,u));o.pitch=mix(p,125,u);
  each((ss,k)=>{feet[ss]=V(k*.16,.15,-.80);footPitch[ss]=55;});hands(.20,.047,.43);
  if(f==='inchworm'){hand.l.z=mix(.12,.43,clamp(q*1.25,0,1));hand.r.z=mix(.12,.43,clamp((q-.20)*1.25,0,1));}
 }
 if(s.eq.includes('sb')&&f==='ballPlank'&&/pike|jackknife/.test(n)){
  hip.set(0,.58+.20*q,-.12+.12*q);o.pitch=100+40*q;hands(.20,.047,.43);each((ss,k)=>{feet[ss]=V(k*.16,.63,-.94+.20*q);footPitch[ss]=0;});meta.ball='feet';
  if(/jackknife/.test(n)){hip.set(0,.57,-.12);o.pitch=100;each(ss=>feet[ss].z+=.30*q);}
 }
 if(s.eq.includes('trx')&&/body saw|pike|hamstring/.test(n)){
  const curl=/hamstring/.test(n),saw=/saw/.test(n),len=curl?1.70:2.40,beta=rad(curl?mix(5,-10,q):saw?41+1.5*Math.sin(a):41-5*q);
  each((ss,k)=>{const anchor=V(k*.12,2.14,.67);feet[ss]=anchor.clone().add(V(0,-len*Math.cos(beta),(curl?1:-1)*len*Math.sin(beta)));footPitch[ss]=0;meta.suspension[ss]={anchor,length:len,feet:true};});
  if(curl){hip.set(0,.36+.03*q,.05);o.pitch=-128;meta.backContact=V(0,.025,-.37);hands(.30,.065,-.10);meta.handModes={};}
  else if(saw){hip.set(0,.316,-.06+.04*Math.sin(a));o.pitch=92;hands(.20,.047,.64);meta.handModes={l:'forearm',r:'forearm'};}
  else{hip.set(0,mix(.446,.76,q),mix(-.073,-.16,q));o.pitch=mix(82,130,q);hands(.20,.047,.43);meta.handModes={l:'palm',r:'palm'};}
 }
 if(f==='legCurl'&&/ball/.test(n)){hip.set(0,.36+.03*q,.05);o.pitch=-128;meta.backContact=V(0,.025,-.37);hands(.30,.065,-.10);meta.handModes={};each((ss,k)=>feet[ss]=V(k*.16,.63,.82-.32*q));if(s.unilateral)feet.r=V(-.14,.75,.60);}
 if(f==='bridge'&&/stability ball/.test(n)&&!/squeeze/.test(n)){feet.l.y=.63;if(/single-leg/.test(n))feet.r=V(-.16,.82,.46);else feet.r.y=.63;}
 if(f==='bridge'&&/smith/.test(n))hip.z=meta.smithZ;
 if(f==='rollout'&&s.eq.includes('sb')){hands(.16,.60,.47+.20*q);hip.set(0,.58-.08*q,-.10);o.pitch=54+23*q;meta.handModes={l:'forearm',r:'forearm'};meta.close={l:0,r:0};meta.ball='hands';meta.forearmBall=true;}
 if(f==='crunch'&&/ball/.test(n)){hip.set(0,.63,.04);o.pitch=-100;meta.crunch=rad(8*q);hands(.13,.68,-.48);}
 if(f==='crunch'&&/decline/.test(n)){hip.y=.55;each(ss=>feet[ss].y=.67);}
 if(f==='rearFly'&&/face/.test(n)){hands(mix(.13,.27,q),mix(1.44,1.49,q),mix(.49,.19,q));each((ss,k)=>pole[ss]=V(k,1,0));}
 if(f==='openBook'){
  hip.set(0,.16,0);o.pitch=90;o.axial=90;o.yaw=0;meta.chestRotation=-60*q;
  feet.l=V(.35,.24,-.43);feet.r=V(.35,.08,-.43);meta.legPoles={l:V(1,0,0),r:V(1,0,0)};
  hand.r=V(.40,.08,.43);hand.l=V(mix(.40,-.40,q),.24,mix(.43,.35,q));
 }
 if(f==='hamStretch'){feet.r=V(-.22,.074,.13);meta.legPoles={r:V(-1,0,0)};}
 if(f==='shinStretch'){hip.set(0,.23,-.35);meta.legPoles={l:V(0,-1,1),r:V(0,-1,1)};}
 if(f==='quadStretch'){feet.l=V(.17,.87,-.08);footPitch.l=90;hand.l=feet.l.clone();meta.legPoles={l:V(0,-1,0)};meta.graspTargets={l:hand.l.clone()};}
 if(f==='armCircle')hands(.61,1.36+.09*Math.sin(a),.02+.09*Math.cos(a));
 if(f==='halo'){
  const plate=s.eq.includes('pl'),radius=plate?.32:.26,center=V(radius*Math.sin(a),1.48-.17*Math.cos(a),radius*Math.cos(a));
  meta.halo={center};hands(plate?.16:.055,center.y,center.z);each(ss=>hand[ss].x+=center.x);meta.graspTargets={l:hand.l.clone(),r:hand.r.clone()};
 }
 if(s.eq.includes('pl')&&/front raise/.test(n)){hand.l.x=.17;hand.r.x=-.17;meta.graspTargets={l:hand.l.clone(),r:hand.r.clone()};}
 if(f==='squat'&&n==='front squat'){r.trunk(hip,o.pitch);const sh=r.point('upperarm_l');meta.bodyBar=V(0,sh.y+.02,sh.z+.07);each((ss,k)=>{hand[ss]=V(k*.25,meta.bodyBar.y,meta.bodyBar.z);pole[ss]=V(0,0,1);});meta.handModes={l:'rack',r:'rack'};meta.close={l:.6,r:.6};}
 if(f==='legExtension'||f==='legCurl'&&!/ball|trx/.test(n)){
  r.trunk(hip,o.pitch);meta.kneePivots={};meta.legPoles={};const lying=/lying|dumbbell leg|prone band/.test(n),standing=/standing/.test(n);
  each((ss,k)=>{if(standing&&ss==='r'||s.unilateral&&ss==='r')return;const h=r.point('thigh_'+ss),thigh=V(k*.04,lying?-.015:standing?-.40:-.025,lying?-.407:standing?0:.407).setLength(r.length('thigh_'+ss,'calf_'+ss)),knee=h.clone().add(thigh),len=r.length('calf_'+ss,'foot_'+ss),angle=rad(f==='legExtension'?mix(-82,-4,q):lying||standing?105*q:mix(-4,-98,q));
   const shank=lying?V(0,len*Math.sin(angle),-len*Math.cos(angle)):standing?V(0,-len*Math.cos(angle),-len*Math.sin(angle)):V(0,len*Math.sin(angle),len*Math.cos(angle));feet[ss]=knee.clone().add(shank);meta.kneePivots[ss]=knee;meta.legPoles[ss]=thigh;footPitch[ss]=lying?-105*q:standing?50*q:-10;
  });
 }
 if(f==='hipMachine'){
  r.trunk(hip,o.pitch);meta.legPoles={};each((ss,k)=>{const h=r.point('thigh_'+ss),angle=rad((/adduction/.test(n)?mix(48,8,q):mix(8,48,q))*k),v=V(0,-.025,.408).setLength(r.length('thigh_'+ss,'calf_'+ss)).applyAxisAngle(V(0,1,0),angle),knee=h.clone().add(v);feet[ss]=knee.clone().add(V(0,-r.length('calf_'+ss,'foot_'+ss),0));meta.legPoles[ss]=v;});
 }
 if(f==='lateral'){
  const cossack=/cossack/.test(n);hip.set((cossack?.26:.23)*q,.91-(cossack?.47:.39)*q,-.08*q);o.pitch=15*q;
  if(/side.step|side lunges/.test(n)){feet.l.x=mix(.18,.55,q);feet.r.x=-.18;hip.x=.30*q;}
  if(/side.step/.test(n)){hands(.17,hip.y+.06,.03);}
 }
 if(f==='reverseNordic'&&/sissy/.test(n))each(ss=>{feet[ss].y=.074+.06*q;footPitch[ss]=20*q;});
 if(f==='jump'&&/bosu/.test(n)){const rise=.27*(t>.27&&t<.62?Math.sin(Math.PI*(t-.27)/.35):0),prep=t<.20?phase(t/.40):t<.33?1-phase((t-.20)/.26):0;hip.set(0,1.13+rise-.18*prep,.024);each((ss,k)=>feet[ss]=V(k*.15,.294+rise,.025));}
 if(f==='jump'&&/split/.test(n)){
  const half=t<.5?0:1,u=(t-half*.5)*2,step=clamp((u-.27)/.38,0,1),v=step*step*(3-2*step),lead=(half?-1:1)*(1-2*v),fly=u>.27&&u<.65?.27*Math.sin((u-.27)/.38*Math.PI):0,load=u<.27?Math.sin(u/.27*Math.PI):u>.65?Math.sin((u-.65)/.35*Math.PI):0;
  hip.set(0,.86+fly-.14*load,0);each((ss,k)=>feet[ss]=V(k*.16,.074+fly,k*.25*lead));hands(.20,1.05+.30*(fly/.27),.16);o.pitch=8*load;
 }
 if(f==='jump'&&/skater|lateral bound/.test(n)){
  const half=t<.5?0:1,u=(t-half*.5)*2,z=clamp((u-.25)/.4,0,1),v=z*z*(3-2*z),progress=half?1-v:v,fly=u>.25&&u<.65?.25*Math.sin((u-.25)/.40*Math.PI):0,load=u<.25?Math.sin(u/.25*Math.PI):u>.65?Math.sin((u-.65)/.35*Math.PI):0;
  hip.set(.42*progress,.86+fly-.10*load,0);feet.l=V(.15+.42*progress,.074+fly+.18*(1-progress),-.12*(1-progress));feet.r=V(-.15+.42*progress,.074+fly+.18*progress,-.12*progress);hands(.23,1.05,.12);o.pitch=12;
 }
 if(f==='march'&&/knee hug/.test(n)){meta.kneeHug={side:t<.5?'l':'r',amount:phase((t% .5)*2)};}
 if(f==='wallStretch'&&/biceps/.test(n)){meta.wallAxis='x';meta.wallPlane=.53;hand.l=V(.50,1.22,-.16);meta.handModes.l='wallSide';}
 if(f==='carry'&&/sled push/.test(n)){meta.graspTargets={l:hand.l.clone(),r:hand.r.clone()};}
 if(f==='carry'&&/sled pull/.test(n)){hands(.20,1.02,.47);}
 if(meta.supportPost){meta.graspTargets={...meta.graspTargets,r:hand.r.clone()};}
 if(f==='medThrow'&&/slam|wall|scoop|shot put|chest pass/.test(n))reviewedThrow(s,t,o,meta);
 return o;
}
function reviewedThrow(s,t,o,meta){
 const n=s.name.toLowerCase(),slam=/slam/.test(n),rot=/rotational/.test(n),shot=/shot put/.test(n),scoop=/scoop/.test(n),over=/overhead/.test(n),half=slam&&rot&&t>=.5?1:0,u=slam&&rot?(t-half*.5)*2:t,side=half?-1:1;
 const at=keys=>{let i=1;while(i<keys.length-1&&u>keys[i][0])i++;const p=keys[i-1],v=keys[i],x=clamp((u-p[0])/(v[0]-p[0]),0,1),q=x*x*(3-2*x);return p.slice(1).map((a,j)=>mix(a,v[j+1],q));};
 let ball,targets,held;
 if(slam){
  const x=rot?.43*side:0,z=rot?.40:.60;
  ball=V(...at([[0,0,1.10,.24],[.20,0,1.68,.20],[.30,x*.4,1.52,.33],[.46,x,.125,z],[.68,x,.125,z],[1,0,1.10,.24]]));
  const [h,p,shift]=at([[0,.91,0,0],[.20,.91,-4,0],[.46,.58,55,rot?.10*side:0],[.60,.43,75,rot?.12*side:0],[.74,.43,75,rot?.12*side:0],[1,.91,0,0]]);o.hip.set(shift,h,0);o.pitch=p;o.yaw=rot?30*side*Math.sin(Math.PI*u)**2:0;
  const follow=V(...at([[0,0,1.10,.24],[.20,0,1.68,.20],[.30,x*.4,1.52,.33],[.46,x,.66,z-.15],[.68,x,.125,z],[1,0,1.10,.24]]));held=u<=.30||u>=.68;targets=held?ball:follow;
 }else{
  const start=shot?[.19,1.40,.05]:scoop?[-.19,.98,.10]:over?[0,1.50,-.22]:[0,1.20,.24],release=shot?[.10,1.42,.60]:scoop?[0,1.15,.52]:over?[0,1.66,.48]:[0,1.25,.60],receive=shot?[.12,1.32,.42]:scoop?[0,1.10,.42]:over?[0,1.50,.30]:[0,1.20,.32];
  ball=V(...at([[0,...start],[.18,...start],[.38,...release],[.58,0,over?1.55:shot?1.35:1.16,1.50],[.79,...receive],[1,...start]]));
  targets=u>.38&&u<.79?V(...at([[0,...start],[.38,...release],[.58,0,over?1.53:1.23,.53],[.79,...receive],[1,...start]])):ball.clone();held=u<=.38||u>=.79;
  const turn=scoop||shot?-65*(1-phase(u)):0;o.yaw=turn;o.hip.y=.91-.06*(1-phase(u));o.pitch=over?6*phase(u):0;
  if(over){o.feet.r.z=-.18+.30*Math.sin(Math.PI*u)**2;o.feet.r.y=.074+.04*Math.sin(Math.PI*u)**2;}
 }
 meta.ballPath=ball;meta.release=held?0:1;meta.close={l:held?.25:0,r:held?.25:0};meta.footYaw={l:o.yaw*.75,r:o.yaw*.75};
 for(const [ss,k]of [['l',1],['r',-1]])o.hand[ss]=targets.clone().add(shot&&ss==='l'?V(0,0,-.115):V(k*.08,0,-.09));
 if(shot&&u>.18&&u<.79)o.hand.r.lerp(V(-.18,1.22,.15),clamp((u-.18)/.12,0,1)*(1-clamp((u-.67)/.12,0,1)));
 meta.graspTargets={l:o.hand.l.clone(),r:o.hand.r.clone()};
}
function eqMachine(s){return s.eq.includes('mc');}
export function finishPose(r,s,t,meta,o){
 const socket=ss=>r.gripPoint(ss);
 for(const ss of ['l','r']){
  let target=meta.graspTargets?.[ss]?.clone()||meta.levers?.[ss]?.end?.clone();
  const sleeve=meta.landmine?.end.clone().sub(meta.landmine.pivot).normalize(),landmineRow=/row/i.test(s.name);
  if(meta.landmine&&(!s.unilateral||ss==='l'))target=meta.landmine.end.clone().add(landmineRow?V(s.unilateral?0:ss==='l'?.055:-.055,0,0):sleeve.clone().multiplyScalar(s.unilateral?-.045:ss==='l'?-.04:-.12));
  if(meta.suspension?.[ss]&&!meta.suspension[ss].feet){const a=meta.suspension[ss];target=o.hand[ss].clone();}
  if(meta.smithZ!==undefined)target=socket(ss).setZ(meta.smithZ);
  if(meta.fixedBar)target=socket(ss).setY(meta.fixedBar.y).setZ(meta.fixedBar.z);
  if(s.family==='bridge'&&s.eq.some(x=>['bb','db'].includes(x)))target=r.point('pelvis').add(V(ss==='l'?.16:-.16,.10,0));
  if(target&&meta.smithZ!==undefined)target.z=meta.smithZ;
  if(target){const shelf=meta.bodyBar&&/back squat|box squat|good morning/i.test(s.name),endCup=meta.landmine&&!landmineRow&&!/single-leg.*romanian/i.test(s.name);if(endCup){const k=ss==='l'?1:-1,radial=V(1,0,0).addScaledVector(sleeve,-sleeve.x).normalize();target=meta.landmine.end.clone().addScaledVector(radial,s.unilateral?0:k*.032);meta[ss]=r.cup(ss,target,sleeve.clone().multiplyScalar(-.2).addScaledVector(radial,-k*.95));}else meta[ss]=r.grasp(ss,target,o.pole[ss]||V(ss==='l'?1:-1,-.3,.1),meta.landmine&&!landmineRow?sleeve:shelf?V(1,0,0):meta.grips?.[ss]||o.grip);if(meta.landmine)meta.landmineContacts={...meta.landmineContacts,[ss]:target};}
 }
 // Pose-specific palms keep their surface tangent to the loaded support.
 for(const ss of ['l','r']){const mode=meta.handModes?.[ss];if(!mode)continue;let target=o.hand[ss]?.clone();if(!target)continue;
  if(mode==='forearm'){
   const sh=r.point('upperarm_'+ss),el=V(sh.x,meta.forearm?.height??.047,meta.forearm?.z??.443);target=el.clone().add(V(0,0,r.length('lowerarm_'+ss,'hand_'+ss)));meta[ss]=r.arm(ss,target,el.clone().sub(sh),'bar',V(0,0,1));
  }else if(mode==='palm'||mode==='wall'||mode==='wallSide'){const direction=mode==='wall'?V(0,1,0):mode==='wallSide'?V(0,0,-1):V(0,0,1);meta[ss]=r.arm(ss,target.addScaledVector(direction,-.04),o.pole[ss]||V(ss==='l'?1:-1,0,-1),'bar',direction);}
  else if(mode==='grip')meta[ss]=r.grasp(ss,target,o.pole[ss]||V(ss==='l'?1:-1,0,-1),o.grip);
  else if(mode==='rack'){const scale=r.scales[r.ids['hand_'+ss]].y;meta[ss]=r.arm(ss,target.add(V(0,-.022*scale,-.076*scale)),V(0,0,1),'underhand',V(0,0,1));}
 }
 if(meta.gripTurn!==undefined){for(const ss of ['l','r']){const fore=r.point('hand_'+ss).sub(r.point('lowerarm_'+ss)).normalize(),rot=Q().setFromAxisAngle(fore,meta.gripTurn);r.orient('hand_'+ss,r.point('hand_'+ss),rot.multiply(r.rotation('hand_'+ss)));meta[ss].axis.applyQuaternion(Q().setFromAxisAngle(fore,meta.gripTurn));}}
 if(meta.wristStretch!==undefined){r.orient('hand_l',r.point('hand_l'),Q().setFromAxisAngle(V(1,0,0),meta.wristStretch).multiply(r.rotation('hand_l')));}
 if(meta.scapularReach){for(const ss of ['l','r']){const p=r.point('clavicle_'+ss).add(V(0,meta.scapularReach,0));r.orient('clavicle_'+ss,p,r.rotation('clavicle_'+ss));const sh=r.point('upperarm_'+ss),end=o.hand[ss];meta[ss]=r.arm(ss,end,V(ss==='l'?1:-1,0,-1),'bar',V(0,0,1));}}
 if(s.family==='deadbug'||s.family==='figure4'||s.family==='flatPress'&&/floor/i.test(s.name)){const p=r.point('head');p.y=.112;r.orient('head',p,r.rotation('head'));}
 if(meta.backContact){const p=r.point('head');p.y=/thrust|glute drive/i.test(s.name)?.586:.112;r.orient('head',p,r.rotation('head'));}
 if(meta.kneeHug){const {side,amount}=meta.kneeHug,knee=r.point('calf_'+side);for(const [ss,k]of [['l',1],['r',-1]]){const target=o.hand[ss].clone().lerp(knee.clone().add(V(k*.055,.015,.055)),amount);meta[ss]=r.grasp(ss,target,V(k,0,1),'neutral');}}
 detailPose(r,s,t,meta,o);
 r.closeHands(meta.close);
}
