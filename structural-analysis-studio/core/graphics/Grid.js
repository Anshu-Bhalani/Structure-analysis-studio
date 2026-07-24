/**
 * Grid.js
 * ------------------------------------------------------------------
 * Renders the adaptive, infinite engineering background grid.
 * Responsibilities:
 * - Calculate visible world bounds using the Camera
 * - Adapt grid density dynamically based on zoom level
 * - Render minor grid lines, major grid lines, and primary axes
 * - Render optional coordinate labels
 * ------------------------------------------------------------------
 */

export class Grid {
    constructor() {
        this.visible = true;
        this.showLabels = true;
        
        // Colors & Styling
        this.minorColor = "rgba(255, 255, 255, 0.05)";
        this.majorColor = "rgba(255, 255, 255, 0.15)";
        this.axisColor = "rgba(255, 255, 255, 0.4)";
        this.textColor = "rgba(255, 255, 255, 0.5)";
        
        // Base constraints
        this.minPixelsBetweenLines = 20; // Prevents grid from turning into a solid block when zoomed out
        this.majorMultiplier = 5;        // Every 5th line is a major line
    }

    /**
     * Toggles grid visibility.
     */
    toggle() {
        this.visible = !this.visible;
    }

    /**
     * Toggles coordinate label visibility.
     */
    toggleLabels() {
        this.showLabels = !this.showLabels;
    }

    /**
     * Calculates the ideal grid spacing in World Units (meters) based on current zoom.
     * Snaps to standard engineering increments (1, 2, 5, 10, etc.).
     * @param {number} zoom - Pixels per meter
     * @returns {number} Minor grid spacing in world units
     */
    _getAdaptiveSpacing(zoom) {
        const rawSpacing = this.minPixelsBetweenLines / zoom;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawSpacing)));
        const residual = rawSpacing / magnitude;
        
        if (residual > 5) return 10 * magnitude;
        if (residual > 2) return 5 * magnitude;
        return 2 * magnitude;
    }

    /**
     * Main render function called by the Canvas loop.
     * @param {CanvasRenderingContext2D} ctx 
     * @param {import('./Camera.js').Camera} camera 
     */
    draw(ctx, camera) {
        if (!this.visible) return;

        // 1. Determine World Bounds
        // Note: Screen (0,0) is top-left. Due to Cartesian Y-flip, 
        // top-left screen corresponds to Max Y, Min X in world coordinates.
        const topLeft = camera.screenToWorld(0, 0);
        const bottomRight = camera.screenToWorld(camera.width, camera.height);

        const minX = topLeft.x;
        const maxX = bottomRight.x;
        const minY = bottomRight.y;
        const maxY = topLeft.y;

        // 2. Calculate Adaptive Spacing
        const minorSpacing = this._getAdaptiveSpacing(camera.zoom);
        const majorSpacing = minorSpacing * this.majorMultiplier;

        // Determine starting values aligned to the grid spacing
        const startX = Math.floor(minX / minorSpacing) * minorSpacing;
        const startY = Math.floor(minY / minorSpacing) * minorSpacing;

        ctx.lineWidth = 1;
        ctx.font = "10px Consolas, monospace";
        ctx.fillStyle = this.textColor;

        // 3. Draw Vertical Lines (Iterating over X)
        for (let x = startX; x <= maxX; x += minorSpacing) {
            // Floating point cleanup to avoid artifacts like 0.0000000001
            const cleanX = Math.round(x * 10000) / 10000;
            const isMajor = Math.abs(cleanX % majorSpacing) < (minorSpacing / 10);
            const isAxis = cleanX === 0;

            const screenTop = camera.worldToScreen(cleanX, maxY);
            const screenBottom = camera.worldToScreen(cleanX, minY);

            ctx.beginPath();
            ctx.moveTo(screenTop.x, screenTop.y);
            ctx.lineTo(screenBottom.x, screenBottom.y);

            if (isAxis) ctx.strokeStyle = this.axisColor;
            else if (isMajor) ctx.strokeStyle = this.majorColor;
            else ctx.strokeStyle = this.minorColor;
            
            ctx.stroke();

            // Draw X Axis Labels (Draw on the X axis, or bottom of screen if X axis is off-screen)
            if (this.showLabels && isMajor && !isAxis) {
                const labelY = (minY <= 0 && maxY >= 0) ? camera.worldToScreen(cleanX, 0).y + 15 : camera.height - 10;
                ctx.fillText(cleanX.toString(), screenTop.x + 5, labelY);
            }
        }

        // 4. Draw Horizontal Lines (Iterating over Y)
        for (let y = startY; y <= maxY; y += minorSpacing) {
            const cleanY = Math.round(y * 10000) / 10000;
            const isMajor = Math.abs(cleanY % majorSpacing) < (minorSpacing / 10);
            const isAxis = cleanY === 0;

            const screenLeft = camera.worldToScreen(minX, cleanY);
            const screenRight = camera.worldToScreen(maxX, cleanY);

            ctx.beginPath();
            ctx.moveTo(screenLeft.x, screenLeft.y);
            ctx.lineTo(screenRight.x, screenRight.y);

            if (isAxis) ctx.strokeStyle = this.axisColor;
            else if (isMajor) ctx.strokeStyle = this.majorColor;
            else ctx.strokeStyle = this.minorColor;
            
            ctx.stroke();

            // Draw Y Axis Labels (Draw on the Y axis, or left of screen if Y axis is off-screen)
            if (this.showLabels && isMajor && !isAxis) {
                const labelX = (minX <= 0 && maxX >= 0) ? camera.worldToScreen(0, cleanY).x + 5 : 5;
                ctx.fillText(cleanY.toString(), labelX, screenLeft.y - 5);
            }
        }
        
        // Origin label
        if (this.showLabels && minX <= 0 && maxX >= 0 && minY <= 0 && maxY >= 0) {
            const originScreen = camera.worldToScreen(0, 0);
            ctx.fillText("0", originScreen.x + 5, originScreen.y + 15);
        }
    }
}
