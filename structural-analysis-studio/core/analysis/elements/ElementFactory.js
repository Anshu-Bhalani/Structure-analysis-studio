import { ELEMENT_TYPES } from "../../modeling/Element.js";
import { SpringElement } from "./SpringElement.js";
import { BarElement } from "./BarElement.js";
import { BeamElement } from "./BeamElement.js";
import { FrameElement } from "./FrameElement.js";

export class ElementFactory {
  static create(modelElement, model) {
    const nodeI = model.getNode(modelElement.startNode?.id || modelElement.startNode);
    const nodeJ = model.getNode(modelElement.endNode?.id || modelElement.endNode);
    
    if (!nodeI || !nodeJ) {
      throw new Error(`Element ${modelElement.id} references a missing node`);
    }

    switch (modelElement.type.toLowerCase()) {
      case ELEMENT_TYPES.SPRING:
        return new SpringElement(modelElement, nodeI, nodeJ);

      case ELEMENT_TYPES.TRUSS:
      case ELEMENT_TYPES.BAR: {
        const material = model.materials.get(modelElement.material) || Array.from(model.materials.values())[0];
        const section = model.sections.get(modelElement.section) || Array.from(model.sections.values())[0];
        return new BarElement(modelElement, nodeI, nodeJ, material, section);
      }

      case ELEMENT_TYPES.BEAM: {
        const material = model.materials.get(modelElement.material) || Array.from(model.materials.values())[0];
        const section = model.sections.get(modelElement.section) || Array.from(model.sections.values())[0];
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
