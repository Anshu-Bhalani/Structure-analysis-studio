/**
 * app.js
 * ------------------------------------------------------------------
 * Application controller for the Geometry Editor (Phase 4).
 *
 * Connects: Canvas -> State -> Renderer -> Model
 *
 * This is the single place that instantiates the graphics/input stack
 * and wires it to a Model. UI shells (desktop/mobile) construct an App
 * against a real <canvas> element and then talk to its small public
 * API (setTool, undo, redo, fitView, deleteSelection, ...)
 * rather than poking Canvas/State/ToolManager directly.
 *
 * Per the Phase 4 brief, this file does NOT perform structural
 * analysis — it only manages geometry creation/editing and the
 * viewport. Running the solver is out of scope until Phase 5.
 * ------------------------------------------------------------------
 */

import { Canvas } from '../graphics/Canvas.js';
import { Grid } from '../graphics/Grid.js';
import { Renderer } from '../graphics/Renderer.js';
import { HitTest } from '../graphics/HitTest.js';
import { SnapManager } from '../graphics/SnapManager.js';
import { MouseController } from '../graphics/MouseController.js';
import { ToolManager } from '../graphics/ToolManager.js';
import {
    DeleteSelectionCommand,
} from '../graphics/Commands.js';
import { State, TOOLS } from '../state/State.js';
import { Model } from '../modeling/Model.js';

export class App {
    /**
     * @param {HTMLCanvasElement} canvasElement
     * @param {import('../modeling/Model.js').Model} [model]
     */
    constructor(canvasElement, model = new Model('Untitled Project')) {
        this.model = model;
        this.state = new State();

        this.canvas = new Canvas(canvasElement);
        this.grid = new Grid();
        this.renderer = new Renderer();
        this.snapManager = new SnapManager();
        this.hitTest = HitTest; // stateless namespace

        // state.history is the single source of truth for undo/redo
        this.history = this.state.history;

        this.toolManager = new ToolManager(this);
        this.mouseController = new MouseController(this);

        this.toolbar = null;

        this._idCounters = { node: 0, element: 0 };
        this._spaceHeld = false;
        this._toolBeforeSpace = null;

        this._registerRenderLayers();
        this._bindKeyboardShortcuts();

        this.canvas.startRenderLoop();
    }

    // ==========================================
    // Render Layers
    // ==========================================

    _registerRenderLayers() {
        this.canvas.addRenderLayer((ctx, camera) => {
            if (this.state.gridEnabled) this.grid.draw(ctx, camera);
        });

        this.canvas.addRenderLayer((ctx, camera) => {
            this.renderer.draw(ctx, this.model, camera, this.state, this.toolManager, this.snapManager);
        });

        // Box-select / drag overlay goes last.
        this.canvas.addRenderLayer((ctx) => {
            this.state.selection.draw(ctx);
        });
    }

    // ==========================================
    // Toolbar / History UI
    // ==========================================

    attachToolbar(toolbar) {
        this.toolbar = toolbar;
        this.syncHistoryUI();
    }

    syncHistoryUI() {
        if (this.toolbar?.setHistoryState) {
            this.toolbar.setHistoryState(this.canUndo(), this.canRedo());
        }
    }

    // ==========================================
    // Tool Switching
    // ==========================================

    /** @param {string} toolName - one of the TOOLS constants exported by State.js */
    setTool(toolName) {
        this.toolManager.activate(toolName);
    }

    /** Convenience for the Toolbar's "+ Beam" / "+ Bar" / "+ Spring" buttons. */
    setElementTool(elementType) {
        this.state.setDrawElementType(elementType);
        this.setTool(TOOLS.DRAW_ELEMENT);
    }

    getActiveTool() {
        return this.toolManager.getActiveName();
    }

    // ==========================================
    // Viewport
    // ==========================================

    zoomIn() {
        const c = this.canvas;
        c.setZoom(c.zoom * 1.25, c.width / 2, c.height / 2);
    }

    zoomOut() {
        const c = this.canvas;
        c.setZoom(c.zoom / 1.25, c.width / 2, c.height / 2);
    }

    fitView() {
        this.canvas.fitModelToScreen(this.model, 60);
    }

    resetView() {
        this.canvas.resetViewport();
    }

    // ==========================================
    // Snap / Grid Toggles
    // ==========================================

    toggleSnap() {
        this.state.snapEnabled = !this.state.snapEnabled;
        this.canvas.requestRedraw();
        return this.state.snapEnabled;
    }

    setSnapEnabled(enabled) {
        this.state.snapEnabled = !!enabled;
        this.canvas.requestRedraw();
        return this.state.snapEnabled;
    }

    setNodeSnapEnabled(enabled) {
        this.snapManager.snapToNode = !!enabled;
        this.canvas.requestRedraw();
        return this.snapManager.snapToNode;
    }

    setGridSnapEnabled(enabled) {
        this.snapManager.snapToGrid = !!enabled;
        this.canvas.requestRedraw();
        return this.snapManager.snapToGrid;
    }

    toggleGrid() {
        this.grid.toggle();
        this.state.gridEnabled = this.grid.visible;
        this.canvas.requestRedraw();
        return this.state.gridEnabled;
    }

    setGridEnabled(enabled) {
        this.grid.visible = !!enabled;
        this.state.gridEnabled = !!enabled;
        this.canvas.requestRedraw();
    }

    // ==========================================
    // Undo / Redo / Command execution
    // ==========================================

    executeCommand(command) {
        const applied = this.history.execute(command);
        if (applied) {
            this.state.selection.clear();
            this.canvas.requestRedraw();
            this.syncHistoryUI();
        }
        return applied;
    }

    pushCommand(command) {
        const pushed = this.history.push(command);
        if (pushed) {
            this.syncHistoryUI();
        }
        return pushed;
    }

    undo() {
        const applied = this.history.undo();
        if (applied) {
            this.state.selection.clear();
            this.canvas.requestRedraw();
            this.syncHistoryUI();
        }
        return applied;
    }

    redo() {
        const applied = this.history.redo();
        if (applied) {
            this.state.selection.clear();
            this.canvas.requestRedraw();
            this.syncHistoryUI();
        }
        return applied;
    }

    canUndo() { return this.history.canUndo(); }
    canRedo() { return this.history.canRedo(); }

    deleteSelection() {
        if (this.state.selection.isEmpty()) return;

        const nodeIds = [...this.state.selection.nodes];
        const elementIds = [...this.state.selection.elements];

        this.executeCommand(new DeleteSelectionCommand(this.model, nodeIds, elementIds));
    }

    selectAll() {
        this.state.selection.clear();
        this.model.getAllNodes().forEach((n) => this.state.selection.nodes.add(n.id));
        this.model.getAllElements().forEach((e) => this.state.selection.elements.add(e.id));
        this.canvas.requestRedraw();
    }

    /** Cancels in-progress interaction (beam chain, drag, box-select) without switching tools. */
    cancelCurrentAction() {
        if (typeof this.toolManager.cancelCurrentAction === 'function') {
            this.toolManager.cancelCurrentAction();
        }

        this.state.selection.clear();
        this.canvas.requestRedraw();
    }

    // ==========================================
    // ID Generation
    // ==========================================

    generateNodeId() {
        let n = this._idCounters.node + 1;
        while (this.model.getNode(`N${n}`)) n++;
        this._idCounters.node = n;
        return `N${n}`;
    }

    generateElementId() {
        let n = this._idCounters.element + 1;
        while (this.model.findElementById(`E${n}`)) n++;
        this._idCounters.element = n;
        return `E${n}`;
    }

    // ==========================================
    // Keyboard Shortcuts
    // ==========================================

    _bindKeyboardShortcuts() {
        this._onKeyDown = (evt) => {
            const tag = evt.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || evt.target.isContentEditable) return;

            const ctrlOrCmd = evt.ctrlKey || evt.metaKey;
            const key = evt.key.toLowerCase();

            if (ctrlOrCmd && key === 'z' && !evt.shiftKey) {
                evt.preventDefault();
                this.undo();
                return;
            }

            if (ctrlOrCmd && (key === 'y' || (key === 'z' && evt.shiftKey))) {
                evt.preventDefault();
                this.redo();
                return;
            }

            if (ctrlOrCmd && key === 'a') {
                evt.preventDefault();
                this.selectAll();
                return;
            }

            if (key === 'delete' || key === 'backspace') {
                evt.preventDefault();
                this.deleteSelection();
                return;
            }

            if (key === 'escape') {
                evt.preventDefault();
                this.cancelCurrentAction();
                return;
            }

            if (key === ' ') {
                if (this._spaceHeld) return;
                this._spaceHeld = true;
                this._toolBeforeSpace = this.getActiveTool();
                this.setTool(TOOLS.PAN);
                evt.preventDefault();
            }
        };

        this._onKeyUp = (evt) => {
            const key = evt.key.toLowerCase();
            if (key === ' ' && this._spaceHeld) {
                this._spaceHeld = false;
                if (this._toolBeforeSpace) {
                    this.setTool(this._toolBeforeSpace);
                }
                this._toolBeforeSpace = null;
                evt.preventDefault();
            }
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }
}