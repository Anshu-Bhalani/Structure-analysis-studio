export class Element {
    constructor(id, startNode, endNode, type = "beam") {
        if (!id) throw new Error("Element must have a valid ID.");
        
        this.id = id;
        this.startNode = startNode; // Can be a string ID or Node object
        this.endNode = endNode;     // Can be a string ID or Node object
        this.type = type;           // 'beam', 'frame', 'truss', 'spring'
        
        this.material = null;
        this.section = null;
        this.springStiffness = 0; // Only used if type === 'spring'
    }
    
    toJSON() {
        return {
            id: this.id,
            startNode: this.startNode?.id || this.startNode,
            endNode: this.endNode?.id || this.endNode,
            type: this.type,
            material: this.material,
            section: this.section,
            springStiffness: this.springStiffness
        };
    }
}
