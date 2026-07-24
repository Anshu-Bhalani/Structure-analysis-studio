/**
 * Section.js
 * Represents a structural cross-section (e.g., IPE 300, Rectangle, Tube).
 */

export class Section {
    /**
     * Create a cross-section.
     * @param {string} id - Unique identifier (e.g., "SEC1").
     * @param {string} name - Human-readable name (e.g., "IPE 300").
     * @param {string} shape - Shape classification (e.g., "I-Beam", "Rectangle", "Circle").
     * @param {number} area - Cross-sectional area (A).
     * @param {number} Iy - Moment of inertia about the local y-axis.
     * @param {number} Iz - Moment of inertia about the local z-axis.
     * @param {number} J - Torsional constant.
     * @param {Object} [dimensions={}] - Key-value pairs of raw dimensions (e.g., { width: 0.15, height: 0.30 }).
     */
    constructor(id, name, shape, area, Iy, Iz, J, dimensions = {}) {
        if (!id) throw new Error("Section must have a valid ID.");
        
        // Basic Properties
        this.id = id;
        this.name = name;
        this.shape = shape;
        
        // Geometric Properties (Internal units: m², m⁴)
        this.area = area;
        this.Iy = Iy;
        this.Iz = Iz;
        this.J = J;
        
        // Dimensional Data
        this.dimensions = dimensions;

        // Run initial validation
        this.validate();
    }

    // ==========================================
    // Geometry Getters
    // ==========================================

    /** Gets the cross-sectional area (A). */
    getArea() {
        return this.area;
    }

    /** 
     * Gets the moments of inertia and torsional constant.
     * @returns {Object} Object containing { Iy, Iz, J }.
     */
    getInertia() {
        return {
            Iy: this.Iy,
            Iz: this.Iz,
            J: this.J
        };
    }

    /** Gets the raw dimensions object. */
    getDimensions() {
        return this.dimensions;
    }

    // ==========================================
    // Edit & Modification
    // ==========================================

    /**
     * Updates the geometric properties of the section.
     */
    updateGeometry(area, Iy, Iz, J, dimensions = this.dimensions) {
        this.area = area;
        this.Iy = Iy;
        this.Iz = Iz;
        this.J = J;
        this.dimensions = dimensions;
        
        this.validate(); // Ensure new properties are physically valid
    }

    // ==========================================
    // Validation
    // ==========================================

    /** 
     * Validates that the geometric properties are physically possible.
     * Throws an error if validation fails.
     */
    validate() {
        if (typeof this.area !== 'number' || this.area <= 0) {
            throw new Error(`Invalid Section [${this.id}]: Area must be greater than 0.`);
        }
        if (typeof this.Iy !== 'number' || this.Iy <= 0) {
            throw new Error(`Invalid Section [${this.id}]: Moment of Inertia (Iy) must be greater than 0.`);
        }
        
        // Note: Iz and J can technically be 0 for idealized 2D beam elements that only 
        // calculate vertical bending, but Area and Iy are strictly required.
        return true;
    }

    // ==========================================
    // Serialization
    // ==========================================

    /** Serializes the section to a plain JSON object[span_1](start_span)[span_1](end_span). */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            shape: this.shape,
            area: this.area,
            Iy: this.Iy,
            Iz: this.Iz,
            J: this.J,
            dimensions: this.dimensions
        };
    }

    /** Reconstructs a Section instance from a parsed JSON object[span_2](start_span)[span_2](end_span). */
    static fromJSON(data) {
        return new Section(
            data.id,
            data.name,
            data.shape,
            data.area,
            data.Iy,
            data.Iz,
            data.J,
            data.dimensions || {}
        );
    }
}
