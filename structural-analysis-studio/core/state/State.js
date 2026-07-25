/**
 * State.js
 * ------------------------------------------------------------------
 * Centralized state management for the Geometry Editor.
 * Responsibilities:
 * - Track the active interaction tool (Select, Draw, Move, Delete, Pan...)
 * - Maintain reference to the current Selection and Hover states
 * - Store global editor settings (Snap, Grid visibility)
 * - Track mouse coordinates in both Screen and World space
 * - Hold the Undo/Redo command history
 * ------------------------------------------------------------------
 */

import { Selection } from '../graphics/Selection.js';
import { CommandHistory } from '../graphics/Commands.js';
import { ELEMENT_TYPES } from '../modeling/Element.js';

export const TOOLS = {
    SELECT: 'select',
    DRAW_NODE: 'draw_node',
    DRAW_ELEMENT: 'draw_element',
    MOVE: 'move',
    PAN: 'pan',
    DELETE: 'delete',
    ADD_SUPPORT: 'add_support',
    ADD_LOAD: 'add_load'
};

export class State {
    constructor() {
        // --- Interaction State ---
        this.currentTool = TOOLS.SELECT;
        this.drawingMode = 'continuous'; // 'continuous' (chaining elements) or 'single'

        // Which element type the generic DRAW_ELEMENT tool creates
        // (Beam/Bar/Spring/etc). Set via setDrawElementType() from the
        // Toolbar's "+ Beam" / "+ Bar" / "+ Spring" buttons.
        this.drawElementType = ELEMENT_TYPES.BEAM;

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
        // Command-pattern history (see core/graphics/Commands.js). Each
        // entry knows how to apply and reverse itself, which is more
        // precise than diffing whole-model JSON snapshots.
        this.history = new CommandHistory();
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

    setDrawElementType(type) {
        if (!Object.values(ELEMENT_TYPES).includes(type)) {
            console.warn(`Unknown element type: ${type}`);
            return;
        }
        this.drawElementType = type;
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
    // Thin convenience pass-throughs so callers (Toolbar, keyboard
    // shortcuts) can query button-enabled state without reaching into
    // state.history directly.

    canUndo() { return this.history.canUndo(); }
    canRedo() { return this.history.canRedo(); }
}
