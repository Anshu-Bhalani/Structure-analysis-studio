/**
 * Canvas.js
 * ------------------------------------------------------------------
 * The primary drawing surface for the structural modeling environment.
 * Responsibilities:
 * - HTML Canvas initialization & High-DPI (Retina) scaling
 * - Viewport management (Pan, Zoom)
 * - World ↔ Screen coordinate conversions (Enforcing Y-up Cartesian)
 * - Optimized Render Loop (Redraws only when marked dirty)
 * ------------------------------------------------------------------
 */

export class Canvas {
    /**
     * @param {HTMLCanvasElement} canvasElement - The target DOM canvas
     */
    constructor(canvasElement) {
        if (!canvasElement) throw new Error("Canvas element is required.");
        
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // alpha: false optimizes background rendering
        
        // --- Viewport State (Camera) ---
        this.panX = 0;       // X translation in screen pixels
        this.panY = 0;       // Y translation in screen pixels
        this.zoom = 100;     // Scale factor (Pixels per World Unit)
        
        // --- Render State ---
        this.isDirty = true;           // Flag to prevent continuous wasteful redrawing
        this.animationFrameId = null;
        this.renderCallbacks = [];     // Array of functions to call on redraw

        this._setupResizeObserver();
    }

    // ==========================================
    // Initialization & Resize
    // ==========================================

    /**
     * Ensures the canvas always fits its container and remains sharp on High-DPI screens.
     */
    _setupResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                this.resize(width, height);
            }
        });
        
        // Observe the parent container instead of the canvas itself to avoid infinite resize loops
        if (this.canvas.parentElement) {
            resizeObserver.observe(this.canvas.parentElement);
        } else {
            window.addEventListener('resize', () => {
                this.resize(window.innerWidth, window.innerHeight);
            });
        }
    }

    /**
     * Resizes the canvas backing store accounting for device pixel ratio.
     * @param {number} width - CSS width
     * @param {number} height - CSS height
     */
    resize(width, height) {
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        
        // Normalize the coordinate system to use CSS pixels
        this.ctx.scale(dpr, dpr);
        
        this.width = width;
        this.height = height;
        
        this.requestRedraw();
    }

    // ==========================================
    // World ↔ Screen Coordinate Conversions
    // ==========================================
    // IMPORTANT: Engineering models use a Cartesian system (+X Right, +Y Up).
    // HTML Canvas uses a Screen system (+X Right, +Y Down).
    // These functions mathematically enforce the Y-axis flip.

    /**
     * Converts a World coordinate (engineering units) to a Screen coordinate (pixels).
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {{x: number, y: number}} Screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX * this.zoom) + this.panX,
            // Flip Y: Subtract from canvas height
            y: this.height - ((worldY * this.zoom) + this.panY)
        };
    }

    /**
     * Converts a Screen coordinate (pixels) to a World coordinate (engineering units).
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {{x: number, y: number}} World coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.panX) / this.zoom,
            // Flip Y: Inverse of worldToScreen
            y: (this.height - screenY - this.panY) / this.zoom
        };
    }

    // ==========================================
    // Viewport Controls
    // ==========================================

    setPan(x, y) {
        this.panX = x;
        this.panY = y;
        this.requestRedraw();
    }

    movePan(dx, dy) {
        this.panX += dx;
        // Invert DY so dragging "up" moves the camera up (which pulls the world down)
        this.panY -= dy; 
        this.requestRedraw();
    }

    /**
     * Zooms the canvas while keeping the point under the mouse stationary.
     * @param {number} newZoom - The new zoom level
     * @param {number} screenX - The X screen coordinate of the mouse
     * @param {number} screenY - The Y screen coordinate of the mouse
     */
    setZoom(newZoom, screenX, screenY) {
        // 1. Find where the mouse is in the world right now
        const worldPos = this.screenToWorld(screenX, screenY);
        
        // 2. Apply new zoom
        this.zoom = Math.max(1, Math.min(newZoom, 10000)); // Clamp zoom limits
        
        // 3. Calculate where that world point *would* be on screen with the new zoom
        const newScreenPosX = (worldPos.x * this.zoom) + this.panX;
        const newScreenPosY = this.height - ((worldPos.y * this.zoom) + this.panY);
        
        // 4. Adjust pan to counteract the drift
        this.panX -= (newScreenPosX - screenX);
        this.panY += (newScreenPosY - screenY); // Add because of inverted Y

        this.requestRedraw();
    }

    /** Center the origin (0,0) in the middle of the screen */
    resetViewport() {
        this.panX = this.width / 2;
        this.panY = this.height / 2;
        this.zoom = 100; // 100 pixels per 1 meter
        this.requestRedraw();
    }

    // ==========================================
    // Render Loop & Drawing
    // ==========================================

    /** Registers a rendering layer function (e.g., drawGrid, drawNodes, drawElements) */
    addRenderLayer(callback) {
        this.renderCallbacks.push(callback);
        this.requestRedraw();
    }

    /** Signals the engine that the canvas needs to be repainted on the next frame */
    requestRedraw() {
        this.isDirty = true;
    }

    /** Starts the highly optimized requestAnimationFrame loop */
    startRenderLoop() {
        if (this.animationFrameId) return;

        const loop = () => {
            if (this.isDirty) {
                this.draw();
                this.isDirty = false;
            }
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    /** Stops the render loop completely */
    stopRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /** 
     * The master draw function. Clears the screen and executes all render layers.
     */
    draw() {
        // 1. Clear with base background color
        this.ctx.fillStyle = "#121212"; 
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. Execute all registered rendering layers in order
        // Note: The layers are responsible for calling worldToScreen() 
        // to figure out where to draw their objects.
        for (const callback of this.renderCallbacks) {
            this.ctx.save();
            callback(this.ctx, this); // Pass context and this canvas instance
            this.ctx.restore();
        }
    }
}
