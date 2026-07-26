// frontend/mobile/layout-loader.js
// ---------------------------------------------------------------------
// Fetches the mobile view markup (frontend/mobile/layout.html) and
// injects it into the document body.
//
// This is a plain, buildless ES module — no bundler/loader is assumed,
// matching the rest of this project. Module scripts execute in document
// order and are implicitly deferred until after HTML parsing, and a
// top-level `await` here delays that further until the fetched markup
// has actually been inserted. Because index.html loads this file BEFORE
// frontend/mobile/layout.js, the #mobile-view markup (and everything in
// it: #editor-canvas-mobile, .mob-bottom-nav, .mob-screen, #mob-sidebar,
// etc.) is guaranteed to already be in the DOM by the time layout.js's
// `DOMContentLoaded` handler queries for those elements — identical to
// how it worked when the markup was inlined directly in index.html.
try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(new URL('./layout.html', import.meta.url), { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    document.body.insertAdjacentHTML('beforeend', html);
} catch (err) {
    console.error(
        '[mobile/layout-loader.js] Could not load frontend/mobile/layout.html — the mobile view will not render.\n' +
        'Reason: ' + err.message + '\n' +
        'This app must be served over HTTP, not opened directly as a file:// URL ' +
        '(browsers block fetch() for local files). From the project root, run e.g.\n' +
        '  python3 -m http.server 8000\n' +
        'or\n' +
        '  npx serve\n' +
        'then open the printed http://localhost:... address, not the file on disk.'
    );
}
