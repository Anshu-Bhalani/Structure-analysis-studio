/**
 * Model.js
 * The central container for the structural analysis project.
 * Acts as the single source of truth. Knows nothing about solving or UI.
 */

export class Model {
    constructor(name = "New Project") {
        // --- Project Information ---
        this.schemaVersion = "1.0.0"; // Freezing the v1 schema
        this.name = name;
        this.description = "";
        
        // Display units (Solver strictly uses internal units: m, N, Pa)
        this.units = { length: "m", force: "kN", stress: "MPa" };
        this.settings = {};

        // --- Collections ---
        // We use ES6 Maps instead of Arrays. This provides O(1) instant search 
        // by ID and inherently prevents duplicate IDs.
        this.nodes = new Map();
        this.elements = new Map();
        this.materials = new Map();
        this.sections = new Map();
        this.supports = new Map();
        this.loads = new Map();

        // Temporary analysis model data, discarded when the model is modified
        this.results = null; 
    }

    // ==========================================
    // Project Information
    // ==========================================

    renameProject(newName) {
        this.name = newName;
    }

    setDescription(description) {
        this.description = description;
    }

    setUnits(units) {
        this.units = { ...this.units, ...units };
    }

    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this._invalidateResults();
    }

    // ==========================================
    // Collections (Add / Remove)
    // ==========================================

    /** Adds a Node. Throws an error if the ID already exists. */
    addNode(node) {
        if (!node || !node.id) throw new Error("Node must have a valid ID.");
        if (this.nodes.has(node.id)) throw new Error(`Node with ID ${node.id} already exists.`);
        
        this.nodes.set(node.id, node);
        this._invalidateResults();
    }

    removeNode(id) {
        this.nodes.delete(id);
        this._invalidateResults();
    }

    /** Adds an Element. Throws an error if the ID already exists. */
    addElement(element) {
        if (!element || !element.id) throw new Error("Element must have a valid ID.");
        if (this.elements.has(element.id)) throw new Error(`Element with ID ${element.id} already exists.`);
        
        this.elements.set(element.id, element);
        this._invalidateResults();
    }

    removeElement(id) {
        this.elements.delete(id);
        this._invalidateResults();
    }

    /** Adds a Material. Throws an error if the ID already exists. */
    addMaterial(material) {
        if (!material || !material.id) throw new Error("Material must have a valid ID.");
        if (this.materials.has(material.id)) throw new Error(`Material with ID ${material.id} already exists.`);
        
        this.materials.set(material.id, material);
        this._invalidateResults();
    }

    removeMaterial(id) {
        this.materials.delete(id);
        this._invalidateResults();
    }

    /** Adds a Section. Throws an error if the ID already exists. */
    addSection(section) {
        if (!section || !section.id) throw new Error("Section must have a valid ID.");
        if (this.sections.has(section.id)) throw new Error(`Section with ID ${section.id} already exists.`);
        
        this.sections.set(section.id, section);
        this._invalidateResults();
    }

    removeSection(id) {
        this.sections.delete(id);
        this._invalidateResults();
    }

    // Note: Supports and Loads would follow the exact same pattern.
    
    // ==========================================
    // Search
    // ==========================================

    findNodeById(id) {
        return this.nodes.get(id) || null;
    }

    findElementById(id) {
        return this.elements.get(id) || null;
    }

    findMaterialById(id) {
        return this.materials.get(id) || null;
    }

    findSectionById(id) {
        return this.sections.get(id) || null;
    }

    // ==========================================
    // Internal State Management
    // ==========================================

    /**
     * Clears results. Any change affecting analysis immediately marks 
     * existing results as outdated and requires reanalysis[span_2](start_span)[span_2](end_span).
     */
    _invalidateResults() {
        this.results = null;
    }

    // ==========================================
    // Serialization
    // ==========================================

    /** Converts the entire project state to a JSON string[span_3](start_span)[span_3](end_span). */
    toJSON() {
        const data = {
            schemaVersion: this.schemaVersion,
            name: this.name,
            description: this.description,
            units: this.units,
            settings: this.settings,
            // Maps are not natively JSON stringifiable, so we convert their values to Arrays
            nodes: Array.from(this.nodes.values()),
            elements: Array.from(this.elements.values()),
            materials: Array.from(this.materials.values()),
            sections: Array.from(this.sections.values()),
            supports: Array.from(this.supports.values()),
            loads: Array.from(this.loads.values())
        };
        return JSON.stringify(data, null, 2);
    }

    /** 
     * Rebuilds a Model instance from a JSON string.
     * Note: In a full implementation, you would pass these raw objects 
     * into Node.fromJSON(), Element.fromJSON(), etc. to restore their class methods.
     */
    static fromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        const model = new Model(data.name);
        
        model.schemaVersion = data.schemaVersion || "1.0.0";
        model.description = data.description || "";
        model.units = data.units || model.units;
        model.settings = data.settings || model.settings;

        // Reconstruct the Maps
        if (data.nodes) data.nodes.forEach(n => model.nodes.set(n.id, n));
        if (data.elements) data.elements.forEach(e => model.elements.set(e.id, e));
        if (data.materials) data.materials.forEach(m => model.materials.set(m.id, m));
        if (data.sections) data.sections.forEach(s => model.sections.set(s.id, s));
        if (data.supports) data.supports.forEach(s => model.supports.set(s.id, s));
        if (data.loads) data.loads.forEach(l => model.loads.set(l.id, l));

        return model;
    }
}
