export class ElementRenderer {
    static draw(ctx, model, camera, state) {
        const baseLineWidth = 2;
        const defaultColor = "#9ca3af";
        const selectedColor = "#3b82f6";
        const hoverColor = "#60a5fa";

        for (const element of model.getAllElements()) {
            const nodeI = model.getNode(element.startNode?.id || element.startNode);
            const nodeJ = model.getNode(element.endNode?.id || element.endNode);
            
            if (!nodeI || !nodeJ) continue;

            const screenI = camera.worldToScreen(nodeI.x, nodeI.y);
            const screenJ = camera.worldToScreen(nodeJ.x, nodeJ.y);

            const isSelected = state.selection.isElementSelected(element.id);
            const isHovered = state.hoveredObject?.id === element.id && state.hoveredObject?.type === 'element';

            ctx.beginPath();
            ctx.moveTo(screenI.x, screenI.y);
            ctx.lineTo(screenJ.x, screenJ.y);

            ctx.lineWidth = isSelected || isHovered ? baseLineWidth + 2 : baseLineWidth;
            
            if (isSelected) {
                ctx.strokeStyle = selectedColor;
            } else if (isHovered) {
                ctx.strokeStyle = hoverColor;
            } else {
                ctx.strokeStyle = defaultColor;
            }

            ctx.stroke();
        }
    }
}
