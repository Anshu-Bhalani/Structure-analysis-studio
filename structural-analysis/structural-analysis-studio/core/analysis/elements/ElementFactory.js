/**
 * Analysis / ElementFactory.js
 * ------------------------------------------------------------------
 * The ONLY place in the codebase that maps a Modeling.Element's
 * `type` string to a concrete Analysis element class. The Solver
 * never does this mapping itself — it just asks the factory for a
 * list of ready-to-use IAnalysisElement instances.
 *
 * Adding a new element type in the future means adding one line here
 * plus one new file in Analysis/ — nothing else in the codebase changes.
 * ------------------------------------------------------------------
 */

import { ELEMENT_TYPES } from "../modeling/Element.js";
import { SpringElement } from "./SpringElement.js";
import { BarElement } from "./BarElement.js";
import { BeamElement } from "./BeamElement.js";
import { FrameElement } from "./FrameElement.js";

export class ElementFactory {
  /**
   * @param {import('../modeling/Element.js').Element} modelElement
   * @param {import('../modeling/Model.js').Model} model
   * @returns {import('./IAnalysisElement.js').IAnalysisElement}
   */
  static create(modelElement, model) {
    const nodeI = model.getNode(modelElement.nodeI);
    const nodeJ = model.getNode(modelElement.nodeJ);
    if (!nodeI || !nodeJ) {
      throw new Error(`Element ${modelElement.id} references a missing node`);
    }

    switch (modelElement.type) {
      case ELEMENT_TYPES.SPRING:
        return new SpringElement(modelElement, nodeI, nodeJ);

      case ELEMENT_TYPES.BAR: {
        const material = model.materials.get(modelElement.properties.materialId) || [...model.materials.values()][0];
        const section = model.sections.get(modelElement.properties.sectionId) || [...model.sections.values()][0];
        return new BarElement(modelElement, nodeI, nodeJ, material, section);
      }

      case ELEMENT_TYPES.BEAM: {
        const material = model.materials.get(modelElement.properties.materialId) || [...model.materials.values()][0];
        const section = model.sections.get(modelElement.properties.sectionId) || [...model.sections.values()][0];
        return new BeamElement(modelElement, nodeI, nodeJ, material, section);
      }

      case ELEMENT_TYPES.FRAME:
        return new FrameElement(modelElement, nodeI, nodeJ);

      default:
        throw new Error(`ElementFactory: unknown or unimplemented element type "${modelElement.type}"`);
    }
  }

  static createAll(model) {
    return model.getAllElements().map((el) => ElementFactory.create(el, model));
  }
}
