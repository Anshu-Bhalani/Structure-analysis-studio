/**
 * Graphics / Selection.js
 * ------------------------------------------------------------------
 * Hit-testing helpers and the current selection state. Pure
 * geometry — never mutates the Model, only reads it.
 * ------------------------------------------------------------------
 */

import { distanceToSegment } from "../utilities/Helpers.js";

export class Selection {
  constructor() {
    this.selectedNodeId = null;
    this.selectedElementId = null;
  }

  clear() {
    this.selectedNodeId = null;
    this.selectedElementId = null;
  }

  selectNode(id) {
    this.selectedNodeId = id;
    this.selectedElementId = null;
  }

  selectElement(id) {
    this.selectedElementId = id;
    this.selectedNodeId = null;
  }

  /** @returns {import('../modeling/Node.js').Node|null} nearest node within tolerance (world units) */
  static hitTestNode(model, worldX, worldY, tolerance) {
    let closest = null;
    let closestDist = Infinity;
    for (const node of model.getAllNodes()) {
      const d = Math.hypot(node.x - worldX, node.y - worldY);
      if (d <= tolerance && d < closestDist) {
        closest = node;
        closestDist = d;
      }
    }
    return closest;
  }

  /** @returns {import('../modeling/Element.js').Element|null} nearest element within tolerance (world units) */
  static hitTestElement(model, worldX, worldY, tolerance) {
    let closest = null;
    let closestDist = Infinity;
    for (const element of model.getAllElements()) {
      const nodeI = model.getNode(element.nodeI);
      const nodeJ = model.getNode(element.nodeJ);
      if (!nodeI || !nodeJ) continue;
      const d = distanceToSegment(worldX, worldY, nodeI.x, nodeI.y, nodeJ.x, nodeJ.y);
      if (d <= tolerance && d < closestDist) {
        closest = element;
        closestDist = d;
      }
    }
    return closest;
  }
}
