export const ELEMENT_TYPES = {
    BEAM: 'beam',
    FRAME: 'frame',
    TRUSS: 'truss',
    SPRING: 'spring',
    BAR: 'bar'
};

export class Element {
    constructor(id, startNode, endNode, type = ELEMENT_TYPES.BEAM) {
        if (!id) throw new Error("Element must have a valid ID.");
        
        this.id = id;
        this.startNode = startNode; 
        this.endNode = endNode;     
        this.type = type;           
        
        this.material = null;
        this.section = null;
        this.springStiffness = 0; 
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
