"""Rasterize shared anatomical fields, cache the UV raster, reuse each role combination."""
import json,hashlib,numpy as np
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent
SIZE=1024
def main():
 data=np.load(HERE/'region-fields.npz');names=list(data['names']);fields=data['weights'];tri=data['triangles'];uv=data['uv']
 cache=HERE/'uv-raster.npz'
 if cache.exists():
  raster=np.load(cache);ids=raster['ids'];bary=raster['bary']
 else:
  ids=np.full((SIZE,SIZE),-1,np.int32);bary=np.zeros((SIZE,SIZE,3),np.float32)
  for i,points in enumerate(uv):
   p=points*np.array([SIZE-1,-(SIZE-1)])+np.array([0,SIZE-1]);lo=np.maximum(0,np.floor(p.min(axis=0)).astype(int));hi=np.minimum(SIZE-1,np.ceil(p.max(axis=0)).astype(int))
   if np.any(hi<lo):continue
   x,y=np.meshgrid(np.arange(lo[0],hi[0]+1)+.5,np.arange(lo[1],hi[1]+1)+.5);a,b,c=p;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
   if abs(den)<1e-10:continue
   u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den;v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;w=1-u-v;mask=(u>=-.015)&(v>=-.015)&(w>=-.015)
   ids[lo[1]:hi[1]+1,lo[0]:hi[0]+1][mask]=i;bary[lo[1]:hi[1]+1,lo[0]:hi[0]+1][mask]=np.stack([u,v,w],axis=-1)[mask]
  np.savez_compressed(cache,ids=ids,bary=bary)
 target=HERE.parent/'exercise-guides/shared';requests=json.loads((HERE/'role-requests.json').read_text());results={};valid=ids>=0;pixelids=tri[np.maximum(ids,0)]
 skin=np.array([.665,.686,.70]);major=np.array([.025,.19,.125]);minor=np.array([.24,.53,.39])
 for key,roles in requests.items():
  main=roles['main'];support=roles['supporting'];allowed=lambda n:not roles.get('side')or n.endswith(':'+roles['side'])or any(n.startswith(k)for k in ['rectus_abdominis','external_oblique','erectors'])
  mi=[i for i,n in enumerate(names)if n.split(':')[0]in main and allowed(n)];si=[i for i,n in enumerate(names)if n.split(':')[0]in support and allowed(n)and i not in mi]
  vertex=np.stack([fields[:,mi].sum(axis=1),fields[:,si].sum(axis=1)],axis=-1);weights=(vertex[pixelids]*bary[:,:,:,None]).sum(axis=2)
  t=np.clip((weights-.32)/.36,0,1);t=t*t*(3-2*t)
  rgb=skin+t[:,:,0,None]*(major-skin)+t[:,:,1,None]*(minor-skin);rgb[~valid]=skin
  # Small padded UV borders avoid gray seams under minification. Preserve the accepted two role shades.
  for _ in range(3):
   old=valid.copy()
   for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:
    neighbor=np.roll(old,(dy,dx),(0,1));fill=neighbor&~valid;rgb[fill]=np.roll(rgb,(dy,dx),(0,1))[fill];valid[fill]=True
  srgb=np.where(rgb<=.0031308,12.92*rgb,1.055*np.clip(rgb,0,1)**(1/2.4)-.055);img=Image.fromarray(np.uint8(np.clip(srgb,0,1)*255),'RGB')
  tmp=HERE/'role.tmp.png';img.save(tmp,optimize=True);raw=tmp.read_bytes();digest=hashlib.sha256(raw).hexdigest();url='assets/roles-'+digest[:16]+'.png';(target/url).write_bytes(raw)
  results[key]={'url':url,'bytes':len(raw),'sha256':digest};valid=ids>=0
 (HERE/'role-assets.json').write_text(json.dumps(results,indent=2));print('ROLE_MAPS',len(results),'unique',len({a['url']for a in results.values()}))
if __name__=='__main__':main()
