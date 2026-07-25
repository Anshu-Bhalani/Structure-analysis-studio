// Phase 4 mobile bootstrap
import { App } from '../../core/app/app.js';
import { TOOLS } from '../../core/state/State.js';
import { ELEMENT_TYPES } from '../../core/modeling/Element.js';
import { TouchController } from './components/TouchController.js';

document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    const mobileRoot = document.getElementById('mobile-view');
    const canvasEl = document.getElementById('editor-canvas-mobile');
    if (!mobileRoot || !canvasEl) return;

    const app = new App(canvasEl);
    window.editorAppMobile = app;
    window.appInstance = app;

    new TouchController(app, document.body);

    // Bottom nav screen switching
    const navButtons = document.querySelectorAll('.mob-bottom-nav button[data-target]');
    const screens = document.querySelectorAll('.mob-screen');

    const activateScreen = (targetId) => {
        navButtons.forEach((b) => b.classList.toggle('active', b.getAttribute('data-target') === targetId));
        screens.forEach((screen) => {
            screen.classList.toggle('active', screen.id === targetId);
        });
    };

    navButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            if (!targetId) return;
            activateScreen(targetId);
        });
    });

    // Sidebar / drawer logic
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.getElementById('mob-sidebar');
    const overlay = document.getElementById('mob-overlay');

    const closeDrawer = () => {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    };

    const toggleDrawer = () => {
        if (!sidebar || !overlay) return;
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    };

    if (menuToggle) menuToggle.addEventListener('click', toggleDrawer);
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeDrawer();
            document.querySelectorAll('.mob-bottom-sheet').forEach((sheet) => sheet.classList.remove('open'));
        });
    }

    // Bottom sheet helper
    window.toggleBottomSheet = function (sheetId) {
        const sheet = document.getElementById(sheetId);
        if (!sheet) return;

        sheet.classList.toggle('open');
        if (overlay) {
            overlay.classList.toggle('show', sheet.classList.contains('open'));
        }
    };

    document.querySelectorAll('.close-sheet').forEach((btn) => {
        btn.addEventListener('click', () => {
            const sheet = btn.closest('.mob-bottom-sheet');
            if (sheet) sheet.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        });
    });

    // Mobile vertical toolbar
    const vertToolbarButtons = document.querySelectorAll('.mob-vert-toolbar button');
    const MOBILE_TOOL_ACTIONS = [
        () => app.setTool(TOOLS.SELECT),               // Select
        () => app.setTool(TOOLS.DRAW_NODE),            // Node
        () => app.setElementTool(ELEMENT_TYPES.BEAM),  // Beam
        null,                                          // Support (not implemented)
        null,                                          // Load (not implemented)
        null,                                          // Moment (not implemented)
        () => app.setTool(TOOLS.DELETE),               // Delete
        () => app.setTool(TOOLS.MOVE),                 // More -> reuse as Move for now
    ];

    vertToolbarButtons.forEach((btn, index) => {
        const action = MOBILE_TOOL_ACTIONS[index];
        if (!action || btn.disabled) return;

        btn.addEventListener('click', () => {
            vertToolbarButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            action();
        });
    });

    // Undo / Redo buttons
    const mobUndo = document.getElementById('mob-undo');
    const mobRedo = document.getElementById('mob-redo');

    const syncHistoryButtons = () => {
        if (mobUndo) mobUndo.disabled = !app.canUndo();
        if (mobRedo) mobRedo.disabled = !app.canRedo();
    };

    if (mobUndo) mobUndo.addEventListener('click', () => app.undo());
    if (mobRedo) mobRedo.addEventListener('click', () => app.redo());

    setInterval(syncHistoryButtons, 250);
    syncHistoryButtons();

    // Default screen
    const initialScreen = document.querySelector('.mob-bottom-nav button.active')?.getAttribute('data-target') || 'screen-home';
    activateScreen(initialScreen);

    app.canvas.fitModelToScreen(app.model, 60);
});