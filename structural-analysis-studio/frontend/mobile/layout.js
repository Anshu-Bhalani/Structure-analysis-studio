/**
 * main.js (Mobile UI)
 * ------------------------------------------------------------------
 * Entry point for the Mobile UI target. Mirrors the Desktop UI's
 * main.js: locate DOM mounts, hand off to App — no logic here.
 * ------------------------------------------------------------------
 */

import { App } from "./app/App.js";

function boot() {
  const mounts = {
    root: document.getElementById("mobile-root"),
  };

  if (!mounts.root) {
    // eslint-disable-next-line no-console
    console.error("Structural Analysis Studio (Mobile): missing #mobile-root mount point");
    return;
  }

  window.__structuralAnalysisStudioMobile = new App(mounts);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
