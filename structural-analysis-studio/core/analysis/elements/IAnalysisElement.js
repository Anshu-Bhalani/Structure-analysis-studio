/**
 * Analysis / IAnalysisElement.js
 * ------------------------------------------------------------------
 * The contract every analysis element (Spring, Bar, Beam, and later
 * Frame/Grid/Plate/Shell/Solid...) must fulfil.
 *
 * The Solver only ever talks to elements through this interface. It
 * never checks `if (element.type === "Beam")` anywhere — that is the
 * rule that keeps Solver generic ("The Solver should never contain
 * beam-specific or spring-specific logic").
 *
 * Each concrete element is responsible for:
 *   1. Knowing which global DOFs it touches (getGlobalDOFIndices)
 *   2. Producing its own stiffness matrix already rotated into the
 *      global coordinate system, sized to match those DOFs
 *      (getGlobalStiffnessMatrix)
 *   3. Turning a global displacement vector back into physically
 *      meaningful local results (recoverResults)
 * ------------------------------------------------------------------
 */

export class IAnalysisElement {
  /**
   * @param {import('../modeling/Element.js').Element} modelElement
   * @param {import('../modeling/Node.js').Node} nodeI
   * @param {import('../modeling/Node.js').Node} nodeJ
   */
  constructor(modelElement, nodeI, nodeJ) {
    if (new.target === IAnalysisElement) {
      throw new Error("IAnalysisElement is an interface and cannot be instantiated directly");
    }
    this.id = modelElement.id;
    this.modelElement = modelElement;
    this.nodeI = nodeI;
    this.nodeJ = nodeJ;
  }

  /** @returns {string} number of DOFs per node this element type activates, kept for Learning display */
  get dofsPerNode() {
    return 3;
  }

  /**
   * @param {import('../solver/DOFManager.js').DOFManager} dofManager
   * @returns {number[]} the 6 global DOF indices [ux_i, uy_i, rz_i, ux_j, uy_j, rz_j]
   */
  getGlobalDOFIndices(dofManager) {
    throw new Error("getGlobalDOFIndices() must be implemented by the concrete element");
  }

  /** @returns {import('../mathematics/Matrix.js').Matrix} 6x6 stiffness matrix in GLOBAL coordinates */
  getGlobalStiffnessMatrix() {
    throw new Error("getGlobalStiffnessMatrix() must be implemented by the concrete element");
  }

  /**
   * Recover local, physically meaningful results (axial force, shear,
   * moment, etc.) once the solver has produced global displacements.
   * @param {number[]} globalU  full global displacement vector
   * @param {import('../solver/DOFManager.js').DOFManager} dofManager
   */
  recoverResults(globalU, dofManager) {
    throw new Error("recoverResults() must be implemented by the concrete element");
  }

  /** Basic geometry shared by every 2-node line element. */
  static geometry(nodeI, nodeJ) {
    const dx = nodeJ.x - nodeI.x;
    const dy = nodeJ.y - nodeI.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    return { L, cx: L === 0 ? 0 : dx / L, cy: L === 0 ? 0 : dy / L, angle };
  }
}
