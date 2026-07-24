export class Model {
    constructor(name) {
        this.name = name;
        this.nodes = new Map();
        this.elements = new Map();
        this.materials = new Map();
        this.sections = new Map();
        this.supports = new Map();
        this.loads = new Map(); // Added Loads Map
        this.results = null;
    }

    // Node Methods
    addNode(node) { this.nodes.set(node.id, node); this._invalidateResults(); }
    findNodeById(id) { return this.nodes.get(id); }

    // Element Methods
    addElement(element) { this.elements.set(element.id, element); this._invalidateResults(); }
    deleteElement(elementId) { this.elements.delete(elementId); this._invalidateResults(); }
    findElementById(id) { return this.elements.get(id); } // Added for consistency

    // Safe Deletion Logic
    deleteNode(nodeId, deleteConnected = false) {
        let connectedElements = [];
        for (const [id, element] of this.elements.entries()) {
            if ((element.startNode?.id || element.startNode) === nodeId || 
                (element.endNode?.id || element.endNode) === nodeId) {
                connectedElements.push(element.id);
            }
        }

        if (connectedElements.length > 0 && !deleteConnected) return { success: false, connectedElements };
        if (deleteConnected) connectedElements.forEach(elementId => this.deleteElement(elementId));

        // Clean up support attached to this node
        for (const [supportId, support] of this.supports.entries()) {
            if ((support.node?.id || support.node) === nodeId) this.removeSupport(supportId);
        }

        this.nodes.delete(nodeId);
        this._invalidateResults();
        return { success: true };
    }

    // Support Methods
    addSupport(support) { this.supports.set(support.id, support); this._invalidateResults(); }
    removeSupport(supportId) { this.supports.delete(supportId); this._invalidateResults(); }
    getSupport(supportId) { return this.supports.get(supportId); }
    getSupports() { return Array.from(this.supports.values()); }

    // --- Load Methods ---
    addLoad(load) { this.loads.set(load.id, load); this._invalidateResults(); }
    removeLoad(loadId) { this.loads.delete(loadId); this._invalidateResults(); }
    getLoad(loadId) { return this.loads.get(loadId); }
    getLoads() { return Array.from(this.loads.values()); }

    // State Management
    _invalidateResults() { this.results = null; }

    toJSON() {
        const out = { name: this.name, nodes: [], elements: [], supports: [], loads: [] };
        this.nodes.forEach(n => out.nodes.push(n.toJSON ? n.toJSON() : n));
        this.elements.forEach(e => out.elements.push(e.toJSON ? e.toJSON() : e));
        this.supports.forEach(s => out.supports.push(s.toJSON ? s.toJSON() : s));
        this.loads.forEach(l => out.loads.push(l.toJSON ? l.toJSON() : l));
        return JSON.stringify(out, null, 2);
    }
}
