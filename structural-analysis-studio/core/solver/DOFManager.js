/**
 * Solver / DOFManager.js
 * ------------------------------------------------------------------
 * Assigns global Degree-Of-Freedom (DOF) numbers to every node.
 *
 * Every node in this application reserves 3 global DOFs:
 *   [ux, uy, rz]  (translation X, translation Y, rotation about Z)
 *
 * This is what lets Spring/Bar (which only ever use ux, uy) and Beam
 * (which only ever uses uy, rz in its own local frame) sit in the
 * SAME global system without the Solver needing to know which
 * element type uses which DOFs — unused rows/columns an element
 * doesn't touch are simply zero in its own global stiffness matrix.
 * ------------------------------------------------------------------
 */

export const DOFS_PER_NODE = 3; // [ux, uy, rz]

export class DOFManager {
  /**
   * @param {import('../modeling/Model.js').Model} model
   */
  constructor(model) {
    this.model = model;
    /** @type {Map<string, number>} nodeId -> starting global DOF index */
    this.nodeStartIndex = new Map();

    let index = 0;
    for (const node of model.getAllNodes()) {
      this.nodeStartIndex.set(node.id, index);
      index += DOFS_PER_NODE;
    }
    this.totalDOFs = index;
  }

  /** @returns {[number,number,number]} global DOF indices [ux, uy, rz] for a node */
  getNodeDOFIndices(nodeId) {
    const start = this.nodeStartIndex.get(nodeId);
    if (start === undefined) throw new Error(`DOFManager: unknown node ${nodeId}`);
    return [start, start + 1, start + 2];
  }

  /** @returns {number[]} the 6 global DOF indices for a 2-node element, [ux_i,uy_i,rz_i, ux_j,uy_j,rz_j] */
  getElementDOFIndices(nodeIId, nodeJId) {
    return [...this.getNodeDOFIndices(nodeIId), ...this.getNodeDOFIndices(nodeJId)];
  }

  /** Human-readable label for a global DOF index, used by the Learning module. */
  describeDOF(globalIndex) {
    const localNames = ["ux", "uy", "rz"];
    for (const [nodeId, start] of this.nodeStartIndex) {
      if (globalIndex >= start && globalIndex < start + DOFS_PER_NODE) {
        const node = this.model.getNode(nodeId);
        const label = node?.label || nodeId;
        return `${label}.${localNames[globalIndex - start]}`;
      }
    }
    return `dof_${globalIndex}`;
  }
}
