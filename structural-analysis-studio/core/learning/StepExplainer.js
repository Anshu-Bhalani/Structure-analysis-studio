/**
 * Learning / StepExplainer.js
 * ------------------------------------------------------------------
 * Small formatting helpers shared by LearningMode. Keeps "how do I
 * turn a Matrix into readable text" separate from "what is the story
 * of this particular analysis".
 * ------------------------------------------------------------------
 */

import { UnitConverter } from "../utilities/UnitConverter.js";

export class StepExplainer {
  static formatMatrix(matrix, decimals = 2) {
    return matrix.toArray().map((row) => row.map((v) => UnitConverter.format(v, decimals)));
  }

  static formatVector(vector, decimals = 4) {
    return vector.map((v) => UnitConverter.format(v, decimals));
  }

  static dofLabelList(dofManager, indices) {
    return indices.map((i) => dofManager.describeDOF(i));
  }
}
