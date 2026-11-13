import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),catalogue=require('../scripts/animation-inventory.cjs');
export const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const groups={
 flatPress:['Barbell Bench Press','Close-Grip Bench Press','Smith Machine Bench Press','Dumbbell Squeeze Press','Kettlebell Floor Press'],
 inclinePress:['Incline Barbell Bench Press'],
 seatedPress:['Machine Chest Press','Incline Machine Press'],
 standingPress:['Standing Cable Chest Press','Single-Arm Cable Chest Press','Anchored Band Chest Press'],
 overhead:['Standing Barbell Overhead Press','Push Press','Machine Shoulder Press','Single-Arm Kettlebell Overhead Press','Bottoms-Up Kettlebell Press','Arnold Press','Band Overhead Press','Z Press','Half-Kneeling Landmine Press','Half-Kneeling Single-Arm Cable Press','Kettlebell Clean and Press','Kettlebell Snatch'],
 pushup:['Weighted Push-Up','Deficit Push-Up','Push-Up on Stability Ball','Feet-on-Ball Push-Up','Feet-on-Box Decline Push-Up','Diamond Push-Up','Banded Push-Up','Medicine Ball Push-Up','BOSU Push-Up','Pike Push-Up'],
 suspensionPress:['TRX Chest Press','TRX Fly','TRX Triceps Extension','TRX Fallout','TRX Anti-Rotation Press'],
 dip:['Weighted Dip','Assisted Dip Machine','Bench Dip'],
 fly:['Cable Fly High to Low','Cable Fly Low to High','Pec Deck','Dumbbell Fly on Stability Ball'],
 raise:['Cable Lateral Raise','Machine Lateral Raise','Leaning Single-Arm Lateral Raise','Lu Raise','Cable Y-Raise','Y-Raise on Stability Ball','Plate Front Raise','Band Lateral Raise'],
 halo:['Kettlebell Halo','Plate Halo'],
 pushdown:['Cable Rope Pushdown','Machine Triceps Extension','Band Triceps Pushdown'],
 tricepsOverhead:['Overhead Cable Triceps Extension','Dumbbell Overhead Triceps Extension'],
 skull:['Dumbbell Skull Crusher','Barbell Skull Crusher','Tate Press'],
 kickback:['Single-Arm Cable Kickback'],
 chop:['Cable Woodchop High to Low','Cable Lift Low to High','Landmine Rainbow','Landmine Rotational Push Press','Cable Trunk Rotation','Band Woodchop','Medicine Ball Woodchop'],
 pallof:['Pallof Press','Half-Kneeling Pallof Press','Band Pallof Press'],
 russian:['Ball Russian Twist','Dumbbell Russian Twist','Medicine Ball Russian Twist','Plate Russian Twist','Machine Torso Rotation'],
 windmill:['Kettlebell Windmill'],around:['Kettlebell Around-the-World'],
 renegade:['Renegade Row'],
 hanging:['Hanging Oblique Knee Raise','Hanging Leg Raise','Hanging Knee Raise','Toes-to-Bar','Hanging Windshield Wiper'],
 rollout:['Stability Ball Rollout','Barbell Rollout','Ab Wheel Rollout'],
 ballPlank:['Stir the Pot','Stability Ball Pike','Stability Ball Jackknife','TRX Body Saw','TRX Pike','BOSU Mountain Climber'],
 crunch:['Ball Crunch','Cable Crunch','Machine Ab Crunch','Weighted Decline Sit-Up','Medicine Ball V-Up'],
 deadbug:['Dead Bug'],sidePlank:['Side Plank','Copenhagen Plank','BOSU Side Plank'],hollow:['Hollow Body Hold'],
 carry:['Dumbbell Farmer\'s Carry','Kettlebell Farmer\'s Carry','Suitcase Carry','Kettlebell Front Rack Carry','Overhead Kettlebell Carry','Mixed Rack and Suitcase Carry','Plate Pinch Carry','Sled Push','Sled Pull','Sandbag Bear-Hug Carry'],
 pullup:['Weighted Pull-Up','Chin-Up','Neutral-Grip Pull-Up','L-Sit Pull-Up','Band-Assisted Archer Pull-Up','Monkey Bar Traverse','Commando Pull-Up','Archer Pull-Up','Assisted Pull-Up Machine'],
 pulldown:['Lat Pulldown','Close-Grip Lat Pulldown','Single-Arm Lat Pulldown','Machine Pulldown','Kneeling Band Lat Pulldown'],
 bentRow:['Barbell Bent-Over Row','Pendlay Row','Landmine T-Bar Row','Kettlebell Gorilla Row','Meadows Row'],
 proneRow:['Seal Row','Ball-Supported Dumbbell Row','Incline Dumbbell Rear Delt Row'],
 seatedRow:['Seated Cable Row','Machine Row','Band Seated Row'],
 singleRow:['Single-Arm Dumbbell Row','Kettlebell Single-Arm Row','Single-Arm Rotational Cable Row','Half-Kneeling Single-Arm Cable Row','Tube Single-Arm Row'],
 suspensionRow:['Inverted Row','TRX Row','TRX Single-Arm Row','TRX Power Pull','TRX Face Pull','TRX Biceps Curl','TRX Y-T-W'],
 pullover:['Straight-Arm Cable Pulldown','Dumbbell Pullover'],
 rearFly:['Cable Face Pull','Reverse Pec Deck','Cable Reverse Fly','Ball Prone Y-T-W','Band Pull-Apart','Band Face Pull'],
 externalRotation:['Cable External Rotation'],
 curl:['Barbell Curl','Cable Curl','Bayesian Cable Curl','Machine Preacher Curl','Concentration Curl','Zottman Curl','Kettlebell Hammer Curl','Band Biceps Curl','EZ-Bar Curl'],
 squat:['Barbell Back Squat','Front Squat','Zercher Squat','Box Squat','Hack Squat','Smith Machine Squat','Double Kettlebell Front Squat','Heel-Elevated Dumbbell Squat','Stability Ball Wall Squat','BOSU Squat','Sandbag Squat'],
 legPress:['Leg Press','Single-Leg Leg Press','Leg Press Calf Raise'],
 hinge:['Conventional Deadlift','Sumo Deadlift','Romanian Deadlift','Double Kettlebell Deadlift','Good Morning','Cable Pull-Through','Band Pull-Through','Band Good Morning','Trap Bar Deadlift'],
 swing:['Kettlebell Swing'],backExtension:['Weighted Back Extension','Back Extension'],
 bridge:['Barbell Hip Thrust','B-Stance Hip Thrust','Dumbbell Hip Thrust','Glute Drive Machine','Single-Leg Hip Thrust','Stability Ball Single-Leg Bridge','Stability Ball Squeeze Bridge','Banded Glute Bridge','Smith Machine Hip Thrust','Dumbbell Glute Bridge'],
 gluteKick:['Cable Glute Kickback','Ankle-Weight Glute Kickback'],
 lunge:['Bulgarian Split Squat','Barbell Reverse Lunge','Dumbbell Walking Lunge','Front-Foot-Elevated Split Squat','Kettlebell Goblet Reverse Lunge','Smith Machine Split Squat','TRX Single-Leg Squat','Pistol Squat to Bench','Skater Squat','Box Bulgarian Split Squat','Curtsy Lunge','Transverse Lunge','BOSU Reverse Lunge','Medicine Ball Lunge with Rotation'],
 singleHinge:['Single-Leg Romanian Deadlift','Kettlebell Single-Leg Deadlift','Landmine Single-Leg Romanian Deadlift','Cable Single-Leg Romanian Deadlift','B-Stance Romanian Deadlift','BOSU Single-Leg Romanian Deadlift'],
 step:['Step-Up','High Step-Up','Lateral Step-Up','Box Step-Up','Lateral Box Step-Up','Crossover Box Step-Up','Box Step-Up with Knee Drive','Eccentric Box Step-Down','Peterson Step-Up','BOSU Lateral Step-Over'],
 lateral:['Lateral Lunge','Cossack Squat','Landmine Lateral Lunge','TRX Lateral Lunge','Side Step Lunge','Side Step Lunge to Balance'],
 legCurl:['Lying Leg Curl','Seated Leg Curl','Standing Cable Leg Curl','Dumbbell Leg Curl','Stability Ball Hamstring Curl','Single-Leg Ball Hamstring Curl','TRX Hamstring Curl','Prone Band Hamstring Curl'],
 nordic:['Nordic Curl','Glute-Ham Raise'],legExtension:['Leg Extension','Single-Leg Extension'],reverseNordic:['Sissy Squat','Reverse Nordic'],
 hipMachine:['Hip Adduction Machine','Hip Abduction Machine'],hipCable:['Cable Hip Abduction','Cable Hip Adduction'],sideLeg:['Side-Lying Hip Abduction','Ankle-Weight Side-Lying Leg Raise'],
 calf:['Standing Calf Raise Machine','Seated Calf Raise','Single-Leg Dumbbell Calf Raise','Barbell Calf Raise'],tibialis:['Tibialis Raise'],
 jump:['Skater Bound','Box Jump','Seated Box Jump','Depth Jump','Lateral Box Jump','Single-Leg Box Jump','Broad Jump','Squat Jump','Approach Vertical Jump','Tuck Jump','Split Squat Jump','Lateral Bound','180 Degree Rotational Jump','Single-Leg Lateral Hop','Pogo Hops','Dumbbell Jump Squat','BOSU Squat Jump'],
 bandWalk:['Mini-Band Lateral Walk','Mini-Band Monster Walk'],clamshell:['Banded Clamshell'],
 ropes:['Battle Rope Alternating Waves','Battle Rope Side-to-Side Waves','Battle Rope Rotational Slams','Battle Rope Double Slams','Battle Rope Lateral Shuffle Waves'],
 medThrow:['Medicine Ball Slam','Rotational Medicine Ball Slam','Medicine Ball Rotational Scoop Toss','Medicine Ball Shot Put Throw','Medicine Ball Chest Pass','Medicine Ball Overhead Wall Throw','Medicine Ball Vertical Toss'],
 getup:['Turkish Get-Up'],
};
const mapping=new Map();for(const [family,names]of Object.entries(groups))for(const n of names){if(mapping.has(slug(n)))throw Error('Duplicate recipe '+n);mapping.set(slug(n),family);}
const moves={
 armCircle:['Arm circles','Reverse arm swings'],shoulderRoll:['Shoulder rolls'],passThrough:['Band dislocates','Broomstick or towel pass-throughs'],
 rearFly:['Band pull-aparts','Band face pulls'],bandWalk:['Banded lateral walks','Lateral band walks'],
 squat:['Bodyweight squats to a bench','Fast bodyweight squats','Bodyweight squats','Deep squat hold','Goblet squat pry','Sit-to-stands from a chair','Wall sit'],
 jump:['Broad jumps','Low box jumps'],catcow:['Cat-cow'],hanging:['Dead hang','Scap pull-ups'],
 downwardDog:['Downward dog to plank','Push-up to downward dog'],pushup:['Explosive push-ups','Push-ups','Scap push-ups'],wallPush:['Wall push-ups','Shoulder taps on the wall'],inclinePush:['Incline push-ups on a bench','Incline push-ups','Fast incline push-ups'],
 bridge:['Glute bridges','Single-leg glute bridges'],kneelingStretch:['Half-kneeling hip flexor stretch with reach','Half-kneeling hip flexor stretch'],
 march:['A-skips','High-knee marches','Marching knee lifts','Standing knee hugs','Walking knee hugs'],hipCircle:['Hip circles'],
 standingTwist:['Hug-yourself twists'],inchworm:['Inchworms'],latStretch:['Lat stretch holding a post'],shuffle:['Lateral shuffles'],
 legSwing:['Leg swings, front to back and side to side','Leg swings, front to back'],medThrow:['Medicine ball chest pass'],
 openBook:['Open books lying on your side','Thoracic open books'],proneYTW:['Prone Y-T-W raises'],reachPull:['Reach-and-pull'],
 lunge:['Reverse lunges in place','Split squat holds','Walking lunges'],lateral:['Side lunges','Cossack squats'],hinge:['Bodyweight good mornings'],calf:['Calf raises'],
 quadCircle:['Quadruped hip circles'],birdDog:['Bird dogs'],deadbug:['Dead bugs'],ballPlank:['Plank shoulder taps'],worldStretch:['Spiderman lunge with reach','World’s greatest stretch'],
 halo:['Kettlebell halos'],ankleRock:['Ankle rocks against a wall'],singleHinge:['Hip airplanes'],thoracicQuad:['Quadruped T-spine reach','Thoracic rotations on hands and knees'],
 seatedTwist:['Seated twists','Seated twist'],standingCat:['Standing back arch and round'],gluteKick:['Standing hip extensions'],threadNeedle:['Thread the needle'],wallSlide:['Wall slides'],
 wallStretch:['Biceps wall stretch','Calf stretch on a wall','Doorway chest stretch'],butterfly:['Butterfly stretch'],child:['Child’s pose'],cobra:['Cobra stretch'],
 shoulderStretch:['Cross-body shoulder stretch','Hands-behind-back chest opener','Overhead triceps stretch','Wrist flexor and extensor stretch'],figure4:['Figure-4 glute stretch','Lying cross-body glute stretch'],
 shinStretch:['Kneeling shin stretch'],neckStretch:['Neck side stretch'],hamStretch:['Seated hamstring stretch'],quadStretch:['Standing quad stretch'],
};
const moveMap=new Map();for(const [family,names]of Object.entries(moves))for(const n of names)moveMap.set(n,family);
export const regionGroups={chest:['pec'],front_delts:['deltoid_front'],side_delts:['deltoid_middle'],rear_delts:['deltoid_rear'],triceps:['triceps'],biceps:['biceps','brachialis','brachioradialis'],forearms:['forearm_flexors','forearm_extensors'],quads:['rectus_femoris','vastus_lateralis','vastus_medialis'],hamstrings:['biceps_femoris','medial_hamstrings'],glutes:['gluteus_maximus'],abductors:['gluteus_medius'],adductors:['adductors'],calves:['gastrocnemius_medial','gastrocnemius_lateral','soleus'],shins:['tibialis_anterior'],abs:['rectus_abdominis_upper','rectus_abdominis_middle','rectus_abdominis_lower','rectus_abdominis_inferior'],obliques:['external_oblique'],lats:['lats'],traps:['traps_upper','traps_middle','traps_lower'],upper_back:['traps_middle','traps_lower','rhomboids','erectors'],hip_flexors:['hip_flexors']};
const familyMuscles={armCircle:['side_delts','traps'],shoulderRoll:['traps','rear_delts'],passThrough:['front_delts','upper_back'],catcow:['abs','upper_back'],standingCat:['abs','upper_back'],quadCircle:['glutes','abductors'],birdDog:['abs','glutes'],thoracicQuad:['upper_back','obliques'],openBook:['chest','upper_back'],threadNeedle:['rear_delts','upper_back'],downwardDog:['front_delts','hamstrings'],inchworm:['abs','hamstrings'],wallSlide:['side_delts','upper_back'],march:['hip_flexors','quads'],legSwing:['hamstrings','hip_flexors'],hipCircle:['abductors','glutes'],ankleRock:['calves','shins'],worldStretch:['hip_flexors','upper_back'],kneelingStretch:['hip_flexors','quads'],wallStretch:['chest','calves'],butterfly:['adductors'],child:['lats','upper_back'],cobra:['abs'],shoulderStretch:['front_delts','triceps'],figure4:['glutes'],shinStretch:['shins','quads'],neckStretch:['traps'],hamStretch:['hamstrings'],quadStretch:['quads'],latStretch:['lats'],standingTwist:['obliques'],seatedTwist:['obliques'],shuffle:['abductors','quads'],reachPull:['lats','rear_delts'],proneYTW:['rear_delts','upper_back']};
const core=['abs','obliques'];
export function recipeList(accepted){
 const all=catalogue.exercises.map(e=>({id:e.id,name:e.n,category:'strength',family:accepted.has(e.id)?'accepted':mapping.get(e.id),eq:e.eq,slot:e.slots[0],unilateral:e.uni,mode:e.mode,cue:e.cue,steps:e.steps,muscles:e.muscles}));
 for(const e of catalogue.moves){if(all.some(x=>x.id===e.id))continue;const family=moveMap.get(e.name);const siblings=all.find(x=>x.family===family&&x.muscles);all.push({id:e.id,name:e.name,category:'guide',family,eq:/[Bb]and/.test(e.name)?['bd']:/[Kk]ettlebell/.test(e.name)?['kb']:/[Mm]edicine ball/.test(e.name)?['mb']:/[Bb]ox/.test(e.name)?['bx']:/[Bb]ench|chair|[Ii]ncline/.test(e.name)?['bn']:[],unilateral:/per side|[Ss]ingle|[Ss]ide/.test(e.steps.join(' ')),cue:e.steps.join(' '),steps:e.steps,muscles:{p:familyMuscles[family]||siblings?.muscles.p||core,s:[]}});}
 const cardio=[['Easy walk','walk'],['Easy bike','cycle'],['Easy row','rowErg'],['Easy elliptical','elliptical'],['Easy marching','march'],['Brisk walk','walk'],['Incline walk','walk'],['Jog','jog'],['Stationary bike','cycle'],['Rowing machine','rowErg'],['Elliptical','elliptical'],['Stair climber','stairs'],['Jump rope','jumpRope'],['Shadow boxing','boxing'],['Jumping jacks','jacks']];
 for(const [name,family]of cardio)if(!all.some(x=>x.id===slug(name)))all.push({id:slug(name),name,category:'cardio',family,eq:[],muscles:{p:['quads','calves'],s:core}});
 for(const area of ['quads','glutes','hamstrings','calves','inner thighs','upper back','lats','chest','shoulders'])for(const tool of ['Foam roll','Massage ball'])all.push({id:slug(tool+' '+area),name:tool+': '+area,category:'recovery',family:'recovery',area,tool,eq:[],muscles:{p:[({'inner thighs':'adductors','upper back':'upper_back',shoulders:'front_delts'})[area]||area],s:[]}});
 for(const r of all){if(!r.family)throw Error('Missing explicit exercise recipe: '+r.name);r.draft=r.family!=='accepted';r.hold=/hold|stretch|plank|sit$|hang$|pry/i.test(r.name)&&!/(push|pull|body saw|mountain|taps)/i.test(r.name);r.halfKneel=/half-kneeling/i.test(r.name);r.seated=/seated|machine|pec deck|concentration|z press/i.test(r.name)&&!/(smith|assisted|calf raise machine|hack|glute drive|lying|back extension)/i.test(r.name);r.side=r.unilateral?'l':null;
  r.main=[...new Set((r.muscles?.p||core).flatMap(x=>regionGroups[x]||[]))];r.supporting=[...new Set((r.muscles?.s||core).flatMap(x=>regionGroups[x]||[]))].filter(x=>!r.main.includes(x));r.roleKey=JSON.stringify([r.main.slice().sort(),r.supporting.slice().sort(),r.side]);
 }
 return all;
}
