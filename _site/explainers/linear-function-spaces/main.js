import * as d3 from "https://cdn.skypack.dev/d3@7";
window.d3 = d3;

import * as cscheid from "/js/cscheid/cscheid.js";

var drawingSurface = cscheid.plot.surface;

//////////////////////////////////////////////////////////////////////////////

function linearFunctionSpace(basis, weightParam)
{
    var d = basis.length;
    var weights = new Float64Array(d);
    
    var f = function(x) {
        var result = 0;
        for (var i=0; i<d; ++i)
            result += basis[i](x) * weights[i];
        return result;
    };
    f.setWeights = function(weightParam) {
        for (var i=0; i<d; ++i) {
            weights[i] = weightParam[i];
        }
    };

    if (weightParam !== undefined) {
        cscheid.debug.assert(basis.length === weightParam.length,
                             "need basis and weight vector to have the same length");
        f.setWeights(weightParam);
    }
    return f;
}

//////////////////////////////////////////////////////////////////////////////

var linearFunctions = drawingSurface({
    element: d3.select("#linear-functions"),
    xScale: d3.scaleLinear().domain([-2.1, 2.1]),
    yScale: d3.scaleLinear().domain([-1.1, 1.1])
});
var linearFunctionAnnotations = [
    { text: "f(x) = 1",         x:  1.8, y:  0.9 },
    { text: "f(x) = x",         x: -0.5, y: -0.3 },
    { text: "f(x) = (x + 1)/2", x: -1.3, y:  0.1 }
];
linearFunctions.append("g").selectAll("text")
    .data(linearFunctionAnnotations)
    .enter()
    .append("text")
    .text(d => d.text)
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .call(setAnnotationStyle);

linearFunctions.surface.addFunction([x=>1, x=>x, x=>(x+1)/2], 1)
    .attr("stroke", (d, i) => ["blue", "red", "black"][i])
    .attr("stroke-width", (d, i) => ["1px", "1px", "2px"][i]);

function setAnnotationStyle(sel) {
    return sel.attr("class", "annotation")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle");
};

//////////////////////////////////////////////////////////////////////////////
// runge phenomenon

var rungeChart = drawingSurface({
    element: d3.select("#runge-phenomenon"),
    xScale: d3.scaleLinear().domain([-1.1, 1.1]),
    yScale: d3.scaleLinear().domain([-0.4, 1.2])
});
var runge = x=>1/(x * x * 25 + 1);
function sample(min, max, f, count) {
    var s = d3.scaleLinear().domain([0, count-1]).range([min, max]);
    var vs = d3.range(count);
    return {xs: vs.map(x => s(x)),
            ys: vs.map(x => f(s(x)))};
}
var deg3runge  = cscheid.approximation.polynomial(sample(-1, 1, runge, 4), 3);
var deg7runge  = cscheid.approximation.polynomial(sample(-1, 1, runge, 8), 7);
var deg11runge = cscheid.approximation.polynomial(sample(-1, 1, runge, 12), 11);
var runges = [x => deg3runge.predict(x),
              x => deg7runge.predict(x),
              x => deg11runge.predict(x) ];
              
rungeChart.surface.addFunction(runges, 600)
    .attr("stroke", (d, i) => d3.hcl(0,0,80 - i * 30))
    .attr("stroke-width", (d, i) => String(i+1) + "px")
    .attr("fill", "none");
rungeChart.surface.addFunction(runge, 600)
    .attr("stroke", "red")
    .attr("stroke-width", "3px")
    .attr("fill", "none");

//////////////////////////////////////////////////////////////////////////////

var squareKernel = function(x) {
    if (x < -0.5) return 0;
    if (x > 0.5) return 0;
    return 1;
};
var bspline0 = squareKernel;

function shift(f, i) {
    return function(x) {
        return f(x-i);
    };
}

var squareFunctions = drawingSurface({
    element: d3.select("#square-functions"),
    xScale: d3.scaleLinear().domain([-1.6, 1.6]),
    yScale: d3.scaleLinear().domain([-0.1, 1.1])
});

var shiftColorScale = d3.scaleLinear()
        .domain([-2, 2])
        .range([d3.lab(60, 30, -30), d3.lab(60, 30, 30)])
        .interpolate(d3.interpolateLab);
squareFunctions.surface.addFunction([shift(squareKernel, -1),
                             shift(squareKernel, 0),
                             shift(squareKernel, 1)], 600)
    .attr("stroke", (f, i) => shiftColorScale(i-1))
    .attr("fill", "none")
    .attr("stroke-width", "1px");
var f = linearFunctionSpace([-1,0,1].map(x => shift(squareKernel, x)), [0.2, 0.6, 0.4]);
squareFunctions.surface.addFunction(f, 600)
    .attr("stroke", d3.lab(60,-30,0))
    .attr("fill", "none")
    .attr("stroke-width", "2px");

function rangeKernel(mn, mx) {
    var c = 1/(mx - mn);
    return (x => {
        // semi-open interval to avoid double-counting on edges
        if (x <= mn) return 0;
        if (x > mx) return 0;
        return c;
    });
}
function uniformLFS(mn, mx, steps) {
    var result = [];
    var r = mx - mn, step = r / steps;
    for (var i=0; i<steps; ++i) {
        result.push(rangeKernel(mn + i * step, mn + (i + 1) * step));
    }
    return result;
}
var squareRunge = drawingSurface({
    element: d3.select("#square-runge"),
    xScale: d3.scaleLinear().domain([-1.1, 1.1]),
    yScale: d3.scaleLinear().domain([-0.4, 1.2])
});

var sq3runge  = cscheid.approximation.leastSquaresLFS(
    sample(-1, 1, runge, 4),  uniformLFS(-4/3, 4/3, 4));
var sq7runge  = cscheid.approximation.leastSquaresLFS(
    sample(-1, 1, runge, 8),  uniformLFS(-8/7, 8/7, 8));
var sq11runge = cscheid.approximation.leastSquaresLFS(
    sample(-1, 1, runge, 12), uniformLFS(-12/11, 12/11, 12));
var sqrunges = [x => sq3runge.predict(x),
                x => sq7runge.predict(x),
                x => sq11runge.predict(x)];
squareRunge.surface.addFunction(sqrunges,  600)
    .attr("stroke", (f, i) => d3.hcl(0,0,80-i*30))
    .attr("fill", "none")
    .attr("stroke-width", (f, i) => String(i+1) + "px");

//////////////////////////////////////////////////////////////////////////////

var bspline0drawing = drawingSurface({
    element: d3.select("#bspline-0"),
    xScale: d3.scaleLinear().domain([-3.1, 3.1]),
    yScale: d3.scaleLinear().domain([-0.1, 1.1])
});
[-2,-1,0,1,2].forEach(i => {
    bspline0drawing.surface.addFunction(x => bspline0(x-i), 600)
        .attr("stroke", shiftColorScale(i))
        .attr("fill", "none")
        .attr("stroke-width", "3px");
});

function bspline1(x) {
    if (x < -1) return 0;
    if (x < 0) return 1 + x;
    if (x < 1) return 1 - x;
    return 0;
}
var bspline1drawing = drawingSurface({
    element: d3.select("#bspline-1"),
    xScale: d3.scaleLinear().domain([-3.1, 3.1]),
    yScale: d3.scaleLinear().domain([-0.1, 1.1])
});
[-2,-1,0,1,2].forEach(i => {
    bspline1drawing.surface.addFunction(x => bspline1(x-i), 600)
        .attr("stroke", shiftColorScale(i))
        .attr("fill", "none")
        .attr("stroke-width", "3px");
});

function bspline2(x) {
    x += 3/2;
    if (x < 0) return 0;
    if (x < 1) return x * x / 2;
    if (x < 2) return ((-2) * x * x + 6 * x - 3) / 2;
    if (x < 3) return (3 - x) * (3 - x) / 2;
    return 0;
}
var bspline2drawing = drawingSurface({
    element: d3.select("#bspline-2"),
    xScale: d3.scaleLinear().domain([-3.1, 3.1]),
    yScale: d3.scaleLinear().domain([-0.1, 1.1])
});
[-2,-1,0,1,2].forEach(i => {
    bspline2drawing.surface.addFunction(x => bspline2(x-i), 600)
        .attr("stroke", shiftColorScale(i))
        .attr("fill", "none")
        .attr("stroke-width", "3px");
});
[{ el: bspline0drawing, k: cscheid.caliper.kernels.bSpline(0) },
 { el: bspline1drawing, k: cscheid.caliper.kernels.bSpline(1) },
 { el: bspline2drawing, k: cscheid.caliper.kernels.bSpline(2) }].forEach(obj => {
     var f = cscheid.caliper.makeFunction([0.4, 0.3, 0.5, 0.7, 0.6], obj.k);
     obj.el.surface.addFunction(x => f(x+2), 600)
         .attr("stroke", d3.lab(60, -30, 0))
         .attr("fill", "none")
         .attr("stroke-width", "5px");
 });
