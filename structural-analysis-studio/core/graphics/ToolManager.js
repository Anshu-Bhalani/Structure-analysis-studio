/**
 * ToolManager.js
 * ------------------------------------------------------------------
 * Delegates actions via App.executeCommand() for the Undo Stack.
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
            ? snapManager.snap(raw.x, raw.y, model, canvas.camera, { excludeNodeId: move.nodeId, snapRadius: state.snapRadius })
            : { x: raw.x, y: raw.y };

        node.setPosition(snapped.x, snapped.y, node.z);
        move.toX = snapped.x;
        move.toY = snapped.y;
    }
    canvas.requestRedraw();
}

function commitDrag(app, drag) {
    const moved = drag.moves.filter((m) => m.toX !== m.fromX || m.toY !== m.fromY);
    if (moved.length > 0) {
        // Direct mutation happened during drag; push silently without re-executing.
        app.history.push(new MoveNodesCommand(app.model, moved));
    }
}

class BaseTool {
    constructor(app) { this.app = app; }
    onActivate() {}
    onDeactivate() {}
    onPointerDown(_world, _screen, _evt) {}
    onPointerMove(_world, _screen, _evt) {}
    onPointerUp(_world, _screen, _evt) {}
    onDoubleClick(_world, _screen, _evt) {}
    getCursor() { return 'default'; }
}

class SelectTool extends BaseTool {
    onDeactivate() {
        this.drag = null;
        this.app.state.selection.isDragging = false;
    }
    onPointerDown(world, screen, evt) {
        const { state, model, canvas } = this.app;
        const multi = !!(evt.shiftKey || evt.ctrlKey || evt.metaKey);
        const hit = this.app.hitTest.hit(world.x, world.y, model, canvas.camera);

        if (hit.type === 'node' && state.selection.isNodeSelected(hit.object.id) && !multi) {
            this.dragStartWorld = world;
            this.drag = beginDrag(this.app, state.selection.nodes);
            return;
        }

        state.selection.pick(screen.x, screen.y, model, canvas.camera, multi);

        if (hit.type === null) {
            state.selection.startBoxSelection(screen.x, screen.y);
        } else if (hit.type === 'node' && state.selection.isNodeSelected(hit.object.id)) {
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
        return this.app.state.hoveredObject ? 'pointer' : 'default';
    }
}

class NodeTool extends BaseTool {
    onPointerDown(world) {
        const { model, state, snapManager, canvas } = this.app;
        const snapped = state.snapEnabled
            ? snapManager.snap(world.x, world.y, model, canvas.camera, { snapRadius: state.snapRadius })
            : { x: world.x, y: world.y };

        const node = new Node(this.app.generateNodeId(), snapped.x, snapped.y);
        this.app.executeCommand(new CreateNodeCommand(model, node));

        state.selection.clear();
        state.selection.nodes.add(node.id);
    }
    onPointerMove() { this.app.canvas.requestRedraw(); }
    getCursor() { return 'crosshair'; }
}

class ElementTool extends BaseTool {
    onActivate() { this.firstNodeId = null; }
    onDeactivate() { this.firstNodeId = null; }

    onPointerDown(world) {
        const { model, state, canvas, snapManager } = this.app;
        let targetNode = this.app.hitTest.hitNode(world.x, world.y, model, canvas.camera);

        if (!targetNode) {
            const snapped = state.snapEnabled
                ? snapManager.snap(world.x, world.y, model, canvas.camera, { snapRadius: state.snapRadius })
                : { x: world.x, y: world.y };
            targetNode = new Node(this.app.generateNodeId(), snapped.x, snapped.y);
            this.app.executeCommand(new CreateNodeCommand(model, targetNode));
        }

        if (!this.firstNodeId) {
            this.firstNodeId = targetNode.id;
        } else if (targetNode.id !== this.firstNodeId) {
            const element = new Element(
                this.app.generateElementId(),
                this.firstNodeId,
                targetNode.id,
                state.drawElementType
            );
            this.app.executeCommand(new CreateBeamCommand(model, element));
            this.firstNodeId = targetNode.id; 
        }

        state.selection.clear();
        state.selection.nodes.add(targetNode.id);
        canvas.requestRedraw();
    }
    onPointerMove() { this.app.canvas.requestRedraw(); }
    getCursor() { return 'crosshair'; }
}

class MoveTool extends BaseTool {
    onDeactivate() { this.drag = null; }
    onPointerDown(world) {
        const { state, model, canvas } = this.app;
        const node = this.app.hitTest.hitNode(world.x, world.y, model, canvas.camera);
        if (!node) return;

        if (!state.selection.isNodeSelected(node.id)) {
            state.selection.clear();
            state.selection.nodes.add(node.id);
        }

        this.dragStartWorld = world;
        this.drag = beginDrag(this.app, state.selection.nodes);
    }
    onPointerMove(world) {
        if (!this.drag) return;
        updateDrag(this.app, this.drag, this.dragStartWorld, world);
    }
    onPointerUp() {
        if (!this.drag) return;
        commitDrag(this.app, this.drag);
        this.drag = null;
        this.app.canvas.requestRedraw();
    }
    getCursor() { return this.drag ? 'grabbing' : 'move'; }
}

class DeleteTool extends BaseTool {
    onPointerDown(world) {
        const { model, canvas } = this.app;
        const hit = this.app.hitTest.hit(world.x, world.y, model, canvas.camera);
        if (hit.type === 'node') {
            this.app.executeCommand(new DeleteSelectionCommand(model, [hit.object.id], []));
        } else if (hit.type === 'element') {
            this.app.executeCommand(new DeleteSelectionCommand(model, [], [hit.object.id]));
        }
    }
    onPointerMove(world) {
        const { model, canvas, state } = this.app;
        const hit = this.app.hitTest.hit(world.x, world.y, model, canvas.camera);
        state.setHover(hit.object?.id ?? null, hit.type);
        canvas.requestRedraw();
    }
    getCursor() { return 'not-allowed'; }
}

class PanTool extends BaseTool {
    onPointerDown(_world, screen) {
        this.panning = true;
        this.lastScreen = screen;
    }
    onPointerMove(_world, screen) {
        if (!this.panning) return;
        const dx = screen.x - this.lastScreen.x;
        const dy = screen.y - this.lastScreen.y;
        this.app.canvas.movePan(dx, dy);
        this.lastScreen = screen;
    }
    onPointerUp() { this.panning = false; }
    getCursor() { return this.panning ? 'grabbing' : 'grab'; }
}

export class ToolManager {
    constructor(app) {
        this.app = app;
        this.tools = {
            [TOOLS.SELECT]: new SelectTool(app),
            [TOOLS.DRAW_NODE]: new NodeTool(app),
            [TOOLS.DRAW_ELEMENT]: new ElementTool(app),
            [TOOLS.MOVE]: new MoveTool(app),
            [TOOLS.PAN]: new PanTool(app),
            [TOOLS.DELETE]: new DeleteTool(app),
        };
        this.active = this.tools[TOOLS.SELECT];
        this._tempPanPrevious = null;
    }

    activate(toolName, options = {}) {
        const next = this.tools[toolName];
        if (!next) return;

        if (this.active) this.active.onDeactivate();
        this.active = next;

        if (options.preserveSelection) {
            this.app.state.currentTool = toolName; 
        } else {
            this.app.state.setTool(toolName);
        }

        this.active.onActivate();
        this.app.canvas.requestRedraw();
    }

    getActiveName() {
        return Object.keys(this.tools).find((key) => this.tools[key] === this.active) ?? null;
    }

    beginTemporaryPan() {
        if (this._tempPanPrevious) return;
        this._tempPanPrevious = this.getActiveName();
        this.activate(TOOLS.PAN, { preserveSelection: true });
    }

    endTemporaryPan() {
        if (!this._tempPanPrevious) return;
        this.activate(this._tempPanPrevious, { preserveSelection: true });
        this._tempPanPrevious = null;
    }

    onPointerDown(world, screen, evt) { this.active.onPointerDown(world, screen, evt); }
    onPointerMove(world, screen, evt) { this.active.onPointerMove(world, screen, evt); }
    onPointerUp(world, screen, evt) { this.active.onPointerUp(world, screen, evt); }
    onDoubleClick(world, screen, evt) { this.active.onDoubleClick(world, screen, evt); }
    getCursor() { return this.active.getCursor(); }
}
