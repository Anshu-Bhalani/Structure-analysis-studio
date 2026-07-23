/**
 * Graphics / renderers / SupportRenderer.js
 * ------------------------------------------------------------------
 * Draws standard structural-engineering support symbols:
 * pin (triangle), roller (triangle + circles), fixed (hatched wall).
 * ------------------------------------------------------------------
 */

export class SupportRenderer {
  static draw(ctx, camera, canvasWidth, canvasHeight, supports, model, colors) {
    supports.forEach((support) => {
      const node = model.getNode(support.nodeId);
      if (!node) return;
      const [sx, sy] = camera.worldToScreen(node.x, node.y, canvasWidth, canvasHeight);

      ctx.save();
      ctx.strokeStyle = colors.support;
      ctx.fillStyle = colors.support;
      ctx.lineWidth = 1.5;

      const { ux, uy, rz } = support.restraints;
      const size = 16;

      if (ux && uy && rz) {
        // Fixed support: hatched ground line
        ctx.beginPath();
        ctx.moveTo(sx - size, sy);
        ctx.lineTo(sx + size, sy);
        ctx.stroke();
        for (let i = -size; i <= size; i += 5) {
          ctx.beginPath();
          ctx.moveTo(sx + i, sy);
          ctx.lineTo(sx + i - 5, sy + 8);
          ctx.stroke();
        }
      } else if (ux && uy) {
        // Pin support: triangle
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - size * 0.6, sy + size);
        ctx.lineTo(sx + size * 0.6, sy + size);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx - size * 0.8, sy + size);
        ctx.lineTo(sx + size * 0.8, sy + size);
        ctx.stroke();
      } else {
        // Roller support (uy only, or ux only): triangle + rollers
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - size * 0.6, sy + size * 0.8);
        ctx.lineTo(sx + size * 0.6, sy + size * 0.8);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx - size * 0.35, sy + size * 0.95, 2.5, 0, Math.PI * 2);
        ctx.arc(sx + size * 0.35, sy + size * 0.95, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
}
