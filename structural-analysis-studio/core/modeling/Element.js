export class Element {
    // We default to 'beam' so previous code doesn't break
    constructor(id, startNode, endNode, type = 'beam') {
        this.id = id;
        this.type = type.toLowerCase(); // 'beam', 'frame', 'truss', 'spring'
        this.startNode = startNode;     // Reference to Node object
        this.endNode = endNode;         // Reference to Node object
        
        // Common property for all elements
        this.label = "";
        
        // Properties specific to Beam, Frame, and Truss
        if (this.type === 'beam' || this.type === 'frame' || this.type === 'truss') {
            this.material = null; 
            this.section = null;  
            this.angle = 0;       
            
            // Member end releases (e.g., for internal hinges in frames)
            this.releases = {
                start: { dx: false, dy: false, mz: false },
                end: { dx: false, dy: false, mz: false }
            };
        }

        // Properties specific to Spring
        if (this.type === 'spring') {
            this.springStiffness = 0; // Placeholder for Phase 4 (Analysis)
        }
    }

    toJSON() {
        const out = {
            id: this.id,
            type: this.type,
            // Defensive checks in case nodes are passed as IDs instead of objects
            startNode: this.startNode ? (this.startNode.id || this.startNode) : null,
            endNode: this.endNode ? (this.endNode.id || this.endNode) : null,
            label: this.label
        };

        if (this.type === 'beam' || this.type === 'frame' || this.type === 'truss') {
            out.material = this.material ? (this.material.id || this.material) : null;
            out.section = this.section ? (this.section.id || this.section) : null;
            out.angle = this.angle;
            out.releases = this.releases;
        }

        if (this.type === 'spring') {
            out.springStiffness = this.springStiffness;
        }

        return out;
    }
}
