import { NodeRenderer } from './renderers/NodeRenderer.js';
import { ElementRenderer } from './renderers/ElementRenderer.js';
import { SupportRenderer } from './renderers/SupportRenderer.js';
import { LoadRenderer } from './renderers/LoadRenderer.js';
import { TOOLS } from '../state/State.js';

export class Renderer {
    draw(ctx, model, camera, state, toolManager = null, snapManager = null) {
        ElementRenderer.draw(ctx, model, camera, state);
        SupportRenderer.draw(ctx, model, camera);
        LoadRenderer.draw(ctx, model, camera);
        NodeRenderer.draw(ctx, model, camera, state);

        this._drawElementPreview(ctx, model, camera, state, toolManager);
        this._drawSnapIndicator(ctx, model, camera, state, toolManager, snapManager);
    }

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

    _drawSnapIndicator(ctx, model, camera, state, toolManager, snapManager) {
        if (!toolManager || !snapManager) return;
        
        // Safety guard
        if (typeof state.mouse.worldX !== 'number') return;

        const activeName = toolManager.getActiveName();
        if (activeName !== TOOLS.DRAW_NODE && activeName !== TOOLS.DRAW_ELEMENT && activeName !== TOOLS.MOVE && activeName !== TOOLS.SELECT) return;

        const snapped = snapManager.snap(state.mouse.worldX, state.mouse.worldY, model, camera, { 
            enabled: state.snapEnabled, 
            snapRadius: state.snapRadius 
        });

        if (!snapped.snapped) return;

        const pos = camera.worldToScreen(snapped.x, snapped.y);

        ctx.save();
        ctx.beginPath();
        
        if (snapped.type === "node") {
            ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)'; // Green
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (snapped.type === "grid") {
            const size = 10;
            ctx.rect(pos.x - size/2, pos.y - size/2, size, size);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // White
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
