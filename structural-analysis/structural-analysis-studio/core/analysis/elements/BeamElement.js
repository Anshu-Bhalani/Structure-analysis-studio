/**
 * Analysis / BeamElement.js
 * ------------------------------------------------------------------
 * A 2-node Euler-Bernoulli BENDING beam element.
 *
 * Scope of "Beam" in this version (deliberately, to keep the module
 * independent of Frame): it carries transverse shear and bending
 * moment only. It does NOT carry axial force — an element that
 * combines bending with axial + full 3D generality is exactly what
 * the future "Frame" module will add, without touching this file.
 *
 * The element can still be drawn at any angle: the 4 local bending
 * DOFs (v_i, theta_i, v_j, theta_j) are transformed into the global
 * (ux, uy, rz) system using the member's orientation angle.
 * ------------------------------------------------------------------
 */

import { IAnalysisElement } from "./IAnalysisElement.js";
import { Matrix } from "../mathematics/Matrix.js";

export class BeamElement extends IAnalysisElement {
  /**
   * @param {import('../modeling/Element.js').Element} modelElement
   * @param {import('../modeling/Node.js').Node} nodeI
   * @param {import('../modeling/Node.js').Node} nodeJ
   * @param {import('../modeling/Material.js').Material} material
   * @param {import('../modeling/Section.js').Section} section
   */
  constructor(modelElement, nodeI, nodeJ, material, section) {
    super(modelElement, nodeI, nodeJ);
    this.E = material.E;
    this.I = section.I;
    const geom = IAnalysisElement.geometry(nodeI, nodeJ);
    this.length = geom.L;
    this.angle = geom.angle;
    if (this.length === 0) {
      throw new Error(`BeamElement ${this.id}: zero-length element is not permitted`);
    }
  }

  getGlobalDOFIndices(dofManager) {
    return dofManager.getElementDOFIndices(this.nodeI.id, this.nodeJ.id);
  }

  /** Local 4x4 bending stiffness for DOF order [v_i, theta_i, v_j, theta_j]. */
  getLocalStiffnessMatrix() {
    const { E, I, length: L } = this;
    const k = (E * I) / (L * L * L);
    return Matrix.fromArray([
      [12 * k, 6 * L * k, -12 * k, 6 * L * k],
      [6 * L * k, 4 * L * L * k, -6 * L * k, 2 * L * L * k],
      [-12 * k, -6 * L * k, 12 * k, -6 * L * k],
      [6 * L * k, 2 * L * L * k, -6 * L * k, 4 * L * L * k],
    ]);
  }

  /**
   * 4x6 transformation from global (ux,uy,rz) at each node to the
   * local bending DOFs [v_i, theta_i, v_j, theta_j].
   * v (transverse displacement) = -sin(angle)*ux + cos(angle)*uy
   * theta is a rotation about the global Z axis, which is invariant
   * under a 2D in-plane rotation, so theta = rz directly.
   */
  getTransformationMatrix() {
    const s = Math.sin(this.angle);
    const c = Math.cos(this.angle);
    return Matrix.fromArray([
      [-s, c, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, -s, c, 0],
      [0, 0, 0, 0, 0, 1],
    ]);
  }

  getGlobalStiffnessMatrix() {
    const T = this.getTransformationMatrix(); // 4x6
    const kLocal = this.getLocalStiffnessMatrix(); // 4x4
    return T.transpose().multiply(kLocal).multiply(T); // 6x6
  }

  /**
   * Recovers local end shear/moment and provides everything the
   * Visualization module needs to draw a deflected shape, SFD and BMD.
   * V1 supports nodal loads only, so shear is constant and moment is
   * linear along the member between the two recovered end values.
   */
  recoverResults(globalU, dofManager) {
    const indices = this.getGlobalDOFIndices(dofManager);
    const uGlobal = indices.map((i) => globalU[i]);
    const T = this.getTransformationMatrix();
    const uLocal = [0, 1, 2, 3].map((r) =>
      T.data[r].reduce((sum, tij, c) => sum + tij * uGlobal[c], 0)
    );
    const kLocal = this.getLocalStiffnessMatrix();
    const fLocal = [0, 1, 2, 3].map((r) =>
      kLocal.data[r].reduce((sum, kij, c) => sum + kij * uLocal[c], 0)
    );

    const [vI, thetaI, vJ, thetaJ] = uLocal;
    const [shearI, momentI, shearJ, momentJ] = fLocal;

    return {
      type: "Beam",
      elementId: this.id,
      length: this.length,
      localDisplacements: { vI, thetaI, vJ, thetaJ },
      shearI, // shear at node i (local)
      momentI, // moment at node i (local)
      shearJ, // shear at node j (local)
      momentJ, // moment at node j (local)
    };
  }
}
