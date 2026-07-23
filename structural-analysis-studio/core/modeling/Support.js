/**
 * Modeling / Support.js
 * ------------------------------------------------------------------
 * A support restrains one or more DOFs of a node. Pure data — the
 * Solver decides how to apply these restraints to the global system.
 * ------------------------------------------------------------------
 */

import { nextId } from "../utilities/Helpers.js";

/** Common support presets, expressed as restrained DOFs [ux, uy, rz]. */
export const SUPPORT_PRESETS = {
  pin: { ux: true, uy: true, rz: false },
  roller: { ux: false, uy: true, rz: false },
  fixed: { ux: true, uy: true, rz: true },
  rollerHorizontal: { ux: true, uy: false, rz: false },
};

export class Support {
  /**
   * @param {string} nodeId
   * @param {{ux:boolean, uy:boolean, rz:boolean}} restraints
   * @param {string=} type   preset name, purely for icon/labeling purposes
   * @param {string=} id
   */
  constructor(nodeId, restraints, type = "custom", id = null) {
    this.id = id || nextId("support");
    this.nodeId = nodeId;
    this.restraints = { ux: false, uy: false, rz: false, ...restraints };
    this.type = type;
  }

  toJSON() {
    return { id: this.id, nodeId: this.nodeId, restraints: { ...this.restraints }, type: this.type };
  }

  static fromJSON(json) {
    return new Support(json.nodeId, json.restraints, json.type, json.id);
  }

  static preset(nodeId, presetName) {
    const restraints = SUPPORT_PRESETS[presetName] || SUPPORT_PRESETS.pin;
    return new Support(nodeId, restraints, presetName);
  }
}
