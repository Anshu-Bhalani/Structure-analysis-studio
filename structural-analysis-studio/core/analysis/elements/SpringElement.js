/**
 * Analysis / SpringElement.js
 * ------------------------------------------------------------------
 * A 2-node translational spring. Stiffness k is user-specified
 * directly (not derived from material/section), and acts along the
 * line connecting its two nodes. Only the translational DOFs
 * (ux, uy) of each node are involved — rotation is never touched.
 *
 * This element is completely independent of Bar and Beam: it knows
 * nothing about either, and they know nothing about it.
 * ------------------------------------------------------------------
 */

import { IAnalysisElement } from "./IAnalysisElement.js";
import { Matrix } from "../mathematics/Matrix.js";

export class SpringElement extends IAnalysisElement {
  /**
   * @param {import('../modeling/Element.js').Element} modelElement
   * @param {import('../modeling/Node.js').Node} nodeI
   * @param {import('../modeling/Node.js').Node} nodeJ
   */
  constructor(modelElement, nodeI, nodeJ) {
    super(modelElement, nodeI, nodeJ);
    this.k = modelElement.properties.stiffness ?? 1000;
    const geom = IAnalysisElement.geometry(nodeI, nodeJ);
    this.length = geom.L;
    this.cx = geom.cx;
    this.cy = geom.cy;
    this.angle = geom.angle;
  }

  getGlobalDOFIndices(dofManager) {
    return dofManager.getElementDOFIndices(this.nodeI.id, this.nodeJ.id);
  }

  /** Local 2x2 axial stiffness, in terms of the two nodes' displacement along the spring axis. */
  getLocalStiffnessMatrix() {
    const k = this.k;
    return Matrix.fromArray([
      [k, -k],
      [-k, k],
    ]);
  }

  /** 2x6 transformation from global (ux,uy,rz) x2 to local axial DOFs (u_i, u_j). */
  getTransformationMatrix() {
    const { cx, cy } = this;
    return Matrix.fromArray([
      [cx, cy, 0, 0, 0, 0],
      [0, 0, 0, cx, cy, 0],
    ]);
  }

  getGlobalStiffnessMatrix() {
    const T = this.getTransformationMatrix(); // 2x6
    const kLocal = this.getLocalStiffnessMatrix(); // 2x2
    // K_global = T^T * k_local * T  (6x6), a standard congruence transform.
    return T.transpose().multiply(kLocal).multiply(T);
  }

  recoverResults(globalU, dofManager) {
    const indices = this.getGlobalDOFIndices(dofManager);
    const uGlobal = indices.map((i) => globalU[i]);
    const T = this.getTransformationMatrix();
    // Local axial displacements at each end.
    const uLocal = [0, 1].map((r) =>
      T.data[r].reduce((sum, tij, c) => sum + tij * uGlobal[c], 0)
    );
    const relativeStretch = uLocal[1] - uLocal[0];
    const axialForce = this.k * relativeStretch;
    return {
      type: "Spring",
      elementId: this.id,
      stiffness: this.k,
      elongation: relativeStretch,
      axialForce, // positive = tension
    };
  }
}
