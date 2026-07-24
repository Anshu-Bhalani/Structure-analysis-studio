import { Node } from './Node.js';
import { Element } from './Element.js';
import { Support } from './Support.js';
import { Load } from './Load.js';

export class Model {
    constructor(name) {
        this.name = name;
        this.nodes = new Map();
        this.elements = new Map();
        this.materials = new Map();
        this.sections = new Map();
        this.supports = new Map();
        this.loads = new Map(); 
        this.results = null;
    }

    // --- Utility Methods ---
    isEmpty() {
        return this.nodes.size === 0 && this.elements.size === 0;
    }

    // --- Node Methods ---
    addNode(node) { this.nodes.set(node.id, node); this._invalidateResults(); }
    getNode(id) { return this.nodes.get(id); }
    findNodeById(id) { return this.nodes.get(id); }
    getAllNodes() { return Array.from(this.nodes.values()); }

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

        for (const [supportId, support] of this.supports.entries()) {
            if ((support.node?.id || support.node) === nodeId) this.removeSupport(supportId);
        }

        this.nodes.delete(nodeId);
        this._invalidateResults();
        return { success: true };
    }

    // --- Element Methods ---
    addElement(element) { this.elements.set(element.id, element); this._invalidateResults(); }
    deleteElement(elementId) { this.elements.delete(elementId); this._invalidateResults(); }
    findElementById(id) { return this.elements.get(id); } 
    getAllElements() { return Array.from(this.elements.values()); }

    // --- Support Methods ---
    addSupport(support) { this.supports.set(support.id, support); this._invalidateResults(); }
    removeSupport(supportId) { this.supports.delete(supportId); this._invalidateResults(); }
    getSupport(supportId) { return this.supports.get(supportId); }
    getAllSupports() { return Array.from(this.supports.values()); }

    // --- Load Methods ---
    addLoad(load) { this.loads.set(load.id, load); this._invalidateResults(); }
    removeLoad(loadId) { this.loads.delete(loadId); this._invalidateResults(); }
    getLoad(loadId) { return this.loads.get(loadId); }
    getAllLoads() { return Array.from(this.loads.values()); }

    // --- State Management ---
    _invalidateResults() { this.results = null; }

    // --- Serialization ---
    toJSON() {
        const out = { name: this.name, nodes: [], elements: [], supports: [], loads: [] };
        this.nodes.forEach(n => out.nodes.push(n.toJSON ? n.toJSON() : n));
        this.elements.forEach(e => out.elements.push(e.toJSON ? e.toJSON() : e));
        this.supports.forEach(s => out.supports.push(s.toJSON ? s.toJSON() : s));
        this.loads.forEach(l => out.loads.push(l.toJSON ? l.toJSON() : l));
        return out; 
    }

    static fromJSON(data) {
        const model = new Model(data.name || "Imported Model");
        
        if (data.nodes) data.nodes.forEach(nData => {
            model.addNode(Node.fromJSON ? Node.fromJSON(nData) : Object.assign(new Node(nData.id, nData.x, nData.y), nData));
        });
        
        if (data.elements) data.elements.forEach(eData => {
            const el = new Element(eData.id, eData.startNode, eData.endNode, eData.type);
            el.material = eData.material;
            el.section = eData.section;
            el.springStiffness = eData.springStiffness;
            model.addElement(el);
        });

        if (data.supports) data.supports.forEach(sData => {
            model.addSupport(Support.fromJSON ? Support.fromJSON(sData) : Object.assign(new Support(sData.id, sData.node, sData.type), sData));
        });

        if (data.loads) data.loads.forEach(lData => {
            model.addLoad(Load.fromJSON ? Load.fromJSON(lData) : Object.assign(new Load(lData.id, lData), lData));
        });

        return model;
    }
}
