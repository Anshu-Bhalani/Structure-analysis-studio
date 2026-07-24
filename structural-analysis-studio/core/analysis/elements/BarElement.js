import { IAnalysisElement } from "./IAnalysisElement.js";
import { Matrix } from "../../math/Matrix.js";

export class BarElement extends IAnalysisElement {
  constructor(modelElement, nodeI, nodeJ, material, section) {
    super(modelElement, nodeI, nodeJ);
    this.E = material.E;
    this.A = section.area; 
    
    const geom = IAnalysisElement.geometry(nodeI, nodeJ);
    this.length = geom.L;
    this.cx = geom.cx;
    this.cy = geom.cy;
    this.angle = geom.angle;
    if (this.length === 0) {
      throw new Error(`BarElement ${this.id}: zero-length element is not permitted`);
    }
  }

  get axialStiffness() {
    return (this.E * this.A) / this.length;
  }

  getGlobalDOFIndices(dofManager) {
    return dofManager.getElementDOFIndices(this.nodeI.id, this.nodeJ.id);
  }

  getLocalStiffnessMatrix() {
    const k = this.axialStiffness;
    return Matrix.fromArray([
      [k, -k],
      [-k, k],
    ]);
  }

  getTransformationMatrix() {
    const { cx, cy } = this;
    return Matrix.fromArray([
      [cx, cy, 0, 0, 0, 0],
      [0, 0, 0, cx, cy, 0],
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
    const uLocal = [0, 1].map((r) =>
      T.data[r].reduce((sum, tij, c) => sum + tij * uGlobal[c], 0)
    );
    const strain = (uLocal[1] - uLocal[0]) / this.length;
    const axialForce = this.axialStiffness * (uLocal[1] - uLocal[0]);
    const stress = this.A !== 0 ? axialForce / this.A : 0;
    return {
      type: "Bar",
      elementId: this.id,
      length: this.length,
      axialStiffness: this.axialStiffness,
      elongation: uLocal[1] - uLocal[0],
      strain,
      axialForce, 
      stress,
    };
  }
}
