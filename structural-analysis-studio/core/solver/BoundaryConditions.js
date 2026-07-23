/**
 * Solver / BoundaryConditions.js
 * ------------------------------------------------------------------
 * Applies supports to the global system by splitting DOFs into
 * "free" (unknown displacement) and "restrained" (known, usually
 * zero, displacement) sets, and reduces the global matrix/vector to
 * the free set only, ready for Gaussian elimination.
 * ------------------------------------------------------------------
 */

export class BoundaryConditions {
  /**
   * @param {import('./DOFManager.js').DOFManager} dofManager
   * @param {import('../modeling/Model.js').Model} model
   */
  static getRestrainedDOFs(dofManager, model) {
    const restrained = new Set();
    for (const support of model.getAllSupports()) {
      const [ux, uy, rz] = dofManager.getNodeDOFIndices(support.nodeId);
      if (support.restraints.ux) restrained.add(ux);
      if (support.restraints.uy) restrained.add(uy);
      if (support.restraints.rz) restrained.add(rz);
    }
    return restrained;
  }

  /**
   * @returns {{free:number[], restrained:number[]}}
   */
  static splitDOFs(dofManager, model) {
    const restrainedSet = BoundaryConditions.getRestrainedDOFs(dofManager, model);
    const free = [];
    const restrained = [];
    for (let i = 0; i < dofManager.totalDOFs; i++) {
      if (restrainedSet.has(i)) restrained.push(i);
      else free.push(i);
    }
    return { free, restrained };
  }

  /**
   * Finds DOFs that no element contributes ANY stiffness to at all
   * (a fully zero row in the global matrix). This is not a modeling
   * mistake by itself — e.g. a Beam element deliberately carries no
   * axial stiffness, so a node touched only by Beam elements has no
   * stiffness resisting its axial translation unless something else
   * (a Bar element, or a support) restrains it. Such DOFs cannot be
   * solved for (their row is all zero, which is singular), but they
   * also don't need to be: with zero load and zero stiffness they
   * simply don't move.
   * @param {import('../mathematics/Matrix.js').Matrix} K
   * @param {number[]} candidateFreeDOFs
   * @param {number} tolerance
   * @returns {number[]} the subset of candidateFreeDOFs with an all-zero row in K
   */
  static findInactiveDOFs(K, candidateFreeDOFs, tolerance = 1e-9) {
    return candidateFreeDOFs.filter((row) => {
      for (let col = 0; col < K.cols; col++) {
        if (Math.abs(K.get(row, col)) > tolerance) return false;
      }
      return true;
    });
  }

  /**
   * Reduce the global stiffness matrix and load vector to the free DOFs.
   * @param {import('../mathematics/Matrix.js').Matrix} K
   * @param {number[]} F
   * @param {number[]} freeDOFs
   */
  static reduce(K, F, freeDOFs) {
    const Kff = K.subMatrix(freeDOFs, freeDOFs);
    const Ff = freeDOFs.map((i) => F[i]);
    return { Kff, Ff };
  }

  /** Rebuild the full-length global displacement vector from the solved free-DOF values. */
  static expandDisplacements(totalDOFs, freeDOFs, uFree) {
    const U = new Array(totalDOFs).fill(0);
    freeDOFs.forEach((globalIndex, i) => {
      U[globalIndex] = uFree[i];
    });
    return U;
  }
}
