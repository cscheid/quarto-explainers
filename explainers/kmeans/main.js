import * as cscheid from "/js/cscheid/cscheid.js";

function assignmentTrace(assignments) {
    assignments = new Int32Array(assignments);
    return function() {
        for (var i=0; i<data.length; ++i) {
            data[i].class = assignments[i];
        }
    };
}

function centerTrace(centers) {
    var internalCenters = [];
    for (var i=0; i<centers.length; ++i) {
        internalCenters.push(cscheid.geometry.vec2(centers[i].x, centers[i].y));
    }
    return function() {
        for (var i=0; i<clusterCenters.length; ++i) {
            clusterCenters[i].set(internalCenters[i]);
        }
    };
}

function traceMany(thunks) {
    return function() {
        thunks.forEach(function(f) { f(); });
    };
}

//////////////////////////////////////////////////////////////////////////////

function kMeans(data, k) {
    var assignments = [], i, j;
    var changed;

    for (i=0; i<data.length; ++i) {
        assignments.push(cscheid.random.uniformRange(0, k));
    }
    var centers = [], counts = new Int32Array(k);
    for (i=0; i<k; ++i) {
        centers.push(cscheid.geometry.vec2(0,0));
    }

    var trace = [];

    trace.push(traceMany([centerTrace(centers),
                          assignmentTrace(assignments)]));

    do {
        changed = false;
        for (i=0; i<k; ++i) {
            centers[i].set(0,0);
            counts[i] = 0;
        }
        for (i=0; i<data.length; ++i) {
            centers[assignments[i]].add(data[i]);
            ++counts[assignments[i]];
        }
        for (i=0; i<k; ++i) {
            centers[i].scaleMutate(1 / counts[i]);
        }

        for (i=0; i<data.length; ++i) {
            var bestDistance = Infinity, d, bestAssignment;
            for (j=0; j<k; ++j) {
                d = centers[j].distance(data[i]);
                if (d < bestDistance) {
                    bestDistance = d;
                    bestAssignment = j;
                }
            }
            if (bestAssignment !== assignments[i]) {
                changed = true;
                assignments[i] = bestAssignment;
            }
        }
        trace.push(traceMany([centerTrace(centers),
                              assignmentTrace(assignments)]));
    } while (changed);
    
    return { assignment: assignments,
             trace: trace };
}

function generateClusters(centers, stdev) {
    stdev = stdev || 1;
    var result = [];
    for (var i=0; i<100; ++i) {
        for (var j=0; j<centers.length; ++j) {
            var v = cscheid.geometry.vec2(cscheid.random.normalVariate() / stdev,
                                          cscheid.random.normalVariate() / stdev);
            result.push(v.plus(centers[j]));
        }
    }

    return result;
}

var clusterCenters = [];
for (var i=0; i<3; ++i)
    clusterCenters.push(cscheid.geometry.vec2(0, 0));

var data = generateClusters([cscheid.geometry.vec2(2, 2),
                             cscheid.geometry.vec2(0, 0),
                             cscheid.geometry.vec2(4, 0)], 1.5);

var plot = cscheid.plot.create(d3.select("#div-kmeans"), 400, 400);

plot.setXDomain([-3, 7]);
plot.setYDomain([-5, 5]);

var pointsSceneObject = plot.addPoints(data, {
    x: function(d) { return d.x; },
    y: function(d) { return d.y; },
    class: function(d) { return d.class; }
});

var clustersSceneObject = plot.addPoints(clusterCenters, {
    x: function(d) { return d.x; },
    y: function(d) { return d.y; },
    class: function(d, i) { return i; },
    r: function() { return 5; },
    custom: function(sel) {
        return sel.attr("fill-opacity", 0.5)
            .attr("stroke", "gray");
    }
});

var result = kMeans(data, 3, pointsSceneObject);

var stages = result.trace;

var stage = 0;
d3.select("#button-step")
    .append("button")
    .text("Step")
    .on("click", function() {
        if (stage < stages.length-1) {
            ++stage;
            stages[stage]();
            plot.render(true);
        }
    });

d3.select("#button-reset")
    .append("button")
    .text("Reset")
    .on("click", function() {
        stage = 0;
        stages[stage]();
        plot.render();
    });

stages[0]();

plot.render();


