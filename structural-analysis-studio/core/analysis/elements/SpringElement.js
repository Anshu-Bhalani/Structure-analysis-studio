import { IAnalysisElement } from "./IAnalysisElement.js";
import { Matrix } from "../../math/Matrix.js";

export class SpringElement extends IAnalysisElement {
  constructor(modelElement, nodeI, nodeJ) {
    super(modelElement, nodeI, nodeJ);
    this.k = modelElement.springStiffness ?? 1000; 
    
    const geom = IAnalysisElement.geometry(nodeI, nodeJ);
    this.length = geom.L;
    this.cx = geom.cx;
    this.cy = geom.cy;
    this.angle = geom.angle;
  }

  getGlobalDOFIndices(dofManager) {
    return dofManager.getElementDOFIndices(this.nodeI.id, this.nodeJ.id);
  }

  getLocalStiffnessMatrix() {
    const k = this.k;
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
    const relativeStretch = uLocal[1] - uLocal[0];
    const axialForce = this.k * relativeStretch;
    
    return {
      type: "Spring",
      elementId: this.id,
      stiffness: this.k,
      elongation: relativeStretch,
      axialForce, 
    };
  }
}
