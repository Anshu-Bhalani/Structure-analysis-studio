/**
 * State.js
 * ------------------------------------------------------------------
 * Centralized state management for the Geometry Editor.
 * Responsibilities:
 * - Track the active interaction tool (Select, Draw, Loads, etc.)
 * - Maintain reference to the current Selection and Hover states
 * - Store global editor settings (Snap, Grid visibility)
 * - Track mouse coordinates in both Screen and World space
 * - Provide the foundation for the Undo/Redo history stack
 * ------------------------------------------------------------------
 */

import { Selection } from '../graphics/Selection.js';

export const TOOLS = {
    SELECT: 'select',
    DRAW_NODE: 'draw_node',
    DRAW_ELEMENT: 'draw_element',
    ADD_SUPPORT: 'add_support',
    ADD_LOAD: 'add_load'
};

export class State {
    constructor() {
        // --- Interaction State ---
        this.currentTool = TOOLS.SELECT;
        this.drawingMode = 'continuous'; // 'continuous' (chaining elements) or 'single'
        
        // --- Selection & Hover ---
        this.selection = new Selection();
        this.hoveredObject = null; // { id: string, type: 'node' | 'element' } | null
        
        // --- Environment Settings ---
        this.snapEnabled = true;
        this.snapDistance = 0.5; // World units
        this.gridEnabled = true;
        
        // --- Mouse Tracking ---
        this.mouse = {
            screenX: 0,
            screenY: 0,
            worldX: 0,
            worldY: 0,
            isDown: false
        };

        // --- History (Undo/Redo) ---
        // Stores serialized JSON snapshots of the Model
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;
    }

    // ==========================================
    // Tool & Mode Management
    // ==========================================

    setTool(tool) {
        if (!Object.values(TOOLS).includes(tool)) {
            console.warn(`Unknown tool: ${tool}`);
            return;
        }
        this.currentTool = tool;
        this.selection.clear(); // Usually, changing tools clears selection
    }

    setHover(id, type) {
        if (!id) {
            this.hoveredObject = null;
        } else {
            this.hoveredObject = { id, type };
        }
    }

    updateMouse(screenX, screenY, worldX, worldY) {
        this.mouse.screenX = screenX;
        this.mouse.screenY = screenY;
        this.mouse.worldX = worldX;
        this.mouse.worldY = worldY;
    }

    // ==========================================
    // History Management (Undo/Redo)
    // ==========================================

    /**
     * Captures the current model state and pushes it to the undo stack.
     * @param {import('../modeling/Model.js').Model} model 
     */
    saveSnapshot(model) {
        if (!model) return;
        
        // Clear redo stack whenever a new action is performed
        this.redoStack = [];
        
        const snapshot = JSON.stringify(model.toJSON());
        this.undoStack.push(snapshot);
        
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift(); // Remove oldest state
        }
    }

    /**
     * Pops the last state from the undo stack and returns it.
     * Pushes the current state to the redo stack.
     */
    undo(currentModel) {
        if (this.undoStack.length === 0) return null;
        
        // Save current state to redo
        this.redoStack.push(JSON.stringify(currentModel.toJSON()));
        
        // Return previous state
        const previousStateJSON = this.undoStack.pop();
        return JSON.parse(previousStateJSON);
    }

    /**
     * Pops the last undone state from the redo stack and returns it.
     * Pushes the current state back to the undo stack.
     */
    redo(currentModel) {
        if (this.redoStack.length === 0) return null;
        
        // Save current state to undo
        this.undoStack.push(JSON.stringify(currentModel.toJSON()));
        
        // Return next state
        const nextStateJSON = this.redoStack.pop();
        return JSON.parse(nextStateJSON);
    }
}
