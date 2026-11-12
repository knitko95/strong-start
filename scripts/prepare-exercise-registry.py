"""Import the eleven visually accepted rose-top demos into the dev-only registry."""
import json,hashlib,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
source=ROOT/'output/exercise-animation-3d-review/models'
target=ROOT/'exercise-guides'
specs=[
 ('dumbbell-romanian-deadlift','Dumbbell Romanian Deadlift',1,'standing','35deg 78deg 3.2m','0m 0.74m 0m',3.2),
 ('hammer-curl','Hammer Curl',2,'standing','35deg 78deg 3.2m','0m 0.74m 0m',3.2),
 ('standing-dumbbell-shoulder-press','Standing Dumbbell Shoulder Press',2,'standing','35deg 78deg 3.5m','0m 0.80m 0m',3.5),
 ('dumbbell-bench-press','Dumbbell Bench Press',2,'floor','-45deg 65deg 2.9m','0m 0.48m -0.18m',2.9),
 ('plank','Plank',1,'floor','-65deg 72deg 2.8m','0m 0.20m 0m',2.8),
 ('goblet-squat','Goblet Squat',2,'standing','35deg 78deg 3.2m','0m 0.74m 0m',3.2),
 ('incline-dumbbell-press','Incline Dumbbell Press',3,'floor','-45deg 65deg 3.1m','0m 0.63m -0.15m',3.1),
 ('dumbbell-floor-press','Dumbbell Floor Press',3,'floor','-45deg 65deg 3.0m','0m 0.3m -0.2m',3.0),
 ('seated-dumbbell-shoulder-press','Seated Dumbbell Shoulder Press',3,'standing','35deg 78deg 3.1m','0m 0.67m 0m',3.1),
 ('dumbbell-lateral-raise','Dumbbell Lateral Raise',3,'standing','35deg 78deg 3.5m','0m 0.74m 0m',3.5),
 ('single-arm-dumbbell-bench-press','Single-Arm Dumbbell Bench Press',3,'floor','-45deg 65deg 2.9m','0m 0.48m -0.18m',2.9)]
registry={'schemaVersion':1,'revision':'2026-11-12-reviewed-2','characters':{
 'instructor-rose-v1':{'label':'Rose-top instructor','rigId':'makehuman-game-engine-v1','assetLicense':'CC0-1.0'}},
 'animations':{},'guides':{}}
for index,(id,name,version,layout,orbit,camera_target,radius) in enumerate(specs):
 asset_source=source if index<5 else ROOT/'output/exercise-animation-3d-review-batch2/models'
 raw=(asset_source/f'{id}-original.glb').read_bytes();digest=hashlib.sha256(raw).hexdigest()
 file=f'models/{id}.rose.v{version}.{digest[:12]}.glb'
 shutil.copy2(asset_source/f'{id}-original.glb',target/file)
 registry['animations'][id]={'version':version,'clip':'Animation','durationSeconds':5,
  'variants':{'instructor-rose-v1':{'asset':file,'bytes':len(raw),'sha256':digest,
    'review':{'status':'visually-accepted','date':'2026-11-11' if index<5 else '2026-11-12'}}}}
 registry['guides'][id]={'exerciseId':id,'name':name,'contentSource':'catalogue','animationId':id,
  'defaultCharacter':'instructor-rose-v1','enabledEnvironments':['development'],
  'presentation':{'layout':layout,'cameraOrbit':orbit,'cameraTarget':camera_target,'radiusMetres':radius,'defaultSpeed':1},
  'fallback':{'type':'existing-text-instructions'}}
(target/'registry.v1.json').write_text(json.dumps(registry,indent=2)+'\n',encoding='utf-8')
print('Prepared eleven reviewed exercise mappings; bodyweight squat reference and unreviewed variants excluded.')
