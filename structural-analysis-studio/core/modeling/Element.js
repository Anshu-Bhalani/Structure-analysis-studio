/**
 * Modeling / Element.js
 * ------------------------------------------------------------------
 * Pure DATA record describing a structural element: which nodes it
 * connects, its type, and which material/section it references.
 *
 * IMPORTANT: This is NOT the same thing as an Analysis element
 * (SpringElement / BarElement / BeamElement). This class never
 * computes a stiffness matrix. The Analysis module reads this data
 * and builds the appropriate calculation object from it.
 * ------------------------------------------------------------------
 */

import { nextId } from "../utilities/Helpers.js";

/** Element type identifiers. Extend this list as new modules are added. */
export const ELEMENT_TYPES = {
  SPRING: "Spring",
  BAR: "Bar",
  BEAM: "Beam",
  FRAME: "Frame", // placeholder, not implemented in V1
};

export class Element {
  /**
   * @param {string} type          one of ELEMENT_TYPES
   * @param {string} nodeI
   * @param {string} nodeJ
   * @param {object} properties    e.g. { stiffness } for Spring, { materialId, sectionId } for Bar/Beam
   * @param {string=} id
   */
  constructor(type, nodeI, nodeJ, properties = {}, id = null) {
    this.id = id || nextId("elem");
    this.type = type;
    this.nodeI = nodeI;
    this.nodeJ = nodeJ;
    this.properties = { ...properties };
    this.label = "";
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      nodeI: this.nodeI,
      nodeJ: this.nodeJ,
      properties: { ...this.properties },
      label: this.label,
    };
  }

  static fromJSON(json) {
    const e = new Element(json.type, json.nodeI, json.nodeJ, json.properties, json.id);
    e.label = json.label || "";
    return e;
  }
}
