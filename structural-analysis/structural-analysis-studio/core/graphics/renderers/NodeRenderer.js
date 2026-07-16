/**
 * Graphics / renderers / NodeRenderer.js
 * ------------------------------------------------------------------
 * Draws nodes. Pure rendering — reads Modeling data, never mutates it.
 * ------------------------------------------------------------------
 */

export class NodeRenderer {
  static draw(ctx, camera, canvasWidth, canvasHeight, nodes, colors, selectedNodeId, hoveredNodeId) {
    const radius = 5;
    nodes.forEach((node) => {
      const [sx, sy] = camera.worldToScreen(node.x, node.y, canvasWidth, canvasHeight);
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;

      ctx.beginPath();
      ctx.arc(sx, sy, isSelected || isHovered ? radius + 2 : radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? colors.accent : colors.node;
      ctx.fill();
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = colors.nodeStroke;
      ctx.stroke();

      if (node.label) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = "11px 'IBM Plex Mono', monospace";
        ctx.fillText(node.label, sx + 9, sy - 8);
      }
    });
  }
}
