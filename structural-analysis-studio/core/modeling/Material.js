/**
 * Material.js
 * Represents a structural material (e.g., Steel, Concrete, Aluminium).
 */

export class Material {
    /**
     * Create a Material.
     * @param {string} id - Unique identifier (e.g., "MAT1").
     * @param {string} name - Human-readable name (e.g., "A36 Steel").
     * @param {string} category - Category (e.g., "Steel", "Concrete").
     * @param {number} E - Young's Modulus (Internal units: Pa).
     * @param {number} G - Shear Modulus (Internal units: Pa).
     * @param {number} poissonRatio - Poisson's Ratio (dimensionless).
     * @param {number} density - Material density/unit weight (Internal units: kg/m³ or N/m³).
     */
    constructor(id, name, category, E, G, poissonRatio, density) {
        if (!id) throw new Error("Material must have a valid ID.");
        
        // Basic Properties
        this.id = id;
        this.name = name;
        this.category = category;
        
        // Mechanical Properties
        this.E = E;
        this.G = G;
        this.poissonRatio = poissonRatio;
        this.density = density;

        // Reserved for future versions (V2+)
        this.yieldStrength = null;
        this.ultimateStrength = null;
        this.thermalExpansion = null;

        // Run initial validation
        this.validate();
    }

    // ==========================================
    // Property Getters
    // ==========================================

    /** Gets a specific property dynamically by name. */
    getProperty(propertyName) {
        if (this[propertyName] !== undefined) {
            return this[propertyName];
        }
        throw new Error(`Property '${propertyName}' does not exist on Material.`);
    }

    /** Gets Young's Modulus (E). */
    getE() {
        return this.E;
    }

    /** Gets Shear Modulus (G). */
    getG() {
        return this.G;
    }

    /** Gets Density. */
    getDensity() {
        return this.density;
    }

    // ==========================================
    // Edit & Modification
    // ==========================================

    /** Renames the material. */
    rename(newName) {
        if (typeof newName !== 'string' || newName.trim() === '') {
            throw new Error("Material name must be a valid string.");
        }
        this.name = newName;
    }

    /** 
     * Modifies multiple properties at once.
     * @param {Object} properties - Object containing properties to update.
     */
    modifyProperties(properties) {
        for (const key in properties) {
            if (Object.prototype.hasOwnProperty.call(this, key) && key !== 'id') {
                this[key] = properties[key];
            }
        }
        this.validate(); // Ensure new properties are physically valid
    }

    // ==========================================
    // Validation
    // ==========================================

    /** 
     * Validates that the mechanical properties are physically possible.
     * Throws an error if validation fails.
     */
    validate() {
        if (typeof this.E !== 'number' || this.E <= 0) {
            throw new Error(`Invalid Material [${this.id}]: Young's Modulus (E) must be greater than 0.`);
        }
        if (typeof this.density !== 'number' || this.density <= 0) {
            throw new Error(`Invalid Material [${this.id}]: Density must be greater than 0.`);
        }
        return true;
    }

    // ==========================================
    // Serialization
    // ==========================================

    /** Serializes the material to a plain JSON object. */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            E: this.E,
            G: this.G,
            poissonRatio: this.poissonRatio,
            density: this.density,
            yieldStrength: this.yieldStrength,
            ultimateStrength: this.ultimateStrength,
            thermalExpansion: this.thermalExpansion
        };
    }

    /** Reconstructs a Material instance from a parsed JSON object. */
    static fromJSON(data) {
        const material = new Material(
            data.id,
            data.name,
            data.category,
            data.E,
            data.G,
            data.poissonRatio,
            data.density
        );
        
        // Restore future/optional properties if they exist
        if (data.yieldStrength !== undefined) material.yieldStrength = data.yieldStrength;
        if (data.ultimateStrength !== undefined) material.ultimateStrength = data.ultimateStrength;
        if (data.thermalExpansion !== undefined) material.thermalExpansion = data.thermalExpansion;
        
        return material;
    }
}
