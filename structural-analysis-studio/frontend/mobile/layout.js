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
});
