import * as cscheid from "/js/cscheid/cscheid.js";

function logisticRegression(data, lambda)
{
    lambda = lambda || 1e-4;
    
    // inefficient in # of traversals, but doesn't create
    // extra copies and easy to write
    function distance2(a, b) {
        return cscheid.blas(a,a) + cscheid.blas(b,b) - 2 * cscheid.blas(a, b);
    }
    
    function logisticFunction(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    var n = data.length, d = data[0].x.length, i, j, k, weight;
    var beta = new Float32Array(d);
    for (i=0; i<d; ++i) {
        beta[i] = Math.random(); // ideally gaussians but won't matter
    }
    var count = 0;
    do {
        var gradient = new Float32Array(d);
        for (i=0; i<n; ++i) {
            weight = logisticFunction(cscheid.blas.dot(beta, data[i].x)) - data[i].y;
            cscheid.blas.axpy(weight, data[i].x, gradient);
        }

        var hessian = [];
        for (i=0; i<d; ++i) {
            hessian.push(new Float32Array(d));
        }

        for (i=0; i<n; ++i) {
            weight = logisticFunction(cscheid.blas.dot(beta, data[i].x));
            weight = weight * (1 - weight);
            for (j=0; j<d; ++j) {
                for (k=0; k<d; ++k) {
                    hessian[j][k] += data[i].x[j] * data[i].x[k] * weight;
                }
            }
        }
        // regularization
        cscheid.blas.axpy(2 * lambda, beta, gradient);
        for (i=0; i<d; ++i) {
            hessian[i][i] += 2 * lambda;
        }
        
        var correction = numeric.solve(hessian, gradient);
        var relativeChange = Math.sqrt(cscheid.blas.dot(correction, correction) /
                                       cscheid.blas.dot(beta, beta));
        cscheid.blas.axpy(-1, correction, beta);
    } while (++count < 100 && relativeChange > 1e-4);

    return beta;
}

function testData()
{
    var result = [];

    for (var i=0; i<20; ++i) {
        result.push({ x: [1, Math.random(), Math.random()],     y: 0});
        result.push({ x: [1, 2+Math.random(), 2+Math.random()], y: 1});
    }
    return result;
}

function makePlot(div, data)
{
    var plot = cscheid.plot.create(div, 300, 300);
    plot.setXDomain([-0.2, 3.2]);
    plot.setYDomain([-0.2, 3.2]);

    var dataPointsSceneObject = plot.addPoints(data, {
        x: function(d) { return d.x[1]; },
        y: function(d) { return d.x[2]; },
        class: function(d) { return d.y; }
    });

    var beta = logisticRegression(data);
    // beta[0] + x beta[1] + y beta [2] = 0
    // y = -beta[0]/beta[2] - x beta[1]/beta[2]

    function boundaryLine(beta) {
        function boundaryY(x) {
            return -beta[0]/beta[2] - x * beta[1]/beta[2];
        }
        var y1 = boundaryY(-0.2), y2 = boundaryY(3.2);
        return { x1: -0.2, x2: 3.2, y1: y1, y2: y2 };
    }

    var boundaryLineObject = { beta: beta, line: boundaryLine(beta) };
    var boundaryLineSceneObject = plot.addLines([boundaryLineObject], {
        x1: function(d) { return d.line.x1; },
        x2: function(d) { return d.line.x2; },
        y1: function(d) { return d.line.y1; },
        y2: function(d) { return d.line.y2; },
        stroke: function() { return "black"; },
        custom: function(sel) {
            sel.attr("stroke-dasharray", "3, 3");
        }
    });

    var xAxis = plot.addXAxis();
    xAxis.axisObject.ticks(3);
    xAxis.update();
    
    var yAxis = plot.addYAxis();
    yAxis.axisObject.ticks(3);
    yAxis.update();

    var centers = [[0,0,0], [0,0,1]];

    for (var i=0; i<data.length; ++i) {
        centers[data[i].y][0] += data[i].x[1];
        centers[data[i].y][1] += data[i].x[2];
    }
    centers[0][0] /= data.length/2;
    centers[0][1] /= data.length/2;
    centers[1][0] /= data.length/2;
    centers[1][1] /= data.length/2;

    var centerSceneObject = plot.addPoints(centers, {
        x: function(d) { return d[0]; },
        y: function(d) { return d[1]; },
        class: function(d) { return d[2]; },
        r: function() { return 5; },
        custom: function(sel) {
            sel.attr("fill-opacity", 0.5)
                .attr("cursor", "pointer")
                .attr("stroke", "black");
        }
    });

    function started() {
        d3.select(this).attr("stroke-width", 3);
    }
    function dragged(d) {
        // update center
        var dx = d[0] - plot.xScale.invert(d3.event.x),
            dy = d[1] - plot.yScale.invert(d3.event.y);
        d[0] = plot.xScale.invert(d3.event.x);
        d[1] = plot.yScale.invert(d3.event.y);
        centerSceneObject.update();
        
        // update data points
        for (var i=0; i<data.length; ++i) {
            if (data[i].y == d[2]) {
                data[i].x[1] -= dx;
                data[i].x[2] -= dy;
            }
        }
        dataPointsSceneObject.update();
        
        // update decision boundary
        beta = logisticRegression(data);
        boundaryLineObject.beta = beta;
        boundaryLineObject.line = boundaryLine(beta);
        boundaryLineSceneObject.update();
    }
    function ended() {
        d3.select(this).attr("stroke-width", 1);
    }
    
    var drag = d3.drag()
            .on("start", started)
            .on("drag", dragged)
            .on("end", ended);
    
    centerSceneObject.group.selectAll("circle").call(drag);
}

makePlot(d3.select("#div-plot"), testData());
