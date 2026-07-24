import { IAnalysisElement } from "./IAnalysisElement.js";
import { Matrix } from "../../math/Matrix.js";

export class BeamElement extends IAnalysisElement {
  constructor(modelElement, nodeI, nodeJ, material, section) {
    super(modelElement, nodeI, nodeJ);
    this.E = material.E;
    this.I = section.Iy; 
    
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
    const T = this.getTransformationMatrix(); 
    const kLocal = this.getLocalStiffnessMatrix(); 
    return T.transpose().multiply(kLocal).multiply(T); 
  }

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
      shearI,
      momentI,
      shearJ,
      momentJ,
    };
  }
}
