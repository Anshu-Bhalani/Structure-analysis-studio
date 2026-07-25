/**
 * Canvas.js
 * ------------------------------------------------------------------
 * The primary drawing surface for the structural modeling environment.
 * Responsibilities:
 * - HTML Canvas initialization & High-DPI (Retina) scaling
 * - Optimized Render Loop (Redraws only when marked dirty)
 * - Owns the Camera (viewport/coordinate math lives there — see
 *   Camera.js) and exposes thin pass-through methods so callers that
 *   only have a `canvas` reference can still pan/zoom/convert without
 *   reaching into `canvas.camera` directly.
 * ------------------------------------------------------------------
 */

import { Camera } from './Camera.js';

export class Canvas {
    /**
     * @param {HTMLCanvasElement} canvasElement - The target DOM canvas
     */
    constructor(canvasElement) {
        if (!canvasElement) throw new Error("Canvas element is required.");
        
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // alpha: false optimizes background rendering
        
        // --- Viewport (delegated to Camera; see Camera.js) ---
        this.width = 0;
        this.height = 0;
        this.camera = new Camera(0, 0);
        
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
        
        // Reset the transform before rescaling — otherwise repeated
        // resize() calls would compound the DPI scale each time.
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        
        // Camera.updateSize() re-centers the origin relative to the size
        // delta, so growing from (0,0) on the very first resize lands it
        // exactly in the middle — no special-casing needed here.
        this.camera.updateSize(width, height);

        this.width = width;
        this.height = height;
        
        this.requestRedraw();
    }

    // ==========================================
    // World ↔ Screen Coordinate Conversions
    // ==========================================
    // All viewport math (pan/zoom/fit/coordinate conversion) lives in
    // Camera.js. These are thin pass-throughs kept for convenience and
    // backward compatibility with code that only holds a Canvas reference.

    /** @see Camera#worldToScreen */
    worldToScreen(worldX, worldY) {
        return this.camera.worldToScreen(worldX, worldY);
    }

    /** @see Camera#screenToWorld */
    screenToWorld(screenX, screenY) {
        return this.camera.screenToWorld(screenX, screenY);
    }

    // ==========================================
    // Viewport Controls
    // ==========================================

    get zoom() { return this.camera.zoom; }
    get panX() { return this.camera.panX; }
    get panY() { return this.camera.panY; }

    setPan(x, y) {
        this.camera.panX = x;
        this.camera.panY = y;
        this.requestRedraw();
    }

    movePan(dx, dy) {
        this.camera.pan(dx, dy);
        this.requestRedraw();
    }

    /**
     * Zooms the canvas while keeping the point under the mouse stationary.
     * @param {number} newZoom - The new zoom level
     * @param {number} screenX - The X screen coordinate of the mouse
     * @param {number} screenY - The Y screen coordinate of the mouse
     */
    setZoom(newZoom, screenX, screenY) {
        this.camera.setZoom(newZoom, screenX, screenY);
        this.requestRedraw();
    }

    /** Center the origin (0,0) in the middle of the screen */
    resetViewport() {
        this.camera.resetView();
        this.requestRedraw();
    }

    /** Frames the entire model with a comfortable margin. @see Camera#fitModelToScreen */
    fitModelToScreen(model, padding = 50) {
        this.camera.fitModelToScreen(model, padding);
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

        // 2. Execute all registered rendering layers in order.
        // Layers receive (ctx, camera, canvas) — most only need `camera`
        // for worldToScreen()/screenToWorld(), but the raw canvas is
        // passed too in case a layer needs width/height directly.
        for (const callback of this.renderCallbacks) {
            this.ctx.save();
            callback(this.ctx, this.camera, this);
            this.ctx.restore();
        }
    }
}
