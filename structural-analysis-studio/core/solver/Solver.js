/**
 * Solver / Solver.js
 * ------------------------------------------------------------------
 * Orchestrates the classic Direct Stiffness Method pipeline:
 *
 *   1. Generate DOFs
 *   2. Ask each element for its own local/global stiffness
 *   3. Assemble the global stiffness matrix
 *   4. Apply boundary conditions
 *   5. Reduce the matrix to free DOFs
 *   6. Solve for unknown displacements
 *   7. Calculate reactions
 *   8. Calculate member forces
 *
 * RULE: this file never mentions "Spring", "Bar", or "Beam". It only
 * talks to elements through IAnalysisElement and to the Model through
 * its generic query methods. This is what makes the architecture
 * extensible to Frame, Grid, Plate, Shell, Solid, etc. without any
 * change to this file.
 * ------------------------------------------------------------------
 */

import { DOFManager } from "./DOFManager.js";
import { Assembler } from "./Assembler.js";
import { BoundaryConditions } from "./BoundaryConditions.js";
import { GaussianElimination } from "../mathematics/GaussianElimination.js";
import { Matrix } from "../mathematics/Matrix.js";
import { ElementFactory } from "../analysis-elements/ElementFactory.js";
import { logger } from "../utilities/Logger.js";

export class SolverError extends Error {}

export class Solver {
  /**
   * Runs a full static linear analysis on the given model.
   * @param {import('../modeling/Model.js').Model} model
   * @returns {object} a rich result bundle (also consumed by the Learning module)
   */
  static run(model) {
    if (model.isEmpty()) {
      throw new SolverError("The model has no nodes. Add at least one node before running analysis.");
    }
    if (model.getAllElements().length === 0) {
      throw new SolverError("The model has no elements. Add at least one Spring, Bar, or Beam element.");
    }
    if (model.getAllSupports().length === 0) {
      throw new SolverError("The model has no supports. Add at least one support before running analysis.");
    }

    // Step 1: Generate DOFs
    const dofManager = new DOFManager(model);

    // Build the analysis-layer elements (this is the only place that
    // resolves "what kind of element is this" — via the factory).
    const analysisElements = ElementFactory.createAll(model);

    // Step 2 + 3: local stiffness (inside each element) + global assembly
    const K = Assembler.assembleGlobalStiffness(dofManager, analysisElements);
    const F = Assembler.assembleGlobalLoadVector(dofManager, model);

    // Step 4: Apply boundary conditions
    const { free: candidateFree, restrained } = BoundaryConditions.splitDOFs(dofManager, model);

    // Some DOFs may have zero stiffness from every element (e.g. the
    // axial direction of a node touched only by bending-only Beam
    // elements). They can't be solved for, but they also carry no
    // load path, so they are excluded rather than treated as an error
    // — unless a load was actually applied there, which IS an error.
    const inactive = BoundaryConditions.findInactiveDOFs(K, candidateFree);
    const inactiveWithLoad = inactive.filter((i) => Math.abs(F[i]) > 1e-9);
    if (inactiveWithLoad.length > 0) {
      const names = inactiveWithLoad.map((i) => dofManager.describeDOF(i)).join(", ");
      throw new SolverError(
        `A load is applied at ${names}, but no element or support provides any stiffness in that direction ` +
          "(for example, a Beam element in this version resists bending only, not axial extension). " +
          "Add a Bar element, a support, or remove the load in that direction."
      );
    }
    if (inactive.length > 0) {
      const names = inactive.map((i) => dofManager.describeDOF(i)).join(", ");
      logger.warn(`${inactive.length} DOF(s) have no stiffness from any element and were excluded from the solve: ${names}`);
    }
    const free = candidateFree.filter((i) => !inactive.includes(i));

    if (free.length === 0) {
      throw new SolverError("Every DOF is restrained or inactive — there is nothing left to solve for.");
    }

    // Step 5: Reduce the matrix to free DOFs
    const { Kff, Ff } = BoundaryConditions.reduce(K, F, free);

    // Step 6: Solve for unknown displacements
    let uFree;
    try {
      uFree = GaussianElimination.solve(Kff, Ff);
    } catch (err) {
      logger.error("Solver: singular reduced stiffness matrix", { error: err.message });
      throw new SolverError(
        "The structure is unstable (a mechanism) or improperly supported, so it has no unique solution. " +
          "Check that supports fully restrain rigid-body motion."
      );
    }
    const U = BoundaryConditions.expandDisplacements(dofManager.totalDOFs, free, uFree);

    // Step 7: Calculate reactions (R = K*U - F, evaluated at restrained DOFs)
    const Ucol = Matrix.fromArray(U.map((v) => [v]));
    const KU = K.multiply(Ucol);
    const reactions = {};
    restrained.forEach((globalIndex) => {
      reactions[globalIndex] = KU.get(globalIndex, 0) - F[globalIndex];
    });

    // Step 8: Calculate member forces (delegated back to each element)
    const elementResults = analysisElements.map((el) => el.recoverResults(U, dofManager));

    logger.info("Solver: analysis completed", {
      dofs: dofManager.totalDOFs,
      freeDOFs: free.length,
      restrainedDOFs: restrained.length,
      elements: analysisElements.length,
    });

    return {
      dofManager,
      analysisElements,
      K,
      F,
      free,
      restrained,
      Kff,
      Ff,
      uFree,
      U,
      reactions,
      elementResults,
    };
  }
}
