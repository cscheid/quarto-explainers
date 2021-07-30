/* global d3 */

// the expression AST has these types:

// "add", "sub", "mul", "div": with attributes "left" and "right"
// "sin", "cos", "exp", "log": with attribute "arg"
// "number", with attribute "value"
// "variable", with attribute "name"

export function depthFirstWalker(dispatch)
{
  return function walk(tree) {
    let f = dispatch[tree.type];
    if (f) {
      f(tree);
    }
    tree.children.forEach(walk);
  };
}

export function treeFold(dispatch)
{
  return function fold(tree) {
    let f = dispatch[tree.type];
    if (!f)
      throw new Error(`don't know how to handle node of type ${tree.type}`);
    let vals = tree.children.map(fold);
    return f(tree, ...vals);
  };
}

export function collectVariables(expression)
{
  let lst = [];
  depthFirstWalker({
    "variable": (n) => {
      if (lst.indexOf(n.name) == -1)
        lst.push(n.name);
    }
  })(expression);
  return lst;
}

// this AD algo doesn't work in general; it works here because the
// only shared nodes in "expression" are variables, which are also
// leaves.
export function reverseModeAD(expression, values)
{
  let fwADVar;
  let gradient = {};
  for (var key in values) {
    if (!fwADVar)
      fwADVar = key;
    gradient[key] = 0;
  }
  
  let forwardPass = forwardModeAD(expression, values, fwADVar);
  // we borrow forwardModeAD for the forward pass, but we don't need
  // the derivative. this saves keystrokes at the expense of clock
  // cycles
  // tag expression nodes with forward pass
  forwardPass.trace.forEach(traceEntry => {
    traceEntry.node.__val = traceEntry.val.val;
    traceEntry.node.__gradient = 0;
  });
  
  // tag expression root with its derivative
  expression.__gradient = 1;

  let backTrace = [];
  
  let backwardPass = depthFirstWalker({
    "add": function(n) {
      let v0 = n.children[0].__gradient,
          v1 = n.children[1].__gradient;
      n.children[0].__gradient += n.__gradient;
      n.children[1].__gradient += n.__gradient;
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
      backTrace.push({ node: n, parent: n.children[1], oldValue: v1, newValue: n.children[1].__gradient});
    },
    "sub": function(n) {
      let v0 = n.children[0].__gradient,
          v1 = n.children[1].__gradient;
      n.children[0].__gradient += n.__gradient;
      n.children[1].__gradient -= n.__gradient;
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
      backTrace.push({ node: n, parent: n.children[1], oldValue: v1, newValue: n.children[1].__gradient});
    },
    "mul": function(n) {
      let v0 = n.children[0].__gradient,
          v1 = n.children[1].__gradient;
      n.children[0].__gradient += n.__gradient * n.children[1].__val;
      n.children[1].__gradient += n.__gradient * n.children[0].__val;
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
      backTrace.push({ node: n, parent: n.children[1], oldValue: v1, newValue: n.children[1].__gradient});
    },
    "div": function(n) {
      let v0 = n.children[0].__gradient,
          v1 = n.children[1].__gradient;
      n.children[0].__gradient += n.__gradient / n.children[1].__val;
      n.children[1].__gradient -= n.__gradient / Math.pow(n.children[0].__val, 2);
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
      backTrace.push({ node: n, parent: n.children[1], oldValue: v1, newValue: n.children[1].__gradient});
    },
    "sin": function(n) {
      let v0 = n.children[0].__gradient;
      n.children[0].__gradient += n.__gradient * Math.cos(n.children[0].__val);
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
    },
    "cos": function(n) {
      let v0 = n.children[0].__gradient;
      n.children[0].__gradient -= n.__gradient * Math.sin(n.children[0].__val);
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
    },
    "exp": function(n) {
      let v0 = n.children[0].__gradient;
      n.children[0].__gradient += n.__gradient * Math.exp(n.children[0].__val);
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
    },
    "log": function(n) {
      let v0 = n.children[0].__gradient;
      n.children[0].__gradient += n.__gradient / n.children[0].__val;
      backTrace.push({ node: n, parent: n.children[0], oldValue: v0, newValue: n.children[0].__gradient});
    },
    "number": function(n) {},
    "variable": function(n) {
      gradient[n.name] += n.__gradient;
    }
  })(expression);

  forwardPass.trace.forEach(traceEntry => {
    delete traceEntry.val.d;
    delete traceEntry.node.__val;
    delete traceEntry.node.__gradient;
  });

  return {
    val: forwardPass.val.val,
    gradient: gradient,
    fwTrace: forwardPass.trace,
    bwTrace: backTrace
  };
}

export function forwardModeAD(expression, values, variable)
{
  let trace = [];
  let result = treeFold({
    "variable": function(n) {
      let v = {
        "val": values[n.name],
        "d": n.name === variable ? 1 : 0
      };
      trace.push({ node: n, val: v });
      return v;
    },
    "number": function(n) {
      let v = { "val": n.value, "d": 0 };
      trace.push({ node: n, val: v });
      return v;
    },
    "add": function(n, left, right) {
      let v = { "val": left.val + right.val,
                "d": left.d + right.d };
      trace.push({ node: n, val: v });
      return v;
    },
    "sub": function(n, left, right) {
      let v = {
        "val": left.val - right.val,
        "d": left.d - right.d };
      trace.push({ node: n, val: v });
      return v;
    },
    "mul": function(n, left, right) {
      let v = {
        "val": left.val * right.val,
        "d": left.d * right.val + left.val * right.d };
      trace.push({ node: n, val: v });
      return v;
    },
    "div": function(n, left, right) {
      let v = {
        "val": left.val / right.val,
        "d": (right.val * left.d - left.val * right.d) /
          (right.val * right.val)
      };
      trace.push({ node: n, val: v });
      return v;
    },
    "sin": function(n, arg) {
      let v = {
        "val": Math.sin(arg.val),
        "d": Math.cos(arg.val) * arg.d
      };
      trace.push({ node: n, val: v });
      return v;
    },
    "cos": function(n, arg) {
      let v = {
        "val": Math.cos(arg.val),
        "d": -Math.sin(arg.val) * arg.d
      };
      trace.push({ node: n, val: v });
      return v;
    },
    "exp": function(n, arg) {
      let v = {
        "val": Math.exp(arg.val),
        "d": Math.exp(arg.val) * arg.d
      };
      trace.push({ node: n, val: v });
      return v;
    },
    "log": function(n, arg) {
      let v = {
        "val": Math.log(arg.val),
        "d": arg.d / arg.val
      };
      trace.push({ node: n, val: v });
      return v;
    }
  })(expression);

  return { trace: trace,
           val: result };
}

export function renderRevAD(expression, svg, adTrace)
{
  let fmt = d3.format(".2f");

  let nodeEls = svg.selectAll("g.node");

  // pretty inefficient...
  adTrace.fwTrace.forEach(trace => {
    let node = trace.node;
    let caption = `v: ${fmt(trace.val.val)}`;
    nodeEls.filter(d => d.data === trace.node)
      .append("text")
      .classed("rev-mode-val", true)
      .text(caption)
      .style("alignment-baseline", "middle")
      .style("opacity", 0)
      .attr("x", 25)
      .attr("y", -7.5);
  });

  adTrace.bwTrace.forEach(trace => {
    let node = trace.node;
    let caption;
    if (node === expression) {
      caption = "d: 1.00";
    } else {
      caption = "";
    }
    nodeEls.filter(d => d.data === trace.node)
      .filter(d => d.data.type !== "variable")
      .append("text")
      .classed("rev-mode-g", true)
      .text(caption)
      .style("alignment-baseline", "middle")
      .style("opacity", 1)
      .attr("x", 25)
      .attr("y", 7.5);
  });

  function callFWNext(traceIndex) {
    if (traceIndex >= adTrace.fwTrace.length) {
      callBWNext(0);
      return;
    }
    let trace = adTrace.fwTrace[traceIndex];
    let node = nodeEls.filter(d => d.data === trace.node);
    
    node.selectAll("circle")
      .transition()
      .duration(300)
      .style("stroke-opacity", "1")
      .on("end", () => {
        node.selectAll("text.rev-mode-val")
          .transition()
          .delay(400)
          .duration(1200)
          .style("opacity", 1)
          .on("end", function() {
            node.selectAll("circle")
              .transition()
              .duration(300)
              .style("stroke-opacity", "0")
              .on("end", function() {
                callFWNext(traceIndex+1);
              });
          });
      });
  }
  let variableCaptions = svg.selectAll("g.variable-gradient text");
  let nodeCaptions = nodeEls.selectAll("text.rev-mode-g");
  let gradient = {};

  function callBWNext(traceIndex) {
    if (traceIndex >= adTrace.bwTrace.length) {
      return;
    }
    let trace = adTrace.bwTrace[traceIndex];
    if (trace.parent.type === "variable") {
      if (!gradient[trace.parent.name])
        gradient[trace.parent.name] = 0;
      let vScale = d3.scaleLinear().range([
        gradient[trace.parent.name],
        gradient[trace.parent.name] + trace.newValue]);

      let node = nodeEls.selectAll("circle")
          .filter(d => d.data === trace.parent);
      let caption = variableCaptions
        .filter(d => d === trace.parent.name);

      caption.transition()
        .duration(300)
        .style("fill", "red");
      node.transition()
        .duration(300)
        .style("stroke-opacity", 1)
        .on("end", () => {
          caption
            .transition()
            .delay(400)
            .duration(1200)
            .textTween(() => t => `d/d${trace.parent.name}: ${fmt(vScale(t))}`)
            .on("end", function() {
              caption.transition()
                .duration(300)
                .style("fill", "black");
              node.transition()
                .duration(300)
                .style("stroke-opacity", 0)
                .on("end", () => {
                  gradient[trace.parent.name] += trace.newValue;
                  callBWNext(traceIndex+1);
                });
            });
        });
    } else {
      if (trace.parent.type === "number") {
        callBWNext(traceIndex+1);
        return;
      }
      let vScale = d3.scaleLinear().range([trace.oldValue, trace.newValue]);
      let node = nodeEls.selectAll("circle")
          .filter(d => d.data === trace.parent);
      node.transition()
        .duration(300)
        .style("stroke-opacity", 1)
        .on("end", () => {
          nodeCaptions
            .filter(d => d.data === trace.parent)
            .transition()
            .delay(400)
            .duration(1200)
            .textTween(() => t => `d: ${fmt(vScale(t))}`)
            .on("end", function() {
              node.transition()
                .duration(300)
                .style("stroke-opacity", 0)
                .on("end", () => {
                  callBWNext(traceIndex+1);
                });
            });
        });
    }
  }

  callFWNext(0);

}

export function renderFWAD(expression, svg, adTrace)
{
  let fmt = d3.format(".2f");

  let nodeEls = svg.selectAll("g.node");
  
  // pretty inefficient...
  adTrace.trace.forEach(trace => {
    let node = trace.node;
    let caption1 = `v: ${fmt(trace.val.val)}`;
    let caption2 = `d/d${adTrace.var}: ${fmt(trace.val.d)}`;
    nodeEls.filter(d => d.data === trace.node)
      .append("text")
      .classed("fw-mode-d", true)
      .text(caption1)
      .style("alignment-baseline", "middle")
      .style("opacity", 0)
      .attr("x", 25)
      .attr("y", -7.5);
    nodeEls.filter(d => d.data === trace.node)
      .append("text")
      .classed("fw-mode-d", true)
      .text(caption2)
      .style("alignment-baseline", "middle")
      .style("opacity", 0)
      .attr("x", 25)
      .attr("y", 7.5);
  });

  function callNext(traceIndex) {
    if (traceIndex >= adTrace.trace.length)
      return;
    let trace = adTrace.trace[traceIndex];

    let node = nodeEls.filter(d => d.data === trace.node);

    node.selectAll("circle")
      .transition()
      .duration(200)
      .style("stroke-opacity", 1)
      .on("end", () => {
        node
          .selectAll("text.fw-mode-d")
          .transition()
          .delay(250)
          .duration(750)
          .style("opacity", 1)
          .on("end", function() {
            node.selectAll("circle")
              .transition()
              .duration(200)
              .style("stroke-opacity", 0)
              .on("end", () => {
                callNext(traceIndex+1);
              });
          });
      });
  }
  callNext(0);
}

export function renderExpressionTree(expression, svg, updateK)
{
  // https://bl.ocks.org/d3noob/8375092
  let width = 600;
  let height = 400;

  let i = 0;
  let tree, root;
  let margin = {
    left: 20,
    top: 20
  };

  let diagonal = d3.linkHorizontal()
      .x(d => d.x)
      .y(d => d.y);
  
  function update(source) {
    let nodes = d3.hierarchy(expression, d => d.children);
    nodes = tree(nodes);
    
    // Update the nodes…
    var node = svg.selectAll("g.node")
	      .data(nodes, function(d) { return d.id || (d.id = ++i); });

    let g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let yScale = d3.scaleLinear()
        .domain([0,height - margin.top * 2])
        .range([height - margin.top * 2,0]);

    let linkEls = g.selectAll(".link")
        .data(nodes.descendants().slice(1))
        .enter().append("path")
        .classed("link", true)
        .style("stroke", "rgb(128,128,128)")
        .style("stroke-width", "1px")
        .style("fill", "none")
        .attr("d", d => {
          return `M ${d.x} ${yScale(d.y)} L ${d.parent.x} ${yScale(d.parent.y)}`;
        });

    let nodeEls = g.selectAll(".node")
        .data(nodes.descendants())
        .enter().append("g").classed("node", true);
    
    nodeEls.attr("transform", d => `translate(${d.x}, ${yScale(d.y)})`);
    nodeEls.append("circle")
      .style("fill", "white")
      .style("stroke", "red")
      .style("stroke-width", "2px")
      .style("stroke-opacity", "0")
      .attr("r", "15")
      .attr("cx", 0)
      .attr("cy", 0);

    let caption = {
      "add": "+",
      "sub": "-",
      "mul": "*",
      "div": "/"
    };

    let fmt = d3.format(".2f");
    nodeEls.append("text")
      .classed("caption", true)
      .attr("x", 0)
      .attr("y", 0)
      .style("alignment-baseline", "middle")
      .style("text-anchor", "middle")
      .text(d => {
        if (caption[d.data.type]) {
          return caption[d.data.type];
        }
        if (d.data.type === "variable") {
          return d.data.name;
        }
        if (d.data.type === "number") {
          return fmt(d.data.value);
        }
        return d.data.type;
      });

    updateK();
  }

  tree = d3.tree()
    .size([width - margin.left * 2, height - margin.top * 2]);

  root = expression;
  root.x0 = height/2, root.y0 = 0;

  update(root);
}
