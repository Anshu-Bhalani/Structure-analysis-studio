/**
 * shared/constants/engineering-constants.js
 * ------------------------------------------------------------------
 * Physical constants and engineering reference values shared by
 * Core Engine modules (and, later, backend validation). These are
 * universal facts, not app defaults — app defaults belong in
 * core/config/Config.js instead.
 * ------------------------------------------------------------------
 */

export const GRAVITY_M_S2 = 9.80665; // standard gravity, m/s^2

export const PROJECT_FILE_FORMAT_VERSION = 1; // must match
// core/storage/JSONSerializer.js's PROJECT_FORMAT_VERSION; kept here
// too so a future backend can validate uploaded project files without
// importing core/ (see backend/database/README.md).

export const DOF_PER_NODE_2D = 3; // [dx, dy, rotation] — Bar/Beam/Frame 2D
export const DOF_PER_NODE_3D = 6; // [dx, dy, dz, rx, ry, rz] — Frame 3D, Grid, Shell

export const STEEL_YIELD_STRENGTH_PA = 250e6; // structural steel, ASTM A36, Pa
