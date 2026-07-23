/**
 * Utilities / Helpers.js
 * ------------------------------------------------------------------
 * Small, generic helper functions with no engineering or UI meaning.
 * ------------------------------------------------------------------
 */

let idCounter = 0;

export function nextId(prefix = "id") {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Date.now().toString(36)}`;
}

export function resetIdCounter() {
  idCounter = 0;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function debounce(fn, wait = 100) {
  let timeout = null;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = clamp(t, 0, 1);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}
