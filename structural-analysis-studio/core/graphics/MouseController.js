/**
 * MouseController.js
 * ------------------------------------------------------------------
 * Central mouse handler for the desktop canvas. This is the ONLY place
 * that attaches raw DOM mouse/wheel listeners. Its job is narrow and
 * mechanical:
 *   1. Convert client coordinates -> canvas-local screen coordinates
 *   2. Convert screen -> world coordinates via the Camera
 *   3. Update State's mouse-tracking fields
 *   4. Forward the semantic event to ToolManager, which decides what
 *      the currently active tool should do with it
 *
 * It also owns two behaviors that are the same no matter which tool is
 * active: the mouse wheel always zooms, and the middle mouse button
 * always pans.
 * ------------------------------------------------------------------
 */

export class MouseController {
    /** @param {import('../app/app.js').App} app */
    constructor(app) {
        this.app = app;
        this.el = app.canvas.canvas; // the raw <canvas> DOM element
        this._middlePan = null;

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onDoubleClick = this._onDoubleClick.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);

        this._bind();
    }

    _bind() {
        this.el.addEventListener('mousedown', this._onMouseDown);
        // Listen on window for move/up so drags don't break if the cursor
        // leaves the canvas mid-drag.
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        this.el.addEventListener('wheel', this._onWheel, { passive: false });
        this.el.addEventListener('dblclick', this._onDoubleClick);
        this.el.addEventListener('contextmenu', this._onContextMenu);
        this.el.addEventListener('mouseleave', this._onMouseLeave);
    }

    /** Removes all listeners (call if the canvas is ever torn down). */
    destroy() {
        this.el.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        this.el.removeEventListener('wheel', this._onWheel);
        this.el.removeEventListener('dblclick', this._onDoubleClick);
        this.el.removeEventListener('contextmenu', this._onContextMenu);
        this.el.removeEventListener('mouseleave', this._onMouseLeave);
    }

    _screenPos(evt) {
        const rect = this.el.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    _onMouseDown(evt) {
        if (evt.button !== 0 && evt.button !== 1) return; // left or middle only

        const screen = this._screenPos(evt);
        const world = this.app.canvas.screenToWorld(screen.x, screen.y);
        this.app.state.updateMouse(screen.x, screen.y, world.x, world.y);
        this.app.state.mouse.isDown = true;

        if (evt.button === 1) {
            this._middlePan = { lastScreen: screen };
            evt.preventDefault();
            return;
        }

        this.app.toolManager.onPointerDown(world, screen, evt);
        this.el.style.cursor = this.app.toolManager.getCursor();
    }

    _onMouseMove(evt) {
        const screen = this._screenPos(evt);
        const world = this.app.canvas.screenToWorld(screen.x, screen.y);
        this.app.state.updateMouse(screen.x, screen.y, world.x, world.y);

        if (this._middlePan) {
            const dx = screen.x - this._middlePan.lastScreen.x;
            const dy = screen.y - this._middlePan.lastScreen.y;
            this.app.canvas.movePan(dx, dy);
            this._middlePan.lastScreen = screen;
            return;
        }

        this.app.toolManager.onPointerMove(world, screen, evt);
        this.el.style.cursor = this.app.toolManager.getCursor();
    }

    _onMouseUp(evt) {
        const screen = this._screenPos(evt);
        const world = this.app.canvas.screenToWorld(screen.x, screen.y);
        this.app.state.mouse.isDown = false;

        if (evt.button === 1) {
            this._middlePan = null;
            return;
        }
        if (evt.button !== 0) return;

        this.app.toolManager.onPointerUp(world, screen, evt);
        this.el.style.cursor = this.app.toolManager.getCursor();
    }

    _onWheel(evt) {
        evt.preventDefault();
        const screen = this._screenPos(evt);
        const zoomFactor = evt.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.app.canvas.setZoom(this.app.canvas.zoom * zoomFactor, screen.x, screen.y);
    }

    _onDoubleClick(evt) {
        const screen = this._screenPos(evt);
        const world = this.app.canvas.screenToWorld(screen.x, screen.y);

        // Double-clicking empty space is a quick "zoom to fit" shortcut.
        const hit = this.app.hitTest.hit(world.x, world.y, this.app.model, this.app.canvas.camera);
        if (hit.type === null) {
            this.app.fitView();
        }

        this.app.toolManager.onDoubleClick(world, screen, evt);
    }

    _onContextMenu(evt) {
        evt.preventDefault(); // suppress the native browser menu
        this.app.cancelCurrentAction(); // right-click cancels the current in-progress action
    }

    _onMouseLeave() {
        this.app.state.setHover(null, null);
        this.app.canvas.requestRedraw();
    }
}
