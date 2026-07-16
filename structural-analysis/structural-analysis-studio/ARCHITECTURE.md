# Architecture

This document is the architectural reference for Structural Analysis
Studio: the full folder structure, what every folder is for, the
responsibility of every major module, how dependencies are allowed to
flow, and where the design could be tightened further as the codebase
grows past 100,000+ lines.

## 1. Folder structure

```
structural-analysis-studio/
├── README.md
├── ARCHITECTURE.md
│
├── frontend/
│   ├── README.md
│   ├── desktop-ui/
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── app/
│   │   │   └── App.js
│   │   ├── components/
│   │   │   ├── UIManager.js
│   │   │   ├── Toolbar.js
│   │   │   ├── Sidebar.js
│   │   │   ├── PropertiesPanel.js
│   │   │   ├── BottomPanel.js
│   │   │   └── Dialogs.js
│   │   └── css/
│   │       ├── main.css
│   │       └── responsive.css
│   ├── mobile-ui/                      (scaffold)
│   │   ├── README.md
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── app/App.js
│   │   ├── components/README.md
│   │   └── css/main.css
│   └── shared-ui/
│       ├── README.md
│       ├── theme/
│       │   ├── ThemeManager.js
│       │   └── themes.css
│       └── assets/
│           ├── icons/
│           ├── fonts/
│           └── images/
│
├── core/
│   ├── README.md
│   ├── state/          State.js
│   ├── config/          Config.js
│   ├── graphics/        Camera.js, Canvas.js, Grid.js, Selection.js, renderers/
│   ├── modeling/         Node.js, Element.js, Support.js, Load.js, Material.js, Section.js, Model.js
│   ├── analysis-elements/ IAnalysisElement.js, SpringElement.js, BarElement.js, BeamElement.js, FrameElement.js, ElementFactory.js
│   ├── solver/            DOFManager.js, Assembler.js, BoundaryConditions.js, Solver.js
│   ├── mathematics/       Matrix.js, Vector.js, GaussianElimination.js
│   ├── visualization/     DeflectedShapeRenderer.js, DiagramRenderer.js, ResultsRenderer.js
│   ├── learning/          LearningMode.js, StepExplainer.js
│   ├── storage/           ProjectStorage.js, JSONSerializer.js
│   └── utilities/         Helpers.js, History.js, Logger.js, UnitConverter.js, Validation.js
│
├── backend/                            (scaffold)
│   ├── README.md
│   ├── auth/README.md
│   ├── database/README.md
│   ├── api/README.md
│   ├── cloud-storage/README.md
│   ├── ai-services/README.md
│   └── project-storage/README.md
│
└── shared/
    ├── README.md
    ├── assets/README.md
    ├── config/           README.md, app.config.json
    ├── constants/         README.md, engineering-constants.js
    ├── templates/         README.md, starter-cantilever-beam.template.json
    ├── example-projects/  README.md, sample-simply-supported-beam.project.json
    ├── units/              README.md, unit-tables.json
    ├── localization/       README.md, en.json
    └── common-data/        README.md, materials.json, sections.json
```

Every non-trivial folder has its own `README.md` explaining its
responsibility in place — this document ties them together and
explains the *reasoning*, not just the layout.

## 2. What each top-level folder is for

| Folder | Responsibility | May contain UI code? | May contain engineering calculations? |
|---|---|---|---|
| `frontend/` | Everything the user sees and touches, for every UI target. | Yes | **No** |
| `core/` | Every engineering calculation and the data model it operates on, once. | No | Yes |
| `backend/` | Everything that runs server-side: accounts, database, API, cloud storage, AI services. | No | No (server-side business logic, not structural math) |
| `shared/` | Data/config/content reused by more than one of the above layers. | No | No |

## 3. Module responsibilities

### 3.1 Frontend

- **`frontend/desktop-ui/`** — the current, full-featured desktop
  application: fixed toolbar/sidebar/properties/bottom-panel layout,
  mouse + keyboard interaction, dialogs. This is a direct move of the
  original `js/app`, `js/ui`, and `css/{main,responsive}.css`, with
  every import path updated to point at `core/` and `shared-ui/`.
- **`frontend/mobile-ui/`** — a touch-first target that will get its
  own layout and components over time. Currently a working scaffold
  (see §5) rather than a full implementation, because the original
  codebase shipped one responsive layout, not two independent UIs.
- **`frontend/shared-ui/`** — theming (`ThemeManager.js` +
  `themes.css`) and UI asset folders (icons/fonts/images) used by
  both UI targets, so neither has to redefine color tokens or ship
  duplicate icon sets.

### 3.2 Core Engine

See `core/README.md` for the full table. Summary: `mathematics/` and
`utilities/` are the leaves (no dependencies within `core/`);
`modeling/` builds on `utilities/`; `analysis-elements/` builds on
`modeling/` + `mathematics/`; `solver/` orchestrates
`analysis-elements/`; `graphics/`, `visualization/`, `learning/`, and
`storage/` each build on `modeling/` and, where relevant, `solver/`
results. `state/` and `config/` are standalone.

The key extensibility mechanism — one `IAnalysisElement` interface
that `solver/Solver.js` calls polymorphically, with zero
per-element-type branching — was already in place in the original
code and is fully preserved by this restructuring; see the root
`README.md`.

### 3.3 Backend

Six placeholder modules (`auth`, `database`, `api`, `cloud-storage`,
`ai-services`, `project-storage`), each with a README describing its
future responsibility, what it may depend on, and — critically —
what it must **not** depend on. No implementation yet; the app is
fully functional without it (local autosave + file export/import
cover persistence today).

### 3.4 Shared Resources

Eight folders (`assets`, `config`, `constants`, `templates`,
`example-projects`, `units`, `localization`, `common-data`), each
seeded with a real starter file, not just an empty placeholder —
see §6 for what's in each and why.

## 4. Dependency rules

```
        Desktop UI                          Mobile UI
            │                                    │
            ├───────────────┐        ┌───────────┤
            │               │        │           │
            ▼               ▼        ▼           ▼
        Core Engine ◄───────┴────────┴────────► Core Engine
            │                                    │
            └──────────────► Shared ◄────────────┘

        Backend  ──────────────────────────────► Shared
        (independent of Core Engine and Frontend)
```

Enforced rules:

1. **`core/` never imports from `frontend/` or `backend/`.** Verified
   for the current codebase — every relative import in `core/`
   resolves to another file inside `core/`.
2. **`frontend/desktop-ui/` and `frontend/mobile-ui/` never
   calculate.** They call `core/` methods (`model.addNode()`,
   `Solver.run(model)`) and render what comes back. The only
   `core/`-adjacent thing a UI component reads directly is plain,
   non-computed data — e.g. `PropertiesPanel.js` importing the
   `ELEMENT_TYPES` constant to populate a dropdown, never a
   calculation.
3. **`frontend/shared-ui/` has no dependency on `core/`, and
   `core/` has no dependency on it either.** `ThemeManager.js`
   hands a plain color object to `core/graphics/Canvas.js` via
   `setColors(colors)` — a one-way data hand-off, not an import.
   This is what keeps `core/graphics` (a Core Engine module) free of
   any DOM/CSS coupling despite being visually themed.
4. **`backend/` never imports `core/`.** They're documented as
   independent in every `backend/*/README.md`. Where both sides need
   to agree on a shape (e.g. the project file format), that shape is
   defined in `shared/` (see §6.4 and §7.1) rather than the backend
   reaching into `core/storage/JSONSerializer.js`.
5. **`shared/` has no outgoing dependencies** on any other top-level
   folder — everything else may depend on it, it depends on nothing.

## 5. The Mobile UI scaffold, specifically

Rather than leave `frontend/mobile-ui/` as empty directories (which
would be untested and might not actually work once someone tries to
fill it in), it ships as a small **working** scaffold:
`mobile-ui/app/App.js` boots, applies the shared `ThemeManager`
theme, and constructs a real `core/modeling/Model` with a node and a
beam element — proving the `Mobile UI → Core Engine` and
`Mobile UI → Shared` arrows in the diagram above actually resolve and
run, before a single real mobile screen is built. `components/` is
intentionally empty (with a README describing what will land there)
since real touch-first components don't exist yet and stubbing fake
ones would just be dead weight to delete later.

## 6. What's inside `shared/`, and why it's not empty

Each subfolder ships with one real starter artifact so the pattern is
demonstrated, not just described:

1. **`config/app.config.json`** — environment-agnostic settings
   (locale, unit system, feature flags) distinct from
   `core/config/Config.js`'s engine defaults.
2. **`constants/engineering-constants.js`** — universal physical
   constants (gravity, DOF-per-node for 2D vs 3D, a reference yield
   strength), as opposed to this-app's-defaults, which stay in
   `core/config/`.
3. **`templates/starter-cantilever-beam.template.json`** — the exact
   seed model `App.js` currently builds in code, expressed as data
   matching `Model.toJSON()`'s shape.
4. **`example-projects/sample-simply-supported-beam.project.json`** —
   a full save-file example in the exact envelope
   `JSONSerializer.serialize()` produces (`formatVersion`, `appName`,
   `savedAt`, `meta`, `model`), useful for docs, an "Open Example"
   menu, or import/export tests.
5. **`units/unit-tables.json`** — the same length/force factors
   `core/utilities/UnitConverter.js` uses today, expressed as data,
   plus a moment table it doesn't have yet.
6. **`localization/en.json`** — the strings currently hardcoded in
   `frontend/desktop-ui/components/*.js`, pulled out as a first
   locale file.
7. **`common-data/materials.json` / `sections.json`** — small preset
   libraries (a few standard steels, a timber, concrete; a few
   standard sections) beyond the single hardcoded default each of
   `core/modeling/Material.js` and `Section.js` currently offers.
8. **`assets/`** — deliberately empty (with a README) until
   export/reporting features exist; documented as distinct from
   `frontend/shared-ui/assets/` (UI chrome) vs. output/branding
   assets.

## 7. Suggested improvements for scaling past ~100k LOC

These are things the current, freshly-restructured codebase does
**not** yet do, worth doing as the project grows:

### 7.1 Close the one indirect Core ↔ Backend coupling

The project file format is defined once today, in
`core/storage/JSONSerializer.js` (`PROJECT_FORMAT_VERSION`). A future
`backend/database` and `backend/project-storage` will need to
validate/store that same shape without importing `core/`. Recommended
fix: formalize the schema as data in `shared/` (e.g. a JSON Schema
file `shared/config/project-file.schema.json`), have
`JSONSerializer.js` validate against it, and have the backend
validate against the same file. Right now this repo only gestures at
that plan via comments in `shared/constants/` and
`backend/database/README.md` — writing the actual schema file is the
next concrete step.

### 7.2 Make `core/utilities/UnitConverter.js` data-driven

It currently hardcodes the same length/force factors now duplicated
in `shared/units/unit-tables.json`. Refactor it to `fetch`/`import`
that JSON so there's one source of truth, not two lists that can
drift.

### 7.3 Introduce a real event bus in `core/state`

`core/state/State.js` and `core/modeling/Model.js` both currently
implement their own tiny pub/sub (`onChange`/`listeners` and
`onChange`/`listeners`, respectively). As more Core Engine modules
need to notify the UI of changes (Learning Mode progress, async
solves for larger models, etc.), consolidate this into one small
shared `EventEmitter` in `core/utilities/` instead of re-implementing
the pattern per class.

### 7.4 Split `core/modeling` from a future `core/domain` layer per analysis family

Today one `Model` holds every element type. Once Grid, Plate, Shell,
and Solid land, consider whether they can keep sharing `Node` and
`Model`, or whether 3D analysis families need their own node/model
variant (e.g. a node with 6 DOF vs. today's 3). If they diverge,
introduce `core/modeling/2d/` and `core/modeling/3d/` subfolders
*before* the two conventions get tangled together in one `Model`
class — this is the single highest-risk area for the "major
restructuring" the original brief wants to avoid.

### 7.5 Give `frontend/desktop-ui/components` and future
`frontend/mobile-ui/components` a shared base layer

Once `mobile-ui/components/` starts filling in, watch for UI logic
that isn't actually desktop- or mobile-specific (e.g. dialog form
validation, results-table formatting). Promote that into
`frontend/shared-ui/` rather than letting it exist twice.

### 7.6 Add a `tests/` folder mirroring `core/`

Not present in the original codebase or this restructuring. Given
`core/` is where 100% of the engineering correctness lives, a
`core/__tests__/` (or root-level `tests/core/...`) mirroring the
module tree — starting with the three hand-calculation checks already
described in the root `README.md` — would catch regressions
mechanically instead of relying on manual verification.

### 7.7 Consider a lightweight module boundary linter

Because this project intentionally has no build step, nothing
currently *enforces* rule §4 mechanically — it's enforced by
convention and the verification done during this restructuring (every
relative import path was checked to confirm `core/` doesn't reach
into `frontend/`). At current size that's manageable by inspection;
past a few hundred files it won't be. A simple CI script that greps
`core/**/*.js` for `import` paths containing `frontend/` or
`backend/` (and fails the build if found) costs very little and
removes the reliance on manual review.
