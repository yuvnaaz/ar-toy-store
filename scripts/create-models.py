"""Build original, redistributable low-poly glTF toys. Python standard library only."""
import base64, json, math, struct
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

def build(name, parts):
    blob = bytearray(); views = []; accessors = []; meshes = []; nodes = []; materials = []
    def attribute(values, width, bounds=False):
        offset = len(blob)
        flat = [v for row in values for v in row]
        blob.extend(struct.pack('<' + 'f' * len(flat), *flat))
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(flat)*4, 'target': 34962})
        acc = {'bufferView': len(views)-1, 'componentType': 5126, 'count': len(values), 'type': 'VEC3'}
        if bounds:
            acc['min'] = [min(v[i] for v in values) for i in range(width)]
            acc['max'] = [max(v[i] for v in values) for i in range(width)]
        accessors.append(acc)
        return len(accessors)-1
    for label, kind, pos, size, color, angle in parts:
        vertices=[]; normals=[]
        def triangle(a,b,c):
            u=[b[i]-a[i] for i in range(3)]; v=[c[i]-a[i] for i in range(3)]
            n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
            length=math.sqrt(sum(x*x for x in n)); n=[x/length for x in n]
            for p in (a,b,c): vertices.append(p); normals.append(n)
        if kind == 'box':
            points=[(x/2,y/2,z/2) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
            for face in [(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2),(0,1,5,4)]:
                triangle(*[points[i] for i in face[:3]]); triangle(*[points[i] for i in (face[0],face[2],face[3])])
        else: # Cylinder along Z for wheels, lamps and boiler.
            for i in range(20):
                a=i*math.tau/20; b=(i+1)*math.tau/20
                p=(math.cos(a)/2,math.sin(a)/2,-.5); q=(math.cos(b)/2,math.sin(b)/2,-.5)
                r=(q[0],q[1],.5); s=(p[0],p[1],.5)
                triangle(p,q,r); triangle(p,r,s); triangle((0,0,-.5),q,p); triangle((0,0,.5),s,r)
        materials.append({'name': label, 'pbrMetallicRoughness': {'baseColorFactor': color+[1], 'metallicFactor': .08, 'roughnessFactor': .55}})
        p=attribute(vertices,3,True); n=attribute(normals,3)
        meshes.append({'primitives':[{'attributes':{'POSITION':p,'NORMAL':n},'material':len(materials)-1}]})
        node={'name':label,'mesh':len(meshes)-1,'translation':pos,'scale':size}
        if angle: node['rotation']=[0,0,math.sin(angle/2),math.cos(angle/2)]
        nodes.append(node)
    data={'asset':{'version':'2.0','generator':'Toy Store original procedural models'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'materials':materials,'buffers':[{'uri':'data:application/octet-stream;base64,'+base64.b64encode(blob).decode(),'byteLength':len(blob)}],'bufferViews':views,'accessors':accessors}
    (ROOT/'assets'/f'{name}.gltf').write_text(json.dumps(data,separators=(',',':')))

yellow=[.95,.64,.08]; blue=[.12,.42,.65]; red=[.78,.14,.13]; dark=[.09,.11,.14]; silver=[.65,.7,.74]; glass=[.35,.78,.87]; cream=[.96,.9,.7]
def part(label,pos,size,color,kind='box',angle=0): return (label,kind,pos,size,color,angle)
def wheels(xs):
    result=[]
    for x in xs:
        for z in [-.43,.43]:
            result += [part('rubber tyre',[x,.22,z],[.44,.44,.16],dark,'cylinder'),part('wheel hub',[x,.22,z+(.09 if z>0 else -.09)],[.2,.2,.03],silver,'cylinder')]
    return result
crane=[part('chassis',[0,.38,0],[1.8,.24,.75],yellow),part('cab',[-.6,.77,0],[.55,.6,.68],yellow),part('windscreen',[-.6,.85,.35],[.42,.29,.02],glass),part('bumper',[-.94,.36,0],[.1,.16,.8],dark),part('turntable',[.3,.62,0],[.5,.18,.55],dark),part('boom',[.45,1.06,0],[1.25,.17,.2],yellow,angle=.65),part('extension',[.94,1.43,0],[.65,.1,.12],silver,angle=.65),part('cable',[1.19,1.04,0],[.025,.96,.025],dark),part('hook',[1.14,.55,0],[.14,.07,.08],dark)]+wheels([-.6,.6])
train=[part('base',[0,.35,0],[1.9,.2,.72],dark),part('cab',[-.58,.88,0],[.6,.86,.68],red),part('roof',[-.58,1.35,0],[.79,.1,.85],dark),part('window',[-.58,1,.35],[.38,.35,.02],glass),part('boiler',[.3,.73,0],[.9,.65,.65],red),part('front lamp',[.78,.83,0],[.05,.24,.24],cream),part('chimney',[.5,1.17,0],[.2,.35,.2],dark),part('chimney cap',[.5,1.38,0],[.29,.09,.29],dark)]+wheels([-.65,0,.65])
robot=[part('body',[0,.96,0],[.65,.74,.4],blue),part('head',[0,1.65,0],[.68,.52,.48],cream),part('visor',[0,1.68,.25],[.55,.22,.035],dark),part('left eye',[-.15,1.68,.28],[.09,.09,.03],glass),part('right eye',[.15,1.68,.28],[.09,.09,.03],glass),part('mouth',[0,1.48,.25],[.25,.035,.02],dark),part('antenna',[0,2,0],[.035,.2,.035],silver),part('antenna tip',[0,2.12,0],[.1,.1,.1],red),part('chest panel',[0,1,.22],[.4,.3,.035],silver),part('power button',[0,1,.25],[.12,.12,.03],red)]
for side in [-1,1]:
    robot += [part('shoulder',[side*.46,1.18,0],[.2,.2,.3],silver),part('arm',[side*.49,.88,0],[.18,.42,.22],blue),part('hand',[side*.49,.6,0],[.23,.18,.27],cream),part('leg',[side*.19,.39,0],[.22,.42,.25],silver),part('foot',[side*.19,.12,.08],[.3,.22,.48],blue)]
for name,parts in [('crane',crane),('train',train),('robot',robot)]: build(name,parts)
print('Created 3 original glTF models.')
