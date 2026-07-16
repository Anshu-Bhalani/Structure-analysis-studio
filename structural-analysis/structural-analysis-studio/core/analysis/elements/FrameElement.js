/**
 * Analysis / FrameElement.js
 * ------------------------------------------------------------------
 * PLACEHOLDER — Frame analysis is NOT implemented in Version 1.
 *
 * This file exists purely so the architecture (ElementFactory,
 * Modeling.ELEMENT_TYPES, UI element palette) already has a slot to
 * grow into. When Frame is implemented, it will combine axial (Bar)
 * and bending (Beam) behaviour into one 2-node, 3-DOF/node element —
 * without requiring any change to Solver, Mathematics, or the other
 * Analysis elements.
 * ------------------------------------------------------------------
 */

import { IAnalysisElement } from "./IAnalysisElement.js";

export class FrameElement extends IAnalysisElement {
  constructor(modelElement, nodeI, nodeJ) {
    super(modelElement, nodeI, nodeJ);
    throw new Error(
      "Frame analysis is not implemented in Version 1. This is a reserved placeholder for a future module."
    );
  }
}
