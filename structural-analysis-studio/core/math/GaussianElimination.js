/**
 * GaussianElimination.js
 * Core linear equation solver for Structural Analysis Studio.
 */

import { Vector } from './Vector.js';

export class GaussianElimination {
    /**
     * Solves the system K * x = F for the unknown vector x.
     * 
     * @param {Matrix} K - The global stiffness matrix.
     * @param {Vector} F - The load vector.
     * @param {number} tolerance - Threshold to detect zero (prevents divide-by-zero).
     * @returns {Object} Object containing { solution, status, error }.
     */
    static solve(K, F, tolerance = 1e-10) {
        // --- Error Detection: Invalid size ---
        if (!K.isSquare()) {
            return { 
                solution: null, 
                status: 'error', 
                error: `Invalid size: Stiffness matrix K must be square (is ${K.rows}x${K.cols}).` 
            };
        }
        if (K.rows !== F.length) {
            return { 
                solution: null, 
                status: 'error', 
                error: `Invalid size: Matrix K (${K.rows} rows) and Vector F (${F.length} elements) mismatch.` 
            };
        }

        const n = K.rows;
        
        // Clone internal arrays to prevent mutating the original K and F objects
        const a = K.toArray();
        const b = F.toArray();

        // --- Forward Elimination with Partial Pivoting ---
        for (let i = 0; i < n; i++) {
            
            // 1. Partial Pivoting: Find the row with the largest absolute value in the current column
            let maxRow = i;
            let maxVal = Math.abs(a[i][i]);

            for (let k = i + 1; k < n; k++) {
                if (Math.abs(a[k][i]) > maxVal) {
                    maxVal = Math.abs(a[k][i]);
                    maxRow = k;
                }
            }

            // --- Error Detection: Singular matrix / Divide by zero ---
            // If the maximum pivot is near zero, the matrix is unstable/singular.
            // In structural analysis, this usually means a structure is a mechanism (not properly supported).
            if (maxVal < tolerance) {
                return { 
                    solution: null, 
                    status: 'error', 
                    error: `Singular matrix or unstable structure detected at DOF ${i + 1}. Check boundary conditions.` 
                };
            }

            // 2. Swap the current row with the max pivot row
            if (maxRow !== i) {
                const tempRowA = a[i];
                a[i] = a[maxRow];
                a[maxRow] = tempRowA;

                const tempValB = b[i];
                b[i] = b[maxRow];
                b[maxRow] = tempValB;
            }

            // 3. Forward Elimination: Create zeros below the pivot
            for (let j = i + 1; j < n; j++) {
                const factor = a[j][i] / a[i][i];
                
                // Only iterate from column 'i' onwards, as previous columns are already zero
                for (let k = i; k < n; k++) {
                    a[j][k] -= factor * a[i][k];
                }
                b[j] -= factor * b[i];
            }
        }

        // --- Back Substitution ---
        const x = new Array(n).fill(0);
        
        for (let i = n - 1; i >= 0; i--) {
            let sum = b[i];
            for (let j = i + 1; j < n; j++) {
                sum -= a[i][j] * x[j];
            }
            x[i] = sum / a[i][i];
        }

        // --- Return Result ---
        return {
            solution: Vector.fromArray(x),
            status: 'success',
            error: null
        };
    }
}
