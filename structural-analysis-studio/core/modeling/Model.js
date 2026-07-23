/**
 * Modeling / Model.js
 * ------------------------------------------------------------------
 * The Model is the single source of truth for structural DATA:
 * nodes, elements, supports, loads, materials, sections.
 *
 * RULE: The Modeling module stores data only. No calculations here —
 * that is the responsibility of Analysis + Solver.
 * ------------------------------------------------------------------
 */

import { Node } from "./Node.js";
import { Element } from "./Element.js";
import { Support } from "./Support.js";
import { Load } from "./Load.js";
import { Material } from "./Material.js";
import { Section } from "./Section.js";

export class Model {
  constructor() {
    /** @type {Map<string, Node>} */
    this.nodes = new Map();
    /** @type {Map<string, Element>} */
    this.elements = new Map();
    /** @type {Map<string, Support>} */
    this.supports = new Map();
    /** @type {Map<string, Load>} */
    this.loads = new Map();
    /** @type {Map<string, Material>} */
    this.materials = new Map();
    /** @type {Map<string, Section>} */
    this.sections = new Map();

    this.listeners = [];

    // Seed with one default material and section so new elements have something to reference.
    const defaultMaterial = Material.defaultSteel();
    const defaultSection = Section.defaultSection();
    this.materials.set(defaultMaterial.id, defaultMaterial);
    this.sections.set(defaultSection.id, defaultSection);
    this.defaultMaterialId = defaultMaterial.id;
    this.defaultSectionId = defaultSection.id;
  }

  // ---- change notification (UI subscribes to this) ----------------
  onChange(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  _notify(eventName) {
    this.listeners.forEach((fn) => fn(eventName, this));
  }

  // ---- Nodes --------------------------------------------------------
  addNode(x, y) {
    const node = new Node(x, y);
    this.nodes.set(node.id, node);
    this._notify("node:add");
    return node;
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  removeNode(id) {
    // Cascade: remove dependent elements, supports, loads referencing this node.
    for (const [eid, el] of this.elements) {
      if (el.nodeI === id || el.nodeJ === id) this.elements.delete(eid);
    }
    for (const [sid, s] of this.supports) {
      if (s.nodeId === id) this.supports.delete(sid);
    }
    for (const [lid, l] of this.loads) {
      if (l.nodeId === id) this.loads.delete(lid);
    }
    this.nodes.delete(id);
    this._notify("node:remove");
  }

  findNodeNear(x, y, tolerance) {
    for (const node of this.nodes.values()) {
      if (Math.hypot(node.x - x, node.y - y) <= tolerance) return node;
    }
    return null;
  }

  // ---- Elements -------------------------------------------------------
  addElement(type, nodeIId, nodeJId, properties = {}) {
    const props = { ...properties };
    const element = new Element(type, nodeIId, nodeJId, props);
    this.elements.set(element.id, element);
    this._notify("element:add");
    return element;
  }

  getElement(id) {
    return this.elements.get(id) || null;
  }

  removeElement(id) {
    this.elements.delete(id);
    this._notify("element:remove");
  }

  // ---- Supports -------------------------------------------------------
  addSupport(nodeId, restraints, type = "custom") {
    const support = new Support(nodeId, restraints, type);
    this.supports.set(support.id, support);
    this._notify("support:add");
    return support;
  }

  addSupportPreset(nodeId, presetName) {
    const support = Support.preset(nodeId, presetName);
    // Only one support per node — replace if one already exists.
    for (const [sid, s] of this.supports) {
      if (s.nodeId === nodeId) this.supports.delete(sid);
    }
    this.supports.set(support.id, support);
    this._notify("support:add");
    return support;
  }

  getSupportForNode(nodeId) {
    for (const s of this.supports.values()) {
      if (s.nodeId === nodeId) return s;
    }
    return null;
  }

  removeSupport(id) {
    this.supports.delete(id);
    this._notify("support:remove");
  }

  // ---- Loads -------------------------------------------------------
  addLoad(nodeId, values) {
    const load = new Load(nodeId, values);
    this.loads.set(load.id, load);
    this._notify("load:add");
    return load;
  }

  getLoadsForNode(nodeId) {
    return [...this.loads.values()].filter((l) => l.nodeId === nodeId);
  }

  removeLoad(id) {
    this.loads.delete(id);
    this._notify("load:remove");
  }

  // ---- Materials / Sections ------------------------------------------
  addMaterial(name, E) {
    const m = new Material(name, E);
    this.materials.set(m.id, m);
    this._notify("material:add");
    return m;
  }

  addSection(name, A, I) {
    const s = new Section(name, A, I);
    this.sections.set(s.id, s);
    this._notify("section:add");
    return s;
  }

  // ---- Bulk queries --------------------------------------------------
  getAllNodes() {
    return [...this.nodes.values()];
  }

  getAllElements() {
    return [...this.elements.values()];
  }

  getAllSupports() {
    return [...this.supports.values()];
  }

  getAllLoads() {
    return [...this.loads.values()];
  }

  isEmpty() {
    return this.nodes.size === 0;
  }

  clear() {
    this.nodes.clear();
    this.elements.clear();
    this.supports.clear();
    this.loads.clear();
    this._notify("model:clear");
  }

  // ---- Serialization --------------------------------------------------
  toJSON() {
    return {
      nodes: this.getAllNodes().map((n) => n.toJSON()),
      elements: this.getAllElements().map((e) => e.toJSON()),
      supports: this.getAllSupports().map((s) => s.toJSON()),
      loads: this.getAllLoads().map((l) => l.toJSON()),
      materials: [...this.materials.values()].map((m) => m.toJSON()),
      sections: [...this.sections.values()].map((s) => s.toJSON()),
      defaultMaterialId: this.defaultMaterialId,
      defaultSectionId: this.defaultSectionId,
    };
  }

  static fromJSON(json) {
    const model = new Model();
    model.nodes.clear();
    model.materials.clear();
    model.sections.clear();

    (json.materials || []).forEach((m) => {
      const mat = Material.fromJSON(m);
      model.materials.set(mat.id, mat);
    });
    (json.sections || []).forEach((s) => {
      const sec = Section.fromJSON(s);
      model.sections.set(sec.id, sec);
    });
    (json.nodes || []).forEach((n) => {
      const node = Node.fromJSON(n);
      model.nodes.set(node.id, node);
    });
    (json.elements || []).forEach((e) => {
      const el = Element.fromJSON(e);
      model.elements.set(el.id, el);
    });
    (json.supports || []).forEach((s) => {
      const sup = Support.fromJSON(s);
      model.supports.set(sup.id, sup);
    });
    (json.loads || []).forEach((l) => {
      const load = Load.fromJSON(l);
      model.loads.set(load.id, load);
    });

    model.defaultMaterialId = json.defaultMaterialId || model.defaultMaterialId;
    model.defaultSectionId = json.defaultSectionId || model.defaultSectionId;
    return model;
  }
}
