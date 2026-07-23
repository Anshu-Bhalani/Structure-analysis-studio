/**
 * Graphics / renderers / ElementRenderer.js
 * ------------------------------------------------------------------
 * Draws Spring/Bar/Beam elements with visually distinct symbols so
 * the element TYPE is legible on the canvas at a glance. Adding a
 * new element type later only means adding one more case here (and
 * the render code still never touches Modeling or Solver data other
 * than reading node coordinates and the element's declared type).
 * ------------------------------------------------------------------
 */

import { ELEMENT_TYPES } from "../../modeling/Element.js";

export class ElementRenderer {
  static draw(ctx, camera, canvasWidth, canvasHeight, elements, model, colors, selectedElementId, hoveredElementId) {
    elements.forEach((element) => {
      const nodeI = model.getNode(element.nodeI);
      const nodeJ = model.getNode(element.nodeJ);
      if (!nodeI || !nodeJ) return;

      const [sxi, syi] = camera.worldToScreen(nodeI.x, nodeI.y, canvasWidth, canvasHeight);
      const [sxj, syj] = camera.worldToScreen(nodeJ.x, nodeJ.y, canvasWidth, canvasHeight);
      const isSelected = element.id === selectedElementId;
      const isHovered = element.id === hoveredElementId;

      const color = isSelected
        ? colors.accent
        : colors.elementByType[element.type] || colors.element;
      const lineWidth = isSelected || isHovered ? 3.5 : 2.5;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      if (element.type === ELEMENT_TYPES.SPRING) {
        ElementRenderer._drawSpring(ctx, sxi, syi, sxj, syj);
      } else if (element.type === ELEMENT_TYPES.BEAM) {
        ElementRenderer._drawBeam(ctx, sxi, syi, sxj, syj);
      } else {
        // Bar (and any future default line-based element)
        ctx.beginPath();
        ctx.moveTo(sxi, syi);
        ctx.lineTo(sxj, syj);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  /** Zig-zag coil symbol, universally recognized as a spring. */
  static _drawSpring(ctx, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    const perpX = -uy;
    const perpY = ux;

    const coilCount = 8;
    const coilAmplitude = 8;
    const straightEnd = Math.min(14, length * 0.15);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const sx1 = x1 + ux * straightEnd;
    const sy1 = y1 + uy * straightEnd;
    ctx.lineTo(sx1, sy1);

    const coilLength = length - straightEnd * 2;
    for (let i = 0; i <= coilCount; i++) {
      const t = i / coilCount;
      const alongX = sx1 + ux * coilLength * t;
      const alongY = sy1 + uy * coilLength * t;
      const side = i % 2 === 0 ? 1 : -1;
      const px = alongX + perpX * coilAmplitude * side * (i === 0 || i === coilCount ? 0 : 1);
      const py = alongY + perpY * coilAmplitude * side * (i === 0 || i === coilCount ? 0 : 1);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x2 - ux * straightEnd, y2 - uy * straightEnd);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  /** Beam drawn as a thicker double line (I-beam flavor) to distinguish it from a Bar. */
  static _drawBeam(ctx, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const perpX = (-dy / length) * 3;
    const perpY = (dx / length) * 3;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.save();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1 + perpX, y1 + perpY);
    ctx.lineTo(x2 + perpX, y2 + perpY);
    ctx.moveTo(x1 - perpX, y1 - perpY);
    ctx.lineTo(x2 - perpX, y2 - perpY);
    ctx.stroke();
    ctx.restore();
  }
}
