"""Reference-directed head surfaces and economical, head-bound hair ribbons.

No new bones, particles, simulations, facial animation or animation retargeting.
All dimensions are in the original instructor's unscaled Blender rest space.
"""
import bpy, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def bell(x,c,w): return math.exp(-((x-c)/w)**2)

def refine_face(body):
    lips=body.vertex_groups['lips'].index
    for v in body.data.vertices:
        x,y,z=v.co
        front=max(0,min(1,(-y-.035)/.045))
        if z>1.225 and abs(x)<.078:
            # Adult mid-face: a clearer bridge/cheek transition and a rounded,
            # defined chin instead of shrinking the whole face into a point.
            v.co.x*=1-.035*bell(z,1.267,.024)*front
            v.co.x*=1+.035*bell(z,1.323,.017)*front
            v.co.y-=.0025*bell(x,0,.013)*bell(z,1.322,.024)*front
            v.co.y-=.0020*bell(x,0,.010)*bell(z,1.309,.009)*front
            v.co.x*=1-.09*bell(x,0,.018)*bell(z,1.314,.023)*front
            # Narrow the lid opening vertically without moving either eye or
            # changing the bone/neck placement. Retain the eyelid geometry.
            eye=bell(abs(x),.02707,.019)*bell(z,1.33661,.013)*front
            v.co.z+=(1.33661-z)*.22*eye
            # Modest cheek and chin definition, not a changed body fit.
            v.co.y-=.0016*bell(abs(x),.041,.017)*bell(z,1.320,.014)*front
            v.co.y-=.0013*bell(x,0,.022)*bell(z,1.251,.010)*front
        if any(g.group==lips and g.weight>.15 for g in v.groups):
            v.co.z+=.0026*min(1,abs(x)/.024)**2
            v.co.y-=.0006
    body.data.update()

def refine_bust(body):
    """Increase the covered bust surface without moving any rig landmarks."""
    count=0;maximum=0
    for v in body.data.vertices:
        x,y,z=v.co
        front=max(0,min(1,(-y-.025)/.045))
        region=bell(abs(x),.065,.038)*bell(z,1.060,.048)*front
        shift=.022*region
        if shift>.00005:
            v.co.y-=shift;v.co.x+=math.copysign(.004*region,x)
            count+=1;maximum=max(maximum,shift)
    body.data.update()
    return {'changedVertices':count,'maximumRestProjectionMetres':maximum,'rigChanged':False}

def parent_to_head(obj,rig):
    bpy.context.view_layer.update();world=obj.matrix_world.copy()
    obj.parent=rig;obj.parent_type='BONE';obj.parent_bone='head'
    bpy.context.view_layer.update();obj.matrix_world=world

def ribbon(name,points,widths,normals,strip,rig,collection,material,face_surface=None,brow=False):
    """Three vertices across each strip retain a curved rather than flat profile."""
    verts=[];uv=[];faces=[];count=len(points)
    if count<2:return
    for i,(point,width,normal) in enumerate(zip(points,widths,normals)):
        tangent=(points[min(count-1,i+1)]-points[max(0,i-1)]).normalized()
        side=tangent.cross(normal).normalized()
        if side.length<.01:side=Vector((1,0,0))
        for j,across in enumerate([-1,0,1]):
            p=point+side*width*.5*across
            # A shallow clump profile gives natural highlights and overlaps.
            p+=normal*(width*.012*(1-abs(across)))
            verts.append(tuple(p));uv.append(((strip+.06+.88*j/2)/8,1-(.08+.90*i/(count-1) if brow else i/(count-1))))
        if i:
            for j in range(2):a=(i-1)*3+j;faces.append((a,a+1,a+4,a+3))
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    layer=me.uv_layers.new(name='Hair card UV')
    for loop in me.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
    obj=bpy.data.objects.new(name,me);collection.objects.link(obj);obj.data.materials.append(material)
    for p in me.polygons:p.use_smooth=True
    obj['texture_kind']='hair';parent_to_head(obj,rig)
    return obj

def bezier(a,b,c,d,t):return a*(1-t)**3+3*b*t*(1-t)**2+3*c*t*t*(1-t)+d*t**3

def make_hair(body,rig,collection,hairmat):
    bpy.context.view_layer.update();surface=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
    cap=bpy.data.objects['Sculpted pulled-back hair']
    base_material=hairmat.copy();base_material.name='Opaque chestnut underlayer'
    cap.data.materials.clear();cap.data.materials.append(base_material)
    cap['texture_kind']='hair_base'
    # Refit the existing cap, retaining it as an opaque underlayer. The visible
    # shape and strand detail come from overlapping alpha-tested ribbons.
    for m in cap.modifiers:
        if m.type=='SUBSURF':m.levels=1
    for v in cap.data.vertices:
        x,y,z=v.co
        if y<-.035 and z<1.410:
            line=1.384+.012*bell(x,-.016,.024)-.007*(abs(x)/.07)**2
            zz=min(z,line+max(0,z-1.389)*.45)
            hit,n,_,_=surface.ray_cast(Vector((x,-.5,zz)),Vector((0,1,0)))
            if hit is not None:v.co=hit+n*.0048
    cap.data.update()
    bun=bpy.data.objects['Hair bun'];bun.data.materials.clear();bun.data.materials.append(base_material)
    bun['texture_kind']='bun_base'
    # A fuller loose bun sits behind the crown rather than as a small sphere.
    placement=bun.matrix_world.copy();placement.translation=Vector((-.004,.055,1.407));bun.matrix_world=placement
    for v in bun.data.vertices:
        a=math.atan2(v.co.z,v.co.x);v.co*=1+.07*math.sin(a*9)
        v.co.x*=1.13;v.co.z*=1.06
    bpy.context.view_layer.update()
    # Sweep individual locks from an asymmetric part back into the bun.
    for j in range(11):
        x=-.067+.134*j/10
        z=1.402+.006*bell(x,-.016,.026)-.009*(abs(x)/.068)**2
        a=Vector((x,-.095,z));b=Vector((x*1.05-.007,-.070,1.463))
        c=Vector((x*.88,.046,1.447));d=Vector((x*.12-.004,.070,1.415+(j%3)*.002))
        pts=[];normals=[];widths=[]
        for k in range(19):
            t=k/18;desired=bezier(a,b,c,d,t)
            hit,n,_,_=surface.find_nearest(desired)
            lift=.0055+.003*math.sin(math.pi*t)+.001*math.sin(j*1.7)
            # The root sits just inside the cap; the layered crown stays full.
            p=hit+n*max(.002,lift) if t<.9 else desired
            pts.append(p);normals.append(n)
            widths.append((.033+.005*math.sin(j*1.3))*(.72+.28*math.sin(math.pi*t))*(1-.5*t**5))
        ribbon('Swept chestnut lock',pts,widths,normals,j%6,rig,collection,hairmat)
    # Asymmetric swept front locks cover the cap boundary with a softer part
    # and tapered ends, instead of exposing the straight roots of each ribbon.
    fringe=[(Vector((-.020,-.092,1.410)),Vector((.012,-.112,1.411)),Vector((.050,-.102,1.391)),Vector((.061,-.072,1.363)),.025),
            (Vector((-.020,-.092,1.409)),Vector((-.050,-.099,1.399)),Vector((-.064,-.072,1.377)),Vector((-.059,-.065,1.348)),.018)]
    for j,(a,b,c,d,width) in enumerate(fringe):
        pts=[];normals=[];widths=[]
        for k in range(25):
            t=k/24;desired=bezier(a,b,c,d,t);hit,n,_,_=surface.find_nearest(desired)
            pts.append(hit+n*(.008+.003*math.sin(math.pi*t)));normals.append(n);widths.append(width*(1-.85*t**3))
        ribbon('Loose swept front lock',pts,widths,normals,(j+3)%6,rig,collection,hairmat)
    # Side locks cover the temple/ear portion of the underlayer and sweep
    # diagonally back into the bun, breaking up the parallel crown flow.
    for sign in [-1,1]:
        for j in range(6):
            a=Vector((sign*.060,-.071,1.357+j*.008))
            b=Vector((sign*.087,-.018,1.369+j*.010))
            c=Vector((sign*.074,.061,1.402+j*.005))
            d=Vector((sign*.014,.080,1.414))
            pts=[];normals=[];widths=[]
            for k in range(20):
                t=k/19;desired=bezier(a,b,c,d,t);hit,n,_,_=surface.find_nearest(desired)
                pts.append(hit+n*(.006+.003*math.sin(math.pi*t)) if t<.8 else desired)
                normals.append(n);widths.append(.022*(1-.45*t**4))
            ribbon('Swept side lock',pts,widths,normals,(j+2)%6,rig,collection,hairmat)
    # Irregular wrapped strips give the bun a gathered-hair silhouette.
    center=Vector((-.004,.055,1.407))
    for j in range(13):
        pts=[];normals=[];widths=[]
        for k in range(25):
            t=k/24;phi=j*2*math.pi/13+3.5*math.pi*t
            zz=.033*math.cos(math.pi*t);r=.014+.025*math.sin(math.pi*t)
            n=Vector((math.cos(phi)*math.sin(math.pi*t),math.sin(phi)*math.sin(math.pi*t),math.cos(math.pi*t))).normalized()
            pts.append(center+Vector((r*math.cos(phi),r*math.sin(phi),zz)))
            normals.append(n);widths.append(.018*(.55+.45*math.sin(math.pi*t)))
        ribbon('Gathered bun lock',pts,widths,normals,j%6,rig,collection,hairmat)
    # Short, soft face-framing pieces end at the temple and follow the surface.
    for sign in [-1,1]:
        for j in range(2):
            pts=[];normals=[];widths=[]
            for k in range(15):
                t=k/14;x=sign*(.049+j*.004+.006*math.sin(t*math.pi))
                z=1.402-(.067+j*.006)*t
                hit,n,_,_=surface.ray_cast(Vector((x,-.5,z)),Vector((0,1,0)))
                if hit is None:continue
                pts.append(hit+n*(.0035+.002*math.sin(math.pi*t)));normals.append(n)
                widths.append((.008-j*.0025)*(1-.85*t))
            ribbon('Soft temple wisp',pts,widths,normals,(j+sign)%6,rig,collection,hairmat)
    # Fine natural brows are in the reference-directed face albedo. Avoid a
    # second set of painted-looking geometry above the real brow ridge.
    return surface
