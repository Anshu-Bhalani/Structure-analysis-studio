/**
 * Support.js (Level 3 - Core Data Models)
 * Represents a boundary condition applied to a Node.
 */
export class Support {
    constructor(id, node, type = 'Custom') {
        if (!id) throw new Error("Support must have a valid ID.");
        
        this.id = id;
        this.node = node; // Can be a Node object or just the Node ID string
        this.type = type; // 'Fixed', 'Pin', 'Roller', 'Spring', 'Custom'

        // Restraints (true = locked/restrained, false = free)
        this.restrainedDOFs = { dx: false, dy: false, mz: false };

        // Spring properties (Only utilized if type === 'Spring' or if partially elastic)
        this.springStiffness = { kx: 0, ky: 0, kmz: 0 };

        // Support settlements (prescribed displacements)
        this.settlement = { dx: 0, dy: 0 };
        this.rotationSettlement = 0;

        // Metadata & State
        this.label = "";
        this.visible = true;
        this.locked = false;
    }

    /** 
     * Serializes the support to a plain JavaScript object for JSON storage. 
     */
    toJSON() {
        return {
            id: this.id,
            node: this.node ? (this.node.id || this.node) : null,
            type: this.type,
            restrainedDOFs: { ...this.restrainedDOFs },
            springStiffness: { ...this.springStiffness },
            settlement: { ...this.settlement },
            rotationSettlement: this.rotationSettlement,
            label: this.label,
            visible: this.visible,
            locked: this.locked
        };
    }
}
