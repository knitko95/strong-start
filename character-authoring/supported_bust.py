"""A rounded, supported athletic surface; no bone, weight or animation edits.

The previous draft added a narrow forward bump. This replaces that deformation
with a broad paired envelope, fuller upper/lateral volume and a softer lower
transition. Values are an artistic fit in the existing model's rest coordinates,
not dimensions inferred from a photograph or a claimed bra size.
"""
import math

def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)

def supported_point(x,y,z,arm=0):
    if not (.975<z<1.163 and abs(x)<.139 and y<-.035) or arm>.2:return x,y,z
    front=smooth(.035,.075,-y)*(1-smooth(.05,.20,arm))
    q=((abs(x)-.060)/.064)**2+((z-1.069)/.074)**2
    # Rounded upper pole and lateral volume, with the apex above the old point.
    wall=-.093+.020*(abs(x)/.14)**2
    height=.068*math.sqrt(max(0,1-q))*smooth(0,.18,1-q)
    target=wall-height
    # The fitted fabric bridges a shallow sternum valley rather than exposing
    # a sharp central cleft or joining two disconnected spherical forms.
    # A fitted top spans the medial contours. Use the height at x=0.035 as a
    # smooth cloth bridge, with only a small centre depression; adding another
    # Gaussian bump here would create a ridge and a triangular lower cleft.
    central_q=((.035-.060)/.064)**2+((z-1.069)/.074)**2
    central_h=.068*math.sqrt(max(0,1-central_q))*smooth(0,.18,1-central_q)
    central=-.0918-central_h+.004*math.exp(-((z-1.068)/.055)**2)
    bridge=math.exp(-(x/.035)**4)
    target=target*(1-bridge)+central*bridge
    edge=(1-smooth(.108,.139,abs(x)))*smooth(.975,1.007,z)*(1-smooth(1.135,1.163,z))
    blend=.95*edge*front
    return x,y+(target-y)*blend,z

def refine_bust(body):
    names={g.index:g.name for g in body.vertex_groups};count=0;forward=0;back=0
    for v in body.data.vertices:
        x,y,z=v.co
        arm=sum(g.weight for g in v.groups if names[g.group].startswith(('upperarm','lowerarm','hand')))
        v.co=supported_point(x,y,z,arm)
        delta=y-v.co.y
        if abs(delta)>.00005:count+=1;forward=max(forward,delta);back=max(back,-delta)
    body.data.update()
    return {'method':'rounded supported envelope, replacing previous projection fields',
        'changedVertices':count,'maximumRestProjectionMetres':forward,
        'maximumRestRetractionMetres':back,'rigChanged':False,'weightsChanged':False}
