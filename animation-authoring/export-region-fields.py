"""Export existing anatomical labels/UVs once; never rebuild the accepted body."""
import bpy,numpy as np,sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'soft-skin-prototype'))
from muscle_definition import territory_fields
source=root/'anatomical-exercise-review/common-anatomical-body.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
body=next(o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('Muscular'))
mesh=body.data
labels=[mesh.materials[p.material_index].name.removeprefix('region_').split('.')[0] for p in mesh.polygons]
names,weights=territory_fields(mesh,labels)
mesh.calc_loop_triangles();tri=np.array([t.vertices[:] for t in mesh.loop_triangles],dtype=np.int32)
uv=np.array([[mesh.uv_layers.active.data[i].uv[:] for i in t.loops]for t in mesh.loop_triangles],dtype=np.float32)
out=Path(__file__).with_name('region-fields.npz')
np.savez_compressed(out,names=np.array(names),weights=weights.astype(np.float32),triangles=tri,uv=uv)
print('REGION_FIELDS',len(names),len(tri),out.stat().st_size)
