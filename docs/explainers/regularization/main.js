/*global d3 */
import * as cscheid from "/js/cscheid/cscheid.js";
import _ from 'https://cdn.skypack.dev/lodash';
import numeric from 'https://cdn.skypack.dev/numeric';

function generatePoints(n, noise)
{
    var xs = new Float32Array(n);
    var ys = new Float32Array(n);
    return { xs: xs, ys: ys };
}

function linearLeastSquares(data, degree, lambda, normalize)
{
    var i;
    var matrix = [];
    // compute column averages
    var averages = [];
    var stdevs = [];

    if (normalize) {
        for (i=0; i<=degree; ++i) {
            averages[i] = 0;
            stdevs[i] = 0;
        }
        stdevs[0] = 1;
        for (i=0; i<data.xs.length; ++i) {
            for (j=1; j<=degree; ++j) {
                var v = Math.pow(data.xs[i], j);
                averages[j] += v;
                stdevs[j] += v * v;
            }
        }
        for (i=1; i<=degree; ++i) {
            averages[i] /= data.xs.length;
            stdevs[i] = Math.pow(stdevs[i]/data.xs.length - Math.pow(averages[i], 2), 0.5);
        }
    } else {
        for (i=0; i<=degree; ++i) {
            averages[i] = 0;
            stdevs[i] = 1;
        }
        stdevs[0] = 1;
    }
    
    for (i=0; i<data.xs.length; ++i) {
        var row = [];
        for (var j=0; j<=degree; ++j) {
            row.push((Math.pow(data.xs[i], j) - averages[j]) / stdevs[j]);
        }
        matrix.push(row);
    }

    var s = numeric.svd(matrix);

    // horrible, horrible. FIXME: don't make a diagonal matrix.
    var sigmaInv = numeric.diag(s.S);
    var effdf = 0;
    for (i=0; i<=degree; ++i) {
        effdf += Math.pow(sigmaInv[i][i], 2) / (Math.pow(sigmaInv[i][i], 2) + lambda);
        sigmaInv[i][i] = 1.0 / (sigmaInv[i][i] + lambda);
    }
    var betaHat = numeric.dot(
        s.V,
        numeric.dot(
            sigmaInv, numeric.dot(
                numeric.transpose(s.U), data.ys)));
    
    return { beta: betaHat,
             averages: averages,
             stdevs: stdevs,
             effdf: effdf
           };
}

function predictLinearLeastSquares(fit, x)
{
    var result = 0;
    for (var i=0; i<fit.beta.length; ++i) {
        result += ((Math.pow(x, i) - fit.averages[i]) / fit.stdevs[i]) * fit.beta[i];
    }
    return result;
}

let pts;

function reseed(n, noiseLevel) {
    var lst = [];
    for (var i=0; i<n; ++i) {
        var u = Math.random();
        var s = Math.random();
        var x = 2 * u * Math.PI;
        var y = Math.sin(x) + (s - 0.5) * noiseLevel;
        lst.push({x: x, y: y});
    }
    lst.sort(function(a, b) {
        if (a.x < b.x)
            return -1;
        if (a.x > b.x)
            return 1;
        return 0;
    });
    for (i=0; i<lst.length; ++i) {
        pts.xs[i] = lst[i].x;
        pts.ys[i] = lst[i].y;
    }
}

export function main()
{
var normalize = true;
var fitDegree = 5;
var noiseLevel = 0.1;
var regularization = 1e-2;

var nPoints = 50;
pts = generatePoints(nPoints);
// var plot = makePlot(d3.select("#div-ridge2"), pts);
reseed(nPoints, noiseLevel);

var plot2 = cscheid.plot.create(d3.select("#div-ridge"), 300, 300);
plot2.setXDomain([0, Math.PI*2]);
plot2.setYDomain([-1.2, 1.2]);
plot2.setMargins({left: 20, right: 10, top: 10, bottom: 10});
var xAxis2 = plot2.addXAxis();
var yAxis2 = plot2.addYAxis();
xAxis2.axisObject.ticks(3);
yAxis2.axisObject.ticks(3);

plot2.addPoints(_.range(nPoints), {
    x: function(d) { return pts.xs[d]; },
    y: function(d) { return pts.ys[d]; },
    color: function() { return "gray"; }
});

plot2.addFunction(Math.sin, {
    color: function() { return "rgba(0,0,0,0.2)"; }
});

plot2.addCurves([ { pts: pts } ], {
    value: function(d) {
        var b = linearLeastSquares(d.pts, fitDegree, regularization, normalize);
        var fmt = d3.format(".3f");
        d3.select("#span-effdf").text(fmt(b.effdf));
        return function(x) {
            return predictLinearLeastSquares(b, x);
        };
    },
    color: function() { return "orange"; },
    custom: function(sel) {
        sel.attr("stroke-width", 2);
    }
});

plot2.render();

//////////////////////////////////////////////////////////////////////////////

d3.select("#span-degree").text(fitDegree);
d3.select("#span-regularization").text(regularization);
d3.select("#span-noise").text(noiseLevel);

//////////////////////////////////////////////////////////////////////////////

d3.select("#slider-degree")
    .append("input")
    .attr("type", "range")
    .attr("min", 1)
    .attr("max", 20)
    .attr("value", 5)
    .attr("step", 1)
    .on("input", function() {
        fitDegree = Number(this.value);
        d3.select("#span-degree").text(this.value);
        plot2.render();
    });

d3.select("#slider-regularization")
    .append("input")
    .attr("type", "range")
    .attr("min", -8)
    .attr("max", 8)
    .attr("value", -2)
    .attr("step", 1)
    .on("input", function() {
        regularization = Math.pow(10, Number(this.value));
        d3.select("#span-regularization").text(regularization);
        plot2.render();
    });

d3.select("#slider-noise")
    .append("input")
    .attr("type", "range")
    .attr("min", 0)
    .attr("max", 1)
    .attr("value", 0.1)
    .attr("step", 0.01)
    .on("input", function() {
        noiseLevel = Number(this.value);
        d3.select("#span-noise").text(noiseLevel);
        reseed(nPoints, noiseLevel);
        plot2.render();
    });

d3.select("#button-reseed")
    .append("button")
    .text("Regenerate points")
    .on("click", function() {
        reseed(nPoints, noiseLevel);
        plot2.render();
    });

d3.select("#span-normalize")
    .append("input")
    .attr("type", "checkbox")
    .property("checked", true)
    .on("click", function() {
        normalize = this.checked;
        plot2.render();
    });
}

