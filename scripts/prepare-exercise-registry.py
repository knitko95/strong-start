"""Import only the five reviewed rose-top demo assets into the public runtime registry."""
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
 ('plank','Plank',1,'floor','-65deg 72deg 2.8m','0m 0.20m 0m',2.8)]
registry={'schemaVersion':1,'revision':'2026-11-11-reviewed-1','characters':{
 'instructor-rose-v1':{'label':'Rose-top instructor','rigId':'makehuman-game-engine-v1','assetLicense':'CC0-1.0'}},
 'animations':{},'guides':{}}
for id,name,version,layout,orbit,camera_target,radius in specs:
 raw=(source/f'{id}-original.glb').read_bytes();digest=hashlib.sha256(raw).hexdigest()
 file=f'models/{id}.rose.v{version}.{digest[:12]}.glb'
 shutil.copy2(source/f'{id}-original.glb',target/file)
 registry['animations'][id]={'version':version,'clip':'Animation','durationSeconds':5,
  'variants':{'instructor-rose-v1':{'asset':file,'bytes':len(raw),'sha256':digest,
    'review':{'status':'visually-accepted','date':'2026-11-11'}}}}
 registry['guides'][id]={'exerciseId':id,'name':name,'contentSource':'catalogue','animationId':id,
  'defaultCharacter':'instructor-rose-v1','enabledEnvironments':['development'],
  'presentation':{'layout':layout,'cameraOrbit':orbit,'cameraTarget':camera_target,'radiusMetres':radius,'defaultSpeed':1},
  'fallback':{'type':'existing-text-instructions'}}
(target/'registry.v1.json').write_text(json.dumps(registry,indent=2)+'\n',encoding='utf-8')
print('Prepared five reviewed exercise mappings; squat reference and unreviewed variants excluded.')
