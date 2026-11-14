"""UV-pack baked 3D surfaces and selected source textures for one mobile draw."""
from pathlib import Path
import sys,json,hashlib
from PIL import Image,ImageDraw
import numpy as np
from scipy.ndimage import distance_transform_edt
root=Path(__file__).resolve().parents[1];review=Path(sys.argv[1]);shared=root/'exercise-guides/shared'
meta=json.loads((review/'candidate-geometry.json').read_text());textures=root/'character-authoring/textures'
body=Image.open(review/'body-baked.png').convert('RGBA');u0,v0,u1,v1=meta['headUVBounds']
def face_crop(image):
    w,h=image.size;return image.crop((round(u0*w),round((1-v1)*h),round(u1*w),round((1-v0)*h)))
atlas=Image.new('RGBA',(2048,2048),(35,23,18,255))
atlas.paste(body.resize((1024,2048),Image.Resampling.LANCZOS),(0,0))
face=face_crop(body).resize((1024,1024),Image.Resampling.LANCZOS)
face.save(review/'face-uv-template.png')
face=Image.open(textures/'reference-face-uv.png').convert('RGBA').resize((1024,1024),Image.Resampling.LANCZOS)
atlas.paste(face,(1024,0))
hair_pixels=np.array(Image.open(textures/'chestnut-hair-source.png').convert('RGBA'))
# Standard atlas alpha-edge color dilation prevents pale fringes after mipmap
# filtering. Strand alpha is retained exactly; only hidden/partial RGB bleeds.
opaque=hair_pixels[:,:,3]>220;nearest=distance_transform_edt(~opaque,return_distances=False,return_indices=True)
edge=~opaque;hair_pixels[edge,:3]=hair_pixels[nearest[0][edge],nearest[1][edge],:3]
hair=Image.fromarray(hair_pixels).resize((1024,1024),Image.Resampling.LANCZOS)
atlas.paste(hair,(1024,1024))
# A dense opaque underlayer keeps the scalp/bun solid under fine alpha wisps.
base_hair=hair.crop((50,50,100,640)).convert('RGB').resize((256,384),Image.Resampling.LANCZOS)
atlas.paste(base_hair,(1792,1664))
iris=Image.open(textures/'brown-iris-neutral.png').convert('RGBA');w,h=iris.size
iris=iris.crop((round(w*.025),round(h*.025),round(w*.975),round(h*.975))).resize((256,256),Image.Resampling.LANCZOS)
atlas.paste(iris,(1792,1024))
draw=ImageDraw.Draw(atlas)
def srgb(c):return round(255*(12.92*c if c<=.0031308 else 1.055*c**(1/2.4)-.055))
rough=Image.new('L',(512,512),round(.55*255));rdraw=ImageDraw.Draw(rough)
br=Image.open(review/'body-rough.png').convert('L')
rough.paste(br.resize((256,512),Image.Resampling.BILINEAR),(0,0))
rough.paste(face_crop(br).resize((256,256),Image.Resampling.BILINEAR),(256,0))
rdraw.rectangle((256,256,511,511),fill=round(.66*255));rdraw.rectangle((448,256,511,319),fill=round(.13*255))
for i,c in enumerate(meta['paletteLinear']):
    draw.rectangle((1792,1280+i*24,2047,1280+(i+1)*24-1),fill=(*map(srgb,c),255))
    value=.66 if c[0]<.1 else .74
    if abs(c[0]-.66)<.025:value=.16
    if c[0]<.01:value=.12
    rdraw.rectangle((448,320+i*6,511,320+(i+1)*6-1),fill=round(value*255))
atlas.save(review/'athlete-atlas.webp',quality=91,method=6,exact=True)
rough.save(review/'athlete-roughness.png',optimize=True)
def asset(label,data,suffix):
    digest=hashlib.sha256(data).hexdigest();url=f'assets/{label}.{digest[:16]}.{suffix}';(shared/url).write_bytes(data)
    return {'url':url,'bytes':len(data),'sha256':digest}
geometry={'asset':asset('rose-athlete', (review/'candidate.bin.gz').read_bytes(),'bin.gz'),'arrays':meta['arrays'],'decodedBytes':meta['decodedBytes']}
color=asset('rose-athlete-color',(review/'athlete-atlas.webp').read_bytes(),'webp');color['mimeType']='image/webp'
roughness=asset('rose-athlete-roughness',(review/'athlete-roughness.png').read_bytes(),'png')
candidate={'schemaVersion':1,'id':'rose-athlete-v1','name':'Rose athlete · detailed face & hair','jointNames':meta['jointNames'],'sourceInverseBindMatrices':meta['sourceInverseBindMatrices'],'geometry':geometry,'texture':color,'roughnessTexture':roughness,'alphaCutoff':.28,'vertices':meta['vertices'],'triangles':meta['triangles'],'commonRestBonesVerified':meta['commonRestBonesVerified'],'textureSize':[2048,2048],'roughnessSize':[512,512],'reviewStatus':'draft','license':'MakeHuman base skin and graphical assets CC0; independent styling and generated strand/iris textures. See CHARACTER-NOTICES.html.'}
(shared/'characters.json').write_text(json.dumps({'schemaVersion':1,'candidates':[candidate]},indent=2)+'\n')
report={'vertices':meta['vertices'],'triangles':meta['triangles'],'geometryBytes':geometry['asset']['bytes'],'textureBytes':color['bytes'],'roughnessBytes':roughness['bytes'],'totalBytes':geometry['asset']['bytes']+color['bytes']+roughness['bytes'],'decodedGeometryBytes':geometry['decodedBytes'],'textureBytesWithMipmaps':round((2048**2+512**2)*4*4/3),'drawCallsForCharacter':1}
(review/'size-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
