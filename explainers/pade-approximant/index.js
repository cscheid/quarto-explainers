import * as cscheid from '../../js/cscheid/cscheid.js';
import * as d3 from "https://cdn.skypack.dev/d3@7";
window.d3 = d3;

let plot = cscheid.plot.create(d3.select("#pade-approximant"), 400, 400);

plot.setXDomain([0.00001, 3]);
plot.setYDomain([-0.5, 10]);

plot.addFunction(
  x => Math.exp(x),
  { custom: sel => sel.attr("stroke", "red").attr("stroke-width", "3px") });
// plot.addFunction(x => 1/(1-x), { custom: sel => sel.attr("stroke", d3.lab(60, 30, -20))});
// plot.addFunction(x => 2/(2 - 2*x + x*x), { custom: sel => sel.attr("stroke", d3.lab(60, 30, 0))});
// plot.addFunction(x => 6/(6 - 6*x + 3*x*x - x*x*x), { custom: sel => sel.attr("stroke", d3.lab(60, 30, 20))});

// plot.addFunction(x => (1+x));

// plot.addFunction(x => (6+2*x)/(6 - 4*x + x*x));
// plot.addFunction(x => (24+6*x)/(24 - 18 * x + 6 * x * x - x*x*x));
// plot.addFunction(x => (2 + 2 * x + x * x) / 2);
// plot.addFunction(x => (6 + 4 * x + x * x) / (6 - 2 * x));

plot.addFunction(x => (2 + x)/(2 - x),
                 { custom: sel => sel.attr("stroke", "blue") });
plot.addFunction(x => (12 + 6 * x + x * 2) / (12 - 6 * x + x * x),
                 { custom: sel => sel.attr("stroke", "blue") });
plot.addFunction(x => (120 + 60 * x + 12 * x * x + x * x * x) / (120 - 60 * x + 12 * x * x - x * x * x),
                 { custom: sel => sel.attr("stroke", "blue") });


plot.addFunction(x => 1 + x,
                 { custom: sel => sel.attr("stroke", "orange") });
plot.addFunction(x => 1 + x + x*x/2,
                 { custom: sel => sel.attr("stroke", "orange") });
plot.addFunction(x => 1 + x + x*x/2 + x*x*x/6,
                 { custom: sel => sel.attr("stroke", "orange") });

