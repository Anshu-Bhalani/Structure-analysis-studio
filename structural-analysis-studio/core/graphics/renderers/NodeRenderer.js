export class NodeRenderer {
    static draw(ctx, model, camera, state) {
        const radius = 4;
        const defaultColor = "#ffffff";
        const selectedColor = "#3b82f6";
        const hoverColor = "#60a5fa";

        for (const node of model.getAllNodes()) {
            const screenPos = camera.worldToScreen(node.x, node.y);

            const isSelected = state.selection.isNodeSelected(node.id);
            const isHovered = state.hoveredObject?.id === node.id && state.hoveredObject?.type === 'node';

            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
            
            if (isSelected) {
                ctx.fillStyle = selectedColor;
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"; // Blue glow
                ctx.stroke();
            } else if (isHovered) {
                ctx.fillStyle = hoverColor;
            } else {
                ctx.fillStyle = defaultColor;
            }

            ctx.fill();
        }
    }
}
