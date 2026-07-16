/**
 * Mathematics / GaussianElimination.js
 * ------------------------------------------------------------------
 * Solves the linear system  A x = b  using Gaussian elimination with
 * partial pivoting. Pure numerical routine — knows nothing about
 * stiffness, structures, or DOFs. The Solver module is the only
 * caller that gives physical meaning to A, x and b.
 * ------------------------------------------------------------------
 */

import { Matrix } from "./Matrix.js";

export class GaussianElimination {
  /**
   * @param {Matrix} A  square coefficient matrix (n x n)
   * @param {number[]} b right-hand side vector (length n)
   * @returns {number[]} solution vector x (length n)
   */
  static solve(A, b) {
    const n = A.rows;
    if (A.cols !== n) throw new Error("GaussianElimination: A must be square");
    if (b.length !== n) throw new Error("GaussianElimination: dimension mismatch between A and b");

    // Build augmented matrix [A | b] as plain arrays for speed.
    const aug = A.toArray().map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
      // Partial pivot: find the row with the largest absolute value in this column.
      let pivotRow = col;
      let maxAbs = Math.abs(aug[col][col]);
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(aug[r][col]) > maxAbs) {
          maxAbs = Math.abs(aug[r][col]);
          pivotRow = r;
        }
      }

      if (maxAbs < 1e-12) {
        throw new Error(
          "GaussianElimination: matrix is singular or near-singular. " +
            "The structure may be an unstable mechanism (insufficient supports)."
        );
      }

      if (pivotRow !== col) {
        const tmp = aug[col];
        aug[col] = aug[pivotRow];
        aug[pivotRow] = tmp;
      }

      // Eliminate below the pivot.
      for (let r = col + 1; r < n; r++) {
        const factor = aug[r][col] / aug[col][col];
        if (factor === 0) continue;
        for (let c = col; c <= n; c++) {
          aug[r][c] -= factor * aug[col][c];
        }
      }
    }

    // Back substitution.
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let sum = aug[r][n];
      for (let c = r + 1; c < n; c++) {
        sum -= aug[r][c] * x[c];
      }
      x[r] = sum / aug[r][r];
    }
    return x;
  }
}
