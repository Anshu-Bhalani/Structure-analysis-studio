/**
 * Matrix.js
 * Core mathematics library for Structural Analysis Studio.
 */

export class Matrix {
    /**
     * Create a matrix.
     * @param {number|number[][]} rowsOrArray - Number of rows, or a 2D array to initialize from.
     * @param {number} [cols] - Number of columns (if first argument is a number).
     */
    constructor(rowsOrArray, cols) {
        if (Array.isArray(rowsOrArray)) {
            // Initialize from 2D array
            this.data = rowsOrArray.map(row => [...row]);
            this._rows = this.data.length;
            this._cols = this.data[0] ? this.data[0].length : 0;
        } else {
            // Initialize empty (zero) matrix
            this._rows = rowsOrArray;
            this._cols = cols;
            this.data = Array.from({ length: this._rows }, () => Array(this._cols).fill(0));
        }
    }

    // --- Matrix Creation ---

    /** Creates a matrix filled with zeros. */
    static zeros(rows, cols) {
        return new Matrix(rows, cols);
    }

    /** Creates an Identity matrix of given size. */
    static identity(size) {
        const matrix = new Matrix(size, size);
        for (let i = 0; i < size; i++) {
            matrix.set(i, i, 1);
        }
        return matrix;
    }

    /** Creates a matrix from a 2D array. */
    static fromArray(arr) {
        return new Matrix(arr);
    }

    /** Returns a deep copy of this matrix. */
    clone() {
        return new Matrix(this.data);
    }

    // --- Matrix Information ---

    /** Number of rows */
    get rows() {
        return this._rows;
    }

    /** Number of columns */
    get cols() {
        return this._cols;
    }

    /** Check if the matrix is square (rows === cols) */
    isSquare() {
        return this._rows === this._cols;
    }

    /** Returns the size as an array [rows, cols] */
    get size() {
        return [this._rows, this._cols];
    }

    // --- Access ---

    /** Get value at row i, column j (0-indexed) */
    get(i, j) {
        return this.data[i][j];
    }

    /** Set value at row i, column j (0-indexed) */
    set(i, j, value) {
        this.data[i][j] = value;
    }

    /** Get an entire row as a 1D array */
    getRow(i) {
        return [...this.data[i]];
    }

    /** Get an entire column as a 1D array */
    getColumn(j) {
        return this.data.map(row => row[j]);
    }

    // --- Basic Operations ---

    /** Adds another matrix to this one and returns a new Matrix. */
    add(m) {
        if (this.rows !== m.rows || this.cols !== m.cols) {
            throw new Error("Matrix dimensions must match for addition.");
        }
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result.set(i, j, this.get(i, j) + m.get(i, j));
            }
        }
        return result;
    }

    /** Subtracts another matrix from this one and returns a new Matrix. */
    subtract(m) {
        if (this.rows !== m.rows || this.cols !== m.cols) {
            throw new Error("Matrix dimensions must match for subtraction.");
        }
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result.set(i, j, this.get(i, j) - m.get(i, j));
            }
        }
        return result;
    }

    /** Multiplies every element by a scalar value and returns a new Matrix. */
    multiplyScalar(scalar) {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result.set(i, j, this.get(i, j) * scalar);
            }
        }
        return result;
    }

    /** Multiplies this matrix by another matrix (Dot product) and returns a new Matrix. */
    multiply(m) {
        if (this.cols !== m.rows) {
            throw new Error(`Incompatible matrices for multiplication: ${this.cols} cols vs ${m.rows} rows.`);
        }
        const result = new Matrix(this.rows, m.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                let sum = 0;
                for (let k = 0; k < this.cols; k++) {
                    sum += this.get(i, k) * m.get(k, j);
                }
                result.set(i, j, sum);
            }
        }
        return result;
    }

    /** Returns a new Matrix that is the transpose of this one. */
    transpose() {
        const result = new Matrix(this.cols, this.rows);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result.set(j, i, this.get(i, j));
            }
        }
        return result;
    }

    /** Copies the contents of another matrix into this one (overwriting current data). */
    copy(m) {
        this.data = m.data.map(row => [...row]);
        this._rows = m.rows;
        this._cols = m.cols;
    }

    // --- Utility ---

    /** Prints the matrix to the console in a readable format. */
    print() {
        console.table(this.data);
    }

    /** Returns the underlying 2D array. */
    toArray() {
        return this.data.map(row => [...row]);
    }

    /** 
     * Checks if this matrix is equal to another matrix within a specific tolerance.
     * Very important for floating-point structural math.
     */
    equals(m, tolerance = 1e-10) {
        if (this.rows !== m.rows || this.cols !== m.cols) {
            return false;
        }
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (Math.abs(this.get(i, j) - m.get(i, j)) > tolerance) {
                    return false;
                }
            }
        }
        return true;
    }
}
