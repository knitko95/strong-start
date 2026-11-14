"""Make the editable Blender scene use the same packed atlas as the runtime."""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector,Matrix
review=Path(sys.argv[sys.argv.index('--')+1]);meta=json.loads((review/'candidate-geometry.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(review/'rose-athlete.blend'))
rig=bpy.data.objects['Instructor_Rig'];rig.data.pose_position='REST';bpy.context.view_layer.update()
body=next(o for o in bpy.data.objects if o.name.startswith('Rose athlete'))
u0,v0,u1,v1=meta['headUVBounds'];palette=meta['paletteLinear']
for o in [o for o in bpy.data.objects if o.type=='MESH' and (o==body or o.parent==rig)]:
    me=o.data
    if not me.uv_layers:me.uv_layers.new(name='Runtime atlas')
    layer=me.uv_layers.active;old=[v.uv.copy() for v in layer.data]
    for poly in me.polygons:
        is_head=o==body and all(me.vertices[i].co.z>1.245 for i in poly.vertices) and all(old[i].x>.65 for i in poly.loop_indices)
        for li in poly.loop_indices:
            v=me.vertices[me.loops[li].vertex_index];point=o.matrix_world@v.co
            if o==body:
                uv=old[li];u,vv=(.5+.5*(uv.x-u0)/(u1-u0),.5*(1-(uv.y-v0)/(v1-v0))) if is_head else (uv.x*.5,1-uv.y)
            elif o.get('texture_kind')=='hair':
                uv=old[li];u,vv=.5+.5*uv.x,.5+.5*(1-uv.y)
            elif o.get('texture_kind')=='iris':u,vv=.875+.125*(.5+.5*v.co.x/.00588),.5+.125*(1-(.5+.5*v.co.z/.00588))
            elif o.get('texture_kind') in ['hair_base','bun_base']:
                center=Vector((-.004,.055,1.407)) if o.get('texture_kind')=='bun_base' else Vector((0,-.02,1.340));q=point-center
                theta=math.atan2(q.x,q.y);phi=math.acos(max(-1,min(1,q.z/max(q.length,1e-8))))
                u,vv=.875+.125*(theta/(2*math.pi)+.5),.8125+.1875*phi/math.pi
            else:
                color=list(o.data.materials[0].diffuse_color[:3]);index=min(range(len(palette)),key=lambda i:sum((a-b)**2 for a,b in zip(palette[i],color)))
                u,vv=.94,.625+.1875*(index+.5)/16
            layer.data[li].uv=(u,1-vv)
mat=bpy.data.materials.new('Runtime reference athlete atlas');mat.use_nodes=True
nodes=mat.node_tree.nodes;links=mat.node_tree.links;bs=nodes.get('Principled BSDF')
color=nodes.new('ShaderNodeTexImage');color.image=bpy.data.images.load(str(review/'athlete-atlas.webp'));color.image.pack()
rough=nodes.new('ShaderNodeTexImage');rough.image=bpy.data.images.load(str(review/'athlete-roughness.png'));rough.image.colorspace_settings.name='Non-Color';rough.image.pack()
links.new(color.outputs['Color'],bs.inputs['Base Color']);links.new(color.outputs['Alpha'],bs.inputs['Alpha']);links.new(rough.outputs['Color'],bs.inputs['Roughness'])
for o in bpy.data.objects:
    if o.type=='MESH' and (o==body or o.parent==rig):
        o.data.materials.clear();o.data.materials.append(mat)
        for p in o.data.polygons:p.material_index=0
rig.animation_data_clear()
for bone in rig.pose.bones:bone.matrix_basis=Matrix.Identity(4)
rig.data.pose_position='POSE';bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(review/'rose-athlete-final.blend'))
print('FINAL_SOURCE_READY',len(rig.data.bones))
