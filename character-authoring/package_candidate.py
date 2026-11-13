"""Package a mobile character without touching accepted motion or library assets."""
from pathlib import Path
import sys,json,hashlib
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];review=Path(sys.argv[1]);shared=root/'exercise-guides/shared'
meta=json.loads((review/'candidate-geometry.json').read_text())
atlas=Image.new('RGB',(1024,1024));atlas.paste(Image.open(review/'body-baked.png').convert('RGB').resize((896,1024),Image.Resampling.LANCZOS))
draw=ImageDraw.Draw(atlas)
def srgb(c):return round(255*(12.92*c if c<=.0031308 else 1.055*c**(1/2.4)-.055))
for i,c in enumerate(meta['paletteLinear']):draw.rectangle((896,i*64,1023,(i+1)*64-1),fill=tuple(srgb(x) for x in c))
atlas.save(review/'athlete-atlas.png',optimize=True)
def asset(label,data,suffix):
    digest=hashlib.sha256(data).hexdigest();url=f'assets/{label}.{digest[:16]}.{suffix}';(shared/url).write_bytes(data)
    return {'url':url,'bytes':len(data),'sha256':digest}
geometry={'asset':asset('rose-athlete', (review/'candidate.bin.gz').read_bytes(),'bin.gz'),'arrays':meta['arrays'],'decodedBytes':meta['decodedBytes']}
texture=asset('rose-athlete-color',(review/'athlete-atlas.png').read_bytes(),'png')
candidate={'schemaVersion':1,'id':'rose-athlete-v1','name':'Rose athlete · realistic draft','jointNames':meta['jointNames'],'sourceInverseBindMatrices':meta['sourceInverseBindMatrices'],'geometry':geometry,'texture':texture,'vertices':meta['vertices'],'triangles':meta['triangles'],'commonRestBonesVerified':meta['commonRestBonesVerified'],'reviewStatus':'draft','license':'MakeHuman base skin and graphical assets CC0; independently authored styling. See CHARACTER-NOTICES.html.'}
(shared/'characters.json').write_text(json.dumps({'schemaVersion':1,'candidates':[candidate]},indent=2)+'\n')
print(json.dumps({'vertices':meta['vertices'],'triangles':meta['triangles'],'geometryBytes':geometry['asset']['bytes'],'textureBytes':texture['bytes'],'totalBytes':geometry['asset']['bytes']+texture['bytes']},indent=2))
