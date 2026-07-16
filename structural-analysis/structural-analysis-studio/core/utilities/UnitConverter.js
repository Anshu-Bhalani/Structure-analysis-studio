/**
 * Utilities / UnitConverter.js
 * ------------------------------------------------------------------
 * Simple unit conversion helpers used across UI/Modeling/Visualization.
 * All internal calculations are done in a single consistent base
 * unit system (SI: meters, Newtons, Pascals) and converted only at
 * the UI boundary for display.
 * ------------------------------------------------------------------
 */

export const LENGTH_UNITS = {
  m: 1,
  cm: 0.01,
  mm: 0.001,
  ft: 0.3048,
  in: 0.0254,
};

export const FORCE_UNITS = {
  N: 1,
  kN: 1000,
  lbf: 4.4482216153,
  kip: 4448.2216153,
};

export class UnitConverter {
  static toBaseLength(value, unit) {
    return value * (LENGTH_UNITS[unit] ?? 1);
  }

  static fromBaseLength(value, unit) {
    return value / (LENGTH_UNITS[unit] ?? 1);
  }

  static toBaseForce(value, unit) {
    return value * (FORCE_UNITS[unit] ?? 1);
  }

  static fromBaseForce(value, unit) {
    return value / (FORCE_UNITS[unit] ?? 1);
  }

  static format(value, decimals = 3) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 1e-9) return (0).toFixed(decimals);
    return value.toFixed(decimals);
  }
}
