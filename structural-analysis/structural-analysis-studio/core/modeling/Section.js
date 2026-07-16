/**
 * Modeling / Section.js
 * ------------------------------------------------------------------
 * Cross-section properties. Pure data.
 * ------------------------------------------------------------------
 */

import { nextId } from "../utilities/Helpers.js";

export class Section {
  /**
   * @param {string} name
   * @param {number} A  cross-sectional area (m^2)
   * @param {number} I  second moment of area (m^4)
   * @param {string=} id
   */
  constructor(name, A, I, id = null) {
    this.id = id || nextId("sec");
    this.name = name;
    this.A = A;
    this.I = I;
  }

  toJSON() {
    return { id: this.id, name: this.name, A: this.A, I: this.I };
  }

  static fromJSON(json) {
    return new Section(json.name, json.A, json.I, json.id);
  }

  static defaultSection() {
    return new Section("Generic (default)", 0.01, 8.33e-6);
  }
}
