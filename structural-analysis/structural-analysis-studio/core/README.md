# Core Engine

All engineering logic lives here, **exactly once**. This folder must
never import anything from `frontend/` or `backend/`. Both
`frontend/desktop-ui` and `frontend/mobile-ui` call into these same
modules — neither is allowed to reimplement any of it.

## Modules (in dependency order — each only depends on modules at or
below its own row)

| Module               | Responsibility                                                                          | Depends on |
|-----------------------|------------------------------------------------------------------------------------------|------------|
| `mathematics/`         | Generic linear algebra: `Matrix`, `Vector`, `GaussianElimination`. No structural meaning. | — |
| `utilities/`           | Generic helpers with no engineering or UI meaning: id generation, logging, validation, undo history, unit conversion. | — |
| `modeling/`            | The structural **data** model: `Node`, `Element`, `Support`, `Load`, `Material`, `Section`, and the `Model` that owns them. Pure data — no calculations. | `utilities/` |
| `analysis-elements/`   | Per-element-type stiffness formulation (`SpringElement`, `BarElement`, `BeamElement`, `FrameElement`) behind one `IAnalysisElement` interface + `ElementFactory`. | `modeling/`, `mathematics/` |
| `solver/`              | Direct Stiffness Method pipeline: `DOFManager` → `Assembler` → `BoundaryConditions` → `Solver`. Turns a `Model` + `analysis-elements` into displacements/reactions/internal forces. | `analysis-elements/`, `modeling/`, `mathematics/`, `utilities/` |
| `graphics/`            | The 2D canvas engine: `Camera`, `Grid`, `Selection`, `Canvas` (surface), and `renderers/` for drawing nodes/elements/supports/loads. Takes a plain color object from the UI layer — never imports UI or DOM theme code. | `modeling/` |
| `visualization/`       | Turns solver results into drawable overlays: deflected shape, SFD/BMD diagrams, results summaries. | `graphics/`, `modeling/`, `utilities/` |
| `learning/`            | Step-by-step matrix-formation explanations (Learning Mode) built from a `Model` + solver result. | `modeling/`, `solver/`, `utilities/` |
| `storage/`             | `Model` ⇄ JSON (de)serialization and local persistence (`ProjectStorage`, `JSONSerializer`). | `modeling/` |
| `state/`                | Session-level application state (active tool, dirty flag, last result) — distinct from `modeling/Model`, which holds the structural data itself. | — |
| `config/`               | Static engine/graphics defaults (grid spacing, default zoom, deflection scale, seed material/section values). | — |

## Adding a new analysis type (Truss, Frame 3D, Grid, Plate, Shell, Solid…)

1. Add the element-stiffness formulation under `analysis-elements/`
   implementing the existing `IAnalysisElement` contract.
2. Register it in `analysis-elements/ElementFactory.js`.
3. If it needs new DOFs per node (e.g. 3D: 6 instead of 3), extend
   `solver/DOFManager.js` — don't special-case it in the UI.
4. Add a renderer under `graphics/renderers/` and, if it has its own
   result diagrams, under `visualization/`.
5. Neither `frontend/desktop-ui` nor `frontend/mobile-ui` should need
   more than a new toolbar button and a new case in the existing
   "which tool is active" dispatch — see
   `frontend/desktop-ui/app/App.js`'s `ELEMENT_TOOL_TYPE` map for the
   pattern.

## Hard rule

If you're about to write `document.`, `window.` (beyond the one-time
`CanvasSurface` mount point already wired in by the UI layer), or any
DOM/CSS code inside `core/`, stop — that belongs in `frontend/`.
