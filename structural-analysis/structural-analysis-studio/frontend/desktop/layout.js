/**
 * main.js
 * ------------------------------------------------------------------
 * Application entry point. Loaded as a native ES module from
 * index.html. Its only job is to locate the DOM mount points and
 * hand them to App — no logic lives here.
 * ------------------------------------------------------------------
 */

import { App } from "./app/App.js";

function boot() {
  const mounts = {
    canvas: document.getElementById("structure-canvas"),
    toolbar: document.getElementById("toolbar"),
    sidebar: document.getElementById("sidebar"),
    properties: document.getElementById("properties-panel"),
    bottom: document.getElementById("bottom-panel"),
    dialogRoot: document.getElementById("dialog-root"),
    importInput: document.getElementById("import-file-input"),
  };

  const missing = Object.entries(mounts).filter(([, el]) => !el);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error("Structural Analysis Studio: missing DOM mount points", missing.map(([k]) => k));
    return;
  }

  window.__structuralAnalysisStudio = new App(mounts);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
