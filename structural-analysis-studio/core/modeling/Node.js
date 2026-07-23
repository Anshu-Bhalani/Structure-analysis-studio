/**
 * Modeling / Node.js
 * ------------------------------------------------------------------
 * A node is a point in space where elements connect. Pure data only.
 * The Modeling module never performs calculations — DOF numbering
 * and stiffness live in Solver / Analysis.
 * ------------------------------------------------------------------
 */

import { nextId } from "../utilities/Helpers.js";

export class Node {
  /**
   * @param {number} x
   * @param {number} y
   * @param {string=} id
   */
  constructor(x, y, id = null) {
    this.id = id || nextId("node");
    this.x = x;
    this.y = y;
    this.label = "";
  }

  toJSON() {
    return { id: this.id, x: this.x, y: this.y, label: this.label };
  }

  static fromJSON(json) {
    const n = new Node(json.x, json.y, json.id);
    n.label = json.label || "";
    return n;
  }
}
