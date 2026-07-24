export class LoadRenderer {
    static draw(ctx, model, camera) {
        const color = "#ef4444"; // Red
        const size = 15; // Arrow length scaling
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        for (const load of model.getAllLoads()) {
            if (load.targetType !== 'node') continue; 

            const node = model.getNode(load.target?.id || load.target);
            if (!node) continue;

            const pos = camera.worldToScreen(node.x, node.y);
            ctx.beginPath();
            
            // Note: Camera flips Y, so FY positive (up in world) points UP on screen.
            // Arrow is drawn pointing AT the node.
            if (load.direction === 'FY') {
                const dir = load.magnitude > 0 ? 1 : -1; 
                ctx.moveTo(pos.x, pos.y + (size * 2 * dir));
                ctx.lineTo(pos.x, pos.y);
                
                // Arrowhead
                ctx.moveTo(pos.x - 5, pos.y + (7 * dir));
                ctx.lineTo(pos.x, pos.y);
                ctx.lineTo(pos.x + 5, pos.y + (7 * dir));
            } 
            else if (load.direction === 'FX') {
                const dir = load.magnitude > 0 ? -1 : 1; 
                ctx.moveTo(pos.x + (size * 2 * dir), pos.y);
                ctx.lineTo(pos.x, pos.y);
                
                // Arrowhead
                ctx.moveTo(pos.x + (7 * dir), pos.y - 5);
                ctx.lineTo(pos.x, pos.y);
                ctx.lineTo(pos.x + (7 * dir), pos.y + 5);
            }

            ctx.stroke();
        }
    }
}
