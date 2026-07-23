/**
 * Solver / Assembler.js
 * ------------------------------------------------------------------
 * Assembles the global stiffness matrix and global load vector from
 * a list of analysis elements. This code has NO idea whether an
 * element is a Spring, Bar, or Beam — it only calls the common
 * IAnalysisElement interface. That is what "the Solver should never
 * contain beam-specific or spring-specific logic" means in practice.
 * ------------------------------------------------------------------
 */

import { Matrix } from "../mathematics/Matrix.js";

export class Assembler {
  /**
   * @param {import('./DOFManager.js').DOFManager} dofManager
   * @param {import('../analysis-elements/IAnalysisElement.js').IAnalysisElement[]} analysisElements
   */
  static assembleGlobalStiffness(dofManager, analysisElements) {
    const n = dofManager.totalDOFs;
    const K = Matrix.zeros(n, n);

    for (const element of analysisElements) {
      const dofIndices = element.getGlobalDOFIndices(dofManager);
      const kElement = element.getGlobalStiffnessMatrix(); // sized to match dofIndices.length

      for (let a = 0; a < dofIndices.length; a++) {
        for (let b = 0; b < dofIndices.length; b++) {
          K.add(dofIndices[a], dofIndices[b], kElement.get(a, b));
        }
      }
    }
    return K;
  }

  /**
   * @param {import('./DOFManager.js').DOFManager} dofManager
   * @param {import('../modeling/Model.js').Model} model
   */
  static assembleGlobalLoadVector(dofManager, model) {
    const F = new Array(dofManager.totalDOFs).fill(0);
    for (const load of model.getAllLoads()) {
      const [ux, uy, rz] = dofManager.getNodeDOFIndices(load.nodeId);
      F[ux] += load.Fx;
      F[uy] += load.Fy;
      F[rz] += load.Mz;
    }
    return F;
  }
}
