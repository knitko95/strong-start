"""Reference-directed head surfaces and economical, head-bound hair ribbons.

No new bones, particles, simulations, facial animation or animation retargeting.
All dimensions are in the original instructor's unscaled Blender rest space.
"""
import bpy, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def bell(x,c,w): return math.exp(-((x-c)/w)**2)

def scalp_boundary(theta):
    front=(1-math.cos(theta))*.5
    return 1.303+.083*front+.022*math.sin(theta)**2+.003*math.sin(2*theta)

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
        # The additional fullness was shaped non-destructively in Blender MCP
        # on the previous draft. Repeat that same smooth field on the source,
        # so the baked/exported candidate matches the editable preview.
        xx,yy,zz=v.co
        fuller=bell(abs(xx),.067,.043)*bell(zz,1.064,.053)*max(0,min(1,(-yy-.025)/.045))
        extra=.016*fuller
        if extra>.00005:
            v.co.y-=extra;v.co.x+=math.copysign(.003*fuller,x)
        if shift+extra>.00005:
            count+=1;maximum=max(maximum,shift+extra)
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
    # A fitted smooth hairline replaces the old stepped side/nape boundary.
    # Ray directions originate inside the head; each ring follows its surface.
    for m in list(cap.modifiers):cap.modifiers.remove(m)
    verts=[];faces=[];segments=72;rings=16;center=Vector((0,-.045,1.345))
    inv=cap.matrix_world.inverted()
    for row in range(rings+1):
        for j in range(segments):
            theta=j*2*math.pi/segments
            boundary=scalp_boundary(theta)
            end=math.acos(max(-1,min(1,(boundary-center.z)/.091)))
            phi=.008+(end-.008)*row/rings
            direction=Vector((math.sin(phi)*math.sin(theta),math.sin(phi)*math.cos(theta),math.cos(phi)))
            hit,n,_,_=surface.ray_cast(center,direction)
            assert hit is not None,'Head surface missing'
            verts.append(tuple(inv@(hit+n*.0027)))
            if row:
                a=(row-1)*segments+j;b=(row-1)*segments+(j+1)%segments
                faces.append((a,b,b+segments,a+segments))
    me=bpy.data.meshes.new('Smooth fitted scalp underlayer');me.from_pydata(verts,[],faces);me.update()
    cap.data=me;me.materials.append(base_material)
    for p in me.polygons:p.use_smooth=True
    bun=bpy.data.objects['Hair bun'];bun.data.materials.clear();bun.data.materials.append(base_material)
    bun['texture_kind']='bun_base'
    # A fuller loose bun sits behind the crown rather than as a small sphere.
    placement=bun.matrix_world.copy();placement.translation=Vector((-.004,.055,1.407));bun.matrix_world=placement
    for v in bun.data.vertices:
        a=math.atan2(v.co.z,v.co.x);v.co*=1+.07*math.sin(a*9)
        v.co.x*=1.13;v.co.z*=1.06
    bpy.context.view_layer.update()
    # Broad overlapping flow sits close to the underlayer. Fine lifted wisps
    # below provide the silhouette, avoiding separated parallel ridges.
    for j in range(17):
        x=-.067+.134*j/16
        z=1.389+.008*bell(x,-.016,.026)-.006*(abs(x)/.068)**2+.001*math.sin(j*2.1)
        a=Vector((x,-.095,z));b=Vector((x*.90+.010,-.070,1.463))
        c=Vector((x*.88,.046,1.447));d=Vector((x*.12-.004,.070,1.415+(j%3)*.002))
        pts=[];normals=[];widths=[]
        for k in range(19):
            t=k/18;desired=bezier(a,b,c,d,t)
            hit,n,_,_=surface.find_nearest(desired)
            lift=.0032+.0015*math.sin(math.pi*t)+.0005*math.sin(j*1.7)
            # The root sits just inside the cap; the layered crown stays full.
            p=hit+n*max(.002,lift) if t<.9 else desired
            pts.append(p);normals.append(n)
            widths.append((.020+.003*math.sin(j*1.3))*(.72+.28*math.sin(math.pi*t))*(1-.75*t**5))
        ribbon('Swept chestnut lock',pts,widths,normals,j%4,rig,collection,hairmat)
    # Asymmetric swept front locks cover the cap boundary with a softer part
    # and tapered ends, instead of exposing the straight roots of each ribbon.
    fringe=[(Vector((-.020,-.092,1.405)),Vector((.012,-.112,1.405)),Vector((.050,-.102,1.385)),Vector((.061,-.072,1.363)),.014),
            (Vector((-.020,-.092,1.404)),Vector((-.050,-.099,1.395)),Vector((-.064,-.072,1.377)),Vector((-.059,-.065,1.348)),.010)]
    for j,(a,b,c,d,width) in enumerate(fringe):
        pts=[];normals=[];widths=[]
        for k in range(25):
            t=k/24;desired=bezier(a,b,c,d,t);hit,n,_,_=surface.find_nearest(desired)
            pts.append(hit+n*(.004+.002*math.sin(math.pi*t)));normals.append(n);widths.append(width*(1-.85*t**3))
        ribbon('Loose swept front lock',pts,widths,normals,(j+2)%4,rig,collection,hairmat)
    # Side locks cover the temple/ear portion of the underlayer and sweep
    # diagonally back into the bun, breaking up the parallel crown flow.
    for sign in [-1,1]:
        for j in range(4):
            a=Vector((sign*.060,-.071,1.369+j*.006))
            b=Vector((sign*.087,-.018,1.369+j*.010))
            c=Vector((sign*.074,.061,1.402+j*.005))
            d=Vector((sign*.014,.080,1.414))
            pts=[];normals=[];widths=[]
            for k in range(20):
                t=k/19;desired=bezier(a,b,c,d,t);hit,n,_,_=surface.find_nearest(desired)
                pts.append(hit+n*(.006+.003*math.sin(math.pi*t)) if t<.8 else desired)
                normals.append(n);widths.append(.018*(1-.65*t**4))
            ribbon('Swept side lock',pts,widths,normals,(j+2)%4,rig,collection,hairmat)
    # Irregular wrapped strips give the bun a gathered-hair silhouette.
    center=Vector((-.004,.055,1.407))
    for j in range(10):
        pts=[];normals=[];widths=[]
        for k in range(25):
            t=k/24;phi=j*2*math.pi/10+3.5*math.pi*t
            zz=.033*math.cos(math.pi*t);r=.014+.025*math.sin(math.pi*t)
            n=Vector((math.cos(phi)*math.sin(math.pi*t),math.sin(phi)*math.sin(math.pi*t),math.cos(math.pi*t))).normalized()
            pts.append(center+Vector((r*math.cos(phi),r*math.sin(phi),zz)))
            normals.append(n);widths.append(.018*(.55+.45*math.sin(math.pi*t)))
        ribbon('Gathered bun lock',pts,widths,normals,j%4,rig,collection,hairmat)
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
            ribbon('Soft temple wisp',pts,widths,normals,4+j%2,rig,collection,hairmat)
    add_loose_strands(surface,rig,collection,hairmat)
    # Fine natural brows are in the reference-directed face albedo. Avoid a
    # second set of painted-looking geometry above the real brow ridge.
    return surface

def add_loose_strands(surface,rig,collection,hairmat):
    """Sparse head-bound cards; no particles, simulation or extra material draw."""
    # Offset roots irregularly and let a few strands lift above the crown.
    # Each card is narrow and uses one of the sparse texture columns.
    for j in range(14):
        x=-.064+.128*j/13
        a=Vector((x,-.094,1.400+.008*bell(x,-.015,.030)))
        b=Vector((x+.014*math.sin(j),-.067,1.465))
        c=Vector((x*.70,.050,1.458))
        d=Vector((x*.20-.004,.079,1.418))
        points=[];normals=[];widths=[]
        for k in range(13):
            t=k/12;desired=bezier(a,b,c,d,t);hit,n,_,_=surface.find_nearest(desired)
            lift=.004+.010*math.sin(math.pi*t)**2*(.65+.35*math.sin(j*2.2)**2)
            points.append(hit+n*lift if t<.85 else desired)
            normals.append(n);widths.append((.0045+.002*math.sin(j*1.9)**2)*(1-.75*t**3))
        ribbon('Airy crown flyaway',points,widths,normals,4+j%2,rig,collection,hairmat)
    # Fine baby-hair cards bridge the opaque base's boundary. Their irregular
    # tapered tips break up the straight edge without a transparent scalp shell.
    head_center=Vector((0,-.045,1.345))
    for j in range(18):
        theta=math.pi*.5+.12+(math.pi-.24)*j/17
        phi=math.acos((scalp_boundary(theta)-head_center.z)/.091)
        direction=Vector((math.sin(phi)*math.sin(theta),math.sin(phi)*math.cos(theta),math.cos(phi)))
        edge,n,_,_=surface.ray_cast(head_center,direction)
        pts=[];normals=[];widths=[]
        for k in range(8):
            t=k/7;desired=edge+Vector((.001*math.sin(j+t*4),0,.010-.016*t))
            hit,normal,_,_=surface.find_nearest(desired)
            pts.append(hit+normal*.0034);normals.append(normal)
            widths.append((.004+.001*math.sin(j)**2)*(1-.8*t))
        ribbon('Soft hairline baby hairs',pts,widths,normals,4+j%2,rig,collection,hairmat)
    # Reference-like face-framing wisps separate from the cheek and curl gently
    # around the temple, stopping above the neck rather than following the cap.
    for sign in [-1,1]:
        for j in range(3):
            a=Vector((sign*(.049+j*.004),-.088,1.397-j*.004))
            b=Vector((sign*(.074+j*.003),-.101,1.369))
            c=Vector((sign*(.068+j*.004),-.079,1.315-j*.009))
            d=Vector((sign*(.054+j*.006),-.085,1.294-j*.008))
            points=[];normals=[];widths=[]
            for k in range(19):
                t=k/18;desired=bezier(a,b,c,d,t);hit,n,_,_=surface.find_nearest(desired)
                # Keep roots attached and tips away from the face surface.
                p=hit+n*.005 if t<.12 else desired
                points.append(p);normals.append(Vector((0,-1,.10)).normalized())
                widths.append((.0065-j*.0012)*(1-.94*t**1.6))
            ribbon('Loose face framing strand',points,widths,normals,4+j%2,rig,collection,hairmat)
    # Open irregular loops soften the bun's round core silhouette. Roots and
    # ends tuck inside the core, keeping it connected in all side views.
    center=Vector((-.004,.055,1.407))
    for j in range(10):
        points=[];normals=[];widths=[]
        phi=j*2*math.pi/10+.13*math.sin(j*2.7)
        direction=Vector((math.cos(phi),math.sin(phi),.12*math.sin(j)))
        for k in range(15):
            t=k/14;angle=-.35+math.pi*1.35*t
            radial=.031+.012*math.sin(math.pi*t)
            p=center+direction*(radial*math.sin(angle))+Vector((0,0,.043*math.cos(angle)))
            n=(p-center).normalized();points.append(p);normals.append(n)
            widths.append((.006+.002*math.sin(j)**2)*(1-.88*t**2))
        ribbon('Loose bun flyaway',points,widths,normals,4+j%2,rig,collection,hairmat)
    # A few continuous modelled filaments survive mipmapping at small sizes.
    # Their narrow tapered silhouettes avoid relying only on alpha speckles.
    fiber=bpy.data.materials.new('Natural brown fine filaments');fiber.diffuse_color=(.030,.015,.009,1)
    paths=[]
    for sign in [-1,1]:
        for j in range(3):
            paths.append((Vector((sign*(.050+j*.004),-.089,1.393-j*.003)),
                Vector((sign*(.073+j*.003),-.112,1.361)),
                Vector((sign*(.073+j*.004),-.098,1.322-j*.009)),
                Vector((sign*(.056+j*.006),-.091,1.296-j*.010)),.0015-j*.0003))
    for j in range(8):
        phi=j*2*math.pi/8
        radial=Vector((math.cos(phi),math.sin(phi),.2))
        a=center+radial*.025+Vector((0,0,.018))
        b=center+radial*.052+Vector((0,0,.047))
        c=center+radial*.056-Vector((0,0,.029))
        d=center+radial*.029-Vector((0,0,.022))
        paths.append((a,b,c,d,.0011))
    for j,(a,b,c,d,width) in enumerate(paths):
        pts=[bezier(a,b,c,d,k/17) for k in range(18)]
        normals=[Vector((0,-1,.1)).normalized() if j<6 else (p-center).normalized() for p in pts]
        widths=[width*(1-.93*(k/17)**1.5) for k in range(18)]
        obj=ribbon('Fine free hair filament',pts,widths,normals,4,rig,collection,fiber)
        obj['texture_kind']='hair_filament'
