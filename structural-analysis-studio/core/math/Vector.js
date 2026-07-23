/**
 * Vector.js
 * Core vector mathematics library for Structural Analysis Studio.
 */

export class Vector {
    /**
     * Create a vector.
     * @param {number|number[]} lengthOrArray - Number of elements (length), or a 1D array to initialize from.
     */
    constructor(lengthOrArray) {
        if (Array.isArray(lengthOrArray)) {
            // Initialize from 1D array
            this.data = [...lengthOrArray];
            this._length = this.data.length;
        } else {
            // Initialize zero vector of given length
            this._length = lengthOrArray || 0;
            this.data = Array(this._length).fill(0);
        }
    }

    // --- Vector Creation ---

    /** Creates an empty vector (length 0). */
    static empty() {
        return new Vector(0);
    }

    /** Creates a vector filled with zeros of a specific length. */
    static zeros(length) {
        return new Vector(length);
    }

    /** Creates a vector from a 1D array. */
    static fromArray(arr) {
        return new Vector(arr);
    }

    /** Returns a deep copy of this vector. */
    clone() {
        return new Vector(this.data);
    }

    // --- Vector Information ---

    /** Number of elements in the vector. */
    get length() {
        return this._length;
    }

    /** Alias for length, useful when matching Matrix nomenclature. */
    get size() {
        return this._length;
    }

    // --- Access ---

    /** Get value at index i (0-indexed). */
    get(i) {
        return this.data[i];
    }

    /** Set value at index i (0-indexed). */
    set(i, value) {
        this.data[i] = value;
    }

    // --- Operations ---

    /** Adds another vector to this one and returns a new Vector. */
    add(v) {
        if (this.length !== v.length) {
            throw new Error(`Vector dimensions must match for addition: ${this.length} vs ${v.length}.`);
        }
        const result = new Vector(this.length);
        for (let i = 0; i < this.length; i++) {
            result.set(i, this.get(i) + v.get(i));
        }
        return result;
    }

    /** Subtracts another vector from this one and returns a new Vector. */
    subtract(v) {
        if (this.length !== v.length) {
            throw new Error(`Vector dimensions must match for subtraction: ${this.length} vs ${v.length}.`);
        }
        const result = new Vector(this.length);
        for (let i = 0; i < this.length; i++) {
            result.set(i, this.get(i) - v.get(i));
        }
        return result;
    }

    /** Multiplies every element by a scalar value and returns a new Vector. */
    multiplyScalar(scalar) {
        const result = new Vector(this.length);
        for (let i = 0; i < this.length; i++) {
            result.set(i, this.get(i) * scalar);
        }
        return result;
    }

    /** Computes the dot product of this vector and another vector. */
    dot(v) {
        if (this.length !== v.length) {
            throw new Error(`Vector dimensions must match for dot product: ${this.length} vs ${v.length}.`);
        }
        let sum = 0;
        for (let i = 0; i < this.length; i++) {
            sum += this.get(i) * v.get(i);
        }
        return sum;
    }

    /** Computes the magnitude (Euclidean length) of this vector. */
    magnitude() {
        let sumOfSquares = 0;
        for (let i = 0; i < this.length; i++) {
            sumOfSquares += this.get(i) * this.get(i);
        }
        return Math.sqrt(sumOfSquares);
    }

    /** 
     * Returns a new unit vector (magnitude of 1) in the same direction. 
     * Throws an error if the magnitude is zero.
     */
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) {
            throw new Error("Cannot normalize a zero vector.");
        }
        return this.multiplyScalar(1 / mag);
    }

    /** Copies the contents of another vector into this one (overwriting current data). */
    copy(v) {
        this.data = [...v.data];
        this._length = v.length;
    }

    // --- Utility ---

    /** Prints the vector to the console. */
    print() {
        console.table(this.data);
    }

    /** Returns the underlying 1D array. */
    toArray() {
        return [...this.data];
    }
}
