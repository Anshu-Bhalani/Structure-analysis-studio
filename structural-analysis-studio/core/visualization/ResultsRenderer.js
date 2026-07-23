/**
 * Visualization / ResultsRenderer.js
 * ------------------------------------------------------------------
 * Top-level Visualization entry point. Given a Solver result bundle,
 * produces a single draw callback that Graphics/Canvas can call after
 * it finishes drawing the base model — Graphics never needs to know
 * what "reactions" or "BMD" mean.
 * ------------------------------------------------------------------
 */

import { DeflectedShapeRenderer } from "./DeflectedShapeRenderer.js";
import { DiagramRenderer } from "./DiagramRenderer.js";
import { UnitConverter } from "../utilities/UnitConverter.js";

export class ResultsRenderer {
  /**
   * @param {import('../modeling/Model.js').Model} model
   * @param {object} solverResult   the object returned by Solver.run()
   * @param {object} viewOptions    { showDeflected, showReactions, showSFD, showBMD, deflectionScale }
   * @param {object} colors
   */
  static makeDrawCallback(model, solverResult, viewOptions, colors) {
    return (ctx, camera, width, height) => {
      if (!solverResult) return;
      const { dofManager, U, reactions, elementResults } = solverResult;

      if (viewOptions.showDeflected) {
        DeflectedShapeRenderer.draw(ctx, camera, width, height, model, dofManager, U, viewOptions.deflectionScale, colors);
      }

      const beamResults = elementResults.filter((r) => r.type === "Beam");
      if (viewOptions.showSFD && beamResults.length) {
        DiagramRenderer.drawSFD(ctx, camera, width, height, model, beamResults, colors, viewOptions.diagramScale);
      }
      if (viewOptions.showBMD && beamResults.length) {
        DiagramRenderer.drawBMD(ctx, camera, width, height, model, beamResults, colors, viewOptions.diagramScale);
      }

      if (viewOptions.showReactions) {
        ResultsRenderer._drawReactions(ctx, camera, width, height, model, dofManager, reactions, colors);
      }
    };
  }

  static _drawReactions(ctx, camera, width, height, model, dofManager, reactions, colors) {
    ctx.save();
    ctx.fillStyle = colors.reaction;
    ctx.font = "11px 'IBM Plex Mono', monospace";

    for (const support of model.getAllSupports()) {
      const node = model.getNode(support.nodeId);
      if (!node) continue;
      const [ux, uy, rz] = dofManager.getNodeDOFIndices(node.id);
      const [sx, sy] = camera.worldToScreen(node.x, node.y, width, height);

      const lines = [];
      if (support.restraints.ux && reactions[ux] !== undefined) {
        lines.push(`Rx = ${UnitConverter.format(reactions[ux], 2)} N`);
      }
      if (support.restraints.uy && reactions[uy] !== undefined) {
        lines.push(`Ry = ${UnitConverter.format(reactions[uy], 2)} N`);
      }
      if (support.restraints.rz && reactions[rz] !== undefined) {
        lines.push(`Mz = ${UnitConverter.format(reactions[rz], 2)} N·m`);
      }
      lines.forEach((line, i) => {
        ctx.fillText(line, sx + 20, sy + 34 + i * 13);
      });
    }
    ctx.restore();
  }
}
