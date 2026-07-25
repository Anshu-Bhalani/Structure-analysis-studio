export class SnapManager {
    constructor() {
        this.snapToGrid = true;
        this.snapToNode = true;

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

    snap(worldX, worldY, model, camera, options = {}) {
        const enabled = options.enabled !== undefined ? options.enabled : true;
        if (!enabled) {
            return { x: worldX, y: worldY, snapped: false, type: "none" };
        }

        if (this.snapToNode) {
            const nodeSnap = this._snapToNearestNode(worldX, worldY, model, camera, options);
            if (nodeSnap) return nodeSnap;
        }

        if (this.snapToGrid) {
            return this._snapToGrid(worldX, worldY, camera);
        }

        return { x: worldX, y: worldY, snapped: false, type: "none" };
    }

    _snapToNearestNode(worldX, worldY, model, camera, options) {
        const radiusPx = options.snapRadius || 12;
        // Fix: Safety fallback for zoom
        const zoom = (camera && camera.zoom) ? camera.zoom : 60; 
        const toleranceWorld = radiusPx / zoom;
        
        let closest = null;
        let minDist = Infinity;

        for (const node of model.getAllNodes()) {
            if (options.excludeNodeId && node.id === options.excludeNodeId) continue;
            const dist = Math.hypot(node.x - worldX, node.y - worldY);
            if (dist <= toleranceWorld && dist < minDist) {
                minDist = dist;
                closest = node;
            }
        }

        if (!closest) return null;
        return { x: closest.x, y: closest.y, snapped: true, type: "node", id: closest.id };
    }

    _snapToGrid(worldX, worldY, camera) {
        const zoom = (camera && camera.zoom) ? camera.zoom : 60;
        const spacing = this.gridSnapSpacing || this._adaptiveSpacing(zoom);
        const x = Math.round(worldX / spacing) * spacing;
        const y = Math.round(worldY / spacing) * spacing;
        return { x, y, snapped: true, type: "grid" };
    }

    _adaptiveSpacing(zoom) {
        const raw = this.minPixelsBetweenLines / zoom;
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
        const residual = raw / magnitude;

        if (residual > 5) return 10 * magnitude;
        if (residual > 2) return 5 * magnitude;
        return 2 * magnitude;
    }
}
