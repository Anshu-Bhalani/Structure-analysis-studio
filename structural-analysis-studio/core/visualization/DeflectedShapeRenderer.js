/**
 * Visualization / DeflectedShapeRenderer.js
 * ------------------------------------------------------------------
 * Draws the deformed shape of the structure using the global
 * displacement vector U produced by the Solver. Displacements are
 * exaggerated by a scale factor purely for visibility — this module
 * never re-derives or re-checks the numbers, it only draws them.
 * ------------------------------------------------------------------
 */

export class DeflectedShapeRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('../graphics/Camera.js').Camera} camera
   * @param {import('../modeling/Model.js').Model} model
   * @param {import('../solver/DOFManager.js').DOFManager} dofManager
   * @param {number[]} U global displacement vector
   * @param {number} scale exaggeration factor
   * @param {object} colors
   */
  static draw(ctx, camera, width, height, model, dofManager, U, scale, colors) {
    ctx.save();
    ctx.strokeStyle = colors.deflected;
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;

    for (const element of model.getAllElements()) {
      const nodeI = model.getNode(element.nodeI);
      const nodeJ = model.getNode(element.nodeJ);
      if (!nodeI || !nodeJ) continue;

      const [uxI, uyI] = dofManager.getNodeDOFIndices(nodeI.id);
      const [uxJ, uyJ] = dofManager.getNodeDOFIndices(nodeJ.id);

      const dxI = nodeI.x + U[uxI] * scale;
      const dyI = nodeI.y + U[uyI] * scale;
      const dxJ = nodeJ.x + U[uxJ] * scale;
      const dyJ = nodeJ.y + U[uyJ] * scale;

      const [sxi, syi] = camera.worldToScreen(dxI, dyI, width, height);
      const [sxj, syj] = camera.worldToScreen(dxJ, dyJ, width, height);

      ctx.beginPath();
      ctx.moveTo(sxi, syi);
      ctx.lineTo(sxj, syj);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }
}
