/**
 * Modeling / Material.js
 * ------------------------------------------------------------------
 * Material properties. Pure data.
 * ------------------------------------------------------------------
 */

import { nextId } from "../utilities/Helpers.js";

export class Material {
  /**
   * @param {string} name
   * @param {number} E  Young's modulus (Pa)
   * @param {string=} id
   */
  constructor(name, E, id = null) {
    this.id = id || nextId("mat");
    this.name = name;
    this.E = E;
  }

  toJSON() {
    return { id: this.id, name: this.name, E: this.E };
  }

  static fromJSON(json) {
    return new Material(json.name, json.E, json.id);
  }

  static defaultSteel() {
    return new Material("Steel (default)", 200e9);
  }
}
