import { App } from '../../core/app/app.js';
import { TOOLS } from '../../core/state/State.js';
import { ELEMENT_TYPES } from '../../core/modeling/Element.js';
import { TouchController } from './components/TouchController.js';

document.addEventListener("DOMContentLoaded", () => {
    // Only execute if mobile view is present
    const mobileApp = document.getElementById('mobile-view');
    if (!mobileApp) return;

    // --- Bottom Navigation Routing ---
    const navButtons = document.querySelectorAll('.mob-bottom-nav button');
    const screens = document.querySelectorAll('.mob-screen');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            if (!targetId) return;

            // Update Nav State
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch Screen
            screens.forEach(screen => {
                screen.classList.remove('active');
                if (screen.id === targetId) {
                    screen.classList.add('active');
                }
            });
        });
    });

    // --- Sidebar (Drawer) Logic ---
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.getElementById('mob-sidebar');
    const overlay = document.getElementById('mob-overlay');

    function toggleMenu() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }

    if(menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        
        // Also close any open bottom sheets when clicking overlay
        document.querySelectorAll('.mob-bottom-sheet').forEach(sheet => {
            sheet.classList.remove('open');
        });
    });

    // --- Bottom Sheet Logic ---
    window.toggleBottomSheet = function(sheetId) {
        const sheet = document.getElementById(sheetId);
        if (sheet) {
            sheet.classList.toggle('open');
            if (sheet.classList.contains('open')) {
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }
    };

    const closeSheetBtns = document.querySelectorAll('.close-sheet');
    closeSheetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sheet = btn.closest('.mob-bottom-sheet');
            sheet.classList.remove('open');
            overlay.classList.remove('show');
        });
    });

    // ==========================================
    // Phase 4: Real Geometry Editor bootstrap (mobile)
    // ------------------------------------------
    // Wires the same App(...) engine used on desktop to the mobile
    // #editor-canvas-mobile element, and — the actual blocker being fixed
    // here — imports and activates TouchController so touch pan/pinch-zoom/
    // tap-select/long-press actually run. It previously existed as a file
    // but was never imported anywhere.
    // ==========================================
    const canvasEl = document.getElementById('editor-canvas-mobile');
    if (canvasEl) {
        const app = new App(canvasEl);
        new TouchController(app); // activates the touch gesture layer
        window.editorAppMobile = app; // handy for manual verification from the browser console

        // The vertical tool strip in the Modeling screen. Support/Load/Moment
        // are marked disabled in index.html (phase-creep guard — those tools
        // don't exist in ToolManager yet), so they're skipped here rather
        // than wired to anything. "More" has no defined behavior yet either.
        const vertToolbarButtons = document.querySelectorAll('.mob-vert-toolbar button');
        const MOBILE_TOOL_ACTIONS = [
            () => app.setTool(TOOLS.SELECT),                    // Select
            () => app.setTool(TOOLS.DRAW_NODE),                 // Node
            () => app.setElementTool(ELEMENT_TYPES.BEAM),       // Beam
            null,                                                // Support (disabled)
            null,                                                // Load (disabled)
            null,                                                // Moment (disabled)
            () => app.setTool(TOOLS.DELETE),                    // Delete
            null,                                                // More (not implemented yet)
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
    }
});
