/**
 * SnapManager.js
 * ------------------------------------------------------------------
 * Computes a "snapped" world position for cursor-driven placement and
 * movement operations (node creation, beam endpoints, node dragging).
 *
 * Priority: Existing Node > Grid > Raw cursor position.
 * Node snapping wins because connecting two elements to the exact same
 * node is structurally meaningful; grid snapping is a convenience.
 * ------------------------------------------------------------------
 */

export class SnapManager {
    constructor() {
        this.snapToGrid = true;
        this.snapToNode = true;
        this.nodeSnapTolerancePx = 12;

        // If null, spacing is derived adaptively from the current zoom
        // (mirrors Grid.js's own adaptive spacing so the crosshair snaps
        // exactly onto the lines the user can see).
        this.gridSnapSpacing = null;
        this.minPixelsBetweenLines = 20;
    }

    toggleGridSnap() {
        this.snapToGrid = !this.snapToGrid;
        return this.snapToGrid;
    }

    toggleNodeSnap() {
        this.snapToNode = !this.snapToNode;
        return this.snapToNode;
    }

    /**
     * @param {number} worldX
     * @param {number} worldY
     * @param {import('../modeling/Model.js').Model} model
     * @param {import('./Camera.js').Camera} camera
     * @param {{enabled?: boolean, excludeNodeId?: string}} [options]
     * @returns {{x: number, y: number, snappedTo: {type: 'node', id: string}|{type: 'grid'}|null}}
     */
    snap(worldX, worldY, model, camera, options = {}) {
        const enabled = options.enabled !== undefined ? options.enabled : true;
        if (!enabled) {
            return { x: worldX, y: worldY, snappedTo: null };
        }

        if (this.snapToNode) {
            const nodeSnap = this._snapToNearestNode(worldX, worldY, model, camera, options.excludeNodeId);
            if (nodeSnap) return nodeSnap;
        }

        if (this.snapToGrid) {
            return this._snapToGrid(worldX, worldY, camera);
        }

        return { x: worldX, y: worldY, snappedTo: null };
    }

    _snapToNearestNode(worldX, worldY, model, camera, excludeNodeId) {
        const toleranceWorld = this.nodeSnapTolerancePx / camera.zoom;
        let closest = null;
        let minDist = Infinity;

        for (const node of model.getAllNodes()) {
            if (excludeNodeId && node.id === excludeNodeId) continue;
            const dist = Math.hypot(node.x - worldX, node.y - worldY);
            if (dist <= toleranceWorld && dist < minDist) {
                minDist = dist;
                closest = node;
            }
        }

        if (!closest) return null;
        return { x: closest.x, y: closest.y, snappedTo: { type: 'node', id: closest.id } };
    }

    _snapToGrid(worldX, worldY, camera) {
        const spacing = this.gridSnapSpacing || this._adaptiveSpacing(camera.zoom);
        const x = Math.round(worldX / spacing) * spacing;
        const y = Math.round(worldY / spacing) * spacing;
        return { x, y, snappedTo: { type: 'grid' } };
    }

    /** Same increment logic as Grid.js so the crosshair lands exactly on visible lines. */
    _adaptiveSpacing(zoom) {
        const raw = this.minPixelsBetweenLines / zoom;
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
        const residual = raw / magnitude;

        if (residual > 5) return 10 * magnitude;
        if (residual > 2) return 5 * magnitude;
        return 2 * magnitude;
    }
}
