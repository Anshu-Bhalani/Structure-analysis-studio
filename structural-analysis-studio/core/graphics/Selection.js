/**
 * Selection.js
 * ------------------------------------------------------------------
 * Manages the state and detection of selected objects on the canvas.
 * Responsibilities:
 * - Single point picking (Click) with dynamic zoom-scaled tolerance
 * - Multi-selection via modifier keys (Ctrl/Shift)
 * - Area picking (Box Selection)
 * - Enforcing Selection Priority (Nodes > Elements)
 * - Rendering the temporary drag-box overlay
 * ------------------------------------------------------------------
 */

export class Selection {
    constructor() {
        // State: Using Sets to guarantee unique IDs and O(1) lookup
        this.nodes = new Set();
        this.elements = new Set();

        // Box Selection State
        this.isDragging = false;
        this.boxStartScreen = { x: 0, y: 0 };
        this.boxEndScreen = { x: 0, y: 0 };
        
        // Settings
        this.clickTolerancePixels = 10; // Pixel radius for clicking objects
        this.boxFillColor = "rgba(59, 130, 246, 0.2)";   // Transparent Blue
        this.boxStrokeColor = "rgba(59, 130, 246, 0.8)"; // Solid Blue
    }

    // ==========================================
    // State Management
    // ==========================================

    clear() {
        this.nodes.clear();
        this.elements.clear();
    }

    isEmpty() {
        return this.nodes.size === 0 && this.elements.size === 0;
    }

    /** Checks if a specific node ID is selected */
    isNodeSelected(id) {
        return this.nodes.has(id);
    }

    /** Checks if a specific element ID is selected */
    isElementSelected(id) {
        return this.elements.has(id);
    }

    // ==========================================
    // Interaction: Single Point Picking
    // ==========================================

    /**
     * Executes a single click selection.
     * Enforces priority: Node > Element.
     * @param {number} screenX - Mouse X
     * @param {number} screenY - Mouse Y
     * @param {import('../modeling/Model.js').Model} model - The active project model
     * @param {import('./Camera.js').Camera} camera - The active camera
     * @param {boolean} multiSelect - True if Ctrl/Shift is held
     */
    pick(screenX, screenY, model, camera, multiSelect = false) {
        const worldPos = camera.screenToWorld(screenX, screenY);
        const toleranceWorld = this.clickTolerancePixels / camera.zoom;

        let pickedNodeId = null;
        let pickedElementId = null;
        let minNodeDist = Infinity;
        let minElementDist = Infinity;

        // 1. Check Nodes (Highest Priority)
        for (const node of model.getAllNodes()) {
            const dist = this._distancePointToPoint(worldPos.x, worldPos.y, node.x, node.y);
            if (dist <= toleranceWorld && dist < minNodeDist) {
                minNodeDist = dist;
                pickedNodeId = node.id;
            }
        }

        // 2. Check Elements (Lower Priority)
        // Only run this if we didn't find a node, or if we want to be thorough. 
        // Based on spec priority: Node -> Element. So we can skip if node found.
        if (!pickedNodeId) {
            for (const element of model.getAllElements()) {
                const nodeI = model.getNode(element.startNode?.id || element.startNode);
                const nodeJ = model.getNode(element.endNode?.id || element.endNode);
                
                if (!nodeI || !nodeJ) continue;

                const dist = this._distancePointToSegment(
                    worldPos.x, worldPos.y, 
                    nodeI.x, nodeI.y, 
                    nodeJ.x, nodeJ.y
                );

                if (dist <= toleranceWorld && dist < minElementDist) {
                    minElementDist = dist;
                    pickedElementId = element.id;
                }
            }
        }

        // 3. Apply Selection State
        if (!multiSelect) this.clear();

        if (pickedNodeId) {
            if (multiSelect && this.nodes.has(pickedNodeId)) {
                this.nodes.delete(pickedNodeId); // Toggle off if already selected
            } else {
                this.nodes.add(pickedNodeId);
            }
        } else if (pickedElementId) {
            if (multiSelect && this.elements.has(pickedElementId)) {
                this.elements.delete(pickedElementId);
            } else {
                this.elements.add(pickedElementId);
            }
        }
    }

    // ==========================================
    // Interaction: Box Selection
    // ==========================================

    startBoxSelection(screenX, screenY) {
        this.isDragging = true;
        this.boxStartScreen = { x: screenX, y: screenY };
        this.boxEndScreen = { x: screenX, y: screenY };
    }

    updateBoxSelection(screenX, screenY) {
        if (!this.isDragging) return;
        this.boxEndScreen = { x: screenX, y: screenY };
    }

    /**
     * Finalizes the box selection and calculates what was caught inside.
     */
    endBoxSelection(model, camera, multiSelect = false) {
        if (!this.isDragging) return;
        this.isDragging = false;

        // Skip if it was just a tiny accidental drag (handled as a click instead)
        if (Math.abs(this.boxEndScreen.x - this.boxStartScreen.x) < 3 && 
            Math.abs(this.boxEndScreen.y - this.boxStartScreen.y) < 3) {
            return;
        }

        if (!multiSelect) this.clear();

        // Convert box corners to world space
        const startWorld = camera.screenToWorld(this.boxStartScreen.x, this.boxStartScreen.y);
        const endWorld = camera.screenToWorld(this.boxEndScreen.x, this.boxEndScreen.y);

        const minX = Math.min(startWorld.x, endWorld.x);
        const maxX = Math.max(startWorld.x, endWorld.x);
        const minY = Math.min(startWorld.y, endWorld.y);
        const maxY = Math.max(startWorld.y, endWorld.y);

        // Check Nodes inside box
        for (const node of model.getAllNodes()) {
            if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
                this.nodes.add(node.id);
            }
        }

        // Check Elements (Both nodes must be inside for V1 window selection)
        for (const element of model.getAllElements()) {
            const nodeI = model.getNode(element.startNode?.id || element.startNode);
            const nodeJ = model.getNode(element.endNode?.id || element.endNode);
            if (!nodeI || !nodeJ) continue;

            const iInside = nodeI.x >= minX && nodeI.x <= maxX && nodeI.y >= minY && nodeI.y <= maxY;
            const jInside = nodeJ.x >= minX && nodeJ.x <= maxX && nodeJ.y >= minY && nodeJ.y <= maxY;

            if (iInside && jInside) {
                this.elements.add(element.id);
            }
        }
    }

    // ==========================================
    // Rendering
    // ==========================================

    /**
     * Draws the selection box overlay (if currently dragging).
     * Call this at the very end of the Canvas render loop.
     */
    draw(ctx) {
        if (!this.isDragging) return;

        const x = this.boxStartScreen.x;
        const y = this.boxStartScreen.y;
        const width = this.boxEndScreen.x - x;
        const height = this.boxEndScreen.y - y;

        ctx.fillStyle = this.boxFillColor;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = this.boxStrokeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    // ==========================================
    // Internal Math Helpers
    // ==========================================

    _distancePointToPoint(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    /** 
     * Calculates the shortest distance from a point to a finite line segment.
     */
    _distancePointToSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
