import * as cscheid from "/js/cscheid/cscheid.js";

export function main()
{

var drawingSurface = cscheid.plot.surface;

var s1 = drawingSurface({
    element: d3.select("#f-chart"),
    xScale: d3.scaleLinear().domain([-5, 5]),
    yScale: d3.scaleLinear().domain([-1, 1]),
    height: 150
});
s1.surface.addFunction(x=>Math.sin(5*x), 600)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "3px");
s1.append("text").attr("x", 4.5).attr("y", -0.8);

var s2 = drawingSurface({
    element: d3.select("#g-chart"),
    xScale: d3.scaleLinear().domain([-5, 5]),
    yScale: d3.scaleLinear().domain([-1, 1]),
    height: 150
});
s2.surface.addFunction(cscheid.caliper.kernels.bSpline(0), 600)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "3px");
s2.append("text").attr("x", 4.5).attr("y", 0.2);

var s3 = drawingSurface({
    element: d3.select("#fg-chart"),
    xScale: d3.scaleLinear().domain([-5, 5]),
    yScale: d3.scaleLinear().domain([-1, 1]),
    height: 150
});

s3.surface.addFunction(x => (1/5)*(Math.cos(5*x-0.5)-Math.cos(5*x+0.5)), 600)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "3px");
s3.append("text").attr("x", 4.5).attr("y", 1);

[{ el: "#bspline0a-chart", k: cscheid.caliper.kernels.bSpline(0) },
 { el: "#bspline0b-chart", k: cscheid.caliper.kernels.bSpline(0) },
 { el: "#bspline1-chart",  k: cscheid.caliper.kernels.bSpline(1) },
 { el: "#bspline2-chart",  k: cscheid.caliper.kernels.bSpline(2) },
 { el: "#bspline3-chart",  k: cscheid.caliper.kernels.bSpline(3) }
].forEach(obj => {
    var f = cscheid.caliper.makeFunction([1], obj.k);
    var s = drawingSurface({
        element: d3.select(obj.el),
        width: 600,
        height: 150,
        xScale: d3.scaleLinear().domain([-2.5, 2.5]),
        yScale: d3.scaleLinear().domain([-0.1, 1])
    });
    s.surface.addFunction(f, 600)
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("stroke-width", "5px");
});
}
