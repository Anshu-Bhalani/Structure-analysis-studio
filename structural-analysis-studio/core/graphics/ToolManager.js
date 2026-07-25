/**
 * ToolManager.js
 * ------------------------------------------------------------------
 * Owns the current active tool and its interaction behavior.
 *
 * State.js stores WHICH tool is active (a plain string, for UI
 * highlighting). ToolManager owns WHAT that tool actually does when
 * the pointer moves/clicks — each tool is a small strategy object with
 * onPointerDown/Move/Up hooks. MouseController (and TouchController on
 * mobile) just convert raw browser events into world/screen
 * coordinates and forward them here.
 *
 * Tools: Select, Node, Beam (generic "connect two nodes with an
 * element" tool — reused for spring/bar/beam via state.drawElementType),
 * Move, Delete, Pan.
 * ------------------------------------------------------------------
 */

import { Node } from '../modeling/Node.js';
import { Element } from '../modeling/Element.js';
import { TOOLS } from '../state/State.js';
import {
    CreateNodeCommand,
    CreateBeamCommand,
    MoveNodesCommand,
    DeleteSelectionCommand,
} from './Commands.js';

// ==========================================
// Shared drag-to-move helpers
// ==========================================

function beginDrag(app, nodeIds) {
    const { model } = app;
    return {
        dragging: true,
        moves: [...nodeIds].map((id) => {
            const node = model.getNode(id);
            return { nodeId: id, fromX: node.x, fromY: node.y, toX: node.x, toY: node.y };
        }),
    };
}

function updateDrag(app, drag, startWorld, currentWorld) {
    const { model, snapManager, state, canvas } = app;
    const dx = currentWorld.x - startWorld.x;
    const dy = currentWorld.y - startWorld.y;

    for (const move of drag.moves) {
        const node = model.getNode(move.nodeId);
        if (!node) continue;

        const raw = { x: move.fromX + dx, y: move.fromY + dy };
        const snapped = state.snapEnabled
            ? snapManager.snap(raw.x, raw.y, model, canvas.camera, { excludeNodeId: move.nodeId })
            : raw;

        node.setPosition(snapped.x, snapped.y, node.z);
        move.toX = snapped.x;
        move.toY = snapped.y;
    }

    canvas.requestRedraw();
}

function commitDrag(app, drag) {
    const moved = drag.moves.filter((m) => m.toX !== m.fromX || m.toY !== m.fromY);
    if (moved.length > 0) {
        // Positions were already applied live during the drag — just record
        // the command as history, don't re-apply it.
        app.pushCommand(new MoveNodesCommand(app.model, moved));
    }
}

// ==========================================
// Base Tool
// ==========================================

class BaseTool {
    constructor(app) {
        this.app = app;
    }
    onActivate() {}
    onDeactivate() {}
    onPointerDown(_world, _screen, _evt) {}
    onPointerMove(_world, _screen, _evt) {}
    onPointerUp(_world, _screen, _evt) {}
    onDoubleClick(_world, _screen, _evt) {}
    getCursor() { return 'default'; }
}

// ==========================================
// Select Tool
// ==========================================

class SelectTool extends BaseTool {
    onDeactivate() {
        this.drag = null;
        this.app.state.selection.isDragging = false;
    }

    onPointerDown(world, screen, evt) {
        const { state, model, canvas } = this.app;
        const multi = !!(evt.shiftKey || evt.ctrlKey || evt.metaKey);

        const hit = this.app.hitTest.hit(world.x, world.y, model, canvas.camera);

        // Clicking an already-selected node starts a direct-manipulation drag.
        if (hit.type === 'node' && state.selection.isNodeSelected(hit.object.id) && !multi) {
            this.dragStartWorld = world;
            this.drag = beginDrag(this.app, state.selection.nodes);
            return;
        }

        state.selection.pick(screen.x, screen.y, model, canvas.camera, multi);

        // Nothing under the cursor at all -> start a box select instead.
        if (hit.type === null) {
            state.selection.startBoxSelection(screen.x, screen.y);
        } else if (hit.type === 'node' && state.selection.isNodeSelected(hit.object.id)) {
            // Freshly selected by the pick() call above -> allow immediate drag too.
            this.dragStartWorld = world;
            this.drag = beginDrag(this.app, state.selection.nodes);
        }

        canvas.requestRedraw();
    }

    onPointerMove(world, screen) {
        const { state, model, canvas } = this.app;

        if (this.drag) {
            updateDrag(this.app, this.drag, this.dragStartWorld, world);
            return;
        }

        if (state.selection.isDragging) {
            state.selection.updateBoxSelection(screen.x, screen.y);
            canvas.requestRedraw();
            return;
        }

        const hit = this.app.hitTest.hit(world.x, world.y, model, canvas.camera);
        state.setHover(hit.object?.id ?? null, hit.type);
        canvas.requestRedraw();
    }

    onPointerUp(world, screen, evt) {
        const { state, model, canvas } = this.app;

        if (this.drag) {
            commitDrag(this.app, this.drag);
            this.drag = null;
            canvas.requestRedraw();
            return;
        }

        if (state.selection.isDragging) {
            const multi = !!(evt.shiftKey || evt.ctrlKey || evt.metaKey);
            state.selection.endBoxSelection(model, canvas.camera, multi);
            canvas.requestRedraw();
        }
    }

    getCursor() {
        if (this.drag) return 'grabbing';
        const hovered = this.app.state.hoveredObject;
        return hovered ? 'pointer' : 'default';
    }
}

// ==========================================
// Move Tool
// ==========================================

class MoveTool extends BaseTool {
    onActivate() {
        this.drag = null;
        this.dragStartWorld = null;
    }

    onDeactivate() {
        this.drag = null;
        this.dragStartWorld = null;
    }

    onPointerDown(world, _screen, evt) {
        const { state, model, canvas } = this.app;
        const hit = this.app.hitTest.hit(world.x, world.y, model, canvas.camera);

        if (hit.type !== 'node') return;

        if (!state.selection.isNodeSelected(hit.object.id)) {
            state.selection.clear();
            state.selection.nodes.add(hit.object.id);
        }

        this.dragStartWorld = world;
        this.drag = beginDrag(this.app, state.selection.nodes);
        canvas.requestRedraw();
    }

    onPointerMove(world, _screen) {
        if (this.drag) {
            updateDrag(this.app, this.drag, this.dragStartWorld, world);
        }
    }

    onPointerUp() {
        if (this.drag) {
            commitDrag(this.app, this.drag);
            this.drag = null;
            this.dragStartWorld = null;
            this.app.canvas.requestRedraw();
        }
    }

    getCursor() {
        return this.drag ? 'grabbing' : 'grab';
    }
}

// ==========================================
// Node Tool — click to place a node
// ==========================================

class NodeTool extends BaseTool {
    onPointerDown(world) {
        const { model, state, snapManager, canvas } = this.app;

        const snapped = state.snapEnabled
            ? snapManager.snap(world.x, world.y, model, canvas.camera)
            : { x: world.x, y: world.y, snappedTo: null };

        // If we snapped exactly onto an existing node, reuse it instead of
        // creating a duplicate node at the same coordinates.
        if (snapped.snappedTo?.type === 'node') {
            state.selection.clear();
            state.selection.nodes.add(snapped.snappedTo.id);
            canvas.requestRedraw();
            return;
        }

        const node = new Node(this.app.generateNodeId(), snapped.x, snapped.y);
        this.app.executeCommand(new CreateNodeCommand(model, node));

        state.selection.clear();
        state.selection.nodes.add(node.id);
        canvas.requestRedraw();
    }

    onPointerMove() {
        this.app.canvas.requestRedraw();
    }

    getCursor() { return 'crosshair'; }
}

// ==========================================
// Element Tool — connect TWO EXISTING nodes only
// No auto-node creation here.
// ==========================================

class ElementTool extends BaseTool {
    onActivate() {
        this.firstNodeId = null;
    }

    onDeactivate() {
        this.firstNodeId = null;
    }

    _pickExistingNodeAt(world) {
        const { model, state, canvas, snapManager } = this.app;

        // Prefer exact node hit.
        const hitNode = this.app.hitTest.hitNode(world.x, world.y, model, canvas.camera);
        if (hitNode) return hitNode;

        // Then snap-to-node if enabled.
        if (state.snapEnabled) {
            const snapped = snapManager.snap(world.x, world.y, model, canvas.camera);
            if (snapped.snappedTo?.type === 'node') {
                return model.getNode(snapped.snappedTo.id) || null;
            }
        }

        return null;
    }

    onPointerDown(world) {
        const { model, state, canvas } = this.app;

        const targetNode = this._pickExistingNodeAt(world);

        // No existing node under cursor -> do nothing.
        if (!targetNode) {
            return;
        }

        if (!this.firstNodeId) {
            this.firstNodeId = targetNode.id;
            state.selection.clear();
            state.selection.nodes.add(targetNode.id);
            canvas.requestRedraw();
            return;
        }

        if (this.firstNodeId === targetNode.id) {
            return;
        }

        const startNode = model.getNode(this.firstNodeId);
        const endNode = targetNode;

        if (!startNode || !endNode) {
            this.firstNodeId = null;
            return;
        }

        const element = new Element(
            this.app.generateElementId(),
            startNode,
            endNode,
            state.drawElementType
        );

        this.app.executeCommand(new CreateBeamCommand(model, element));

        if (state.drawingMode === 'single') {
            this.firstNodeId = null;
        } else {
            this.firstNodeId = endNode.id;
        }

        state.selection.clear();
        state.selection.elements.add(element.id);
        canvas.requestRedraw();
    }

    onPointerMove() {
        this.app.canvas.requestRedraw();
    }

    getCursor() { return 'crosshair'; }
}

// ==========================================
// Delete Tool
// ==========================================

class DeleteTool extends BaseTool {
    onPointerDown(world) {
        const { model, state, canvas } = this.app;
        const hit = this.app.hitTest.hit(world.x, world.y, model, canvas.camera);

        if (!hit.type) return;

        state.selection.clear();
        if (hit.type === 'node') state.selection.nodes.add(hit.object.id);
        else state.selection.elements.add(hit.object.id);

        this.app.executeCommand(
            new DeleteSelectionCommand(
                model,
                [...state.selection.nodes],
                [...state.selection.elements]
            )
        );

        canvas.requestRedraw();
    }

    getCursor() { return 'not-allowed'; }
}

// ==========================================
// Pan Tool
// ==========================================

class PanTool extends BaseTool {
    onActivate() {
        this.panning = false;
        this.lastScreen = null;
    }

    onDeactivate() {
        this.panning = false;
        this.lastScreen = null;
    }

    onPointerDown(_world, screen) {
        this.panning = true;
        this.lastScreen = { x: screen.x, y: screen.y };
    }

    onPointerMove(_world, screen) {
        if (!this.panning || !this.lastScreen) return;
        const dx = screen.x - this.lastScreen.x;
        const dy = screen.y - this.lastScreen.y;
        this.app.canvas.movePan(dx, dy);
        this.lastScreen = { x: screen.x, y: screen.y };
    }

    onPointerUp() {
        this.panning = false;
        this.lastScreen = null;
    }

    getCursor() {
        return this.panning ? 'grabbing' : 'grab';
    }
}

// ==========================================
// Placeholder tools for Phase 4
// ==========================================

class PlaceholderTool extends BaseTool {
    constructor(app, label) {
        super(app);
        this.label = label;
    }
    getCursor() { return 'not-allowed'; }
    onPointerDown() {}
    onPointerMove() {}
    onPointerUp() {}
    onDoubleClick() {}
}

// ==========================================
// Tool Manager
// ==========================================

export class ToolManager {
    constructor(app) {
        this.app = app;
        this.active = null;

        this._tools = {
            [TOOLS.SELECT]: new SelectTool(app),
            [TOOLS.MOVE]: new MoveTool(app),
            [TOOLS.DRAW_NODE]: new NodeTool(app),
            [TOOLS.DRAW_ELEMENT]: new ElementTool(app),
            [TOOLS.DELETE]: new DeleteTool(app),
            [TOOLS.PAN]: new PanTool(app),
            [TOOLS.ADD_SUPPORT]: new PlaceholderTool(app, 'add_support'),
            [TOOLS.ADD_LOAD]: new PlaceholderTool(app, 'add_load'),
        };

        this.activate(app.state.currentTool || TOOLS.SELECT);
    }

    activate(toolName) {
        if (!Object.values(TOOLS).includes(toolName)) {
            toolName = TOOLS.SELECT;
        }

        if (this.active?.onDeactivate) {
            this.active.onDeactivate();
        }

        this.app.state.setTool(toolName);
        this.active = this._tools[toolName] || this._tools[TOOLS.SELECT];

        if (this.active?.onActivate) {
            this.active.onActivate();
        }

        this.app.canvas.requestRedraw();
    }

    getActiveName() {
        return this.app.state.currentTool;
    }

    getCursor() {
        return this.active?.getCursor?.() || 'default';
    }

    onPointerDown(world, screen, evt) {
        this.active?.onPointerDown?.(world, screen, evt);
        this.app.canvas.requestRedraw();
    }

    onPointerMove(world, screen, evt) {
        this.active?.onPointerMove?.(world, screen, evt);
    }

    onPointerUp(world, screen, evt) {
        this.active?.onPointerUp?.(world, screen, evt);
        this.app.canvas.requestRedraw();
    }

    onDoubleClick(world, screen, evt) {
        this.active?.onDoubleClick?.(world, screen, evt);
    }

    cancelCurrentAction() {
        if (!this.active) return;

        if ('firstNodeId' in this.active) this.active.firstNodeId = null;
        if ('drag' in this.active) this.active.drag = null;
        if ('dragStartWorld' in this.active) this.active.dragStartWorld = null;
        if ('panning' in this.active) this.active.panning = false;
        if ('lastScreen' in this.active) this.active.lastScreen = null;
    }
}