import * as d3 from "https://cdn.skypack.dev/d3@7";
window.d3 = d3; // ... yeah

import * as cscheid  from "/js/cscheid/cscheid.js";
import { distributions as ds } from "/js/cscheid/cscheid/random.js";

function createkNNClassificationSurface(tree, points, k)
{
  var nSamples = 50;
  var xScale = d3.scaleLinear().domain([0,nSamples]).range([-4, 4]);
  var yScale = d3.scaleLinear().domain([0,nSamples]).range([-4, 4]);

  var sampleLocations = d3.range(0,nSamples+1);
  var samples = [];

  sampleLocations.forEach(y => {
    y = yScale(y);
    sampleLocations.forEach(x => {
      x = xScale(x);
      let nns = cscheid.classify.nearestNeighbors2D(tree, {point: [x, y]}, k);
      var kNNEstimate = cscheid.classify.classifyFromNNs(nns);
      samples.push(points[kNNEstimate].label);
    });
  });

  return {
    scalarField: samples,
    dims: [nSamples+1, nSamples+1]
  };
}

//////////////////////////////////////////////////////////////////////////////

function generateData()
{
  var c1 = ds.gaussian2D([  -2,   -2], [  1,   1]);
  var c2 = ds.gaussian2D([   2,    2], [  1,   1]);
  var c3 = ds.gaussian2D([ 0.5,  0.5], [0.2, 0.2]);
  var c4 = ds.gaussian2D([-0.5, -0.5], [0.2, 0.2]);
  var c1l = ds.transform(c1, d => { return { point: d, label: 1 }; });
  var c2l = ds.transform(c2, d => { return { point: d, label: 0 }; });
  var c3l = ds.transform(c3, d => { return { point: d, label: 1 }; });
  var c4l = ds.transform(c4, d => { return { point: d, label: 0 }; });

  var mixture = ds.mixture([c1l, c2l, c3l, c4l], [1, 1, 0.1, 0.1]);
  var points = [];
  
  for (var i=0; i<500; ++i) {
    points.push(mixture());
  }
  points.forEach((p, i) => { p.i = i; });
  return points;
}

var points = generateData();
var quadtree = d3.quadtree()
    .x(d => d.point[0])
    .y(d => d.point[1])
    .addAll(points);
var sampleSurface = createkNNClassificationSurface(quadtree, points, 30);

sampleSurface.contourValues = [0, 0.5];

var plot = cscheid.plot.create(d3.select("#knn-surface"), 400, 400);

plot.setXDomain([-4, 4]);
plot.setYDomain([-4, 4]);
var contourObject = plot.addContours(sampleSurface, {
  stroke: d => "white",
  fill: d => {
    var label = d.value === 0.5 ? 1 : 0;
    var c = d3.color(plot.classColorScale(label));
    return d3.scaleLinear().range([c, "white"])(0.75);
  }});

plot.addPoints(points, { x: d => d.point[0], y: d => d.point[1], class: d => d.label });

window.updatePlot = function(newValue) {
  var newSampleSurface = createkNNClassificationSurface(quadtree, points, newValue);
  sampleSurface.scalarField = newSampleSurface.scalarField;
  contourObject.update();
  return true;
};

