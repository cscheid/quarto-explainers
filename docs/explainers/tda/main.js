import * as cscheid from "/js/cscheid/cscheid.js";
import * as d3 from "https://cdn.skypack.dev/d3@7";
window.d3 = d3;

var s = cscheid.plot.surface({
    element: d3.select("#div-ph"),
    width: 400,
    height: 400,
    margin: 2,
    xScale: d3.scaleLinear().domain([0, 1]),
    yScale: d3.scaleLinear().domain([0, 1]),
    axes: false
});

var pts = [];
d3.range(30).forEach(d => {
    var angle = Math.PI * 2 / 30 * d + Math.random() * 0.2;
    pts.push({x: 0.3 + Math.cos(angle) * 0.2 + Math.random() * 0.05,
              y: 0.3 + Math.sin(angle) * 0.2 + Math.random() * 0.05});

    angle = Math.PI * 2 / 30 * d + Math.random() * 0.2;
    pts.push({x: 0.7 + Math.cos(angle) * 0.2 + Math.random() * 0.05,
              y: 0.3 + Math.sin(angle) * 0.2 + Math.random() * 0.05});

    angle = Math.PI * 2 / 30 * d + Math.random() * 0.2;
    pts.push({x: 0.3 + Math.cos(angle) * 0.2 + Math.random() * 0.05,
              y: 0.7 + Math.sin(angle) * 0.2 + Math.random() * 0.05});
});

var result = Delaunay.triangulate(pts.map(d => [d.x, d.y]));

var lines = [];
for (var i=0; i<result.length/3; ++i) {
    lines.push({p0: result[3*i+0], p1: result[3*i+1]});
    lines.push({p0: result[3*i+1], p1: result[3*i+2]});
    lines.push({p0: result[3*i+2], p1: result[3*i+0]});
}
s.append("g")
    .selectAll("line")
    .data(lines)
    .enter()
    .append("line")
    .attr("x1", d => pts[d.p0].x)
    .attr("y1", d => pts[d.p0].y)
    .attr("x2", d => pts[d.p1].x)
    .attr("y2", d => pts[d.p1].y)
    .attr("stroke", d3.lab(90,0,0));


s.append("g")
    .selectAll("circle")
    .data(pts)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r" , 3)
    .attr("fill", "white")
    .attr("stroke", "black");
