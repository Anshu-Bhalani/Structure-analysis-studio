/**
 * Graphics / Camera.js
 * ------------------------------------------------------------------
 * Converts between WORLD coordinates (meters, structural model
 * space, +Y up) and SCREEN coordinates (pixels, +Y down, canvas
 * space). Owns pan and zoom state. Knows nothing about nodes,
 * elements, or engineering — purely a 2D viewport.
 * ------------------------------------------------------------------
 */

export class Camera {
  constructor() {
    this.zoom = 80; // pixels per meter
    this.offsetX = 0; // world-space pan offset (pixels applied at draw time)
    this.offsetY = 0;
    this.minZoom = 5;
    this.maxZoom = 800;
  }

  worldToScreen(x, y, canvasWidth, canvasHeight) {
    const sx = canvasWidth / 2 + this.offsetX + x * this.zoom;
    const sy = canvasHeight / 2 + this.offsetY - y * this.zoom;
    return [sx, sy];
  }

  screenToWorld(sx, sy, canvasWidth, canvasHeight) {
    const x = (sx - canvasWidth / 2 - this.offsetX) / this.zoom;
    const y = -(sy - canvasHeight / 2 - this.offsetY) / this.zoom;
    return [x, y];
  }

  pan(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  zoomAt(factor, screenX, screenY, canvasWidth, canvasHeight) {
    const [worldXBefore, worldYBefore] = this.screenToWorld(screenX, screenY, canvasWidth, canvasHeight);
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    const [screenXAfter, screenYAfter] = this.worldToScreen(worldXBefore, worldYBefore, canvasWidth, canvasHeight);
    this.offsetX += screenX - screenXAfter;
    this.offsetY += screenY - screenYAfter;
  }

  reset() {
    this.zoom = 80;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  fitToBounds(minX, minY, maxX, maxY, canvasWidth, canvasHeight, padding = 80) {
    const spanX = Math.max(maxX - minX, 0.5);
    const spanY = Math.max(maxY - minY, 0.5);
    const zoomX = (canvasWidth - padding * 2) / spanX;
    const zoomY = (canvasHeight - padding * 2) / spanY;
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, Math.min(zoomX, zoomY)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.offsetX = -centerX * this.zoom;
    this.offsetY = centerY * this.zoom;
  }
}
