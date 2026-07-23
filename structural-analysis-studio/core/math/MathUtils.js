/**
 * MathUtils.js
 * Core mathematical utilities and constants for Structural Analysis Studio.
 * Contains only lightweight helper functions, no complex matrix/vector logic.
 */

export class MathUtils {
    
    // --- Constants ---
    
    /** Standard tolerance for floating-point comparisons in structural analysis. */
    static get EPSILON() { return 1e-10; }
    
    static get PI() { return Math.PI; }
    
    static get TWO_PI() { return 2 * Math.PI; }


    // --- Geometry ---

    /** 
     * Calculates the Euclidean distance between two 2D or 3D points. 
     * (z1 and z2 default to 0 for 2D analysis).
     */
    static distance(x1, y1, x2, y2, z1 = 0, z2 = 0) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /** 
     * Calculates the midpoint between two 2D or 3D points. 
     */
    static midpoint(x1, y1, x2, y2, z1 = 0, z2 = 0) {
        return {
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            z: (z1 + z2) / 2
        };
    }

    /** 
     * Calculates the angle (in radians) of a line from point 1 to point 2.
     * Measured counter-clockwise from the positive X-axis.
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /** Converts degrees to radians. */
    static toRadians(degrees) {
        return degrees * (this.PI / 180);
    }

    /** Converts radians to degrees. */
    static toDegrees(radians) {
        return radians * (180 / this.PI);
    }


    // --- Comparison ---

    /** 
     * Compares two numbers to see if they are strictly equal within a given tolerance. 
     */
    static compare(a, b, tolerance = this.EPSILON) {
        return Math.abs(a - b) <= tolerance;
    }

    /** 
     * Alias for compare, reads more naturally in conditional statements.
     */
    static isEqual(a, b, tolerance = this.EPSILON) {
        return this.compare(a, b, tolerance);
    }

    /** 
     * Checks if a number is effectively zero within a given tolerance. 
     * Crucial for eliminating floating-point dust in stiffness matrices.
     */
    static isZero(value, tolerance = this.EPSILON) {
        return Math.abs(value) <= tolerance;
    }


    // --- Number Utilities ---

    /** 
     * Restricts a value to be within a specified minimum and maximum range.
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /** 
     * Standard rounding to the nearest integer.
     */
    static round(value) {
        return Math.round(value);
    }

    /** 
     * Rounds a number to a specific number of decimal places.
     * (Useful for UI display and generating clean reports).
     */
    static roundToDecimals(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /** 
     * Linear interpolation between a start and end value.
     * (Useful for plotting intermediate points on SFD/BMD diagrams).
     * @param {number} t - Interpolation factor (0.0 to 1.0).
     */
    static lerp(start, end, t) {
        return start + (end - start) * this.clamp(t, 0, 1);
    }


    // --- Validation ---

    /** 
     * Checks if a value is a valid, non-NaN number.
     */
    static isValidNumber(value) {
        return typeof value === 'number' && !Number.isNaN(value);
    }

    /** 
     * Checks if a value is a finite number (not Infinity or -Infinity).
     */
    static isFinite(value) {
        return Number.isFinite(value);
    }
}
