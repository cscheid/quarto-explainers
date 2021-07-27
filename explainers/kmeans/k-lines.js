/*global cscheid */

function generateData(k, n, sigma) {
    var lines = [], i, j;
    var points = [];
    for (i=0; i<k; ++i) {
        var m = cscheid.random.normalVariate();
        var b = cscheid.random.normalVariate();
        lines.push([m, b]);
    }
    for (i=0; i<k; ++i) {
        for (j=0; j<n; ++j) {
            var x = Math.random();
            var y = lines[i][0] * x + lines[i][1] + cscheid.random.normalVariate() * sigma;
            points.push(cscheid.geometry.vec2(x, y));
        }
    }
    return points;
}

function kLines(data, k) {
    var assignments = [], i, j;
    var changed;

    for (i=0; i<data.length; ++i) {
        assignments.push(cscheid.random.uniformRange(0, k));
    }
    var xs = [], ys = [], solvers;

    do {
        xs = [];
        ys = [];
        for (i=0; i<k; ++i) {
            xs.push([]);
            ys.push([]);
        }
        for (i=0; i<data.length; ++i) {
            xs[assignments[i]].push([data[i].x, 1]);
            ys[assignments[i]].push(data[i].y);
        }
        solvers = [];
        for (i=0; i<xs.length; ++i) {
            solvers.push(cscheid.data.leastSquares(xs[i], ys[i]));
        }
        changed = false;
        var totalError = 0;
        for (i=0; i<data.length; ++i) {
            var bestError = Infinity, bestChoice = -1;
            for (j=0; j<solvers.length; ++j) {
                var error = Math.pow(solvers[j].predict([data[i].x, 1]) - data[i].y, 2);
                if (error < bestError) {
                    bestError = error;
                    bestChoice = j;
                }
            }
            if (assignments[i] !== bestChoice) {
                assignments[i] = bestChoice;
                changed = true;
            }
            totalError += bestError;
        }
        console.log("Total error", totalError);
    } while (changed);
    return {
        solvers: solvers,
        assignments: assignments
    };
}

var data = generateData(2, 20, 0.05);

var plot = cscheid.plot.create(d3.select("#div-klines"), 400, 400);
plot.setXDomain([-0.1, 1.1]);
plot.setYDomain(d3.extent(data, function(d) { return d.y; }));

plot.setMargins({left: 20, right: 10, top: 10, bottom: 10});
var xAxis2 = plot.addXAxis();
var yAxis2 = plot.addYAxis();
xAxis2.axisObject.ticks(3);
yAxis2.axisObject.ticks(3);

var solution = kLines(data, 2);

plot.addCurves(solution.solvers, {
    value: function(d) {
        return function(x) {
            return d.predict([x, 1]);
        };
    }
});

plot.addPoints(data, {
    x: function(d) { return d.x; },
    y: function(d) { return d.y; },
    class: function(d,i) { return solution.assignments[i]; }
});
