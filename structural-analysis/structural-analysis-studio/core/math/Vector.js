/**
 * Mathematics / Vector.js
 * ------------------------------------------------------------------
 * Pure numerical vector operations. No engineering meaning is
 * attached to any value here.
 * ------------------------------------------------------------------
 */

export class Vector {
  static zeros(size) {
    return new Array(size).fill(0);
  }

  static length(a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Angle (radians) of the vector from point a to point b, measured from +X axis. */
  static angle(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  static add(a, b) {
    return a.map((v, i) => v + b[i]);
  }

  static subtract(a, b) {
    return a.map((v, i) => v - b[i]);
  }

  static scale(a, k) {
    return a.map((v) => v * k);
  }

  static dot(a, b) {
    return a.reduce((sum, v, i) => sum + v * b[i], 0);
  }

  static magnitude(a) {
    return Math.sqrt(Vector.dot(a, a));
  }

  static normalize(a) {
    const m = Vector.magnitude(a);
    return m === 0 ? a.slice() : Vector.scale(a, 1 / m);
  }
}
