export class Element {
    constructor(id, startNode, endNode) {
        this.id = id;
        this.startNode = startNode; // Reference to Node object
        this.endNode = endNode;     // Reference to Node object
        
        // Properties
        this.material = null; 
        this.section = null;  
        this.angle = 0;       
        this.label = "";
        
        // Member end releases
        this.releases = {
            start: { dx: false, dy: false, mz: false },
            end: { dx: false, dy: false, mz: false }
        };
    }

    toJSON() {
        return {
            id: this.id,
            // Safety check to ensure we get the ID strings for JSON output
            startNode: this.startNode ? this.startNode.id : null,
            endNode: this.endNode ? this.endNode.id : null,
            material: this.material ? this.material.id : null,
            section: this.section ? this.section.id : null,
            angle: this.angle,
            label: this.label,
            releases: this.releases
        };
    }
}
