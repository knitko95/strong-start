// Author poses in metres: Y up, Z forward, left on +X. All limb lengths come from the frozen rig.
import {V,Q,M,T,rad} from './rig.mjs';
const lerp=T.MathUtils.lerp,clamp=T.MathUtils.clamp;
export const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export function phase(t){return t<.12?0:t<.46?ease((t-.12)/.34):t<.57?1:t<.94?1-ease((t-.57)/.37):0;}
export function pose(r,s,t){
 r.reset();const n=s.name.toLowerCase(),f=s.family,q=phase(t),a=2*Math.PI*t,w=Math.sin(a),c=Math.cos(a),un=s.unilateral;
 let hip=r.pivot.clone(),pitch=0,yaw=0,roll=0,axial=0,feet={l:V(.185,.074,.025),r:V(-.185,.074,.025)},footPitch={l:0,r:0},hand={},pole={},grip=s.eq.includes('bb')||s.eq.includes('pl')?'bar':s.eq.includes('cb')||s.eq.includes('bd')?'bar':'neutral',floor=false;
 let seated=s.seated,bench=false,prone=false,kneel=s.halfKneel;
 const meta={floor:false,bench:false,seated:false,grip,contacts:[],release:0};let jumpingYaw=0;
 const both=fn=>{for(const [side,sign]of [['l',1],['r',-1]])fn(side,sign);};
 const foot=(side,p,angle=0)=>{feet[side]=p;footPitch[side]=angle;};
 const setHands=(x,y,z)=>both((side,sign)=>hand[side]=V(sign*x,y,z));
 const supine=(height=.14)=>{hip.set(0,height,.03);pitch=-90;floor=true;both((side,sign)=>foot(side,V(sign*.18,.074,.62)));};
 const sit=(height=.53)=>{hip.set(0,height,0);both((side,sign)=>foot(side,V(sign*.20,.074,.43)));seated=true;};
 const quadruped=()=>{hip.set(0,.47,-.18);pitch=85;floor=true;both((side,sign)=>{foot(side,V(sign*.12,.075,-.58),180);hand[side]=V(sign*.22,.11,.49);pole[side]=V(sign,0,-1);});};
 const plank=(height=.37,forearms=false)=>{hip.set(0,height,-.18);pitch=86;floor=true;both((side,sign)=>{foot(side,V(sign*.16,.15,-.96),55);hand[side]=V(sign*.22,forearms?.12:.09,.59);pole[side]=forearms?V(0,-1,-1):V(sign,0,-1);});};
 const hanging=()=>{hip.set(0,1.05,.03);both((side,sign)=>{foot(side,V(sign*.12,.21,.02));hand[side]=V(sign*.34,1.91,.04);pole[side]=V(sign,0,0);});};
 const kneeling=()=>{hip.set(0,.51,-.10);both((side,sign)=>foot(side,V(sign*.13,.075,-.47),180));kneel=true;};
 switch(f){
 case 'flatPress':case 'inclinePress':case 'skull':{
  supine(/floor/.test(n)?.14:.53);bench=!/floor/.test(n);pitch=f==='inclinePress'?-60:-90;
  if(f==='skull'){if(/tate/.test(n))setHands(.09,lerp(1.01,.67,q),-.46);else setHands(.20,.91-.15*q,-.55-.28*q);}
  else setHands(/close-grip|squeeze/.test(n)?.14:.31,lerp(.67,1.02,q),-.47);
  both((side,sign)=>pole[side]=V(sign,-.3,.2));break;}
 case 'seatedPress':sit();bench=true;pitch=/incline/.test(n)?-22:0;setHands(.27,1.02,.17+.42*q);both((side,sign)=>pole[side]=V(sign,-1,0));break;
 case 'standingPress':hip.z=-.03;foot('r',V(-.18,.074,-.20));setHands(.24,1.22,.15+.42*q);both((side,sign)=>pole[side]=V(sign,-1,-1));break;
 case 'overhead':{
  if(seated){sit();bench=true;}if(n==='z press'){sit(.13);feet={l:V(.16,.074,.78),r:V(-.16,.074,.78)};floor=true;}
  if(kneel){hip.set(0,.56,0);foot('l',V(.16,.074,.42));foot('r',V(-.15,.08,-.42),40);}
  if(/push press|clean|snatch/.test(n)){hip.y-=.10*(1-q);hip.z-=.025*(1-q);}
  const base=hip.y+.27,top=hip.y+.89;setHands(lerp(.27,.23,q),lerp(base,top,q),.12);
  if(/landmine/.test(n))hand.l.set(.13,lerp(1.04,1.47,q),lerp(.24,.50,q));
  if(/clean/.test(n)){const clean=t<.30?phase(t/.30):1;hand.l.y=t<.30?lerp(.63,1.14,clean):lerp(1.14,1.78,phase((t-.30)/.70));}
  if(/snatch/.test(n)){pitch=35*(1-q);hand.l.set(.20,lerp(.52,1.79,q),lerp(.30,.04,q));}
  if(/arnold/.test(n))grip=q<.45?'underhand':'bar';both((side,sign)=>pole[side]=V(sign,0,.1));break;}
 case 'fly':{
  if(/ball/.test(n)){supine(.62);feet={l:V(.28,.074,.55),r:V(-.28,.074,.55)};meta.ball='back';}
  else if(seated){sit();bench=true;}
  const yy=/high to low/.test(n)?lerp(1.40,.85,q):/low to high/.test(n)?lerp(.88,1.42,q):hip.y+.32;
  setHands(lerp(.58,.06,q),yy,lerp(.10,.48,q));if(floor)setHands(lerp(.57,.06,q),lerp(.66,1.04,q),-.44);break;}
 case 'raise':{
  if(seated){sit();bench=true;}if(/ball/.test(n)){hip.set(0,.56,-.22);pitch=60;prone=true;floor=true;meta.ball='chest';}
  const angle=rad(10+(/lu|y-raise/.test(n)?155:80)*q),h=hip.y+.45;setHands(.16+.48*Math.sin(angle),h-.48*Math.cos(angle),.06);
  if(/plate front/.test(n))setHands(.13,h-.46*Math.cos(angle),.46*Math.sin(angle));
  if(/leaning/.test(n)){roll=-12;hand.r=V(-.55,1.31,-.02);}break;}
 case 'halo':{const angle=a;setHands(.12,1.52+.10*Math.cos(angle),.20*Math.sin(angle));both((side,sign)=>hand[side].x=sign*.12+.19*Math.cos(angle));break;}
 case 'pushdown':if(seated){sit();bench=true;}setHands(lerp(.17,.23,q),hip.y+lerp(.27,-.05,q),lerp(.36,.10,q));both((side,sign)=>pole[side]=V(sign,-1,-1));break;
 case 'tricepsOverhead':setHands(.08,lerp(1.48,1.82,q),lerp(-.20,.025,q));both((side,sign)=>pole[side]=V(sign,1,0));break;
 case 'kickback':hip.z=-.08;hip.y-=.08;pitch=55;hand.l=V(.23,lerp(.89,1.08,q),lerp(.20,-.26,q));hand.r=V(-.26,.77,.24);pole.l=V(0,1,-1);break;
 case 'pushup':case 'inclinePush':case 'wallPush':{
  if(f==='wallPush'){hip.set(0,.88,-.05);pitch=18;setHands(.24,1.24,.60);foot('l',V(.16,.074,-.08));foot('r',V(-.16,.074,-.08));hip.z+=.17*q;pitch+=12*q;meta.wall=true;}
  else {plank();hip.y-=.20*q;if(/pike/.test(n)){hip.y=.83-.18*q;pitch=45;feet={l:V(.17,.074,-.62),r:V(-.17,.074,-.62)};setHands(.23,.09,.53);}
   if(f==='inclinePush'){hip.y+=.28;pitch=60;setHands(.25,.55,.55);bench=true;}
   if(/feet-on|decline/.test(n)){feet.l.y=/ball/.test(n)?.60:.46;feet.r.y=feet.l.y;hip.y+=.22;pitch=102;}
   if(/hands|ball push-up|bosu push-up/.test(n)&&!/feet/.test(n)){hand.l.y+=.25;hand.r.y+=.25;hip.y+=.12;}
   if(/medicine ball/.test(n)){hand.l.set(.0,.23,.59);hand.r.set(-.25,.09,.59);}
   if(/push-up on stability ball/.test(n)){hand.l.y=.64;hand.r.y=.64;hip.y+=.30;pitch=63;}
   if(/diamond/.test(n)){hand.l.x=.05;hand.r.x=-.05;}
   if(/scap/.test(n)){hip.y=.37+.025*q;}
   if(/explosive|fast/.test(n)){hand.l.y+=.08*Math.max(0,Math.sin(a));hand.r.y=hand.l.y;hip.y+=.08*Math.max(0,Math.sin(a));}
  }
  both((side,sign)=>pole[side]=V(sign,0,-1));if(/taps/.test(n))hand.l.lerp(V(-.18,1.20,.48),q);break;}
 case 'suspensionPress':{
  hip.set(0,.83,.10+.16*q);pitch=25+15*q;setHands(lerp(.25,.20,q),1.13,.57);both((side,sign)=>pole[side]=V(sign,-1,-1));
  if(/fly/.test(n))setHands(lerp(.22,.57,q),1.10,.44);if(/triceps/.test(n))setHands(.18,1.38,.45);
  if(/fallout/.test(n)){pitch=25+30*q;hip.z=.10+.21*q;setHands(.22,1.38,.66);}
  if(/anti-rotation/.test(n)){yaw=90;setHands(.07,1.15,.35+.20*q);}break;}
 case 'dip':{
  hip.y=.83-.23*q;feet={l:V(.14,.27,-.14),r:V(-.14,.27,-.14)};setHands(.33,1.0,0);pitch=12;
  if(/bench/.test(n)){hip.set(0,.40-.15*q,.21);feet={l:V(.15,.074,.75),r:V(-.15,.074,.75)};setHands(.24,.47,-.05);bench=true;floor=true;}both((side,sign)=>pole[side]=V(sign,0,-1));break;}
 case 'chop':case 'pallof':{
  if(kneel){hip.set(0,.56,0);foot('l',V(.17,.074,.40));foot('r',V(-.15,.08,-.40),45);}
  if(f==='pallof')setHands(.055,hip.y+.30,.24+.30*q);
  else {const high=/low to high|lift/.test(n);yaw=lerp(-35,35,q);setHands(.06,lerp(high?.75:1.50,high?1.50:.75,q),.37);both((side)=>hand[side].x+=lerp(-.30,.30,q));if(/push press/.test(n))hand.l.y+=.23*q;}
  break;}
 case 'russian':case 'seatedTwist':{
  sit(/machine/.test(n)?.53:.15);pitch=-25;yaw=32*w;floor=!/machine/.test(n);setHands(.07,hip.y+.35,.35);both((side)=>hand[side].x+=.32*w);if(/ball/.test(n)){supine(.60);yaw=30*w;setHands(.06,.98,-.44);meta.ball='back';}break;}
 case 'windmill':{hip.x=-.17*q;pitch=35*q;roll=23*q;hand.l=V(.19,1.78-.20*q,.02);hand.r=V(-.27,lerp(.75,.23,q),.16);feet={l:V(.31,.074,.03),r:V(-.31,.074,.03)};break;}
 case 'around':setHands(.20,1.01,.03);hand.l.set(.30*Math.cos(a),.97,.30*Math.sin(a));hand.r.copy(hand.l).add(V(-.10,0,0));break;
 case 'renegade':plank();feet.l.x=.30;feet.r.x=-.30;hand.l.lerp(V(.22,.46,.17),q);pole.l=V(1,1,-1);break;
 case 'hanging':{
  hanging();if(/dead hang/.test(n))break;
  if(/scap/.test(n)){hip.y+=.045*q;feet.l.y+=.045*q;feet.r.y+=.045*q;break;}
  both((side,sign)=>{const bent=/knee|oblique/.test(n),angle=rad((/toes/.test(n)?148:92)*q);const length=bent?.58:.80;foot(side,V(sign*.12,hip.y-.80*Math.cos(angle)+(bent?.20*q:0),length*Math.sin(angle)));});
  if(/oblique/.test(n)){feet.l.x+=.22*q;feet.r.x+=.22*q;}
  if(/wiper/.test(n)){both((side,sign)=>foot(side,V(sign*.12+.50*w,1.27,.65)));yaw=18*w;}break;}
 case 'pullup':{
  hanging();const lift=.36*q;hip.y+=lift;feet.l.y+=lift;feet.r.y+=lift;setHands(.36,1.91,.04);
  if(/chin/.test(n))grip='underhand';if(/neutral/.test(n))grip='neutral';if(/l-sit/.test(n)){feet.l.set(.12,1.0+lift,.79);feet.r.set(-.12,1.0+lift,.79);}
  if(/archer/.test(n)){hip.x=.17*q;hand.l.x=.42;hand.r.x=-.42;}
  if(/assisted/.test(n)){feet.l.set(.14,.55+lift,-.30);feet.r.set(-.14,.55+lift,-.30);footPitch.l=180;footPitch.r=180;}
  if(/commando/.test(n)){hand.l.set(.0,1.91,.11);hand.r.set(.0,1.91,-.05);hip.x=.10*q;}
  if(/monkey/.test(n)){hip.x=.13*w;hand.l.z=.10+.20*Math.max(0,w);hand.r.z=-.1+.20*Math.max(0,-w);}
  both((side,sign)=>pole[side]=V(sign,0,1));break;}
 case 'pulldown':{
  if(/kneeling/.test(n))kneeling();else{sit();bench=true;}
  setHands(/close/.test(n)?.13:.35,hip.y+lerp(.89,.30,q),.15);both((side,sign)=>pole[side]=V(sign,-1,.25));break;}
 case 'bentRow':case 'singleRow':case 'proneRow':case 'seatedRow':{
  if(f==='seatedRow'){sit();if(!/machine/.test(n))feet={l:V(.17,.074,.69),r:V(-.17,.074,.69)};bench=/machine/.test(n);floor=!bench;}
  else if(f==='proneRow'){hip.set(0,/seal/.test(n)?.80:.63,-.19);pitch=/seal/.test(n)?90:58;bench=!/ball/.test(n);meta.ball=/ball/.test(n)?'chest':null;prone=true;feet={l:V(.22,.074,-.72),r:V(-.22,.074,-.72)};}
  else if(f==='singleRow'&&!/cable|tube|kneeling/.test(n)){hip.set(.12,.84,-.02);pitch=60;hand.r=V(-.20,.55,.43);feet.r.set(-.20,.46,-.27);bench=true;}
  else if(/half-kneeling/.test(n)){hip.set(0,.57,0);foot('l',V(.17,.074,.42));foot('r',V(-.15,.08,-.41),40);}
  else {pitch=/pendlay/.test(n)?80:/cable|tube/.test(n)?5:48;hip.z=-.10;hip.y-=.07;}
  const shoulderY=hip.y+.44*Math.cos(rad(pitch)),shoulderZ=hip.z+.44*Math.sin(rad(pitch));
  both((side,sign)=>{if(f==='singleRow'&&side==='r'&&hand.r)return;const start=V(sign*.24,shoulderY-.36,shoulderZ+.13),end=V(sign*.24,hip.y+.14,hip.z+.05);if(f==='seatedRow'||/cable|tube/.test(n)){start.set(sign*.20,hip.y+.25,.52);end.set(sign*.20,hip.y+.20,.15);}hand[side]=start.lerp(end,q);pole[side]=V(sign,1,-1);});
  if(/rotational/.test(n))yaw=25*(1-q);if(/gorilla/.test(n)){hand.l.y+=.13*(1+w);hand.r.y+=.13*(1-w);}break;}
 case 'suspensionRow':{
  hip.set(0,.61-.10*q,-.10);pitch=-37-12*q;setHands(.23,1.05,.36);feet={l:V(.17,.074,.48),r:V(-.17,.074,.48)};both((side,sign)=>pole[side]=V(sign,0,-1));
  if(/face/.test(n))setHands(.26,1.26,.21);if(/biceps/.test(n))setHands(.22,1.22,.27);if(/y-t-w/.test(n)){const points=[[.38,1.49],[.53,1.14],[.31,1.16]],u=t*3,i=Math.floor(u)%3,v=ease(u-Math.floor(u)),p=points[i],b=points[(i+1)%3];setHands(lerp(p[0],b[0],v),lerp(p[1],b[1],v),.26);}
  if(/power pull/.test(n)){yaw=35*(1-q);hand.r=V(-.52,.72,.0);}break;}
 case 'pullover':{
  if(/dumbbell/.test(n)){supine(.58);bench=true;setHands(.06,lerp(.90,.69,q),lerp(-.46,-.94,q));}
  else{pitch=12;setHands(.22,lerp(1.49,.82,q),lerp(.39,.22,q));}break;}
 case 'rearFly':case 'proneYTW':{
  if(/prone|ball/.test(n)){hip.set(0,/ball/.test(n)?.53:.13,-.20);pitch=85;floor=true;prone=true;meta.ball=/ball/.test(n)?'chest':null;feet={l:V(.20,.074,-.73),r:V(-.20,.074,-.73)};}
  else if(seated){sit();bench=true;}
  const face=/face/.test(n),armY=hip.y+.36;setHands(face?lerp(.12,.33,q):lerp(.09,.57,q),face?armY+.12:armY,lerp(.48,.02,q));
  if(f==='proneYTW'||/y-t-w/.test(n)){const points=[[.43,.62],[.57,.28],[.33,.29]],u=t*3,i=Math.floor(u)%3,v=ease(u-Math.floor(u)),p=points[i],b=points[(i+1)%3];setHands(lerp(p[0],b[0],v),hip.y+.08,lerp(p[1],b[1],v));both((side,sign)=>hand[side].y+=.025*q);}
  both((side,sign)=>pole[side]=V(sign,0,-1));break;}
 case 'externalRotation':hand.l=V(.18+.29*q,1.03,.27-.17*q);hand.r=V(-.23,.91,.03);pole.l=V(0,-1,0);break;
 case 'curl':{
  if(seated){sit();bench=true;}both((side,sign)=>{const shoulder=V(sign*.164,hip.y+.45,.02),elbow=shoulder.clone().add(V(sign*.04,-.23,/bayesian/.test(n)?-.10:.02));const angle=rad(10+112*q);hand[side]=elbow.clone().add(V(0,-.235*Math.cos(angle),.235*Math.sin(angle)));pole[side]=V(sign,-1,-1);});
  if(/preacher|concentration/.test(n)){hand.l.z+=.12;hand.r.z+=.12;}grip=/hammer/.test(n)?'neutral':/zottman/.test(n)&&t>.5?'bar':'underhand';break;}
 case 'squat':{
  const hold=/hold|pry|wall sit/.test(n),depth=hold?.8:q;hip.y-=.36*depth;hip.z-=.14*depth;pitch=/front|zercher|goblet/.test(n)?10*depth:20*depth;
  feet={l:V(.23,.074,.04),r:V(-.23,.074,.04)};if(/bosu/.test(n)){hip.y+=.20;feet.l.y+=.20;feet.r.y+=.20;}
  if(/wall/.test(n))meta.wall=true;if(/bench|box squat|chair/.test(n))bench=true;
  if(/back squat|smith|box squat/.test(n))setHands(.34,hip.y+.43,hip.z-.06);
  else if(/front squat/.test(n)&&s.eq.includes('bb'))setHands(.26,hip.y+.43,hip.z+.12);
  else if(/zercher/.test(n))setHands(.17,hip.y+.28,hip.z+.21);
  else if(s.eq.includes('db')&&!/goblet/.test(n))setHands(.28,hip.y-.03,hip.z+.12);
  else setHands(.10,hip.y+.35,hip.z+.25);break;}
 case 'legPress':{
  hip.set(0,.54,-.18);pitch=-30;seated=true;bench=true;const yy=.82+.25*q,zz=.40+.24*q;both((side,sign)=>foot(side,V(sign*.20,yy,zz),-45));setHands(.28,.43,-.09);if(un)foot('r',V(-.19,.25,.30));if(/calf/.test(n)){feet.l.y=1.00+.035*q;feet.r.y=1.00+.035*q;footPitch.l=-45+18*q;footPitch.r=footPitch.l;}break;}
 case 'hinge':case 'singleHinge':case 'swing':{
  const depth=f==='swing'?1-q:q;pitch=62*depth;hip.y-=.09*depth;hip.z-=.19*depth;
  if(/conventional|trap bar|double kettlebell|sumo/.test(n)){pitch=40*depth;hip.y-=.25*depth;}
  if(/sumo/.test(n))feet={l:V(.37,.074,.06),r:V(-.37,.074,.06)};
  if(f==='singleHinge'){foot('r',V(-.12,.074+.73*depth,-.03-.70*depth),-45*depth);if(/b-stance/.test(n))foot('r',V(-.16,.074,-.30));if(/bosu/.test(n)){hip.y+=.23;feet.l.y+=.23;}}
  const sy=hip.y+.43*Math.cos(rad(pitch)),sz=hip.z+.43*Math.sin(rad(pitch));setHands(.24,sy-.46,sz+.03);
  if(/good morning/.test(n))setHands(.34,sy,sz-.10);
  if(f==='swing')setHands(.06,lerp(.49,1.30,q),lerp(.10,.56,q));break;}
 case 'backExtension':{hip.set(0,.80,0);pitch=lerp(35,80,q);feet={l:V(.14,.12,-.54),r:V(-.14,.12,-.54)};setHands(.13,.97-.23*q,.27+.21*q);prone=true;meta.extensionPad=true;break;}
 case 'bridge':{
  const raised=/thrust|glute drive/.test(n),top=raised?.58:.40;hip.set(0,lerp(raised?.30:.15,top,q),.10);pitch=lerp(-118,-90,q);floor=true;bench=raised;
  feet={l:V(.19,.074,.62),r:V(-.19,.074,.62)};if(/single-leg/.test(n))foot('r',V(-.13,.51,.43));if(/ball/.test(n)){feet.l.y=.60;feet.r.y=.60;feet.l.z=.77;feet.r.z=.77;meta.ball='feet';}
  setHands(.22,hip.y+.08,.07);break;}
 case 'lunge':case 'kneelingStretch':case 'worldStretch':{
  let depth=f==='lunge'?(s.hold?.8:q):.82;hip.y-=.30*depth;hip.z=-.04;pitch=f==='worldStretch'?40:10*depth;
  feet={l:V(.16,.074,.35),r:V(-.16,.09,-.43)};footPitch.r=40;
  if(/bulgarian/.test(n)){feet.r.y=.43;bench=true;}if(/bosu/.test(n)){feet.l.y=.31;hip.y+=.10;}
  if(/pistol|single-leg squat/.test(n)){foot('r',V(-.12,.26+.18*depth,.53));hip.y-=.10*depth;}
  if(/skater/.test(n))foot('r',V(-.12,.20,-.38));
  if(/curtsy/.test(n))feet.r.x=.20;if(/transverse/.test(n))yaw=35*q;
  setHands(.27,hip.y-.03,.05);if(/goblet|medicine/.test(n))setHands(.09,hip.y+.33,.26);
  if(/barbell|smith/.test(n))setHands(.34,hip.y+.42,-.06);
  if(f==='kneelingStretch'){hip.y=.52;footPitch.r=180;setHands(.14,n.includes('reach')?1.40:.88,.12);kneel=true;floor=true;}
  if(f==='worldStretch'){hip.y=.48;pitch=80;hand.l=V(.29,.10,.34);hand.r=V(-.29,.36+.60*q,.32);yaw=35*q;floor=true;}break;}
 case 'step':{
  const height=/high/.test(n)?.48:/peterson/.test(n)?.14:/bosu/.test(n)?.23:.34,up=/down/.test(n)?1-q:q;hip.set(0,.88+height*up,-.02+.16*up);
  feet={l:V(.16,.074+height,.25),r:V(-.16,.074+height*up,.025)};if(/lateral|crossover/.test(n)){feet.l.x=.26;feet.l.z=.04;hip.x=.17*up;}
  if(/knee drive/.test(n))foot('r',V(-.14,.074+height*up+.35*up,.02+.35*up));setHands(.27,hip.y-.03,.04);meta.stepHeight=height;break;}
 case 'lateral':{
  hip.set(.27*q,.91-.28*q,-.09*q);pitch=17*q;feet={l:V(.48,.074,.02),r:V(-.48,.074,.02)};setHands(.10,hip.y+.31,.27);if(/cossack/.test(n)){hip.x=.32*q;hip.y-=.10*q;footPitch.r=-25*q;}break;}
 case 'legCurl':{
  if(/ball|trx/.test(n)){supine(.40);feet={l:V(.16,.60,lerp(.80,.45,q)),r:V(-.16,.60,lerp(.80,.45,q))};setHands(.31,.13,.10);if(/single-leg/.test(n))foot('r',V(-.14,.72,.45));meta.ball=/ball/.test(n)?'feet':null;}
  else if(/seated/.test(n)){sit();bench=true;both((side,sign)=>foot(side,V(sign*.16,lerp(.46,.13,q),lerp(.70,.19,q))));setHands(.27,.43,.0);}
  else if(/standing/.test(n)){foot('l',V(.18,.074+.34*q,.02-.34*q),50*q);hand.r=V(-.45,1.17,.10);}
  else{hip.set(0,.57,0);pitch=90;prone=true;floor=true;bench=!/prone band/.test(n);if(!bench)hip.y=.16;both((side,sign)=>foot(side,V(sign*.13,hip.y+.43*q,-.76+.36*q),-90*q));setHands(.25,hip.y-.02,.47);}break;}
 case 'nordic':case 'reverseNordic':{
  if(/sissy/.test(n)){hip.y-=.18*q;hip.z-=.14*q;pitch=-25*q;setHands(.12,hip.y+.28,.25);hand.r=V(-.44,1.14,.10);meta.post=true;}
  else{kneeling();const angle=rad((f==='nordic'?58:-40)*q);hip.set(0,.435*Math.cos(angle)+.10,.435*Math.sin(angle));pitch=(f==='nordic'?58:-40)*q;setHands(.12,hip.y+.28,hip.z+.24);floor=true;}break;}
 case 'legExtension':sit();bench=true;both((side,sign)=>foot(side,V(sign*.17,lerp(.074,.49,q),lerp(.37,.76,q))));if(un)feet.r.set(-.17,.074,.37);setHands(.28,.43,0);break;
 case 'hipMachine':sit();bench=true;both((side,sign)=>foot(side,V(sign*lerp(/adduction/.test(n)?.42:.14,/adduction/.test(n)?.14:.42,q),.074,.40)));setHands(.29,.43,.01);break;
 case 'hipCable':foot('l',V(lerp(.16,/adduction/.test(n)?-.15:.55,q),.074+.08*q,.025));hand.r=V(-.50,1.14,.10);break;
 case 'sideLeg':case 'clamshell':case 'sidePlank':case 'openBook':case 'figure4':{
  hip.set(0,f==='sidePlank'?.34:.16,0);pitch=f==='sidePlank'?75:90;axial=90;floor=true;
  feet={l:V(0,.18,-.82),r:V(0,.08,-.82)};setHands(.08,.11,.48);
  if(f==='sideLeg')foot('l',V(.0,.20+.44*q,-.75+.13*q));
  if(f==='clamshell'){feet.l.set(.12,.16,-.52);feet.r.set(.10,.08,-.52);hip.z=-.10;}
  if(f==='sidePlank'){feet.l.z=-.87;feet.r.z=-.84;hand.r=V(0,.11,.65);hand.l=V(0,1.05,.38);pole.r=V(0,-1,-1);if(/copenhagen/.test(n)){feet.l.y=.47;feet.r.y=.32;hip.y+=.18;bench=true;}if(/bosu/.test(n)){hip.y+=.10;hand.r.y+=.20;}}
  if(f==='openBook'){yaw=70*q;hand.l=V(.50*q,.15,.46-.36*q);hand.r=V(.03,.12,.49);feet.l.z=-.40;feet.r.z=-.40;}
  if(f==='figure4'){supine();foot('l',V(-.09,.43,.39));foot('r',V(-.13,.21,.52));setHands(.10,.35,.35);}break;}
 case 'calf':case 'tibialis':{
  if(seated){sit();bench=true;}const lift=f==='calf'?.075*q:0;hip.y+=lift;both((side,sign)=>foot(side,V(sign*.18,.074+lift,.025),f==='tibialis'?-22*q:20*q));if(un)foot('r',V(-.15,.22,-.10));setHands(.25,hip.y-.03,.04);break;}
 case 'jump':{
  const prep=t<.20?ease(t/.20):t<.33?1-ease((t-.20)/.13):0,flight=t>.27&&t<.62?Math.sin(Math.PI*(t-.27)/.35):0,land=t>.60&&t<.82?Math.sin(Math.PI*(t-.60)/.22):0;
  const platform=/box|bosu/.test(n),height=platform?(/bosu/.test(n)?.22:.34):0,outward=ease((t-.28)/.36),returning=ease((t-.76)/.24),progress=outward*(1-returning),jump=.27*flight;
  hip.y-=.19*(prep+.7*land);hip.y+=jump+height*progress;hip.z+=/broad|box|approach/.test(n)?.38*progress:0;
  if(/lateral|skater|bound/.test(n))hip.x=.42*progress;if(/rotational/.test(n)){yaw=180*outward+180*returning;jumpingYaw=yaw;}
  both((side,sign)=>{foot(side,V(sign*.18+hip.x,.074+jump+height*progress,.025+hip.z-r.pivot.z));if(/tuck/.test(n))feet[side].y+=.27*flight;});
  if(/split/.test(n)){feet.l.z+=.27*(1-2*progress);feet.r.z-=.27*(1-2*progress);}
  if(platform&&t>.72){const right=ease((t-.72)/.18),left=ease((t-.84)/.16);feet.r.y=.074+height*(1-right);feet.l.y=.074+height*(1-left);feet.r.z=.025+.38*(1-right);feet.l.z=.025+.38*(1-left);}
  if(un){feet.r.y+=.20;feet.r.z-=.12;}setHands(.23,lerp(.79,1.60,flight),.30*flight);pitch=12*prep;
  if(/pogo/.test(n)){hip.y=r.pivot.y+.06*Math.sin(Math.PI*2*t)**2;both((side,sign)=>foot(side,V(sign*.16,.074+.06*Math.sin(Math.PI*2*t)**2,.025)));setHands(.24,.89,.01);}
  meta.stepHeight=height;meta.reset=true;break;}
 case 'bandWalk':case 'shuffle':{
  hip.y-=.13;hip.x=.13*w;pitch=12;both((side,sign)=>foot(side,V(sign*.25+.13*w,.074+.035*Math.max(0,sign*w),/monster/.test(n)?.08*sign*w:.025)));setHands(.10,1.14,.24);break;}
 case 'ropes':{
  hip.y-=.12;pitch=18;feet={l:V(.25,.074,.04),r:V(-.25,.074,.04)};
  setHands(.20,.95,.43);if(/alternating|shuffle/.test(n)){hand.l.y+=.18*w;hand.r.y-=.18*w;}else if(/side-to-side/.test(n)){hand.l.x+=.26*w;hand.r.x+=.26*w;yaw=20*w;}else{hand.l.y+=.45*q;hand.r.y+=.45*q;hip.y+=.10*q;}
  if(/rotational/.test(n)){yaw=35*w;hand.l.x+=.20*w;hand.r.x+=.20*w;}if(/shuffle/.test(n))hip.x=.16*w;break;}
 case 'medThrow':{
  const slam=/slam/.test(n),over=/overhead|vertical/.test(n),rotation=/rotational|scoop|shot put/.test(n);setHands(.09,slam||over?lerp(.88,1.73,q):1.19,lerp(.18,.48,q));
  if(slam){hip.y-=.12*(1-q);pitch=25*(1-q);meta.release=t>.60&&t<.90?ease((t-.60)/.30):0;}
  else meta.release=t>.46&&t<.82?Math.sin(Math.PI*(t-.46)/.36):0;
  if(rotation){yaw=lerp(-38,38,q);both(side=>hand[side].x+=.25*w);}if(/shot put/.test(n)){hand.l.set(.21,1.36,.16+.38*q);hand.r.set(.09,1.32,.21+.34*q);}if(/scoop/.test(n)){setHands(.07,.83+.34*q,.31);both(side=>hand[side].x+=lerp(-.35,.38,q));}if(/vertical/.test(n))hip.y+=.12*q;break;}
 case 'getup':{
  // Segmented, reversible sequence: supine, elbow, tall sit, bridge, half-kneel, stand.
  const u=t<.5?ease(t*2):ease((1-t)*2),stages=[[0,.15,-90,.03],[.20,.22,-48,.03],[.37,.25,-12,.04],[.52,.43,-14,-.04],[.69,.58,0,-.05],[1,.91,0,.024]];
  let b=1;while(b<stages.length-1&&u>stages[b][0])b++;const p=stages[b-1],v=stages[b],k=ease((u-p[0])/(v[0]-p[0]));hip.set(0,lerp(p[1],v[1],k),lerp(p[3],v[3],k));pitch=lerp(p[2],v[2],k);
  feet.l.set(.18,.074,.48*(1-u));feet.r.set(-.18,.074,-.28*Math.sin(Math.PI*u));hand.l=V(.16,hip.y+.44*Math.cos(rad(pitch))+.47,hip.z+.44*Math.sin(rad(pitch)));hand.r=V(-.28,lerp(.10,.82,ease((u-.5)*2)),.07);floor=u<.7;break;}
 case 'carry':case 'walk':case 'jog':case 'march':case 'stairs':case 'elliptical':{
  const fast=f==='jog',stride=fast?.29:.18,bob=(fast?.045:.013)*Math.sin(a*2)**2;hip.y+=bob;both((side,sign)=>{const swing=sign*w;foot(side,V(sign*.15,.074+Math.max(0,swing)*(f==='march'?.37:fast?.14:.065),stride*Math.cos(a+(sign<0?Math.PI:0))));hand[side]=V(sign*.23,1.0+(f==='carry'?0:-.10*swing),-.16*swing);});
  if(/front rack|bear-hug/.test(n))setHands(.12,1.23,.19);if(/overhead/.test(n))hand.l=V(.20,1.80,.01);if(/mixed/.test(n))hand.l=V(.18,1.23,.15);
  if(/sled push/.test(n)){pitch=25;setHands(.28,1.05,.53);}if(/sled pull/.test(n)){pitch=-12;setHands(.20,1.02,.47);}
  if(/knee hug/.test(n)){foot('l',V(.12,.55+.03*q,.34));setHands(.12,.74,.37);}if(f==='stairs'){feet.l.y+=.13;feet.r.y+=.13;hip.y+=.13;meta.stepHeight=.20;}break;}
 case 'cycle':{
  sit(.72);pitch=22;both((side,sign)=>{const theta=a+(sign<0?Math.PI:0);foot(side,V(sign*.16,.34+.15*Math.sin(theta),.23+.15*Math.cos(theta)));hand[side]=V(sign*.25,1.09,.48);});meta.cycle=true;break;}
 case 'rowErg':{
  sit(.30);hip.z=lerp(-.18,-.48,q);pitch=lerp(18,-16,q);feet={l:V(.15,.16,.47),r:V(-.15,.16,.47)};setHands(.18,.59,lerp(.38,-.14,q));meta.rowErg=true;break;}
 case 'jumpRope':hip.y+=.07*Math.sin(a*2)**2;both((side,sign)=>{foot(side,V(sign*.14,.074+.07*Math.sin(a*2)**2,.025));hand[side]=V(sign*.30,.99+.035*w,.09+.035*c);});break;
 case 'boxing':foot('r',V(-.19,.074,-.19));yaw=12*w;hand.l=V(.17,1.31,.21+.30*q);hand.r=V(-.17,1.31,.20+.30*(1-q));break;
 case 'jacks':hip.y+=.04*Math.sin(a)**2;both((side,sign)=>{foot(side,V(sign*lerp(.15,.40,q),.074,.025));hand[side]=V(sign*(.20+.43*Math.sin(rad(165*q))),1.35-.48*Math.cos(rad(165*q)),.02);});break;
 case 'rollout':case 'ballPlank':case 'deadbug':case 'hollow':case 'crunch':{
  if(f==='deadbug'||f==='hollow'){supine();pitch=-90;both((side,sign)=>{const move=f==='hollow'?.8:(side==='l'?q:1-q);foot(side,V(sign*.13,lerp(.58,.19,move),lerp(.30,.77,move)));hand[side]=V(sign*.16,lerp(.55,.19,1-move),lerp(-.43,-.91,1-move));});}
  else if(f==='crunch'){supine(/ball/.test(n)?.57:/decline/.test(n)?.50:.15);bench=/decline/.test(n);pitch=lerp(-90,-45,q);hand.l=V(.12,hip.y+.30*q,-.32);hand.r=V(-.12,hip.y+.30*q,-.32);if(/cable/.test(n)){kneeling();pitch=25+40*q;setHands(.17,1.01-.24*q,.28+.19*q);}if(/machine/.test(n)){sit();pitch=25*q;setHands(.27,.99-.15*q,.31);}if(/ball/.test(n))meta.ball='back';}
  else{plank(.39,/stir|saw|rollout/.test(n));if(f==='rollout'){hip.set(0,lerp(.50,.31,q),-.10+.10*q);pitch=lerp(55,84,q);feet={l:V(.13,.074,-.46),r:V(-.13,.074,-.46)};footPitch.l=180;footPitch.r=180;setHands(.18,.16,.45+.35*q);if(s.eq.includes('sb')){hip.y+=.21;hand.l.y=.59;hand.r.y=.59;}}
   else if(/pike/.test(n)){hip.y+=.38*q;pitch-=37*q;feet.l.z+=.26*q;feet.r.z+=.26*q;}
   else if(/jackknife|mountain/.test(n)){feet.l.z+=.45*q;feet.r.z+=/mountain/.test(n)?.45*(1-q):.45*q;feet.l.y+=.10*q;feet.r.y+=.10*q;}
   else if(/stir/.test(n)){hand.l.x+=.04*w;hand.r.x+=.04*w;hand.l.z+=.04*c;hand.r.z+=.04*c;}
   else if(/saw/.test(n)){hip.z+=.12*w;hand.l.z+=.12*w;hand.r.z+=.12*w;}
   else if(/taps/.test(n))hand.l.lerp(V(-.16,.51,.39),q);
   if(s.eq.includes('sb')&&/stir/.test(n)){hip.y+=.20;pitch=69;hand.l.y=.58;hand.r.y=.58;}
   if(s.eq.includes('sb')&&/pike|jackknife/.test(n)){feet.l.y=.60;feet.r.y=.60;hip.y+=.24;}
  }break;}
 case 'gluteKick':{
  if(/standing|cable/.test(n)){pitch=10;foot('l',V(.16,.074+.16*q,.02-.36*q),-15*q);hand.r=V(-.40,1.18,.22);}
  else{quadruped();foot('l',V(.14,.17+.42*q,-.61-.12*q),-20*q);}break;}
 case 'armCircle':{
  both((side,sign)=>hand[side]=V(sign*(.37+.15*c),1.32+.15*w,.12*Math.sin(a)));break;}
 case 'shoulderRoll':{both((side,sign)=>{const cn='clavicle_'+side;});setHands(.24,.90+.04*w,.03+.025*c);break;}
 case 'passThrough':{const angle=rad(15+160*q);setHands(.44,1.34-.40*Math.cos(angle),.40*Math.sin(angle));grip='bar';break;}
 case 'catcow':case 'quadCircle':case 'birdDog':case 'thoracicQuad':case 'threadNeedle':{
  quadruped();if(f==='catcow'){pitch=80+6*w;hip.y+=.02*w;}
  if(f==='quadCircle')foot('l',V(.14+.15*w,.16+.13*c,-.59+.14*w));
  if(f==='birdDog'){hand.l.lerp(V(.16,.52,.74),q);foot('r',V(-.14,.075+.395*q,-.58-.46*q),180);}
  if(f==='thoracicQuad'){yaw=35*q;hand.l.lerp(V(.35,.93,.46),q);}
  if(f==='threadNeedle'){yaw=-28*q;hand.l.lerp(V(-.32,.08,.44),q);hip.y-=.08*q;}
  break;}
 case 'downwardDog':case 'inchworm':{
  plank();hip.y+=.49*q;pitch-=42*q;feet.l.z+=.20*q;feet.r.z+=.20*q;if(f==='inchworm'){hand.l.z-=.15*q;hand.r.z-=.15*q;}break;}
 case 'standingCat':pitch=12*w;setHands(.12,.87,.15);break;
 case 'hipCircle':hip.x=.065*w;hip.z+=.065*c;setHands(.17,.96,.13);break;
 case 'legSwing':foot('l',V(.17,.074+.16*Math.abs(w),.48*w),-25*w);if(/side to side/.test(n)&&t>.5)foot('l',V(.17+.42*w,.074+.13*Math.abs(w),.025));hand.r=V(-.44,1.23,.10);break;
 case 'wallSlide':setHands(lerp(.36,.25,q),lerp(1.27,1.75,q),-.05);meta.wall=true;break;
 case 'ankleRock':hip.z+=.09*q;foot('l',V(.17,.074,.28));foot('r',V(-.17,.074,-.16));setHands(.22,1.27,.50);meta.wall=true;break;
 case 'standingTwist':yaw=35*w;setHands(.12,1.28,.23);break;
 case 'reachPull':setHands(lerp(.21,.27,q),lerp(1.78,1.18,q),.11);break;
 case 'latStretch':hip.z=-.12;pitch=30;hand.l=V(.23,1.46,.52);hand.r=V(-.21,.93,.10);meta.post=true;break;
 case 'wallStretch':{
  meta.wall=true;if(/calf/.test(n)){feet={l:V(.15,.074,.33),r:V(-.15,.074,-.30)};pitch=12;setHands(.22,1.26,.55);}
  else if(/biceps/.test(n)){hand.l=V(.48,1.22,-.16);hand.r=V(-.23,.89,.02);yaw=-20;}
  else{setHands(.42,1.26,.25);hip.z=.08;pitch=6;}break;}
 case 'butterfly':sit(.13);feet={l:V(.025,.10,.38),r:V(-.025,.10,.38)};setHands(.05,.20,.32);floor=true;break;
 case 'child':kneeling();hip.y=.24;hip.z=-.28;pitch=75;setHands(.18,.12,.56);floor=true;break;
 case 'cobra':hip.set(0,.13,.01);pitch=48;feet={l:V(.15,.074,-.77),r:V(-.15,.074,-.77)};setHands(.26,.09,.39);floor=true;break;
 case 'shoulderStretch':{
  if(/cross/.test(n)){hand.l=V(-.24,1.33,.28);hand.r=V(.15,1.25,.27);}
  else if(/behind/.test(n)){setHands(.10,1.03,-.27);}
  else if(/triceps/.test(n)){hand.l=V(.07,1.48,-.12);hand.r=V(.15,1.62,.01);pole.l=V(0,1,0);}
  else{hand.l=V(.16,1.24,.49);hand.r=V(.14,1.21,.53);}break;}
 case 'shinStretch':kneeling();hip.y=.27;hip.z=-.29;setHands(.20,.39,.19);floor=true;break;
 case 'neckStretch':roll=0;setHands(.24,.87,.02);meta.neckTilt=18;break;
 case 'hamStretch':sit(.13);feet={l:V(.15,.074,.80),r:V(-.15,.074,.80)};pitch=25;setHands(.15,.25,.54);floor=true;break;
 case 'quadStretch':foot('l',V(.17,.47,-.25),70);hand.l=V(.17,.49,-.22);hand.r=V(-.44,1.24,.12);meta.post=true;break;
 case 'recovery':{
  if(/quads|inner thighs/.test(s.area)){plank(.31,true);feet.l.y=.12;feet.r.y=.12;hip.z+=.05*w;}
  else if(/calves|hamstrings/.test(s.area)){sit(.14);feet={l:V(.14,.16,.75),r:V(-.14,.16,.75)};setHands(.30,.10,-.11);hip.z+=.05*w;}
  else if(/upper back/.test(s.area)){supine(.28);pitch=-75;setHands(.12,.39,-.40);hip.z+=.05*w;}
  else if(/lats/.test(s.area)){hip.set(0,.20,0);pitch=90;axial=90;feet={l:V(0,.17,-.70),r:V(0,.08,-.70)};setHands(.10,.12,.49);floor=true;}
  else if(/glutes/.test(s.area)){sit(.24);pitch=-15;feet={l:V(.15,.074,.50),r:V(-.15,.074,.50)};setHands(.30,.11,-.12);hip.x=.04*w;floor=true;}
  else {pitch=12;setHands(.22,1.25,.48);meta.wall=true;hip.z+=.025*w;}meta.recovery=true;break;}
 default:throw Error('No pose author for '+f+' '+s.name);
 }
 if(s.halfKneel&&!['kneelingStretch','worldStretch','pulldown','overhead','singleRow','chop','pallof','crunch'].includes(f)){hip.y=.52;foot('l',V(.17,.074,.41));foot('r',V(-.14,.08,-.43),180);}
 if(jumpingYaw){const turn=M().makeRotationY(rad(jumpingYaw));both(side=>{feet[side].sub(hip).applyMatrix4(turn).add(hip);hand[side].sub(hip).applyMatrix4(turn).add(hip);});}
 // Keep authored foot contacts inside the legs' reachable ranges.
 for(let iteration=0;iteration<24;iteration++){
  let max=0;r.trunk(hip,pitch,yaw,roll,axial);
  for(const side of ['l','r']){const p=r.point('thigh_'+side),d=p.distanceTo(feet[side]),limit=r.length('thigh_'+side,'calf_'+side)+r.length('calf_'+side,'foot_'+side)-.0002;if(d>limit){hip.add(feet[side].clone().sub(p).multiplyScalar((d-limit)/d));max=Math.max(max,d-limit);r.trunk(hip,pitch,yaw,roll,axial);}}
  if(max<.00002)break;
 }
 const transform=r.trunk(hip,pitch,yaw,roll,axial);
 if(f==='catcow'||f==='standingCat'){for(const bone of ['spine_01','spine_02','spine_03']){const i=r.ids[bone];r.locals[i].multiply(M().makeRotationX(rad(4*w)));}}
 if(meta.neckTilt){const i=r.ids.neck_01;r.locals[i].multiply(M().makeRotationZ(rad(meta.neckTilt)));}
 if(f==='shoulderRoll'){for(const side of ['l','r']){const p=r.point('clavicle_'+side);p.y+=.025*(1+w);p.z+=.018*c;r.orient('clavicle_'+side,p,r.rotation('clavicle_'+side));}}
 // Enforce actual knee planes and foot placements; solve, rather than scale, every limb.
 both((side,sign)=>{
  let legPole=V(0,0,1);if(prone||f==='legCurl'&&/lying|dumbbell|prone/.test(n))legPole=V(0,-1,.05);if(['butterfly','clamshell','hipMachine'].includes(f))legPole=V(sign,0,.1);if(f==='clamshell'&&side==='l')legPole=V(0,1,.1+q);
  if(['sideLeg','sidePlank','openBook'].includes(f))legPole=V(.1,1,0);
  const leg=r.leg(side,feet[side],legPole,footPitch[side],jumpingYaw);meta.contacts.push({side,requested:feet[side].toArray(),actual:leg.ankle.toArray()});
 });
 both((side,sign)=>{
  if(!hand[side]){const shoulder=r.point('upperarm_'+side);hand[side]=shoulder.clone().add(V(sign*.07,-.47,.035));}
  // Unilateral demos keep the non-working arm quiet; supports and asymmetrical poses retain explicit targets.
  if(un&&side==='r'&&s.category==='strength'&&['standingPress','overhead','raise','curl','pulldown'].includes(f))hand[side]=r.point('upperarm_'+side).add(V(-.07,-.47,.02));
  meta[side]=r.arm(side,hand[side],pole[side]||V(sign,-.3,.1),grip);
 });
 r.closeHands(s.eq.some(x=>['db','bb','kb','cb','bd','pl','trx','rp','sandbag','sled','abwheel'].includes(x))?1:0);
 meta.floor=floor;meta.bench=bench;meta.seated=seated;meta.prone=prone;meta.hip=hip;meta.pitch=pitch;meta.yaw=yaw;meta.grip=grip;
 return meta;
}
