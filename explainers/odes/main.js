import * as cscheid from "/js/cscheid/cscheid.js";

var drawingSurface = cscheid.plot.surface;

//////////////////////////////////////////////////////////////////////////////

function eulerIntegration(vfX, vfY, x0, y0, h, n) {
    var result = [];
    var px = x0, py = y0, t = 0;
    for (var i=0; i<n; ++i) {
        result.push({x: px, y: py, t: t});
        var vx = vfX(px, py);
        var vy = vfY(px, py);
        px += h * vx;
        py += h * vy;
        t += h;
    }
    return result;
}

function eulerIntegrationAdaptiveError(vfX, vfY, x0, y0, h0, T, n) {
    var result = [];
    var px = x0, py = y0, t = 0, h = h0;
    var M = 2, m = 1/2, S = 0.9; // Butcher, ch2, pp. 60-61
    var oldVx, oldVy;
    for (var i=0; i<n; ++i) {
        result.push({x: px, y: py, t: t});
        var vx = vfX(px, py);
        var vy = vfY(px, py);
        px += h * vx;
        py += h * vy;
        t += h;
        // step-size control
        if (oldVx !== undefined) {
            var dx = vx - oldVx, dy = vy - oldVy;
            var e = h * Math.sqrt(dx * dx + dy * dy) / 2;
            var scaleFactor = Math.max(m, Math.min(Math.sqrt(T/e), M)*S);
            oldVx = vx;
            oldVy = vy;
            h *= scaleFactor;
        }
        oldVx = vx;
        oldVy = vy;
    }
    return result;
}

function eulerPredictorCorrector(vfX, vfY, x0, y0, h0, T, n) {
    var result = [];
    var px = x0, py = y0, t = 0, h = h0;
    var M = 2, m = 1/2, S = 0.9; // Butcher, ch2, pp. 60-61
    var oldVx, oldVy;
    for (var i=0; i<n; ++i) {
        result.push({x: px, y: py, t: t});
        var vx = vfX(px, py);
        var vy = vfY(px, py);
        var vx2 = vfX(px + h * vx, py + h * vy);
        var vy2 = vfY(px + h * vx, py + h * vy);
        px += h * (vx + vx2)/2;
        py += h * (vy + vy2)/2;
        t += h;
        // step-size control
        if (oldVx !== undefined) {
            var dx = vx - oldVx, dy = vy - oldVy;
            var e = h * Math.sqrt(dx * dx + dy * dy) / 2;
            var scaleFactor = Math.max(m, Math.min(Math.sqrt(T/e), M)*S);
            oldVx = vx;
            oldVy = vy;
            h *= scaleFactor;
        }
        oldVx = vx;
        oldVy = vy;
    }
    return result;
}

function eulerPredictorCorrectorBad(vfX, vfY, x0, y0, h0, T, n) {
    var result = [];
    var px = x0, py = y0, t = 0, h = h0;
    var M = 2, m = 1/2, S = 0.9; // Butcher, ch2, pp. 60-61
    var oldVx, oldVy;
    for (var i=0; i<n; ++i) {
        result.push({x: px, y: py, t: t});
        var vx = vfX(px, py);
        var vy = vfY(px, py);
        var vx2 = vfX(px + h * vx, py + h * vy);
        var vy2 = vfY(px + h * vx, py + h * vy);
        px += h * vx2/2;
        py += h * vy2/2;
        t += h;
        // step-size control
        if (oldVx !== undefined) {
            var dx = vx - oldVx, dy = vy - oldVy;
            var e = h * Math.sqrt(dx * dx + dy * dy) / 2;
            var scaleFactor = Math.max(m, Math.min(Math.sqrt(T/e), M)*S);
            oldVx = vx;
            oldVy = vy;
            h *= scaleFactor;
        }
        oldVx = vx;
        oldVy = vy;
    }
    return result;
}

//////////////////////////////////////////////////////////////////////////////

function drawJitteredGlyphs(boundsX, boundsY, vfX, vfY, density, sel) {
    var vx = vfX, vy = vfY;
    density = density || 30;
    var samples = [];
    var xScale = d3.scaleLinear().domain([0, density]).range(boundsX);
    var yScale = d3.scaleLinear().domain([0, density]).range(boundsY);
    for (var i=0; i<density; ++i) {
        for (var j=0; j<density; ++j) {
            samples.push({ x: xScale(i+Math.random()), y: yScale(j+Math.random()) });
        }
    }
    // shaft
    sel.append("g").selectAll("line").data(samples).enter().append("line")
        .attr("x1", d => d.x)
        .attr("y1", d => d.y)
        .attr("x2", d => d.x + vx(d.x, d.y))
        .attr("y2", d => d.y + vy(d.x, d.y));

    // arrowhead 1
    sel.append("g").selectAll("line").data(samples).enter().append("line")
        .attr("x1", d => d.x + vx(d.x, d.y))
        .attr("y1", d => d.y + vy(d.x, d.y))
        .attr("x2", d => {
            var dx = vx(d.x, d.y), dy = vy(d.x, d.y);
            var px = -dy, py = dx;
            return d.x + 3 * dx / 4 - px / 6;
        })
        .attr("y2", d => {
            var dx = vx(d.x, d.y), dy = vy(d.x, d.y);
            var px = -dy, py = dx;
            return d.y + 3 * dy / 4 - py / 6;
        });

    // arrowhead 2
    sel.append("g").selectAll("line").data(samples).enter().append("line")
        .attr("x1", d => d.x + vx(d.x, d.y))
        .attr("y1", d => d.y + vy(d.x, d.y))
        .attr("x2", d => {
            var dx = vx(d.x, d.y), dy = vy(d.x, d.y);
            var px = -dy, py = dx;
            return d.x + 3 * dx / 4 + px / 6;
        })
        .attr("y2", d => {
            var dx = vx(d.x, d.y), dy = vy(d.x, d.y);
            var px = -dy, py = dx;
            return d.y + 3 * dy / 4 + py / 6;
        });
    
    return sel;
}

function addInteractiveEulerCurve(opts) {
    var vx = opts.vx, vy = opts.vy;
    var x0 = opts.x0, y0 = opts.y0;
    var sel = opts.sel;
    var eulerG = sel.append("g");
    var eulerCurveG = eulerG.append("g");
    var h = opts.h || 0.5;
    var n = opts.n || 100;
    function addEulerODE() {
        eulerCurveG
            .selectAll("circle")
            .data(eulerIntegration(vx, vy, x0, y0, h, n))
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", "red")
            .attr("r", 2);
    }
    var eulerCircleHandle = eulerG.append("g")
            .append("circle")
            .attr("r", 5)
            .attr("fill", "black")
            .style("cursor", "pointer");
    function updateCircleHandle(x, y) {
        eulerCircleHandle
            .attr("cx", x)
            .attr("cy", y);
    }
    function reset() {
        eulerCurveG.selectAll("circle").remove();
        updateCircleHandle(x0, y0);
        addEulerODE();
    }
    reset();
    eulerCircleHandle
        .call(d3.drag()
              .on("drag", () => {
                  x0 = sel.surface.xScale.invert(d3.event.x);
                  y0 = sel.surface.yScale.invert(d3.event.y);
                  reset();
              }));

    return {
        setN: function(n_) {
            n = n_;
            reset();
        },
        setH: function(h_) {
            h = h_;
            reset();
        }
    };
}

function addInteractiveAdaptiveEulerCurve(opts) {
    var vx = opts.vx, vy = opts.vy;
    var x0 = opts.x0, y0 = opts.y0;
    var T = opts.T;
    var sel = opts.sel;
    var eulerG = sel.append("g");
    var eulerCurveG = eulerG.append("g");
    var h = opts.h || 0.5;
    var n = opts.n || 100;
    function addEulerODE() {
        eulerCurveG
            .selectAll("circle")
            .data(eulerIntegrationAdaptiveError(vx, vy, x0, y0, h, T, n))
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", "red")
            .attr("r", 2);
    }
    var eulerCircleHandle = eulerG.append("g")
            .append("circle")
            .attr("r", 5)
            .attr("fill", "black")
            .style("cursor", "pointer");
    function updateCircleHandle(x, y) {
        eulerCircleHandle
            .attr("cx", x)
            .attr("cy", y);
    }
    function reset() {
        eulerCurveG.selectAll("circle").remove();
        updateCircleHandle(x0, y0);
        addEulerODE();
    }
    reset();
    eulerCircleHandle
        .call(d3.drag()
              .on("drag", () => {
                  x0 = sel.surface.xScale.invert(d3.event.x);
                  y0 = sel.surface.yScale.invert(d3.event.y);
                  reset();
              }));

    return {
        setN: function(n_) {
            n = n_;
            reset();
        },
        setT: function(t_) {
            T = t_;
            reset();
        }
    };
}

function addInteractiveEulerPredictorCorrectorCurve(opts) {
    var vx = opts.vx, vy = opts.vy;
    var x0 = opts.x0, y0 = opts.y0;
    var T = opts.T;
    var sel = opts.sel;
    var eulerG = sel.append("g");
    var eulerCurveG = eulerG.append("g");
    var h = opts.h || 0.5;
    var n = opts.n || 100;
    function addEulerODE() {
        eulerCurveG
            .selectAll("circle")
            .data(eulerPredictorCorrector(vx, vy, x0, y0, h, T, n))
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", "red")
            .attr("r", 2);
    }
    var eulerCircleHandle = eulerG.append("g")
            .append("circle")
            .attr("r", 5)
            .attr("fill", "black")
            .style("cursor", "pointer");
    function updateCircleHandle(x, y) {
        eulerCircleHandle
            .attr("cx", x)
            .attr("cy", y);
    }
    function reset() {
        eulerCurveG.selectAll("circle").remove();
        updateCircleHandle(x0, y0);
        addEulerODE();
    }
    reset();
    eulerCircleHandle
        .call(d3.drag()
              .on("drag", () => {
                  x0 = sel.surface.xScale.invert(d3.event.x);
                  y0 = sel.surface.yScale.invert(d3.event.y);
                  reset();
              }));

    return {
        setN: function(n_) {
            n = n_;
            reset();
        },
        setT: function(t_) {
            T = t_;
            reset();
        }
    };
}

function addInteractiveEulerPredictorCorrectorBadCurve(opts) {
    var vx = opts.vx, vy = opts.vy;
    var x0 = opts.x0, y0 = opts.y0;
    var T = opts.T;
    var sel = opts.sel;
    var eulerG = sel.append("g");
    var eulerCurveG = eulerG.append("g");
    var h = opts.h || 0.5;
    var n = opts.n || 100;
    function addEulerODE() {
        eulerCurveG
            .selectAll("circle")
            .data(eulerPredictorCorrectorBad(vx, vy, x0, y0, h, T, n))
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", "red")
            .attr("r", 2);
    }
    var eulerCircleHandle = eulerG.append("g")
            .append("circle")
            .attr("r", 5)
            .attr("fill", "black")
            .style("cursor", "pointer");
    function updateCircleHandle(x, y) {
        eulerCircleHandle
            .attr("cx", x)
            .attr("cy", y);
    }
    function reset() {
        eulerCurveG.selectAll("circle").remove();
        updateCircleHandle(x0, y0);
        addEulerODE();
    }
    reset();
    eulerCircleHandle
        .call(d3.drag()
              .on("drag", () => {
                  x0 = sel.surface.xScale.invert(d3.event.x);
                  y0 = sel.surface.yScale.invert(d3.event.y);
                  reset();
              }));

    return {
        setN: function(n_) {
            n = n_;
            reset();
        },
        setT: function(t_) {
            T = t_;
            reset();
        }
    };
}

//////////////////////////////////////////////////////////////////////////////

function vx(x, y) {
    return Math.cos(x + 2 * y)/5;
}
function vy(x, y) {
    return Math.sin(x - 2 * y)/5;
}

var vf1 = drawingSurface({
    element: d3.select("#vf1"),
    xScale: d3.scaleLinear().domain([-2.5, 2.5]),
    yScale: d3.scaleLinear().domain([-2.5, 2.5]),
    width: 400,
    height: 400
});

drawJitteredGlyphs([-2.5, 2.5], [-2.5, 2.5],
                   vx, vy, 30, vf1.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,40))
    .attr("stroke-width", "1px");

//////////////////////////////////////////////////////////////////////////////

var vf2 = drawingSurface({
    element: d3.select("#vf2"),
    xScale: d3.scaleLinear().domain([-2.5, 2.5]),
    yScale: d3.scaleLinear().domain([-2.5, 2.5]),
    width: 400,
    height: 400
});

drawJitteredGlyphs([-2.5, 2.5], [-2.5, 2.5],
                   vx, vy, 30, vf2.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,60))
    .attr("stroke-width", "1px");

addInteractiveEulerCurve({
    sel: vf2, x0: -1.75, y0: 0.75,
    vx: vx, vy: vy
});

//////////////////////////////////////////////////////////////////////////////

function circleX(x, y) { return -y/8; }
function circleY(x, y) { return x/8; }
var vf3 = drawingSurface({
    element: d3.select("#vf3"),
    xScale: d3.scaleLinear().domain([-2.5, 2.5]),
    yScale: d3.scaleLinear().domain([-2.5, 2.5]),
    width: 400,
    height: 400
});

drawJitteredGlyphs([-2.5, 2.5], [-2.5, 2.5],
                   circleX, circleY, 20, vf3.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,70))
    .attr("stroke-width", "1px");

addInteractiveEulerCurve({
    sel: vf3, x0: -0.8, y0: 0.5,
    vx: circleX, vy: circleY,
    h: 1
});

//////////////////////////////////////////////////////////////////////////////

function lvx(x, y) { return x * (2 - y) / 10; }
function lvy(x, y) { return y * (x - 1) / 10; }

var vf4 = drawingSurface({
    element: d3.select("#vf4"),
    xScale: d3.scaleLinear().domain([0, 6]),
    yScale: d3.scaleLinear().domain([0, 6]),
    width: 400,
    height: 400,
    margin: 25
});

drawJitteredGlyphs([0, 6], [0, 6],
                   lvx, lvy, 20, vf4.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,70))
    .attr("stroke-width", "1px");

addInteractiveEulerCurve({
    sel: vf4, x0: 2, y0: 3,
    vx: lvx, vy: lvy,
    h: 1,
    n: 200
});

//////////////////////////////////////////////////////////////////////////////

var vf5 = drawingSurface({
    element: d3.select("#vf5"),
    xScale: d3.scaleLinear().domain([0, 6]),
    yScale: d3.scaleLinear().domain([0, 6]),
    width: 400,
    height: 400,
    margin: 25
});

drawJitteredGlyphs([0, 6], [0, 6],
                   lvx, lvy, 20, vf5.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,70))
    .attr("stroke-width", "1px");

addInteractiveAdaptiveEulerCurve({
    sel: vf5, x0: 2, y0: 3,
    vx: lvx, vy: lvy,
    h: 1,
    T: 0.005,
    n: 200
});

//////////////////////////////////////////////////////////////////////////////

var vf6 = drawingSurface({
    element: d3.select("#vf6"),
    xScale: d3.scaleLinear().domain([0, 6]),
    yScale: d3.scaleLinear().domain([0, 6]),
    width: 250,
    height: 250,
    margin: 25
});

drawJitteredGlyphs([0, 6], [0, 6],
                   lvx, lvy, 15, vf6.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,70))
    .attr("stroke-width", "1px");

addInteractiveEulerPredictorCorrectorCurve({
    sel: vf6, x0: 2, y0: 3,
    vx: lvx, vy: lvy,
    h: 1,
    T: 0.01,
    n: 200
});

var vf7 = drawingSurface({
    element: d3.select("#vf7"),
    xScale: d3.scaleLinear().domain([-1, 1]),
    yScale: d3.scaleLinear().domain([-1, 1]),
    width: 250,
    height: 250,
    margin: 25
});

drawJitteredGlyphs([-1, 1], [-1, 1],
                   circleX, circleY, 15, vf7.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,70))
    .attr("stroke-width", "1px");

addInteractiveEulerPredictorCorrectorCurve({
    sel: vf7, x0: 0.9, y0: 0,
    vx: circleX, vy: circleY,
    h: 1,
    T: 0.005,
    n: 200
});

var vf8 = drawingSurface({
    element: d3.select("#vf8"),
    xScale: d3.scaleLinear().domain([0, 6]),
    yScale: d3.scaleLinear().domain([0, 6]),
    width: 250,
    height: 250,
    margin: 25
});

drawJitteredGlyphs([0, 6], [0, 6],
                   lvx, lvy, 15, vf8.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,70))
    .attr("stroke-width", "1px");

addInteractiveEulerPredictorCorrectorBadCurve({
    sel: vf8, x0: 2, y0: 3,
    vx: lvx, vy: lvy,
    h: 1,
    T: 0.01,
    n: 200
});

var vf9 = drawingSurface({
    element: d3.select("#vf9"),
    xScale: d3.scaleLinear().domain([-1, 1]),
    yScale: d3.scaleLinear().domain([-1, 1]),
    width: 250,
    height: 250,
    margin: 25
});

drawJitteredGlyphs([-1, 1], [-1, 1],
                   circleX, circleY, 15, vf9.append("g"))
    .selectAll("line")
    .attr("fill", "none")
    .attr("stroke", d3.hcl(0,0,70))
    .attr("stroke-width", "1px");

addInteractiveEulerPredictorCorrectorBadCurve({
    sel: vf9, x0: 0.9, y0: 0,
    vx: circleX, vy: circleY,
    h: 1,
    T: 0.005,
    n: 200
});
