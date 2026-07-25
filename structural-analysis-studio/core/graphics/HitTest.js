/**
 * HitTest.js
 * ------------------------------------------------------------------
 * Stateless, read-only "what is under the cursor" queries.
 *
 * This is intentionally separate from Selection.js:
 * - Selection.js MUTATES state (click-to-select, multi-select toggling,
 *   box-select accumulation) and owns the current selection Sets.
 * - HitTest.js answers a single question — "what geometry sits at this
 *   world point?" — without touching any state. It is used for hover
 *   feedback and by tools (Node/Beam/Move/Delete) that need to know
 *   what's under the pointer without invoking full selection logic.
 *
 * Priority is always Node > Element > Nothing, matching Selection.js.
 * ------------------------------------------------------------------
 */

export class HitTest {
    static NODE_TOLERANCE_PX = 10;
    static ELEMENT_TOLERANCE_PX = 8;

    /**
     * Finds the closest node within tolerance of a world point.
     * @param {number} worldX
     * @param {number} worldY
     * @param {import('../modeling/Model.js').Model} model
     * @param {import('./Camera.js').Camera} camera
     * @param {number} [tolerancePx]
     * @returns {import('../modeling/Node.js').Node|null}
     */
    static hitNode(worldX, worldY, model, camera, tolerancePx = HitTest.NODE_TOLERANCE_PX) {
        const toleranceWorld = tolerancePx / camera.zoom;
        let closest = null;
        let minDist = Infinity;

        for (const node of model.getAllNodes()) {
            if (node.visible === false) continue;
            const dist = Math.hypot(node.x - worldX, node.y - worldY);
            if (dist <= toleranceWorld && dist < minDist) {
                minDist = dist;
                closest = node;
            }
        }
        return closest;
    }

    /**
     * Finds the closest element (by distance to its line segment) within tolerance.
     * @returns {import('../modeling/Element.js').Element|null}
     */
    static hitElement(worldX, worldY, model, camera, tolerancePx = HitTest.ELEMENT_TOLERANCE_PX) {
        const toleranceWorld = tolerancePx / camera.zoom;
        let closest = null;
        let minDist = Infinity;

        for (const element of model.getAllElements()) {
            const nodeA = model.getNode(element.startNode?.id || element.startNode);
            const nodeB = model.getNode(element.endNode?.id || element.endNode);
            if (!nodeA || !nodeB) continue;

            const dist = HitTest._distanceToSegment(worldX, worldY, nodeA.x, nodeA.y, nodeB.x, nodeB.y);
            if (dist <= toleranceWorld && dist < minDist) {
                minDist = dist;
                closest = element;
            }
        }
        return closest;
    }

    /**
     * Combined priority hit test: Node -> Element -> nothing.
     * @returns {{type: 'node'|'element'|null, object: object|null}}
     */
    static hit(worldX, worldY, model, camera) {
        const node = HitTest.hitNode(worldX, worldY, model, camera);
        if (node) return { type: 'node', object: node };

        const element = HitTest.hitElement(worldX, worldY, model, camera);
        if (element) return { type: 'element', object: element };

        return { type: null, object: null };
    }

    /** Shortest distance from a point to a finite line segment. */
    static _distanceToSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let t = lenSq !== 0 ? dot / lenSq : -1;
        t = Math.max(0, Math.min(1, t));

        const xx = x1 + t * C;
        const yy = y1 + t * D;
        return Math.hypot(px - xx, py - yy);
    }
}
