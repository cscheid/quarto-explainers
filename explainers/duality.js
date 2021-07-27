import * as cscheid from "/js/cscheid/cscheid.js";

export function main()
{

var svg = d3.select("#div-duality")
    .append("svg")
    .attr("width", 500).attr("height", 500);

//////////////////////////////////////////////////////////////////////////////

function updateCursor(e) {
    cursorLine.p2.x = e.offsetX;
    cursorLine.p2.y = e.offsetY;
    updateHyperPlaneDrawing();
}

var bg = svg.append("rect")
        .attr("width", 500).attr("height", 500)
        .attr("fill", "rgba(0,0,0,0.1)")
        .on("mousemove", updateCursor);

var centerX = 250, centerY = 250,
    radiusX = 200, radiusY = 80,
    rotate = 45;

var ellipseG = svg.append("g")
        .attr("transform",
              cscheid.svg.translate(centerX, centerY) +
              cscheid.svg.rotate(rotate));

var ellipseSVG = ellipseG.append("ellipse")
        .attr("cx", 0).attr("cy", 0)
        .attr("rx", radiusX).attr("ry", radiusY)
        .attr("fill", "white").attr("stroke", "black").attr("stroke-width", 2)
        .on("mousemove", updateCursor);

var G = cscheid.geometry;
var M = cscheid.math;

var ellipse = G.ellipse()
        .transform(G.Transform.prototype.scale(radiusX, radiusY))
        .transform(G.Transform.prototype.rotate(M.radians(rotate)))
        .transform(G.Transform.prototype.translate(centerX, centerY))
;

//////////////////////////////////////////////////////////////////////////////

function updateHyperPlaneDrawing() {
    setTangentLine();
    setDualTangentLine();
    tangentAtCursor.call(lineD);
    tangentAtEllipse.call(lineD);
    pointToCursor.call(lineD);
}

function updateClosestPointDrawing() {
    debugGroup.selectAll("*").remove();
    cscheid.debug.clear();
    setLineToClosestPoint();
    cscheid.debug.appendToD3(debugGroup);
    lineToClosestPointSVG.call(lineD);
}

var drag = d3.drag()
    .on("drag", function(e, d, i) {
      d.x += e.dx;
      d.y += e.dy;
      d3.select(this).attr("transform", cscheid.svg.translateVec);
      updateClosestPointDrawing();
      updateHyperPlaneDrawing();
    });

var cursorLine = { p1: G.vec2(50, 400), p2: G.vec2(0, 0) };
var tangentLine = { p1: G.vec2(0,0), p2: G.vec2(0,0) };
var dualTangentLine = { p1: G.vec2(0,0), p2: G.vec2(0,0) };
var lineToClosestPoint = { p1: cursorLine.p1, p2: G.vec2(0, 0) };

function setTangentLine() {
    var p1 = cursorLine.p1, p2 = cursorLine.p2;
    var d = p2.minus(p1).unit();
    var tangent = G.vec2(d.y, -d.x).scale(500);
    tangentLine.p1.set(p2.minus(tangent));
    tangentLine.p2.set(p2.plus(tangent));
}

function setDualTangentLine() {
    var p1 = cursorLine.p1, p2 = cursorLine.p2;
    var n = p1.minus(p2).unit();
    var p = ellipse.tangentPointWithNormal(n);
    var tangent = G.vec2(n.y, -n.x).scale(500);
    dualTangentLine.p1.set(p.minus(tangent));
    dualTangentLine.p2.set(p.plus(tangent));
}

function setLineToClosestPoint() {
    var closest = ellipse.closestPoint(lineToClosestPoint.p1);
    lineToClosestPoint.p2.set(closest);
}

function lineD(sel) {
  sel.attr("x1", d => d.p1.x)
    .attr("x2", d => d.p2.x)
    .attr("y1", d => d.p1.y)
    .attr("y2", d => d.p2.y);
}

var pointToCursor = svg.append("line")
    .datum(cursorLine)
    .attr("stroke", "gray")
    .attr("fill", "none")
    .attr("stroke-dasharray", "2 2")
    .call(lineD);

var tangentAtCursor = svg.append("line")
    .datum(tangentLine)
    .attr("stroke", "gray")
    .attr("stroke-dasharray", "2 2")
    .call(lineD);

var tangentAtEllipse = svg.append("line")
    .datum(dualTangentLine)
    .attr("stroke", "red")
    .attr("stroke-dasharray", "2 2")
    .call(lineD);

var lineToClosestPointSVG = svg.append("line")
    .datum(lineToClosestPoint)
    .attr("stroke", "blue")
    .attr("fill", "none")
    .attr("stroke-dasharray", "2 2")
    .call(lineD);

var point = svg.append("circle")
    .datum(cursorLine.p1)
    .attr("r", 5)
    .attr("transform", cscheid.svg.translateVec)
    .attr("cursor", "pointer")
    .call(drag);

var debugGroup = svg.append("g");

updateClosestPointDrawing();
updateHyperPlaneDrawing();

}
