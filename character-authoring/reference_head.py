"""Reference-directed face sculpt and shared head-parenting utilities."""
import bpy,math

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


def parent_to_head(obj,rig):
    bpy.context.view_layer.update();world=obj.matrix_world.copy()
    obj.parent=rig;obj.parent_type='BONE';obj.parent_bone='head'
    bpy.context.view_layer.update();obj.matrix_world=world


def bezier(a,b,c,d,t):return a*(1-t)**3+3*b*t*(1-t)**2+3*c*t*t*(1-t)+d*t**3
