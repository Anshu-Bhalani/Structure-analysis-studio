// Phase 4 desktop bootstrap
import { App } from '../../core/app/app.js';
import { TOOLS } from '../../core/state/State.js';
import { ELEMENT_TYPES } from '../../core/modeling/Element.js';
import { Toolbar } from './components/Toolbar.js';

document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const canvasEl = document.getElementById('editor-canvas');
    const toolbarMount = document.getElementById('toolbar-mount');
    if (!canvasEl || !toolbarMount) return;

    const app = new App(canvasEl);
    window.editorApp = app;
    window.appInstance = app;

    const toolbar = new Toolbar(toolbarMount, {
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
                case 'addBeam':
                    app.setElementTool(ELEMENT_TYPES.BEAM);
                    break;
                case 'addBar':
                    app.setElementTool(ELEMENT_TYPES.BAR);
                    break;
                case 'addSpring':
                    app.setElementTool(ELEMENT_TYPES.SPRING);
                    break;
                case 'delete':
                    app.setTool(TOOLS.DELETE);
                    break;
                case 'addSupport':
                    console.warn('Support tool not implemented yet.');
                    break;
                case 'addLoad':
                    console.warn('Load tool not implemented yet.');
                    break;
                default:
                    console.warn(`No App action wired for tool "${toolId}" yet.`);
            }
        },

        onToggleSnap: (checked) => app.setSnapEnabled(checked),
        onToggleGrid: (checked) => app.setGridEnabled(checked),

        onUndo: () => app.undo(),
        onRedo: () => app.redo(),

        onZoomIn: () => app.zoomIn(),
        onZoomOut: () => app.zoomOut(),
        onFitView: () => app.fitView(),
        onResetView: () => app.resetView(),

        onRunAnalysis: () => alert('Phase 5 only'),
        onToggleLearning: () => {},
        onViewOptionChange: () => {},
    });

    app.attachToolbar(toolbar);

    const desktopUndo = document.getElementById('desktop-undo');
    const desktopRedo = document.getElementById('desktop-redo');

    const syncTopButtons = () => {
        if (desktopUndo) desktopUndo.disabled = !app.canUndo();
        if (desktopRedo) desktopRedo.disabled = !app.canRedo();
    };

    if (desktopUndo) desktopUndo.addEventListener('click', () => app.undo());
    if (desktopRedo) desktopRedo.addEventListener('click', () => app.redo());

    setInterval(syncTopButtons, 250);
    syncTopButtons();

    app.canvas.fitModelToScreen(app.model, 60);
});