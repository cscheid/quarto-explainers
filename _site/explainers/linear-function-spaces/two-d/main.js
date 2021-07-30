import * as d3 from "https://cdn.skypack.dev/d3@7";
import _ from 'https://cdn.skypack.dev/lodash';

window.d3 = d3;
window._ = _;

import * as cscheid from "/js/cscheid/cscheid.js";

//////////////////////////////////////////////////////////////////////////////

var canvas = d3.select("#bilinear-reconstruction").append("canvas")
    .attr("width", 720)
    .attr("height", 360);

Lux.init({
    canvas: canvas.node(),
    clearColor: [0, 0, 0, 0.05],
    highDPS: true
});

function lineSet(points) {
    if (points.length === 0) {
        throw new Error("points must be non-zero length");
    }
    var positions = [].concat.apply([], points);
    var elements = d3.range(points.length);
    var model = Lux.model({
        type: "lines",
        elements: elements,
        vertex: [positions, points[0].length]
    });
    return model;
}

var camera = Shade.Camera.perspective({
    fieldOfViewY: 22.5
});
var around = Shade(function(vec, transform) {
    var n = vec.neg();
    return (
        (Shade.translation(vec.x(), vec.y(), vec.z()))
        (transform)
        (Shade.translation(n.x(), n.y(), n.z()))
    );
});

var grid = lineSet([
    [-0.5, 0, 0],  [3.5, 0, 0],
    [-0.5, 0, -1], [3.5, 0, -1],
    [-0.5, 0, -2], [3.5, 0, -2],
    [-0.5, 0, -3], [3.5, 0, -3],
    [0, 0, 0.5], [0, 0, -3.5],
    [1, 0, 0.5], [1, 0, -3.5],
    [2, 0, 0.5], [2, 0, -3.5],
    [3, 0, 0.5], [3, 0, -3.5],
]);

var w = Shade.parameter("float", 0.5);
var offsetX = Shade.parameter("float", 1); 
var offsetZ = Shade.parameter("float", -1);
var hatColor = Shade.parameter("vec4", Shade.color("black").evaluate());

var hat = Shade(function(u) {
    return u.lt(-1).ifelse(0,
           u.lt( 0).ifelse(Shade.add(1, u),
           u.lt( 1).ifelse(Shade.sub(1, u), 0)));
});

function basisFunction(u, v) {
    return w.mul(hat(u)).mul(hat(v));
}

var hatScene = Lux.scene({
    transform: function(appearance) {
        appearance = _.clone(appearance);
        var x = appearance.position.x(),
            y = appearance.position.y();
        appearance.position = Shade.vec(x.add(offsetX), basisFunction(x, y), y.add(offsetZ));
        return appearance;
    }
});

var ourScene = Lux.scene({
    transform: function(appearance) {
        appearance = _.clone(appearance);
        appearance.position = camera(
            (Shade.translation(-1.5, -0.5, -6))
            (Shade.rotation(0.4, Shade.vec(1,0,0)))
            (around(Shade.vec(1.5, 0.0, -1.5), Shade.rotation(Shade.sin(Lux.now().div(2)).div(4).add(0.5), Shade.vec(0,1,0))))
            (appearance.position)
        );
        return appearance;
    }
});

ourScene.add(hatScene);
ourScene.add(Lux.actor({
    model: grid,
    appearance: {
        position: grid.vertex,
        color: Shade.color("#000")
    }
}));

var hat1 = lineSet([
    [-1,  0.00], [0,  0.00], [0,  0.00], [1,  0.00],
    // [-1,  0.50], [0,  0.50], [0,  0.50], [1,  0.50],
    // [-1, -0.50], [0, -0.50], [0, -0.50], [1, -0.50],

    [0,    -1], [0, 0], [0, 0], [0, 1],
    // [0.5,  -1], [0.5, 0],  [0.5, 0],  [0.5, 1],
    // [-0.5, -1], [-0.5, 0], [-0.5, 0], [-0.5, 1],
]);

//////////////////////////////////////////////////////////////////////////////

function instancedActor(
    actor,
    parameters,
    values) {
    return {
        dress: function(scene) {
            var batch = actor.dress(scene);
            return {
                draw: function() {
                    values.forEach(valueList => {
                        parameters.forEach((parameter, i) => {
                            parameter.set(valueList[i]);
                        });
                        batch.draw();
                    });
                }
            };
        },
        on: function(eventName, event) {
            return actor.on(eventName, event);
        }
    };
}

var hatActor = Lux.actor({
    model: hat1,
    appearance: {
        position: hat1.vertex,
        color: hatColor,
        lineWidth: 10
    }
});

hatScene.add(instancedActor(
    hatActor,
    [w, offsetX, offsetZ, hatColor],
    [[0.5, 1, -1, Shade.color("#800").evaluate()],
     [0.2, 2, -1, Shade.color("#080").evaluate()],
     [0.4, 1, -2, Shade.color("#008").evaluate()],
     [0.9, 2, -2, Shade.color("#088").evaluate()],
    ]
));

Lux.Scene.add(ourScene);

Lux.Scene.animate();
