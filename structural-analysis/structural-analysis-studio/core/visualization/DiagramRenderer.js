/**
 * Visualization / DiagramRenderer.js
 * ------------------------------------------------------------------
 * Draws Shear Force Diagrams (SFD) and Bending Moment Diagrams (BMD)
 * offset from each Beam element. V1 supports nodal loads only, so
 * shear is constant and moment varies linearly along each member —
 * both are fully described by the two end values the Beam element
 * already recovered.
 * ------------------------------------------------------------------
 */

export class DiagramRenderer {
  /**
   * @param {Array} beamResults  elementResults filtered to type === "Beam"
   */
  static drawSFD(ctx, camera, width, height, model, beamResults, colors, pixelScale) {
    DiagramRenderer._drawDiagram(ctx, camera, width, height, model, beamResults, colors, pixelScale, "shear", colors.sfd);
  }

  static drawBMD(ctx, camera, width, height, model, beamResults, colors, pixelScale) {
    DiagramRenderer._drawDiagram(ctx, camera, width, height, model, beamResults, colors, pixelScale, "moment", colors.bmd);
  }

  static _drawDiagram(ctx, camera, width, height, model, beamResults, colors, pixelScale, kind, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.5;

    beamResults.forEach((result) => {
      const element = model.getElement(result.elementId);
      if (!element) return;
      const nodeI = model.getNode(element.nodeI);
      const nodeJ = model.getNode(element.nodeJ);
      if (!nodeI || !nodeJ) return;

      const dx = nodeJ.x - nodeI.x;
      const dy = nodeJ.y - nodeI.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const perpX = -uy;
      const perpY = ux;

      const valueI = kind === "shear" ? result.shearI : result.momentI;
      // Note: end-j value is negated for shear (equal/opposite equilibrium pair)
      const valueJ = kind === "shear" ? -result.shearJ : result.momentJ;

      const [sxi, syi] = camera.worldToScreen(nodeI.x, nodeI.y, width, height);
      const [sxj, syj] = camera.worldToScreen(nodeJ.x, nodeJ.y, width, height);

      const offsetI = valueI * pixelScale;
      const offsetJ = valueJ * pixelScale;

      const px1 = sxi + perpX * offsetI * -1;
      const py1 = syi - perpY * offsetI * -1;
      const px2 = sxj + perpX * offsetJ * -1;
      const py2 = syj - perpY * offsetJ * -1;

      ctx.beginPath();
      ctx.moveTo(sxi, syi);
      ctx.lineTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.lineTo(sxj, syj);
      ctx.stroke();

      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.moveTo(sxi, syi);
      ctx.lineTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.lineTo(sxj, syj);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.85;
    });
    ctx.restore();
  }
}
