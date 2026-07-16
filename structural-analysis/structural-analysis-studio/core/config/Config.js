/**
 * App / Config.js
 * ------------------------------------------------------------------
 * Static application configuration. No logic — just named constants
 * so magic numbers don't get scattered across the codebase.
 * ------------------------------------------------------------------
 */

export const Config = {
  appName: "Structural Analysis Studio",
  version: "1.0.0",
  formatVersion: 1,

  grid: {
    defaultSpacingMeters: 0.5,
  },

  camera: {
    defaultZoomPxPerMeter: 80,
  },

  visualization: {
    defaultDeflectionScale: 50,
    defaultDiagramPixelScale: 0.02,
  },

  defaults: {
    springStiffness: 1000, // N/m
    materialE: 200e9, // Pa (structural steel)
    sectionA: 0.01, // m^2
    sectionI: 8.33e-6, // m^4
  },
};
