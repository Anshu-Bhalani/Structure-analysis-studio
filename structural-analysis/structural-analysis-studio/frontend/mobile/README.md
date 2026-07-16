# Mobile UI (scaffold)

Status: **not yet built**. This folder is a working scaffold that
proves the wiring, not a finished mobile app.

`app/App.js` boots, applies the shared theme, and creates a real
`Model` through the Core Engine to render a short status message —
confirming the dependency chain (`Mobile UI → Core Engine + Shared`)
works end to end before any real screens are written.

## What to build here later

A touch-first experience with its own layout and components, e.g.:

- A gesture-driven canvas view (pinch to zoom, drag to pan/move nodes)
- Bottom-sheet panels instead of desktop's fixed side panels
- A condensed toolbar with an overflow menu

## Rules that must not be broken

1. **No engineering logic here.** Every calculation — stiffness
   matrices, DOF numbering, solving, unit conversion — comes from
   `core/`. If you find yourself writing math in this folder, stop
   and move it to `core/` instead.
2. **Reuse, don't fork, the Desktop UI's Core Engine calls.** Look at
   `frontend/desktop-ui/app/App.js` for the reference pattern of how
   a UI layer talks to `core/modeling`, `core/solver`,
   `core/graphics`, etc.
3. **Use `frontend/shared-ui/`** for icons, fonts, and theme colors
   instead of duplicating them here.
