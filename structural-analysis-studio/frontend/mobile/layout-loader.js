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
const response = await fetch(new URL('./layout.html', import.meta.url));
const html = await response.text();
document.body.insertAdjacentHTML('beforeend', html);
