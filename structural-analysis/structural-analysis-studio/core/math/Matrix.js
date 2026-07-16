/**
 * Mathematics / Matrix.js
 * ------------------------------------------------------------------
 * Pure numerical matrix operations.
 *
 * RULE: This module must NEVER contain engineering logic (no DOFs,
 * no stiffness, no elements). It only knows about numbers.
 * ------------------------------------------------------------------
 */

export class Matrix {
  /**
   * @param {number} rows
   * @param {number} cols
   * @param {number[][]=} data
   */
  constructor(rows, cols, data = null) {
    this.rows = rows;
    this.cols = cols;
    this.data = data || Matrix.zerosData(rows, cols);
  }

  static zerosData(rows, cols) {
    const d = new Array(rows);
    for (let i = 0; i < rows; i++) d[i] = new Array(cols).fill(0);
    return d;
  }

  static zeros(rows, cols) {
    return new Matrix(rows, cols);
  }

  static identity(size) {
    const m = Matrix.zeros(size, size);
    for (let i = 0; i < size; i++) m.set(i, i, 1);
    return m;
  }

  /** Build a Matrix from a plain 2D array. */
  static fromArray(arr) {
    const rows = arr.length;
    const cols = arr[0] ? arr[0].length : 0;
    return new Matrix(rows, cols, arr.map((r) => r.slice()));
  }

  get(r, c) {
    return this.data[r][c];
  }

  set(r, c, value) {
    this.data[r][c] = value;
  }

  add(r, c, value) {
    this.data[r][c] += value;
  }

  clone() {
    return new Matrix(this.rows, this.cols, this.data.map((row) => row.slice()));
  }

  transpose() {
    const result = Matrix.zeros(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(j, i, this.get(i, j));
      }
    }
    return result;
  }

  /** Matrix multiplication: this (m x n) * other (n x p) => (m x p) */
  multiply(other) {
    if (this.cols !== other.rows) {
      throw new Error(
        `Matrix.multiply: dimension mismatch (${this.rows}x${this.cols}) * (${other.rows}x${other.cols})`
      );
    }
    const result = Matrix.zeros(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let k = 0; k < this.cols; k++) {
        const v = this.get(i, k);
        if (v === 0) continue;
        for (let j = 0; j < other.cols; j++) {
          result.add(i, j, v * other.get(k, j));
        }
      }
    }
    return result;
  }

  addMatrix(other) {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error("Matrix.addMatrix: dimension mismatch");
    }
    const result = Matrix.zeros(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(i, j, this.get(i, j) + other.get(i, j));
      }
    }
    return result;
  }

  scale(k) {
    const result = Matrix.zeros(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(i, j, this.get(i, j) * k);
      }
    }
    return result;
  }

  /** Extract a sub-matrix given arrays of row and column indices (used for DOF reduction). */
  subMatrix(rowIndices, colIndices) {
    const result = Matrix.zeros(rowIndices.length, colIndices.length);
    for (let i = 0; i < rowIndices.length; i++) {
      for (let j = 0; j < colIndices.length; j++) {
        result.set(i, j, this.get(rowIndices[i], colIndices[j]));
      }
    }
    return result;
  }

  toArray() {
    return this.data.map((row) => row.slice());
  }
}
