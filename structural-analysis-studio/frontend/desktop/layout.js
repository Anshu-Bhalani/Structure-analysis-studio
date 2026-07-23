// A simple UI Manager mapping for layout interactions
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

    // Ribbon tool active state logic
    const ribbonBtns = document.querySelectorAll('.ribbon-btn');
    ribbonBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from peers in the same group
            const group = e.target.closest('.ribbon-group');
            group.querySelectorAll('.ribbon-btn').forEach(b => b.classList.remove('active'));
            e.target.closest('.ribbon-btn').classList.add('active');
        });
    });
});
