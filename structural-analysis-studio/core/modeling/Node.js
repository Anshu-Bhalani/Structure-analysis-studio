/**
 * Node.js
 * Represents a single structural joint in the user model.
 */

import { MathUtils } from '../math/MathUtils.js';

export class Node {
    /**
     * Create a structural Node.
     * @param {string} id - Unique identifier (e.g., "N1").
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {number} [z=0] - Z coordinate (Reserved for future 3D expansion).
     * @param {string} [label=""] - Optional text label.
     */
    constructor(id, x, y, z = 0, label = "") {
        if (!id) throw new Error("Node must have a valid ID.");
        
        // Properties
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.label = label;
        
        // State
        this.visible = true;
        this.locked = false;
    }

    // ==========================================
    // Coordinates
    // ==========================================

    /** Returns the current coordinates as an object. */
    getPosition() {
        return { 
            x: this.x, 
            y: this.y, 
            z: this.z 
        };
    }

    /** Sets the node to an exact absolute position. */
    setPosition(x, y, z = this.z) {
        if (this.locked) return; // Prevent movement if locked
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /** Moves the node by a relative delta distance. */
    move(dx, dy, dz = 0) {
        if (this.locked) return; // Prevent movement if locked
        this.x += dx;
        this.y += dy;
        this.z += dz;
    }

    // ==========================================
    // State
    // ==========================================

    /** Locks the node so its coordinates cannot be changed. */
    lock() {
        this.locked = true;
    }

    /** Unlocks the node, allowing movement. */
    unlock() {
        this.locked = false;
    }

    /** Hides the node from the canvas view. */
    hide() {
        this.visible = false;
    }

    /** Shows the node on the canvas view. */
    show() {
        this.visible = true;
    }

    // ==========================================
    // Utility
    // ==========================================

    /** 
     * Calculates the true Euclidean distance to another Node object.
     * @param {Node} otherNode - The target node to measure to.
     * @returns {number} Distance in current model units.
     */
    distanceTo(otherNode) {
        if (!otherNode) throw new Error("Must provide a valid node to calculate distance.");
        return MathUtils.distance(this.x, this.y, otherNode.x, otherNode.y, this.z, otherNode.z);
    }

    /** 
     * Serializes the node to a plain JavaScript object for JSON storage. 
     */
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            z: this.z,
            label: this.label,
            visible: this.visible,
            locked: this.locked
        };
    }

    /** 
     * Reconstructs a Node instance from a parsed JSON object. 
     */
    static fromJSON(data) {
        const node = new Node(data.id, data.x, data.y, data.z, data.label);
        node.visible = data.visible !== undefined ? data.visible : true;
        node.locked = data.locked || false;
        return node;
    }
}
