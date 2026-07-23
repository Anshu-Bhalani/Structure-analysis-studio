# Structural Analysis Studio

A browser-based structural analysis platform built with plain **HTML, CSS, and JavaScript** (ES modules, no build step, no framework, no external dependencies). The current release implements three analysis modules — **Spring**, **Bar (Truss)**, and **Beam** — on an architecture designed to grow into a full platform (Frame, Grid, Plate, Shell, Solid, 3D, Learning Mode, AI Assistant, Cloud Sync, and more) without rewriting what already exists.

See **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** for the full folder-by-folder breakdown, module responsibilities, dependency rules, and suggested improvements.

---

## Running it

No build tools, no npm install. Because the app uses native ES modules (`import`/`export`), it must be served over HTTP — opening `index.html` directly via `file://` will be blocked by the browser's module security policy.

From the project's root folder, run any static file server, for example:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then open:
- **Desktop UI:** `http://localhost:8080/frontend/desktop-ui/`
- **Mobile UI (scaffold):** `http://localhost:8080/frontend/mobile-ui/`

(adjust the port to whatever your server prints).

## Using the app (Desktop UI)

- **Toolbar** (top): file actions (New/Open/Save/Import/Export), drawing tools, **Run Analysis**, **Learning Mode**, view toggles (Deflected Shape / Reactions / SFD / BMD), zoom and theme controls.
- **Canvas** (center): click **+ Node** then click empty space to place nodes. Click **+ Spring / + Bar / + Beam**, then click two nodes to connect them (clicking empty space while one of these tools is active drops a new node there automatically). Click **+ Support** or **+ Load** then click a node to attach it. Use **Select** to drag nodes around, or **Pan** to move the view (mouse wheel / pinch-friendly zoom buttons are also available).
- **Sidebar** (left): a live tree of every node/element/support/load.
- **Properties panel** (right): edit whatever is currently selected — node position, spring stiffness, or a bar/beam's material and section.
- **Bottom panel**: **Results** (reactions and member forces after solving), **Learning** (a full step-by-step walkthrough of the Direct Stiffness Method once Learning Mode is on), and **Console** (application log).

A small cantilever beam example is loaded automatically the first time you open the app, so there's something to click **Run Analysis** on immediately. The same example now also exists as reusable data at [`shared/templates/starter-cantilever-beam.template.json`](./shared/templates/starter-cantilever-beam.template.json).

---

## The one idea that makes this extensible

Every node reserves **3 global degrees of freedom**: `ux`, `uy`, `rz`. Every analysis element (`SpringElement`, `BarElement`, `BeamElement`, and — later — `FrameElement`, `GridElement`...) implements the same interface, `IAnalysisElement`:

```js
getGlobalDOFIndices(dofManager)     // which of the 6 (2 nodes × 3 DOF) global slots it touches
getGlobalStiffnessMatrix()          // its own 6×6 stiffness, already rotated into global coordinates
recoverResults(globalU, dofManager) // turns solved displacements back into axial force / shear / moment
```

`core/solver/Solver.js` only ever calls these three methods. It never contains a single `if (type === "Beam")`. That is what lets **Frame, Grid, Plate, Shell, Solid, 3D, and Dynamic Analysis** get added later as new files in `core/analysis-elements/` (registered in one line in `ElementFactory.js`) with **zero changes** to `Solver`, `Mathematics`, or any existing element — see `core/README.md`.

### Scope decisions worth knowing about

- **Beam = bending only, no axial stiffness.** This is what keeps `Beam` genuinely independent of a future `Frame` element (which will combine bending + axial + full generality). A practical consequence: a node touched *only* by Beam elements has no stiffness resisting its own axial translation. The Solver detects this automatically — if nothing needs that direction (no load, no support), it's silently excluded from the solve; if a load *is* applied there, you get a clear, specific error telling you to add a Bar element or a support.
- **Loads are nodal only** (`Fx`, `Fy`, `Mz` at a node) currently. Distributed member loads are a natural extension — the architecture converts them to equivalent nodal loads inside `core/analysis-elements/`, so `Solver` and `Modeling` don't need to change when that's added.
- **Units are SI** internally (meters, Newtons, Pascals) everywhere; `core/utilities/UnitConverter.js` (backed by data in `shared/units/`) is the single place unit conversion for display happens.

### Verified against hand calculations

The solver was checked against closed-form textbook results before delivery:
- A cantilever beam with a tip load matched the classic `PL³/3EI` deflection and `PL²/2EI` rotation formulas exactly.
- A simple axial bar matched `PL/EA` elongation exactly.
- A single spring matched `F/k` exactly.
- An under-supported (mechanism) structure with a load in its unrestrained direction correctly produces a clear error instead of garbage numbers.

---

## Adding a new element type (e.g. Frame) later

1. Create `core/analysis-elements/FrameElement.js` implementing `IAnalysisElement` (replace the current placeholder that intentionally throws).
2. Register it in `core/analysis-elements/ElementFactory.js` (one `case` statement).
3. Add a toolbar button and a symbol in `core/graphics/renderers/ElementRenderer.js`.

Nothing in `Solver`, `Mathematics`, `Modeling.Model`, or the other element types needs to change. See `ARCHITECTURE.md` for the full picture and `core/README.md` for the module map.

## Known current limitations (by design, not oversight)

- Pinch-to-zoom (two-finger touch gesture) isn't implemented; mouse wheel and the on-screen `+`/`−` buttons cover zoom in the meantime.
- Distributed loads, Frame, Grid, Plate, Shell, Solid, 3D, Dynamic/Buckling/Modal/Thermal analysis, a real Mobile UI, a Backend, and the AI Assistant are intentionally out of scope today — the folder structure documented in `ARCHITECTURE.md` already has a place ready for each of them.
