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

    // Desktop ribbon / tab chrome active-state wiring that used to live inline in index.html
    const setExclusiveActive = (button) => {
        const group = button.closest('.ribbon-group');
        if (!group) return;
        group.querySelectorAll('.ribbon-btn').forEach((b) => b.classList.remove('active'));
        button.classList.add('active');
    };

    document.querySelectorAll('.ribbon-btn').forEach((btn) => {
        btn.addEventListener('click', (evt) => {
            setExclusiveActive(evt.currentTarget);
        });
    });

    document.querySelectorAll('.bp-tab').forEach((tab) => {
        tab.addEventListener('click', (evt) => {
            document.querySelectorAll('.bp-tab').forEach((t) => t.classList.remove('active'));
            evt.currentTarget.classList.add('active');
        });
    });

    document.querySelectorAll('.workspace-tabs .tab').forEach((tab) => {
        tab.addEventListener('click', (evt) => {
            const current = evt.currentTarget;
            if (current.classList.contains('disabled-phase')) return;
            document.querySelectorAll('.workspace-tabs .tab').forEach((t) => t.classList.remove('active'));
            current.classList.add('active');
        });
    });

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

    const syncHistoryButtons = () => {
        if (desktopUndo) desktopUndo.disabled = !app.canUndo();
        if (desktopRedo) desktopRedo.disabled = !app.canRedo();
    };

    if (desktopUndo) desktopUndo.addEventListener('click', () => app.undo());
    if (desktopRedo) desktopRedo.addEventListener('click', () => app.redo());

    const historySyncTimer = setInterval(syncHistoryButtons, 250);
    window.addEventListener('beforeunload', () => clearInterval(historySyncTimer));
    syncHistoryButtons();

    app.canvas.fitModelToScreen(app.model, 60);
});