import * as cscheid from "/js/cscheid/cscheid.js";

export function main()
{

//////////////////////////////////////////////////////////////////////////////
// sets up canvas

var canvasSel = cscheid.dom.makeCenteredElement(
  d3.select("#emd-mnist-canvas"),
  "canvas")
    .attr("width", 280)
    .attr("height", 280);

var ctx = cscheid.dom.setupCanvas(canvasSel.node());
ctx.scale(10, 10);

//////////////////////////////////////////////////////////////////////////////

function bitmapFromDistribution(d)
{
  let mx = Math.max.apply(null, d);
  let clamped = new Uint8ClampedArray(d.length * 4);
  
  for (let i = 0; i < d.length; ++i) {
    let v = ~~((d[i] / mx) * 255);
    clamped[4 * i] = 255-v;
    clamped[4 * i + 1] = 255-v;
    clamped[4 * i + 2] = 255-v;
    clamped[4 * i + 3] = 255; 
  }
  
  return createImageBitmap(new ImageData(clamped, 28, 28));
}

function bitmapFromPoint(point)
{
  let clamped = new Uint8ClampedArray(point.data.length * 4);
  for (let i = 0; i < point.data.length; ++i) {
    clamped[4 * i] = 255-point.data[i];
    clamped[4 * i + 1] = 255-point.data[i];
    clamped[4 * i + 2] = 255-point.data[i];
    clamped[4 * i + 3] = 255; // alpha = 255
  }
  
  return createImageBitmap(new ImageData(clamped, 28, 28));
}

let mnist;
let pointsByLabel = [];
let currentDistribution;
let nextDistribution;

cscheid.datasets.loadMnist("../data/datasets/mnist")
  .then(mnistLocal => {
    mnist = mnistLocal;

    for (let i = 0; i < 10; ++i) {
      pointsByLabel.push([]);
    }
    for (let i = 0; i < 60000; ++i) {
      let p = mnist.getTrainingPoint(i);
      pointsByLabel[p.label].push(p);
    }

    let point = cscheid.random.choose(pointsByLabel[0]);
    currentDistribution = cscheid.linalg.scale(
      point.data, 1/cscheid.array.sum(point.data));

    bitmapFromPoint(point)
      .then(bitmap => ctx.drawImage(bitmap, 0, 0));
    
    animateNext();
  });

var metric = cscheid.geometry.gridDistance(28, 28);

let emd;
function optTransport(prev, next, t) {
  return cscheid.geometry.sinkhorn.renderPartialImageTransport(
    emd.p,
    currentDistribution,
    28, 28, t);
}

let interpolate = optTransport;
var digit = 0;

function animateNext() {
  let nextPoint = cscheid.random.choose(pointsByLabel[cscheid.random.choose([0,1,2,3,4,5,6,7,8,9])]);
  nextDistribution = cscheid.linalg.scale(
    nextPoint.data, 1/cscheid.array.sum(nextPoint.data));
  emd = cscheid.geometry.sinkhorn.dualSinkhornDivergence(
    currentDistribution,
    nextDistribution,
    metric,
    3);

  d3.transition()
    .duration(1000)
    .tween("foo", function() {
      return function(t) {
        let result = interpolate(
          currentDistribution, nextDistribution, t);
        bitmapFromDistribution(result)
          .then(bitmap => ctx.drawImage(bitmap, 0, 0));
      };
    }).on("end", () => {
      currentDistribution = nextDistribution;
      animateNext();
    });

}
d3.select("#lerp")
  .on("click", d => {
    interpolate = cscheid.linalg.lerp;
  });

d3.select("#emd")
  .on("click", d => {
    interpolate = optTransport;
  });
}
