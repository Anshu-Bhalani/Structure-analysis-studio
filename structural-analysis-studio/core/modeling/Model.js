export class Model {
    constructor(name) {
        this.name = name;
        this.nodes = new Map();
        this.elements = new Map(); // Stores our Structural Elements
        this.materials = new Map();
        this.sections = new Map();
        this.results = null;
    }

    // --- Node Methods ---
    addNode(node) {
        this.nodes.set(node.id, node);
        this._invalidateResults();
    }

    findNodeById(id) {
        return this.nodes.get(id);
    }

    // --- Element Methods ---
    addElement(element) {
        this.elements.set(element.id, element);
        this._invalidateResults();
    }

    deleteElement(elementId) {
        this.elements.delete(elementId);
        this._invalidateResults();
    }

    // --- Safe Deletion Logic ---
    deleteNode(nodeId, deleteConnected = false) {
        let connectedElements = [];
        
        // Find all elements attached to this node
        for (const [id, element] of this.elements.entries()) {
            if (element.startNode.id === nodeId || element.endNode.id === nodeId) {
                connectedElements.push(element.id);
            }
        }

        // Reject if connected elements exist and we aren't forcing deletion
        if (connectedElements.length > 0 && !deleteConnected) {
            return { 
                success: false, 
                message: `Node belongs to ${connectedElements.length} element(s).`,
                connectedElements: connectedElements
            };
        }

        // If forced, delete the elements first
        if (deleteConnected) {
            connectedElements.forEach(elementId => this.deleteElement(elementId));
        }

        // Finally delete the node
        this.nodes.delete(nodeId);
        this._invalidateResults();
        
        return { success: true };
    }

    // --- State Management ---
    _invalidateResults() {
        // Clears analysis results when geometry is modified
        this.results = null; 
    }

    toJSON() {
        const out = { 
            name: this.name, 
            nodes: [], 
            elements: [] 
        };
        this.nodes.forEach(n => out.nodes.push(n.toJSON ? n.toJSON() : n));
        this.elements.forEach(e => out.elements.push(e.toJSON ? e.toJSON() : e));
        return JSON.stringify(out, null, 2);
    }
}
