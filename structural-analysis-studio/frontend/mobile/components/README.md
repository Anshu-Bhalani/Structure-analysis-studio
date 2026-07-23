# Mobile UI Components (scaffold)

Empty on purpose. This is where touch-first mobile components will
live once they're built, mirroring `frontend/desktop-ui/components/`
but with their own layouts and interaction patterns, e.g.:

- `MobileToolbar.js` — condensed, bottom-anchored toolbar
- `MobileSheet.js` — swipe-up bottom sheet (replaces desktop's fixed
  Sidebar / PropertiesPanel / BottomPanel side panels)
- `MobileDialogs.js` — full-screen modal dialogs instead of desktop's
  centered dialog cards

Rules (same as Desktop UI):

- No engineering calculations in this folder. Ever.
- Components receive data and callbacks from `../app/App.js` — they
  don't reach into Core Engine modules directly except for reading
  plain data shapes (mirroring how `PropertiesPanel.js` in
  `desktop-ui` only imports `ELEMENT_TYPES` as a constant, never
  solver/analysis logic).
- Reuse `frontend/shared-ui/` for icons, fonts, and theme colors
  instead of redefining them.
