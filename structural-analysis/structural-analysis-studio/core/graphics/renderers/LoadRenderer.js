/**
 * Graphics / renderers / LoadRenderer.js
 * ------------------------------------------------------------------
 * Draws nodal load arrows (Fx, Fy) and a curved arrow for moment (Mz).
 * ------------------------------------------------------------------
 */

export class LoadRenderer {
  static draw(ctx, camera, canvasWidth, canvasHeight, loads, model, colors) {
    loads.forEach((load) => {
      const node = model.getNode(load.nodeId);
      if (!node) return;
      const [sx, sy] = camera.worldToScreen(node.x, node.y, canvasWidth, canvasHeight);

      ctx.save();
      ctx.strokeStyle = colors.load;
      ctx.fillStyle = colors.load;
      ctx.lineWidth = 2;

      const arrowLen = 42;
      if (load.Fx) {
        const dir = Math.sign(load.Fx);
        LoadRenderer._arrow(ctx, sx - dir * arrowLen, sy, sx, sy);
      }
      if (load.Fy) {
        // +Fy is up in world space => up is -screenY
        const dir = Math.sign(load.Fy);
        LoadRenderer._arrow(ctx, sx, sy + dir * arrowLen, sx, sy);
      }
      if (load.Mz) {
        LoadRenderer._momentArc(ctx, sx, sy, 18, load.Mz > 0);
      }
      ctx.restore();
    });
  }

  static _arrow(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  static _momentArc(ctx, cx, cy, radius, counterClockwise) {
    ctx.beginPath();
    const start = -Math.PI * 0.2;
    const end = Math.PI * 1.3;
    ctx.arc(cx, cy, radius, start, end, counterClockwise);
    ctx.stroke();

    const tipAngle = counterClockwise ? start : end;
    const tipX = cx + radius * Math.cos(tipAngle);
    const tipY = cy + radius * Math.sin(tipAngle);
    const tangent = tipAngle + (counterClockwise ? Math.PI / 2 : -Math.PI / 2);
    const headLen = 7;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(tangent - Math.PI / 6), tipY - headLen * Math.sin(tangent - Math.PI / 6));
    ctx.lineTo(tipX - headLen * Math.cos(tangent + Math.PI / 6), tipY - headLen * Math.sin(tangent + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}
