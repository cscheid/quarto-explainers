import * as d3 from 'https://cdn.skypack.dev/d3';

function getMatrix() {
    var m00 = Number(document.getElementById("m00").value);
    var m01 = Number(document.getElementById("m01").value);
    var m10 = Number(document.getElementById("m01").value);
    var m11 = Number(document.getElementById("m11").value);
    return [m00, m01, m10, m11];
}

//////////////////////////////////////////////////////////////////////////////
// minimal matrix library

function dist(v1, v2) {
    return length(sub(v1, v2));
}

function neg(v) {
    return { x: -v.x, y: -v.y };
}

function sub(v1, v2) {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
}

function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

function add(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}

function scale(v, k) {
    return { x: k * v.x, y : k * v.y };
}

function length(v) {
    return Math.sqrt(dot(v, v));
}

function normalize(v) {
    var l = length(v);
    return { x: v.x / l, y: v.y / l };
}

function mulMat(m1, m2) {
    var [m1_00, m1_01, m1_10, m1_11] = m1;
    var [m2_00, m2_01, m2_10, m2_11] = m2;

    return [ m1_00 * m2_00 + m1_01 * m2_10, m1_00 * m2_01 + m1_01 * m2_11,
             m1_10 * m2_00 + m1_11 * m2_10, m1_10 * m2_01 + m1_11 * m2_11 ];
}

function transform(m, v) {
    var [m00, m01, m10, m11] = m;
    return { x: m00 * v.x + m01 * v.y, y: m10 * v.x + m11 * v.y };
}

function transformMany(m, ps) {
    return ps.map(function(v) {
        return transform(m, v);
    });
}

// returns (I - n . n^T) v = v - n <n, v>
function normalProjection(normal, v) {
    return sub(v, scale(normal, dot(normal, v)));
}

function eigen(m) {
    // this is the power method for computing eigenvectors, in case
    // you're looking at the code.
    
    // assumes matrix is symmetric, because otherwise eigenvector can
    // be complex.

    // by the way, it's a nice exercise in linear algebra and
    // eigenvectors to try to understand why the following code works.
    //
    // It might help you to first assume that the eigenvalues are different
    // from each other.
    //
    // We've seen enough linear algebra in class for you to be able to
    // do it!
    //
    // the expressions for val1 and val2 are non-intuitive, but
    // the procedure to find vec1 is quite easy to understand, and vec2
    // is just a little bit harder.

    function findEigenValue(tv, v) {
        if (Math.abs(tv.x) > Math.abs(tv.y)) {
            return tv.x / v.x;
        } else {
            return tv.y / v.y;
        }
    }
    
    var guess = normalize({ x: Math.random(), y: Math.random() }),
        next = normalize(transform(m, guess));

    while (Math.abs(dot(guess, next)) < (1 - 1e-8)) {
        guess = next;
        next = normalize(transform(m, guess));
    }
    var t = transform(m, guess);
    var val1 = findEigenValue(t, guess), vec1 = guess;

    guess = normalize({ x: Math.random(), y: Math.random() });
    next = normalize(normalProjection(vec1, transform(m, guess)));
    while (Math.abs(dot(guess, next)) < (1 - 1e-8)) {
        guess = next;
        next = normalize(normalProjection(vec1, transform(m, guess)));
    }
    t = transform(m, guess);
    var val2 = findEigenValue(t, guess), vec2 = guess;
    
    return { vals: [val1, val2], vecs: [vec1, vec2] };
}

//////////////////////////////////////////////////////////////////////////////

function makeCirclePoints()
{
    var result = [];
    for (var i=0; i<360; i+=10) {
        var a = i / 180 * Math.PI;
        var x = Math.cos(a), y = Math.sin(a);
        result.push({x: x, y: y});
    }
    return result;
}

function updateState()
{
    var fmt = d3.format(".3n");
    mat = getMatrix();
    eig = eigen(mat);
    eigs = [eig.vecs[0], eig.vecs[1], neg(eig.vecs[0]), neg(eig.vecs[1])];
    matrixNorm = Math.max(Math.abs(eig.vals[0]), Math.abs(eig.vals[1]));
    d3.select("#u00").text(fmt(eig.vecs[0].x));
    d3.select("#u01").text(fmt(eig.vecs[0].y));
    d3.select("#u10").text(fmt(eig.vecs[1].x));
    d3.select("#u11").text(fmt(eig.vecs[1].y));
    d3.select("#l0").text(fmt(eig.vals[0]));
    d3.select("#l1").text(fmt(eig.vals[1]));
    x.domain([-1.05*matrixNorm, 1.05*matrixNorm]);
    y.domain([-1.05*matrixNorm, 1.05*matrixNorm]);
    d3.select("#m10").text(String(mat[2]));
}

var svg = d3.select("#matrix-operation")
        .append("svg")
        .attr("width", 500)
        .attr("height", 500);

var mat, eig, matrixNorm, eigs;
var x = d3.scaleLinear().range([10, 490]).nice();
var y = d3.scaleLinear().range([490, 10]).nice();

updateState();

var points = makeCirclePoints();

var guidelinesColor = d3.lab(60, 0, 0);

function createLines(sel, data)
{
    return sel.selectAll("line")
        .data(data)
        .enter()
        .append("line");
}

function createCircles(sel, data)
{
    return sel.selectAll("circle")
        .data(data)
        .enter()
        .append("circle");
}

function setLines(sel, data, withTransition)
{
    var t = sel.data(data);
    if (withTransition)
        t = sel.transition();
    return t.attr("x1", function(p) { return x(p.x); })
        .attr("y1", function(p) { return y(p.y); })
        .attr("x2", function(p) { return x(transform(mat, p).x); })
        .attr("y2", function(p) { return y(transform(mat, p).y); });
}

function setCircles(sel, data, withTransition)
{
    var t = sel.data(data);
    if (withTransition)
        t = t.transition();
    return t.attr("cx", function(p) { return x(p.x); })
        .attr("cy", function(p) { return y(p.y); });
}

var pointLines = setLines(createLines(svg.append("g"), points), points)
        .attr("stroke", guidelinesColor);
var eigLines = setLines(createLines(svg.append("g"), eigs), eigs)
        .attr("stroke", guidelinesColor);

var xAxis = d3.axisBottom(x).ticks(5);
var yAxis = d3.axisLeft(y).ticks(5);
var xAxisG = svg.append("g").attr("transform", "translate(0, 250)");
var yAxisG = svg.append("g").attr("transform", "translate(250, 0)");

xAxisG.call(xAxis);
yAxisG.call(yAxis);

var pointCircles = setCircles(createCircles(svg.append("g"), points), points)
    .attr("r", 3).attr("fill", "black");
var eigCircles = setCircles(createCircles(svg.append("g"), eigs), eigs)
    .attr("r", 5).attr("fill", "red");

function transformCircles()
{
    svg.selectAll("circle")
        .transition()
        .duration(1500)
        .attr("cx", function(p) { return x(transform(mat, p).x); })
        .attr("cy", function(p) { return y(transform(mat, p).y); })
        .transition()
        .delay(500)
        .duration(500)
        .attr("cx", function(p) { return x(p.x); })
        .attr("cy", function(p) { return y(p.y); });
}

function transformByEigen()
{
    var ut = [ eig.vecs[0].x, eig.vecs[0].y, eig.vecs[1].x, eig.vecs[1].y ];
    var E  = [ eig.vals[0],   0,              0,           eig.vals[1]];
    var u  = [ eig.vecs[0].x, eig.vecs[1].x, eig.vecs[0].y, eig.vecs[1].y ];
    var Eut = mulMat(E, ut);
    
    svg.selectAll("circle")
        .transition()
        .duration(1500)
        .attr("cx", function(p) { return x(transform(ut, p).x); })
        .attr("cy", function(p) { return y(transform(ut, p).y); })
        .transition()
        .duration(1500)
        .delay(1000)
        .attr("cx", function(p) { return x(transform(Eut, p).x); })
        .attr("cy", function(p) { return y(transform(Eut, p).y); })
        .transition()
        .duration(1500)
        .delay(1000)
        .attr("cx", function(p) { return x(transform(mat, p).x); })
        .attr("cy", function(p) { return y(transform(mat, p).y); })
        .transition()
        .duration(500)
        .delay(1000)
        .attr("cx", function(p) { return x(p.x); })
        .attr("cy", function(p) { return y(p.y); });
}

d3.select("#transform").style("position", "absolute")
    .append("button").text("Transform").on("click", transformCircles);
d3.select("#transform").append("span").text(" ");
d3.select("#transform").style("position", "absolute")
    .append("button").text("via U Σ U^T").on("click", transformByEigen);

d3.selectAll("input").on("change", function() {
    updateState();
    
    setLines  (pointLines,   points);
    setLines  (eigLines,     eigs);
    setCircles(pointCircles, points);
    setCircles(eigCircles,   eigs);
    
    xAxisG.transition().call(xAxis);
    yAxisG.transition().call(yAxis);
});
