/**
 * TouchController.js
 * ------------------------------------------------------------------
 * Touch-input layer for the mobile canvas. Mirrors the responsibility
 * MouseController.js has on desktop, but for touch gestures:
 *
 *   - One-finger drag  -> forwarded to the active tool (pan/select/draw/move),
 *                          exactly like a mouse drag would be
 *   - Two-finger pinch -> zoom (anchored at the pinch midpoint), combined
 *                          with a two-finger pan as the midpoint drifts
 *   - Tap              -> select (delegates to the active tool via
 *                          onPointerDown/onPointerUp, same as a click)
 *   - Long press        -> selects the object under the finger and opens a
 *                          small floating context menu (Delete / Cancel)
 *
 * Like MouseController, this only translates raw browser events into
 * world/screen coordinates and forwards them to ToolManager — it holds
 * no tool-specific logic itself.
 * ------------------------------------------------------------------
 */

const LONG_PRESS_MS = 500;
const TAP_MOVE_TOLERANCE_PX = 10;

export class TouchController {
    /**
     * @param {import('../../../core/app/app.js').App} app
     * @param {HTMLElement} [contextMenuHost] - element the long-press context menu is appended to
     */
    constructor(app, contextMenuHost = document.body) {
        this.app = app;
        this.el = app.canvas.canvas; // the raw <canvas> DOM element
        this.contextMenuHost = contextMenuHost;

        this.activeTouches = new Map(); // touch identifier -> {x, y} screen position
        this.pinch = null;              // { startDist, startZoom, midScreen }
        this.touchStart = null;         // { screen, moved }
        this.longPressTimer = null;
        this.menuEl = null;
        this._outsideHandler = null;

        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);

        this._bind();
    }

    _bind() {
        this.el.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.el.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.el.addEventListener('touchend', this._onTouchEnd, { passive: false });
        this.el.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    }

    destroy() {
        this.el.removeEventListener('touchstart', this._onTouchStart);
        this.el.removeEventListener('touchmove', this._onTouchMove);
        this.el.removeEventListener('touchend', this._onTouchEnd);
        this.el.removeEventListener('touchcancel', this._onTouchEnd);
        this._closeContextMenu();
    }

    _screenPos(touch) {
        const rect = this.el.getBoundingClientRect();
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    // ==========================================
    // Touch Start
    // ==========================================

    _onTouchStart(evt) {
        evt.preventDefault();
        this._closeContextMenu();

        for (const touch of evt.changedTouches) {
            this.activeTouches.set(touch.identifier, this._screenPos(touch));
        }

        if (this.activeTouches.size === 1) {
            const screen = [...this.activeTouches.values()][0];
            const world = this.app.canvas.screenToWorld(screen.x, screen.y);
            this.app.state.updateMouse(screen.x, screen.y, world.x, world.y);

            this.touchStart = { screen, moved: false };
            this.longPressTimer = setTimeout(() => this._triggerLongPress(screen, world), LONG_PRESS_MS);

            this.app.toolManager.onPointerDown(world, screen, {});
        } else if (this.activeTouches.size === 2) {
            this._clearLongPress();
            const [a, b] = [...this.activeTouches.values()];
            this.pinch = {
                startDist: Math.hypot(a.x - b.x, a.y - b.y),
                startZoom: this.app.canvas.zoom,
                midScreen: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            };
        }
    }

    // ==========================================
    // Touch Move
    // ==========================================

    _onTouchMove(evt) {
        evt.preventDefault();

        for (const touch of evt.changedTouches) {
            if (this.activeTouches.has(touch.identifier)) {
                this.activeTouches.set(touch.identifier, this._screenPos(touch));
            }
        }

        if (this.activeTouches.size === 2 && this.pinch) {
            const [a, b] = [...this.activeTouches.values()];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

            const scale = dist / this.pinch.startDist;
            this.app.canvas.setZoom(this.pinch.startZoom * scale, mid.x, mid.y);

            // Two-finger pan: shift by however much the midpoint itself moved.
            const dx = mid.x - this.pinch.midScreen.x;
            const dy = mid.y - this.pinch.midScreen.y;
            if (dx !== 0 || dy !== 0) this.app.canvas.movePan(dx, dy);
            this.pinch.midScreen = mid;
            return;
        }

        if (this.activeTouches.size === 1 && this.touchStart) {
            const screen = [...this.activeTouches.values()][0];
            const dx = screen.x - this.touchStart.screen.x;
            const dy = screen.y - this.touchStart.screen.y;

            if (!this.touchStart.moved && Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) {
                this.touchStart.moved = true;
                this._clearLongPress(); // a real drag started — this isn't a tap or long-press anymore
            }

            const world = this.app.canvas.screenToWorld(screen.x, screen.y);
            this.app.state.updateMouse(screen.x, screen.y, world.x, world.y);
            this.app.toolManager.onPointerMove(world, screen, {});
        }
    }

    // ==========================================
    // Touch End
    // ==========================================

    _onTouchEnd(evt) {
        evt.preventDefault();
        this._clearLongPress();

        for (const touch of evt.changedTouches) {
            this.activeTouches.delete(touch.identifier);
        }

        if (this.activeTouches.size < 2) this.pinch = null;

        if (this.activeTouches.size === 0 && this.touchStart) {
            const screen = this.touchStart.screen;
            const world = this.app.canvas.screenToWorld(screen.x, screen.y);
            this.app.toolManager.onPointerUp(world, screen, {});
            this.app.canvas.requestRedraw();
            this.touchStart = null;
        }
    }

    // ==========================================
    // Long Press -> Context Menu
    // ==========================================

    _clearLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    _triggerLongPress(screen, world) {
        const hit = this.app.hitTest.hit(world.x, world.y, this.app.model, this.app.canvas.camera);
        if (!hit.type) return;

        this.app.state.selection.clear();
        if (hit.type === 'node') this.app.state.selection.nodes.add(hit.object.id);
        else this.app.state.selection.elements.add(hit.object.id);
        this.app.canvas.requestRedraw();

        this._showContextMenu(screen);

        // Swallow the eventual touchend for this gesture so it doesn't also
        // fire a tap/select on top of the menu we just opened.
        this.touchStart = null;
    }

    _showContextMenu(screen) {
        this._closeContextMenu();
        const rect = this.el.getBoundingClientRect();

        const menu = document.createElement('div');
        menu.className = 'touch-context-menu';
        Object.assign(menu.style, {
            position: 'fixed',
            left: `${rect.left + screen.x}px`,
            top: `${rect.top + screen.y}px`,
            transform: 'translate(-50%, -115%)',
            background: '#1b1f26',
            border: '1px solid #2c323c',
            borderRadius: '10px',
            padding: '6px',
            display: 'flex',
            gap: '6px',
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
        });

        const deleteBtn = this._menuButton('🗑 Delete', '#e5584f', '#ffffff', () => {
            this.app.deleteSelection();
            this._closeContextMenu();
        });
        const cancelBtn = this._menuButton('Cancel', '#2c323c', '#e6e9ee', () => {
            this.app.state.selection.clear();
            this.app.canvas.requestRedraw();
            this._closeContextMenu();
        });

        menu.appendChild(deleteBtn);
        menu.appendChild(cancelBtn);
        this.contextMenuHost.appendChild(menu);
        this.menuEl = menu;

        this._outsideHandler = (e) => {
            if (!menu.contains(e.target)) this._closeContextMenu();
        };
        // Deferred so the same touch that opened the menu doesn't instantly close it.
        setTimeout(() => document.addEventListener('touchstart', this._outsideHandler, { passive: true }), 0);
    }

    _menuButton(label, background, color, onClick) {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            background,
            color,
            fontSize: '14px',
            whiteSpace: 'nowrap',
        });
        btn.onclick = onClick;
        return btn;
    }

    _closeContextMenu() {
        if (this.menuEl) {
            this.menuEl.remove();
            this.menuEl = null;
        }
        if (this._outsideHandler) {
            document.removeEventListener('touchstart', this._outsideHandler);
            this._outsideHandler = null;
        }
    }
}
