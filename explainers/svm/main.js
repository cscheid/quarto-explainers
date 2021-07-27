import * as cscheid  from "/js/cscheid/cscheid.js";
import { distributions as ds } from "/js/cscheid/cscheid/random.js";

import * as d3 from "https://cdn.skypack.dev/d3@7";
window.d3 = d3;

//////////////////////////////////////////////////////////////////////////////

function createSvmClassificationSurface(model)
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
      let v = model.classify([x, y, 1, x * x, x * y, y * y]);
      samples.push(v);
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
  let c1 = ds.gaussian2D([  0,   0], [  1,   1]);
  let c1l = ds.transform(c1, d => {
    let n = cscheid.linalg.norm2(d);
    let l = n < 1 ? -1 : 1;
    if (Math.random() < 0.1)
      l = -l;
    
    if (l === 1) {
      cscheid.blas.axby(1, d, 0.5 / Math.sqrt(n, n), d);
    }
    
    return { x: new Float64Array([d[0], d[1], 1, d[0]*d[0], d[0]*d[1], d[1]*d[1]]), y: l };
  });

  var points = [];
  for (var i=0; i<200; ++i) {
    points.push(c1l());
  }

  return points;
}

//////////////////////////////////////////////////////////////////////////////

var size = 800, margin = 20;
var plot = cscheid.plot.create(d3.select("#svm-surface"), size, size);

plot.addClipPath()
  .attr("id", "myClip")
  .append("rect")
  .attr("width", size - 2 * margin)
  .attr("height", size - 2 * margin)
  .attr("x", margin)
  .attr("y", margin);

let data = generateData();
let svmModel = cscheid.classify.svmTrain(data, 0.1, 0.000005);
let surface = createSvmClassificationSurface(svmModel);
surface.contourValues = [-1, 0, 1];

data.forEach(d => {
  d.isSupport = svmModel.isSupport(d);
});

plot.setXDomain([-4, 4]);
plot.setYDomain([-4, 4]);
let contourObject = plot.addContours(surface, {
  stroke: d => {
    if (d.value == -1) {
      return "orange";
    } else if (d.value === 1) {
      return "steelblue";
    } else {
      return "gray";
    }
  },
  fill: d => "none",
  "stroke-width": d => 2,
  "stroke-dasharray": d => {
    if (d.value === 0) {
      return "4 4";
    } else {
      return null;
    }
  }
});
contourObject.group.selectAll("*")
  .attr("clip-path", "url(#myClip)");

let points = plot.addPoints(data, {
  x: d => d.x[0],
  y: d => d.x[1],
  color: d => d.y === -1 ? "orange" : "steelblue",
  r: d => d.isSupport ? 3 : 2,
  custom: sel => sel.style("fill-opacity", d => d.isSupport ? 1: 0.5)
});

function updateSvm()
{
  let newValue = Number(d3.select("#svm-lambda").text());
  var newSvmModel = cscheid.classify.svmTrain(data, newValue, 0.000005);
  var newSurface = createSvmClassificationSurface(newSvmModel);
  console.log(newSurface.scalarField);
  console.log(surface.scalarField);
  surface.scalarField = newSurface.scalarField;
  
  data.forEach(d => {
    d.isSupport = newSvmModel.isSupport(d);
  });
  points.update();
  contourObject.update();
  return true;
}

function setEventHandlers()
{
  d3.select("#svm-lambda")
    .on("input", function() {
      // this.innerText = this.textContent;
      var newValue = Number(this.innerText);
      if (isNaN(newValue) || newValue <= 0) {
        return false;
      }
      updateSvm();
      // var newSvmModel = cscheid.classify.svmTrain(data, newValue, 0.000005);
      // var newSurface = createSvmClassificationSurface(newSvmModel);
      // console.log(newSurface.scalarField);
      // console.log(surface.scalarField);
      // surface.scalarField = newSurface.scalarField;
      
      // data.forEach(d => {
      //   d.isSupport = newSvmModel.isSupport(d);
      // });
      // points.update();
      // contourObject.update();
      return true;
    });

  d3.select("#svm-increase-lambda")
    .on("click", function() {
      var newValue = Number(d3.select("#svm-lambda").text()) * 10;
      d3.select("#svm-lambda").text(newValue);
      updateSvm();
    });

  d3.select("#svm-decrease-lambda")
    .on("click", function() {
      var newValue = Number(d3.select("#svm-lambda").text()) / 10;
      d3.select("#svm-lambda").text(newValue);
      updateSvm();
    });
}
setEventHandlers();
