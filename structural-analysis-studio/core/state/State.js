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
        this.currentTool = TOOLS.SELECT;
        this.drawingMode = 'continuous';
        this.drawElementType = ELEMENT_TYPES.BEAM;

        this.selection = new Selection();
        this.hoveredObject = null;

        // --- Environment Settings ---
        this.snapEnabled = true;
        this.snapDistance = 0.5; // Restored: World units (prevents breaking legacy modules)
        this.snapRadius = 12;    // Added: Screen pixel snap tolerance

        this.gridEnabled = true;

        this.mouse = {
            screenX: 0,
            screenY: 0,
            worldX: 0,
            worldY: 0,
            isDown: false
        };

        this.history = new CommandHistory();
    }

    setTool(tool) {
        if (!Object.values(TOOLS).includes(tool)) return;
        this.currentTool = tool;
        this.selection.clear(); 
    }

    setDrawElementType(type) {
        if (!Object.values(ELEMENT_TYPES).includes(type)) return;
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

    canUndo() { return this.history.canUndo(); }
    canRedo() { return this.history.canRedo(); }
}
