// A simple UI Manager mapping for layout interactions
import { App } from '../../core/app/app.js';
import { TOOLS } from '../../core/state/State.js';
import { ELEMENT_TYPES } from '../../core/modeling/Element.js';
import { Toolbar } from './components/Toolbar.js';

document.addEventListener("DOMContentLoaded", () => {
    
    // Bottom Panel Tab Switching logic
    const bpTabs = document.querySelectorAll('.bp-tab');
    bpTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            bpTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            // Normally this would trigger BottomPanel.js state updates
        });
    });

    // Workspace Tab Switching logic
    const wsTabs = document.querySelectorAll('.workspace-tabs .tab');
    wsTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            wsTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            // Normally this would trigger UIManager.js canvas swap
        });
    });

    // ==========================================
    // Phase 4: Real Geometry Editor bootstrap
    // ------------------------------------------
    // This replaces the old static ribbon mockup with a live Toolbar.js
    // instance wired to a real App(...) running against the real
    // #editor-canvas element. Nothing here touches the solver/analysis/
    // modeling internals — it only connects UI events to the public
    // App API built in Phase 4 (setTool, undo/redo, zoom, fitView, ...).
    // ==========================================
    const canvasEl = document.getElementById('editor-canvas');
    const toolbarMount = document.getElementById('toolbar-mount');
    if (!canvasEl || !toolbarMount) return; // desktop shell isn't present on this viewport

    const app = new App(canvasEl);
    window.editorApp = app; // handy for manual verification from the browser console

    const toolbar = new Toolbar(toolbarMount, {
        onToolChange: (toolId) => {
            switch (toolId) {
                case 'select': app.setTool(TOOLS.SELECT); break;
                case 'move': app.setTool(TOOLS.MOVE); break;
                case 'pan': app.setTool(TOOLS.PAN); break;
                case 'addNode': app.setTool(TOOLS.DRAW_NODE); break;
                case 'addBeam': app.setElementTool(ELEMENT_TYPES.BEAM); break;
                case 'addBar': app.setElementTool(ELEMENT_TYPES.BAR); break;
                case 'addSpring': app.setElementTool(ELEMENT_TYPES.SPRING); break;
                case 'delete': app.setTool(TOOLS.DELETE); break;
                // addSupport / addLoad buttons are disabled in the Toolbar UI
                // (see Toolbar.js) until that functionality actually exists.
                default: console.warn(`No App action wired for tool "${toolId}" yet.`);
            }
        },
        onToggleSnap: (checked) => app.setSnapEnabled(checked),
        onToggleGrid: (checked) => app.setGridEnabled(checked),
        onUndo: () => app.undo(),
        onRedo: () => app.redo(),
        onZoomIn: () => app.zoomIn(),
        onZoomOut: () => app.zoomOut(),
        onFitView: () => app.fitView(),
        // onRunAnalysis / onToggleLearning / onViewOptionChange are
        // intentionally left unset: those Toolbar controls are disabled
        // until the Phase 5 solver exists, so they have nothing to call yet.
    });

    // Keep the Undo/Redo buttons' enabled state honest. Node/beam creation
    // and drags push straight onto app.history from ToolManager, so a light
    // poll is the simplest way to reflect that without threading a change
    // event through Commands.js/ToolManager for this Phase-4 UI concern.
    setInterval(() => {
        toolbar.setHistoryState(app.canUndo(), app.canRedo());
    }, 250);
});
