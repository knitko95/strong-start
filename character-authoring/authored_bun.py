"""Fit the CC0 Rehman Polanski bun asset and add small loose head-bound wisps.

The original mesh/texture and headers are retained under assets/bun-brown.
Coordinates are converted from MakeHuman decimetres/Y-up into this rest mesh.
No source rig, animation, weights or runtime material count is changed.
"""
import bpy,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from reference_head import parent_to_head,bezier

def make_hair(body,rig,collection,hairmat):
    bpy.context.view_layer.update();surface=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
    for o in list(bpy.data.objects):
        if o.parent==rig and o.name.startswith(('Sculpted pulled-back hair','Hair bun')):bpy.data.objects.remove(o,do_unlink=True)
    source=Path(__file__).parent/'assets/bun-brown/hair_bun_brown.obj'
    verts=[];tex=[];faces=[];face_uv=[]
    for line in source.read_text().splitlines():
        parts=line.split()
        if not parts:continue
        if parts[0]=='v':
            x,y,z=map(float,parts[1:4]);p=Vector((x*.1,-z*.1,y*.1+.660))
            # Preserve the authored layered shape; only lift intersections out
            # of the fitted skull instead of projecting all locks onto a shell.
            if p.y<.055 and p.z<1.445 and p.z>1.26:
                hit,n,_,_=surface.find_nearest(p)
                signed=(p-hit).dot(n)
                if signed<.0015 and (p-hit).length<.025:p+=n*(.0015-signed)
            rear=max(0,min(1,(p.y-.045)/.035))
            p.x+=rear*(.002+.003*math.sin((p.z-1.4)*65))
            p.z+=rear*.003*math.sin(p.x*85+(p.y-.065)*50)
            verts.append(tuple(p))
        elif parts[0]=='vt':tex.append(tuple(map(float,parts[1:3])))
        elif parts[0]=='f':
            refs=[p.split('/') for p in parts[1:]]
            faces.append(tuple(int(p[0])-1 for p in refs));face_uv.append([int(p[1])-1 for p in refs])
    # A smaller asymmetric gathered bun replaces the source's large even oval.
    rear_points=[Vector(p) for p in verts if p[1]>.065]
    center=Vector([(min(p[i] for p in rear_points)+max(p[i] for p in rear_points))*.5 for i in range(3)])
    for i,co in enumerate(verts):
        p=Vector(co);w=max(0,min(1,(p.y-.052)/.023));w=w*w*(3-2*w)
        p.x=center.x+(p.x-center.x)*(1-.15*w)-.004*w
        p.y=center.y+(p.y-center.y)*(1-.10*w)-.006*w
        p.z=center.z+(p.z-center.z)*(1-.25*w)-.004*w+.003*math.sin((p.x-center.x)*50)*w
        verts[i]=tuple(p)
    me=bpy.data.meshes.new('Adapted authored bun and loose layers');me.from_pydata(verts,[],faces);me.update()
    layer=me.uv_layers.new(name='Original authored hair UV')
    for poly,uvs in zip(me.polygons,face_uv):
        poly.use_smooth=True
        band=all(tex[ti][0]>.66 and tex[ti][1]<.34 for ti in uvs)
        for li,ti in zip(poly.loop_indices,uvs):
            u,v=tex[ti]
            # Re-use the source's own brown strand tile for the tie surface.
            # No additional material or texture is introduced.
            if band:u,v=.05+.50*(u-.66)/.34,.03+.15*v/.34
            layer.data[li].uv=(u,v)
    obj=bpy.data.objects.new('Loose chestnut bun - adapted Rehman Polanski',me);collection.objects.link(obj)
    me.materials.append(hairmat);obj['texture_kind']='authored_hair';obj['normal_mode']='geometry';parent_to_head(obj,rig)
    # Short alpha-tapered loose ends sit around the actual bun surface.
    back=[Vector(p) for p in verts if p[1]>.065]
    center=sum(back,Vector())/len(back)
    paths=[]
    for j in range(8):
        theta=j*2*math.pi/8;out=Vector((math.cos(theta),.3,math.sin(theta))).normalized()
        a=center+out*.025;b=a+out*.014+Vector((0,.008,.006))
        c=a+out*.017+Vector((-.004,.007,-.006));d=a+out*.010+Vector((-.006,0,-.013))
        paths.append((a,b,c,d,.0032,center,'bun'))
    for sign in [-1,1]:
        for j in range(2):
            a=Vector((sign*(.049+j*.006),-.110,1.394-j*.006))
            hit,n,_,_=surface.find_nearest(a);a=hit+n*.002
            b=Vector((sign*(.074+j*.002),-.132,1.366))
            c=Vector((sign*(.068+j*.002),-.131,1.312-j*.009))
            d=Vector((sign*(.054+j*.007),-.109,1.292-j*.008))
            paths.append((a,b,c,d,.0045-j*.0015,Vector((0,.010,1.335)),'temple'))
    for a,b,c,d,base_width,normal_center,area in paths:
        pts=[bezier(a,b,c,d,k/20) for k in range(21)];vv=[];uv=[];ff=[]
        for k,p in enumerate(pts):
            t=k/20;tangent=(pts[min(20,k+1)]-pts[max(0,k-1)]).normalized();normal=(p-normal_center).normalized();side=tangent.cross(normal).normalized()
            width=base_width*(1-.92*t)
            for n,across in enumerate([-1,0,1]):vv.append(tuple(p+side*width*.5*across));uv.append((n/2,1-t))
            if k:
                for n in range(2):aa=(k-1)*3+n;ff.append((aa,aa+1,aa+4,aa+3))
        wm=bpy.data.meshes.new('Loose bun wisp');wm.from_pydata(vv,[],ff);wm.update();wl=wm.uv_layers.new(name='Tapered wisp UV')
        for loop in wm.loops:wl.data[loop.index].uv=uv[loop.vertex_index]
        wo=bpy.data.objects.new('Loose '+area+' flyaway',wm);collection.objects.link(wo);wm.materials.append(hairmat)
        for p in wm.polygons:p.use_smooth=True
        wo['texture_kind']='hair_wisp';wo['normal_mode']='geometry';parent_to_head(wo,rig)
    return surface
