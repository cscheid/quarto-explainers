import * as cscheid from '../../js/cscheid/cscheid.js';
import * as d3 from "https://cdn.skypack.dev/d3@7";
window.d3 = d3;

// ////////////////////////////////////////////////////////////////////////////
/* Linear perceptron algorithm */

function lineFromPlaneEq(v, c)
{
  let alpha = -c / v.dot(v);
  let p0 = v.scale(alpha);
  let t = cscheid.geometry.vec2(v.y, -v.x).scaleMutate(1/v.length());
  return {
    p1: t.scale(-8).add(p0),
    p2: t.scale( 8).add(p0)
  };
}

function perceptron(data, maxEpochs)
{
  // make copy so we can shuffle it around willy-nilly
  data = data.slice();

  let v = cscheid.geometry.vec2(0, 0), c = 0;
  let trace = [];

  function activation(x) {
    return v.dot(x) + c;
  }
  function classify(x) {
    let d = v.dot(x) + c;
    if (d > 0)
      return 1;
    if (d < 0)
      return -1;
    return 0;
  }
  let changed = false;
  do {
    cscheid.random.shuffle(data);
    changed = false;
    for (let i = 0; i < data.length; ++i) {
      let p = data[i];
      if (activation(p.x) * p.y <= 0) {
        v.add(p.x.scale(p.y));
        c += p.y;
        trace.push({
          incorrectPoint: p.x,
          newLine: lineFromPlaneEq(v, c)
        });
        changed = true;
      }
    }
  } while ((--maxEpochs > 0) && changed);
  return {
    model: { v: v, c: c },
    trace: trace
  };
}

function generateRight()
{
  let angle = cscheid.random.uniformReal(-Math.PI/2, Math.PI/2);
  let centerX = Math.cos(angle), centerY = Math.sin(angle);
  let rX = cscheid.random.normalVariate() * 0.1 + centerX;
  let rY = cscheid.random.normalVariate() * 0.1 + centerY;
  return { x: cscheid.geometry.vec2(rX*2, rY*2), y: 1 };
}

function generateLeft()
{
  let rX = cscheid.random.normalVariate() * 0.25 - 1;
  let rY = cscheid.random.normalVariate() * 0.25;
  return { x: cscheid.geometry.vec2(rX*2, rY*2), y: -1 };
}

function generateData()
{
  let result = [];
  for (let i=0; i<100; ++i) {
    result.push(generateLeft());
    result.push(generateRight());
  }
  return result;
}

let data = generateData();
let result = perceptron(data, 10);

let plot = cscheid.plot.create(d3.select("#div-perceptron"), 400, 400);
plot.setXDomain([-4, 4]);
plot.setYDomain([-4, 4]);

let hairlines = plot.addLines([
  {x1: -4, x2: 4, y1: 0, y2: 0},
  {x1: 0, x2: 0, y1: -4, y2: 4}
], {
  x1: function(d) { return d.x1; },
  x2: function(d) { return d.x2; },
  y1: function(d) { return d.y1; },
  y2: function(d) { return d.y2; },
  stroke: function() { return d3.rgb(224, 224, 224); }
});

plot.addPoints(data, {
  x: function(d) { return d.x.x; },
  y: function(d) { return d.x.y; },
  class: function(d) { return d.y; }
});

let line0 = {
  p1: cscheid.geometry.vec2(0,0),
  p2: cscheid.geometry.vec2(0,0)
};
   
let lineSceneObject = plot.addLines([line0], {
  x1: function(d) { return d.p1.x; },
  y1: function(d) { return d.p1.y; },
  x2: function(d) { return d.p2.x; },
  y2: function(d) { return d.p2.y; },
  stroke: function() { return "black"; }
});

let stage = -1;
d3.select("#button-step")
  .append("button")
  .text("Step")
  .on("click", function() {
    if (stage < result.trace.length-1) {
      ++stage;
      let traceV = result.trace[stage];
      line0.p1 = traceV.newLine.p1;
      line0.p2 = traceV.newLine.p2;
      plot.addPoints([traceV.incorrectPoint], {
        x: d => d.x,
        y: d => d.y,
        color: d => "black",
        r: d => 5,
      });
                     
      plot.render(true);
    }
  });


