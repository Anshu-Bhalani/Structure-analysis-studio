/**
 * Camera.js
 * ------------------------------------------------------------------
 * Viewport controller for the engineering canvas.
 * Responsibilities:
 * - Mathematical conversion between World (Engineering) and Screen coordinates
 * - Enforcing standard Cartesian rules (+X Right, +Y Up)
 * - Handling Pan and Zoom state
 * - Calculating "Fit to Screen" bounding boxes based on model geometry
 * 
 * Note: This module performs NO drawing. It purely manages spatial math.
 * ------------------------------------------------------------------
 */

export class Camera {
    constructor(screenWidth, screenHeight) {
        this.width = screenWidth;
        this.height = screenHeight;
        
        // Pan represents the pixel offset of the origin (0,0)
        this.panX = screenWidth / 2;
        this.panY = screenHeight / 2;
        
        this.zoom = 100; // Default: 100 pixels per 1 unit (meter)
        this.minZoom = 1;
        this.maxZoom = 10000;
    }

    // ==========================================
    // Resize Handling
    // ==========================================

    /**
     * Updates the camera's knowledge of the screen size, keeping the 
     * engineering origin anchored relatively so the model doesn't jump.
     */
    updateSize(newWidth, newHeight) {
        this.panX += (newWidth - this.width) / 2;
        this.panY += (newHeight - this.height) / 2;
        
        this.width = newWidth;
        this.height = newHeight;
    }

    // ==========================================
    // Coordinate Conversion Math
    // ==========================================

    /**
     * Converts a World coordinate (m) to a Screen coordinate (px).
     * Automatically flips the Y-axis so +Y goes UP on the screen.
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX * this.zoom) + this.panX,
            y: this.height - ((worldY * this.zoom) + this.panY)
        };
    }

    /**
     * Converts a Screen coordinate (px) to a World coordinate (m).
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.panX) / this.zoom,
            y: (this.height - screenY - this.panY) / this.zoom
        };
    }

    // ==========================================
    // Viewport Controls (Pan & Zoom)
    // ==========================================

    /**
     * Moves the camera by a specific pixel delta.
     */
    pan(dx, dy) {
        this.panX += dx;
        this.panY -= dy; // Inverted: dragging mouse down (positive dy) moves world up
    }

    /**
     * Zooms in or out while anchoring a specific screen coordinate 
     * (usually the mouse pointer), so zooming feels natural.
     */
    setZoom(newZoom, screenX, screenY) {
        // 1. Where in the structural world is the mouse pointing right now?
        const worldPos = this.screenToWorld(screenX, screenY);
        
        // 2. Apply the new zoom within safe bounds
        this.zoom = Math.max(this.minZoom, Math.min(newZoom, this.maxZoom));
        
        // 3. Where would that structural point end up on screen after zooming?
        const newScreenX = (worldPos.x * this.zoom) + this.panX;
        const newScreenY = this.height - ((worldPos.y * this.zoom) + this.panY);
        
        // 4. Shift the pan to counteract the difference, anchoring the point
        this.panX -= (newScreenX - screenX);
        this.panY += (newScreenY - screenY); // Added due to inverted Y
    }

    /**
     * Resets the viewport back to default scale and centered origin.
     */
    resetView() {
        this.panX = this.width / 2;
        this.panY = this.height / 2;
        this.zoom = 100;
    }

    // ==========================================
    // Smart Framing
    // ==========================================

    /**
     * Analyzes the structural model and automatically adjusts pan and zoom
     * so all nodes fit perfectly within the screen with a safe margin.
     * @param {import('../modeling/Model.js').Model} model 
     * @param {number} padding - Blank space in pixels around the edges
     */
    fitModelToScreen(model, padding = 50) {
        const nodes = model.getAllNodes();
        
        // If the model is empty, just reset the view
        if (nodes.length === 0) {
            this.resetView();
            return;
        }

        // Find the bounding box of the entire structure
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const node of nodes) {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.y > maxY) maxY = node.y;
        }

        // Edge case: Single node model
        if (minX === maxX && minY === maxY) {
            this.zoom = 100;
            this.panX = (this.width / 2) - (minX * this.zoom);
            this.panY = (this.height / 2) - (minY * this.zoom);
            return;
        }

        const modelWidth = maxX - minX;
        const modelHeight = maxY - minY;

        const availWidth = this.width - (padding * 2);
        const availHeight = this.height - (padding * 2);

        // Determine which dimension requires the most shrinking
        const zoomX = availWidth / modelWidth;
        const zoomY = availHeight / modelHeight;
        
        // Set zoom (don't zoom in infinitely if the model is tiny)
        this.zoom = Math.max(this.minZoom, Math.min(zoomX, zoomY, this.maxZoom));

        // Find the geometric center of the structure
        const centerX = minX + (modelWidth / 2);
        const centerY = minY + (modelHeight / 2);

        // Center the camera on the structure's center point
        this.panX = (this.width / 2) - (centerX * this.zoom);
        this.panY = (this.height / 2) - (centerY * this.zoom);
    }
}
