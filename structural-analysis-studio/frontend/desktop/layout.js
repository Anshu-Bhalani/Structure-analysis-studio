import { App } from '../../core/app/app.js';
import { Model } from '../../core/modeling/Model.js';
import { Toolbar } from './components/Toolbar.js';
import { TOOLS } from '../../core/state/State.js';
import { ELEMENT_TYPES } from '../../core/modeling/Element.js';

export function mountDesktop() {
  const canvasEl = document.getElementById('model-canvas-desktop');
  const toolbarEl = document.getElementById('desktop-toolbar');

  const app = new App(canvasEl, new Model('Untitled Project'));
  window.__app = app;

  const toolbar = new Toolbar(toolbarEl, {
    onNew: () => location.reload(),
    onOpen: () => alert('Open project not wired yet'),
    onSave: () => alert('Save project not wired yet'),
    onImport: () => alert('Import not wired yet'),
    onExport: () => alert('Export not wired yet'),

    onToolChange: (toolId) => {
      switch (toolId) {
        case 'select':
          app.setTool(TOOLS.SELECT);
          break;
        case 'move':
          app.setTool(TOOLS.MOVE);
          break;
        case 'pan':
          app.setTool(TOOLS.PAN);
          break;
        case 'addNode':
          app.setTool(TOOLS.DRAW_NODE);
          break;
        case 'addSupport':
          app.setTool(TOOLS.ADD_SUPPORT);
          break;
        case 'addLoad':
          app.setTool(TOOLS.ADD_LOAD);
          break;
        case 'delete':
          app.setTool(TOOLS.DELETE);
          break;
        case 'addBeam':
          app.setElementTool(ELEMENT_TYPES.BEAM);
          break;
        case 'addBar':
          app.setElementTool(ELEMENT_TYPES.BAR);
          break;
        case 'addSpring':
          app.setElementTool(ELEMENT_TYPES.SPRING);
          break;
      }
    },

    onToggleSnap: (enabled) => app.setSnapEnabled(enabled),
    onToggleNodeSnap: (enabled) => app.setNodeSnapEnabled(enabled),
    onToggleGridSnap: (enabled) => app.setGridSnapEnabled(enabled),

    onUndo: () => app.undo(),
    onRedo: () => app.redo(),

    onZoomOut: () => app.zoomOut(),
    onZoomIn: () => app.zoomIn(),
    onFitView: () => app.fitView(),
    onResetView: () => app.resetView(),

    onRunAnalysis: () => alert('Phase 5 only'),
    onToggleLearning: () => {},
    onViewOptionChange: () => {},
  });

  app.attachToolbar(toolbar);
  app.canvas.fitModelToScreen(app.model, 60);
}