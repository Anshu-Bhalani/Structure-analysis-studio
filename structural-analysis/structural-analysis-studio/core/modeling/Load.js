/**
 * Modeling / Load.js
 * ------------------------------------------------------------------
 * A nodal load: forces/moment applied directly at a node.
 * Version 1 supports nodal loads only. Distributed member loads are
 * a natural future extension (converted to equivalent nodal loads
 * by the Analysis module) and do not require changes to this class.
 * ------------------------------------------------------------------
 */

import { nextId } from "../utilities/Helpers.js";

export class Load {
  /**
   * @param {string} nodeId
   * @param {{Fx?:number, Fy?:number, Mz?:number}} values
   * @param {string=} id
   */
  constructor(nodeId, values = {}, id = null) {
    this.id = id || nextId("load");
    this.nodeId = nodeId;
    this.Fx = values.Fx || 0;
    this.Fy = values.Fy || 0;
    this.Mz = values.Mz || 0;
  }

  toJSON() {
    return { id: this.id, nodeId: this.nodeId, Fx: this.Fx, Fy: this.Fy, Mz: this.Mz };
  }

  static fromJSON(json) {
    return new Load(json.nodeId, { Fx: json.Fx, Fy: json.Fy, Mz: json.Mz }, json.id);
  }
}
