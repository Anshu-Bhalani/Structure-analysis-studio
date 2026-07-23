/**
 * Utilities / Validation.js
 * ------------------------------------------------------------------
 * Generic, domain-agnostic validation helpers. Engineering-specific
 * validation rules (e.g. "a beam needs a section") live in the
 * Modeling module, not here — this file only offers primitives.
 * ------------------------------------------------------------------
 */

export class Validation {
  static isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  static isPositiveNumber(value) {
    return Validation.isFiniteNumber(value) && value > 0;
  }

  static isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  static inRange(value, min, max) {
    return Validation.isFiniteNumber(value) && value >= min && value <= max;
  }

  static assert(condition, message) {
    if (!condition) {
      throw new Error(`Validation failed: ${message}`);
    }
  }
}
