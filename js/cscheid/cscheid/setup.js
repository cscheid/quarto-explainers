/** @module cscheid/setup */

import { addPrototypes } from "./svg.js";

export function setupGlobals({ d3 })
{
    window.d3 = d3;
    addPrototypes();
}
