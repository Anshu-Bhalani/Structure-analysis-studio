/**
 * Graphics / Grid.js
 * ------------------------------------------------------------------
 * Draws the background grid and provides snap-to-grid math.
 * ------------------------------------------------------------------
 */

export class Grid {
  constructor(spacing = 0.5) {
    this.spacing = spacing; // world units (meters)
    this.enabled = true;
  }

  snap(x, y) {
    if (!this.enabled) return [x, y];
    const s = this.spacing;
    return [Math.round(x / s) * s, Math.round(y / s) * s];
  }

  draw(ctx, camera, canvasWidth, canvasHeight, colors) {
    const spacing = this.spacing;
    const [worldLeft, worldTop] = camera.screenToWorld(0, 0, canvasWidth, canvasHeight);
    const [worldRight, worldBottom] = camera.screenToWorld(canvasWidth, canvasHeight, canvasWidth, canvasHeight);

    const minX = Math.floor(Math.min(worldLeft, worldRight) / spacing) * spacing;
    const maxX = Math.ceil(Math.max(worldLeft, worldRight) / spacing) * spacing;
    const minY = Math.floor(Math.min(worldTop, worldBottom) / spacing) * spacing;
    const maxY = Math.ceil(Math.max(worldTop, worldBottom) / spacing) * spacing;

    ctx.save();
    ctx.lineWidth = 1;

    for (let x = minX; x <= maxX; x += spacing) {
      const isAxis = Math.abs(x) < 1e-6;
      const [sx] = camera.worldToScreen(x, 0, canvasWidth, canvasHeight);
      ctx.strokeStyle = isAxis ? colors.axis : colors.gridLine;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvasHeight);
      ctx.stroke();
    }

    for (let y = minY; y <= maxY; y += spacing) {
      const isAxis = Math.abs(y) < 1e-6;
      const [, sy] = camera.worldToScreen(0, y, canvasWidth, canvasHeight);
      ctx.strokeStyle = isAxis ? colors.axis : colors.gridLine;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(canvasWidth, sy);
      ctx.stroke();
    }
    ctx.restore();
  }
}
