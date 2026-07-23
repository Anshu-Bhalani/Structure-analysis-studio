/**
 * Graphics / Canvas.js
 * ------------------------------------------------------------------
 * The drawing surface. Owns the Camera, Grid and Selection, and
 * delegates actual shape drawing to the renderers/ sub-modules.
 *
 * Canvas captures raw pointer input and turns it into WORLD
 * coordinates + hit-test results, then calls back into whatever
 * controller (App.js) is listening. It does NOT decide what a click
 * means for the application (e.g. "create a node" vs "start a beam")
 * — that decision belongs to App, keeping Graphics reusable no
 * matter how many tools/modes get added later.
 * ------------------------------------------------------------------
 */

import { Camera } from "./Camera.js";
import { Grid } from "./Grid.js";
import { Selection } from "./Selection.js";
import { NodeRenderer } from "./renderers/NodeRenderer.js";
import { ElementRenderer } from "./renderers/ElementRenderer.js";
import { SupportRenderer } from "./renderers/SupportRenderer.js";
import { LoadRenderer } from "./renderers/LoadRenderer.js";

const HIT_TOLERANCE_PX = 14;

export class CanvasSurface {
  /**
   * @param {HTMLCanvasElement} canvasEl
   * @param {import('../modeling/Model.js').Model} model
   */
  constructor(canvasEl, model) {
    this.canvasEl = canvasEl;
    this.ctx = canvasEl.getContext("2d");
    this.model = model;

    this.camera = new Camera();
    this.grid = new Grid(0.5);
    this.selection = new Selection();

    this.colors = null; // set via setColors() by ThemeManager
    this.hoveredNodeId = null;
    this.hoveredElementId = null;

    this.isPanning = false;
    this.isDraggingNode = false;
    this.lastPointer = [0, 0];
    this.currentTool = "select";

    this.extraDrawCallback = null; // Visualization module hooks in here

    // Public callbacks — App.js assigns these.
    this.onNodeClick = null; // (node) => void
    this.onElementClick = null; // (element) => void
    this.onEmptyClick = null; // (worldX, worldY) => void
    this.onNodeMoved = null; // (node) => void
    this.onSelectionChange = null; // () => void

    this._bindEvents();
    this._resizeToContainer();
    window.addEventListener("resize", () => this._resizeToContainer());
  }

  setColors(colors) {
    this.colors = colors;
  }

  /**
   * Called by App whenever the active toolbar tool changes. This is
   * what lets the "Pan" tool work by simple touch-and-drag — Alt+drag
   * and middle-click remain available as desktop shortcuts, but
   * touch/tablet users have neither, so the explicit Pan tool is the
   * primary way they navigate the canvas.
   */
  setTool(tool) {
    this.currentTool = tool;
    this.canvasEl.style.cursor = tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair";
  }

  zoomStep(factor) {
    this.camera.zoomAt(factor, this.width / 2, this.height / 2, this.width, this.height);
    this.render();
  }

  setExtraDrawCallback(fn) {
    this.extraDrawCallback = fn;
  }

  _resizeToContainer() {
    const rect = this.canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvasEl.width = rect.width * dpr;
    this.canvasEl.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
    this.render();
  }

  _bindEvents() {
    const el = this.canvasEl;

    el.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    el.addEventListener("pointermove", (e) => this._onPointerMove(e));
    el.addEventListener("pointerup", (e) => this._onPointerUp(e));
    el.addEventListener("pointerleave", () => {
      this.hoveredNodeId = null;
      this.hoveredElementId = null;
      this.render();
    });
    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.camera.zoomAt(factor, sx, sy, this.width, this.height);
        this.render();
      },
      { passive: false }
    );
  }

  _screenFromEvent(e) {
    const rect = this.canvasEl.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  _onPointerDown(e) {
    const [sx, sy] = this._screenFromEvent(e);
    this.lastPointer = [sx, sy];

    if (e.button === 1 || e.altKey || this.currentTool === "pan") {
      this.isPanning = true;
      return;
    }

    const [wx, wy] = this.camera.screenToWorld(sx, sy, this.width, this.height);
    const tolerance = HIT_TOLERANCE_PX / this.camera.zoom;
    const node = this.currentTool === "select" ? Selection.hitTestNode(this.model, wx, wy, tolerance) : null;

    if (node) {
      this.isDraggingNode = true;
      this.draggedNodeId = node.id;
    }
  }

  _onPointerMove(e) {
    const [sx, sy] = this._screenFromEvent(e);

    if (this.isPanning) {
      this.camera.pan(sx - this.lastPointer[0], sy - this.lastPointer[1]);
      this.lastPointer = [sx, sy];
      this.render();
      return;
    }

    const [wx, wy] = this.camera.screenToWorld(sx, sy, this.width, this.height);
    const tolerance = HIT_TOLERANCE_PX / this.camera.zoom;

    if (this.isDraggingNode && this.draggedNodeId) {
      const node = this.model.getNode(this.draggedNodeId);
      if (node) {
        const [snapX, snapY] = this.grid.snap(wx, wy);
        node.x = snapX;
        node.y = snapY;
        this.onNodeMoved?.(node);
        this.render();
      }
      this.lastPointer = [sx, sy];
      return;
    }

    const node = Selection.hitTestNode(this.model, wx, wy, tolerance);
    const element = node ? null : Selection.hitTestElement(this.model, wx, wy, tolerance);
    const newHoveredNode = node?.id || null;
    const newHoveredElement = element?.id || null;
    if (newHoveredNode !== this.hoveredNodeId || newHoveredElement !== this.hoveredElementId) {
      this.hoveredNodeId = newHoveredNode;
      this.hoveredElementId = newHoveredElement;
      this.render();
    }
    this.lastPointer = [sx, sy];
  }

  _onPointerUp(e) {
    const [sx, sy] = this._screenFromEvent(e);
    const moved = Math.hypot(sx - this.lastPointer[0], sy - this.lastPointer[1]) > 3;

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }
    if (this.isDraggingNode) {
      this.isDraggingNode = false;
      this.draggedNodeId = null;
      return;
    }
    if (moved) return; // was a drag, not a click

    const [wx, wy] = this.camera.screenToWorld(sx, sy, this.width, this.height);
    const tolerance = HIT_TOLERANCE_PX / this.camera.zoom;
    const node = Selection.hitTestNode(this.model, wx, wy, tolerance);

    if (node) {
      this.selection.selectNode(node.id);
      this.onNodeClick?.(node);
      this.onSelectionChange?.();
      this.render();
      return;
    }

    const element = Selection.hitTestElement(this.model, wx, wy, tolerance);
    if (element) {
      this.selection.selectElement(element.id);
      this.onElementClick?.(element);
      this.onSelectionChange?.();
      this.render();
      return;
    }

    this.selection.clear();
    this.onEmptyClick?.(wx, wy);
    this.onSelectionChange?.();
    this.render();
  }

  fitToModel() {
    const nodes = this.model.getAllNodes();
    if (nodes.length === 0) return;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    this.camera.fitToBounds(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), this.width, this.height);
  }

  render() {
    const { ctx, width, height, colors } = this;
    if (!colors) return;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.canvasBackground;
    ctx.fillRect(0, 0, width, height);

    this.grid.draw(ctx, this.camera, width, height, colors);

    SupportRenderer.draw(ctx, this.camera, width, height, this.model.getAllSupports(), this.model, colors);
    ElementRenderer.draw(
      ctx,
      this.camera,
      width,
      height,
      this.model.getAllElements(),
      this.model,
      colors,
      this.selection.selectedElementId,
      this.hoveredElementId
    );
    LoadRenderer.draw(ctx, this.camera, width, height, this.model.getAllLoads(), this.model, colors);
    NodeRenderer.draw(
      ctx,
      this.camera,
      width,
      height,
      this.model.getAllNodes(),
      colors,
      this.selection.selectedNodeId,
      this.hoveredNodeId
    );

    if (this.extraDrawCallback) {
      this.extraDrawCallback(ctx, this.camera, width, height);
    }
    ctx.restore();
  }
}
