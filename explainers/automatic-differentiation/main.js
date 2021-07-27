/*global d3, fetch, peg*/

import * as cscheid from "../../js/cscheid/cscheid.js";
import * as ad from "./autodiff.js";

let parser;

function renderFW(text)
{
  let parse;

  try {
    console.log("parsing:", text);
    parse = parser.parse(text);
    console.log("ok:", parse);
  } catch (e) {
    console.log("Exception raised: ", e);
    return;
  }

  d3.select("#fm-autodiff").selectAll("*").remove();
  
  let svg = cscheid.dom.makeCenteredElement(
    d3.select("#fm-autodiff"), "svg")
      .attr("width", 600)
      .attr("height", 400);

  let vars = ad.collectVariables(parse);
  let assignment = {};
  vars.forEach(v => assignment[v] = Math.random() );
  let adOutput = ad.forwardModeAD(parse, assignment, vars[0]);
  let adTrace = {
    trace: adOutput.trace,
    var: "a",
    assignment: assignment
  };
  ad.renderExpressionTree(parse, svg, () => {
    ad.renderFWAD(parse, svg, adTrace);
  });
}

function renderRev(text)
{
  let parse;

  try {
    console.log("parsing:", text);
    parse = parser.parse(text);
    console.log("ok:", parse);
  } catch (e) {
    console.log("Exception raised: ", e);
    return;
  }

  d3.select("#rm-autodiff").selectAll("*").remove();
  
  let svg = cscheid.dom.makeCenteredElement(
    d3.select("#rm-autodiff"), "svg")
      .attr("width", 600)
      .attr("height", 400);

  let vars = ad.collectVariables(parse);

  svg.append("g")
    .selectAll("g")
    .data(vars)
    .enter()
    .append("g")
    .classed("variable-gradient", true)
    .attr("transform", (d, i) => `translate(20, ${380 - vars.length * 15 + i * 15})`)
    .append("text")
    .text((d, i) => `d/d${d}: 0.00`); 
  
  let assignment = {};
  vars.forEach(v => assignment[v] = Math.random() );
  let adOutput = ad.reverseModeAD(parse, assignment);
  let adTrace = {
    fwTrace: adOutput.fwTrace,
    bwTrace: adOutput.bwTrace,
    assignment: assignment
  };
  ad.renderExpressionTree(parse, svg, () => {
    ad.renderRevAD(parse, svg, adTrace);
  });
  console.log(adOutput);
}

function goFM() {
  renderFW(d3.select("#fm-autodiff-input").node().value);
}

function goRM() {
  renderRev(d3.select("#rm-autodiff-input").node().value);
}

export function main()
{
  fetch("expression.peg")
    .then(response => response.text())
    .then(text => {
      parser = peg.generate(text);
      goFM();
      d3.select("#fm-autodiff-input").on("change", goFM);
      d3.select("#fm-autodiff-go").on("click", goFM);
      goRM();
      d3.select("#rm-autodiff-input").on("change", goRM);
      d3.select("#rm-autodiff-go").on("click", goRM);
    });
}

