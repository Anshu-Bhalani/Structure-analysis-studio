/**
 * Renderer.js
 * ------------------------------------------------------------------
 * Composition point for drawing every engineering object on a single
 * frame: elements, supports, loads, and nodes (nodes drawn last so
 * their joints sit visually on top of member end points), plus a
 * live preview overlay for in-progress tool actions (e.g. the
 * rubber-band beam preview while placing the second endpoint).
 *
 * This module performs NO hit-testing or state mutation — it only
 * reads Model + State and paints pixels.
 * ------------------------------------------------------------------
 */

import { NodeRenderer } from './renderers/NodeRenderer.js';
import { ElementRenderer } from './renderers/ElementRenderer.js';
import { SupportRenderer } from './renderers/SupportRenderer.js';
import { LoadRenderer } from './renderers/LoadRenderer.js';
import { TOOLS } from '../state/State.js';

export class Renderer {
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {import('../modeling/Model.js').Model} model
     * @param {import('./Camera.js').Camera} camera
     * @param {import('../state/State.js').State} state
     * @param {import('./ToolManager.js').ToolManager} [toolManager] - optional, enables live tool previews
     * @param {import('./SnapManager.js').SnapManager} [snapManager] - optional, enables the ghost-node preview
     */
    draw(ctx, model, camera, state, toolManager = null, snapManager = null) {
        ElementRenderer.draw(ctx, model, camera, state);
        SupportRenderer.draw(ctx, model, camera);
        LoadRenderer.draw(ctx, model, camera);
        NodeRenderer.draw(ctx, model, camera, state);

        this._drawElementPreview(ctx, model, camera, state, toolManager);
        this._drawGhostNode(ctx, model, camera, state, toolManager, snapManager);
    }

    /** Rubber-band line from the first clicked node to the current cursor while drawing an element. */
    _drawElementPreview(ctx, model, camera, state, toolManager) {
        if (!toolManager || toolManager.getActiveName() !== TOOLS.DRAW_ELEMENT) return;

        const tool = toolManager.active;
        if (!tool || !tool.firstNodeId) return;

        const fromNode = model.getNode(tool.firstNodeId);
        if (!fromNode) return;

        const from = camera.worldToScreen(fromNode.x, fromNode.y);
        const to = camera.worldToScreen(state.mouse.worldX, state.mouse.worldY);

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
    }

    /** Faint preview circle showing exactly where the next click will place/attach a node. */
    _drawGhostNode(ctx, model, camera, state, toolManager, snapManager) {
        if (!toolManager || !snapManager) return;

        const activeName = toolManager.getActiveName();
        if (activeName !== TOOLS.DRAW_NODE && activeName !== TOOLS.DRAW_ELEMENT) return;

        const snapped = state.snapEnabled
            ? snapManager.snap(state.mouse.worldX, state.mouse.worldY, model, camera)
            : { x: state.mouse.worldX, y: state.mouse.worldY, snappedTo: null };

        const pos = camera.worldToScreen(snapped.x, snapped.y);

        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, snapped.snappedTo?.type === 'node' ? 7 : 5, 0, Math.PI * 2);
        ctx.strokeStyle = snapped.snappedTo?.type === 'node'
            ? 'rgba(16, 185, 129, 0.9)'   // green: will attach to an existing node
            : 'rgba(255, 255, 255, 0.5)'; // white: free / grid-snapped placement
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
}
