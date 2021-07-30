/*global d3, Lux, Shade */
function init() {
    d3.select("#bilinear").append("canvas");
    Lux.init({
        clearColor: [0,0,0,1],
        clearDepth: 1.0
    });
    
    var angleY = Shade.parameter("float", 0.0);
    var angleX = Shade.parameter("float", 0.0);
    var camera = Shade.Camera.perspective({fieldOfViewY: 30});
    var modelXForm = (Shade.rotation(0.35, Shade.vec(1,0,0)))(Shade.rotation(angleX, Shade.vec(0, 1, 0)))(Shade.rotation(angleY, Shade.vec(1, 0, 0)))(Shade.translation(-0.5, -1, -0.5));
    var viewXForm = Shade.translation(0, 0.2, -3);

    var startTime = (new Date().getTime()) / 1000;
    angleX.set(0.2);
    Lux.Scene.animate();

    var mesh = Lux.Models.mesh(100,100);
    var u = mesh.texCoord.x(), v = mesh.texCoord.y();

    var a = Shade.mix(0.9, 0.5,   Shade.sin(Lux.now()).add(1).div(2));
    var b = Shade.mix(0.2, 0.4,   Shade.sin(Lux.now().add(0.5)).add(1).div(2));
    var c = Shade.mix(0.35, 0.55, Shade.sin(Lux.now().add(0.6).div(1.1)).add(1).div(2).add(1));
    var d = Shade.mix(0.7, 0.9,   Shade.sin(Lux.now().add(1).div(1.4)).add(1).div(2));
    var avg = a.add(b).add(c).add(d).div(4);
    var scaleY = 0.5;
    var bottom = Shade.mix(c, d, u),
        top = Shade.mix(a, b, u);
    var h = Shade.mix(top, bottom, v).sub(avg).add(0.5);
    
    var position = Shade.vec(u, h, v);
    var linePos = Shade(Lux.attributeBuffer({ vertexArray: [0,0,0, 1,0,0,
                                                            1,0,1, 0,0,1,
                                                            0,1,0, 1,1,0,
                                                            1,1,1, 0,1,1], itemSize: 3}));
    var lineEls = Lux.elementBuffer([0, 1, 1, 2, 2, 3, 3, 0, 0, 4, 1, 5, 2, 6, 3, 7]);
    var supportLines = Lux.actor({
        model: { type: 'lines',
                 elements: lineEls },
        appearance: {
            mode: Lux.DrawingMode.overWithDepth,
            position: camera(viewXForm)(modelXForm)(linePos),
            color: Shade.color("white"),
            lineWidth: 3
        }
    });
    
    var dSdy = Shade.dFdy(Shade.vec(u, v, h));
    var dvdy = Shade.dFdy(v);
    var dSdv = dSdy.div(dvdy);

    var dSdx = Shade.dFdx(Shade.vec(u, v, h));
    var dudx = Shade.dFdx(u);
    var dSdu = dSdx.div(dudx);

    var normal = Shade.normalize(Shade.cross(dSdu, dSdv));

    // var dhdv = Shade.dFdx(Shade(0, 1, h)).div(Shade.dFdx(v));

    var gradient = Shade.vec(0,1,0); // Shade.normalize(Shade.cross(dhdu, dhdv));
    
    var bivariateActor = Lux.actor({
        model: mesh,
        appearance: {
            position: camera(viewXForm)(modelXForm)(position),
            color: Shade.mix(Shade.vec(0.4, 0.6, 0.8, 1), Shade.color("black"),
                             Shade.clamp(Shade.dot(Shade.vec(-1,1,0), normal), 0, 1))
        }});
    Lux.Scene.add(supportLines);
    Lux.Scene.add(bivariateActor);
    var scaleVec = Shade.vec(1,scaleY,1);
    var square = Lux.model({
        type: "triangles",
        elements: [0, 1, 2, 0, 2, 3],
        vertex: [[0,1,0, 1,1,0, 1,1,1, 0,1,1], 3]
    });
    var cuttingPlane = Lux.actor({
        model: square,
        appearance: {
            mode: Lux.DrawingMode.overWithDepth,
            position: camera(viewXForm)(modelXForm)(square.vertex.mul(scaleVec)),
            color: Shade.vec(1,1,1,0.9)
        }
    });
    Lux.Scene.add(cuttingPlane);
}

//////////////////////////////////////////////////////////////////////////////
// regularly sampled spatially reconstructed linear function spaces

function hatKernel(x)
{
    if (x <= -1) return 0;
    if (x >= 1) return 0;
    if (x < 0)
        return -x-1;
    else
        return 1-x;
}

//////////////////////////////////////////////////////////////////////////////

export function main() {
  init();
}
