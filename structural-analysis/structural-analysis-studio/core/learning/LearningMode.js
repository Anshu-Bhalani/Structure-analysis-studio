/**
 * Learning / LearningMode.js
 * ------------------------------------------------------------------
 * Turns a raw Solver result bundle into an ordered list of teaching
 * steps, each with a title, plain-English explanation, and the
 * relevant data to display (a matrix, a vector, a table of values).
 *
 * This module explains; it never recalculates. Every number it shows
 * comes straight from the Solver's result bundle.
 * ------------------------------------------------------------------
 */

import { StepExplainer } from "./StepExplainer.js";

export class LearningMode {
  /**
   * @param {import('../modeling/Model.js').Model} model
   * @param {object} result   the object returned by Solver.run()
   * @returns {Array<{title:string, explanation:string, data:any}>}
   */
  static buildSteps(model, result) {
    const { dofManager, K, F, free, restrained, Kff, Ff, uFree, U, reactions, elementResults, analysisElements } = result;
    const steps = [];

    // 1. Node numbering
    steps.push({
      title: "Node Numbering",
      explanation:
        "Every node in the model is given an identity the solver can reference. " +
        `This structure has ${model.getAllNodes().length} node(s). Their positions define the geometry ` +
        "that every stiffness calculation below is based on.",
      data: model.getAllNodes().map((n, i) => ({ index: i + 1, id: n.id, label: n.label || `N${i + 1}`, x: n.x, y: n.y })),
    });

    // 2. DOF numbering
    steps.push({
      title: "DOF Numbering",
      explanation:
        "Each node reserves 3 global Degrees of Freedom: horizontal translation (ux), vertical translation (uy), " +
        "and rotation (rz). This is what lets every element type share one global system without the solver " +
        `needing to know what kind of element it is. Total DOFs in this model: ${dofManager.totalDOFs}.`,
      data: model.getAllNodes().map((n) => ({
        node: n.label || n.id,
        indices: dofManager.getNodeDOFIndices(n.id),
      })),
    });

    // 3. Local stiffness matrices
    steps.push({
      title: "Local Stiffness Matrix",
      explanation:
        "Each element computes its own stiffness matrix from its own physics — a Spring uses its stiffness k, " +
        "a Bar uses EA/L, a Beam uses EI/L. The Solver never derives these itself; it only asks each element for its matrix.",
      data: analysisElements.map((el) => ({
        elementId: el.id,
        type: el.modelElement.type,
        matrix: StepExplainer.formatMatrix(
          typeof el.getLocalStiffnessMatrix === "function" ? el.getLocalStiffnessMatrix() : el.getGlobalStiffnessMatrix()
        ),
      })),
    });

    // 4. Assembly
    steps.push({
      title: "Assembly",
      explanation:
        `Every element's stiffness contribution is added into the correct rows/columns of one global ` +
        `${dofManager.totalDOFs}×${dofManager.totalDOFs} matrix, based on which global DOFs it connects to. ` +
        "Overlapping contributions at a shared node simply add together — this is the essence of the Direct Stiffness Method.",
      data: { size: dofManager.totalDOFs, matrix: StepExplainer.formatMatrix(K) },
    });

    // 5. Boundary conditions
    steps.push({
      title: "Boundary Conditions",
      explanation:
        `Supports restrain ${restrained.length} DOF(s) to zero displacement, leaving ${free.length} unknown ` +
        "(free) DOFs to solve for. Restrained DOFs are removed from the system before solving, then reinserted afterward.",
      data: {
        restrained: StepExplainer.dofLabelList(dofManager, restrained),
        free: StepExplainer.dofLabelList(dofManager, free),
      },
    });

    // 6. Reduced matrix
    steps.push({
      title: "Reduced Matrix",
      explanation:
        "Removing the restrained rows/columns leaves a smaller, non-singular matrix that can actually be solved — " +
        "a full unrestrained structure would be a mechanism with no unique solution.",
      data: { size: free.length, matrix: StepExplainer.formatMatrix(Kff), loadVector: StepExplainer.formatVector(Ff) },
    });

    // 7. Unknown displacements
    steps.push({
      title: "Unknown Displacements",
      explanation:
        "Solving the reduced system (Gaussian elimination) for the free DOFs gives the structure's actual " +
        "deformation under the applied loads.",
      data: free.map((globalIndex, i) => ({
        dof: dofManager.describeDOF(globalIndex),
        value: StepExplainer.formatVector([uFree[i]])[0],
      })),
    });

    // 8. Reactions
    steps.push({
      title: "Reactions",
      explanation:
        "With every displacement now known, the force required at each restrained DOF to keep it at zero " +
        "displacement is the reaction there: R = K·U − F.",
      data: restrained.map((globalIndex) => ({
        dof: dofManager.describeDOF(globalIndex),
        value: StepExplainer.formatVector([reactions[globalIndex]])[0],
      })),
    });

    // 9. Member forces
    steps.push({
      title: "Member Forces",
      explanation:
        "Finally, each element converts the global displacements back into its own local, physically " +
        "meaningful results — axial force for a Spring/Bar, or shear and moment for a Beam.",
      data: elementResults,
    });

    return steps;
  }
}
