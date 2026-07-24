export class SupportRenderer {
    static draw(ctx, model, camera) {
        const color = "#10b981"; // Emerald Green
        const s = 12; // Base size of the support symbol
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        for (const support of model.getAllSupports()) {
            const node = model.getNode(support.node?.id || support.node);
            if (!node) continue;

            const pos = camera.worldToScreen(node.x, node.y);

            if (support.restrainedDOFs.dx && support.restrainedDOFs.dy && support.restrainedDOFs.mz) {
                // Fixed Support (Square centered below node)
                ctx.fillRect(pos.x - s/2, pos.y + 4, s, s);
            } 
            else if (support.restrainedDOFs.dx && support.restrainedDOFs.dy) {
                // Pinned Support (Triangle pointing up to node)
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - s/2, pos.y + s);
                ctx.lineTo(pos.x + s/2, pos.y + s);
                ctx.closePath();
                ctx.stroke();
            }
            else if (support.restrainedDOFs.dy) {
                // Roller Support (Circle below node with a ground line)
                ctx.beginPath();
                ctx.arc(pos.x, pos.y + s/2 + 2, s/2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Ground line
                ctx.beginPath();
                ctx.moveTo(pos.x - s, pos.y + s + 2);
                ctx.lineTo(pos.x + s, pos.y + s + 2);
                ctx.stroke();
            }
        }
    }
}
