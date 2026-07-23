# Structural Analysis Software — Master Specification
### Steps 1–16, filtered and consolidated

**Status of this document:** Steps 1, 2, and 6 reflect your final, confirmed decisions. Steps 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15, and 16 are your original AI-assisted answers, filtered down to the technical content only (field lists, rules, pipelines, decisions) — repetition, "Excellent/Purpose" commentary, and filler removed. Step 14 (AI) is intentionally skipped for V1.

**How to use this document:** Treat it as the project's constitution. Before implementing a feature or making a design call, check it against this file. If a decision needs to change, update this document first, then the code.

---

## Table of Contents

1. Scope Boundaries
2. Engineering Method & Domain Rules
3. Input Data Specification
4. Output Data Specification
5. Data Model & Schema
6. File Format & Save/Load
7. Software & Module Architecture
8. Solver & Calculation Engine Architecture
9. UI/UX, Navigation & Workflow
10. Rendering & Graphics Engine
11. Application Infrastructure
12. Testing & Validation
13. Performance Planning & Optimization
14. AI Integration — *Skipped for V1*
15. Documentation, Git & Project Management
16. Pre-Coding Readiness & Development Plan

---

## Step 1 — Scope Boundaries

- **Dimensionality:** 2D only for V1. `Node` stores `x, y, z` from day one (`z` reserved, unused) so 3D is an extension later, not a rewrite.
- **Platform:** Desktop first. Mobile and backend/cloud come later.
- **Supported elements (V1):** Beam, Plane Truss, Plane Frame, Spring.
- **Included:** Learning Mode (structured step-by-step calculation display), SFD/BMD/AFD, deflected shape, reactions, PDF/JSON export.
- **Explicitly out of scope for V1:** 3D analysis, dynamic/modal analysis, nonlinear analysis, P‑Delta, buckling, moving loads, design-code checking, AI-assisted calculation, plugins, importing STAAD/SAP/other third-party files, cloud/collaboration.
- **Rule:** Scope must be written down and frozen before coding. "I'll decide as I go" is how solo projects balloon.

---

## Step 2 — Engineering Method & Domain Rules

- **Analysis method:** Direct Stiffness Method (DSM).
- **Element formulations:**
  - **Beam** — bending only, 4×4 local stiffness matrix, Euler-Bernoulli (no shear deformation), constant EI.
  - **Plane Truss** — axial only, pin-connected, needs a direction-cosine transformation.
  - **Plane Frame** — axial + bending + shear, 6×6 local stiffness matrix, needs a local-to-global transformation (members aren't all collinear).
  - **Spring** — discrete linear stiffness (translational or rotational).
- **DOFs per node:**

| Element | DOFs |
|---|---|
| Beam | Vertical translation + rotation (2 DOF) |
| Plane Truss | Horizontal + vertical translation (2 DOF) |
| Plane Frame | Horizontal + vertical translation + rotation (3 DOF) |
| Spring | Depends on spring type |

- **Coordinate system:** +X right, +Y up, origin at O. +Z reserved for 3D (out of the screen).
- **Sign convention:** Right = positive, up = positive, clockwise rotation = positive. (No universal convention exists across software/textbooks — internal consistency is what matters.)
- **Fixed rule (non-negotiable):** The solver's internal coordinate system and sign convention never change. Any user-facing display setting (CW/CCW positive, Y-up/Y-down, diagram convention) is a **display-layer transform only**, applied after solving. The solver always computes in one fixed convention. Letting the solver itself change convention per user setting means maintaining and testing multiple mathematical pathways — don't do it.
- **Material assumptions:** Linear elastic, homogeneous, isotropic, Hooke's Law, small deformations, constant properties.
- **Internal units (fixed regardless of display units):** Length = m, Force = N, Moment = N·m, Stress/Modulus = Pa. Never mix display units into internal fields — convert only at the UI boundary.
- **Reference data to support later** (configurable data, never hardcoded): material/section libraries (AISC, Euronorm IPE/HEA/HEB, IS shapes) and load-combination factor sets (ASCE 7, IS 456, IS 800, IS 875, IS 1893, Eurocode, ACI).
- **Explicitly out of scope:** P‑Delta, buckling, moving loads, plate/shell elements, nonlinear/dynamic/modal analysis, design-code checking.

---

## Step 3 — Input Data Specification

*If the user forgets one required input, the software cannot analyze the model. This is the complete list of what it needs.*

### 3.1 Project
Name, description, designer, company, date created, last modified, project version, software version, analysis type (Linear Static, fixed for V1), coordinate system, sign convention, unit system, gravity value, notes.

### 3.2 Nodes
`id`, `x`, `y`, `z` (reserved), label (optional), visibility, locked/unlocked.

### 3.3 Elements
`id`, type (Beam/Truss/Frame/Spring), start node, end node, material ref, section ref, local axis angle, start/end release flags, label.

### 3.4 Materials
*(`materials.json` already stubbed — formalize it)*
`id`, name, category, E, G (or ν), density/unit weight. Reserved for later: thermal expansion coefficient, yield strength, ultimate strength.

### 3.5 Sections
*(`sections.json` already stubbed — formalize it)*
`id`, name, shape type; geometry: A, Iy, Iz, J; dimensions: width, height, thickness. Reserved for later: standard code reference, manufacturer.

### 3.6 Supports
`id`, node id, type (Fixed/Pin/Roller/Spring/Custom), restrained DOFs, spring stiffness, settlement value, rotational settlement.

### 3.7 Loads
`id`, name, load case, direction, magnitude, unit, target (node or member).
Types: point load, UDL, UVL (triangular), trapezoidal, point moment, axial load, self-weight, temperature, settlement. Reserved for later: moving load, wind, earthquake.

### 3.8 Load Cases
`id`, name, type (Dead/Live/Wind/Earthquake/Construction/Temperature).

### 3.9 Load Combinations
`id`, name, source code/standard, list of (load case, factor) pairs. Define the structure only — don't calculate combined results yet.

### 3.10 Analysis Settings
Solver method, max iterations, tolerance, precision, autosave, auto-reanalysis, Learning Mode on/off.

### 3.11 Display Settings *(display-layer only — never affects the solver)*
Unit display, coordinate/sign-convention display, theme, diagram colors, result precision.

### 3.12 Validation Rules (pre-analysis gate)
- Every element has two distinct, non-duplicate nodes
- No zero-length elements
- Every element has a material and section assigned
- At least one support exists
- Loads reference valid targets
- Units are defined
- Model is stable enough to analyze (no obvious mechanism)

If any check fails: stop, show a clear message. Never run the solver on a model that fails validation.

---

## Step 4 — Output Data Specification

### 4.1 Analysis Status
Success/failure, analysis time, counts (nodes/elements/DOFs/free DOFs/restrained DOFs), timestamp.

### 4.2 Joint (Node) Results
Node id, Ux, Uy, rotation θ, resultant displacement. *(Reserve Uz, Rx, Ry, Rz for 3D.)*

### 4.3 Support Reactions
Node id, horizontal reaction, vertical reaction, reaction moment.

### 4.4 Member End Forces
Per member, per end: axial force (N), shear (V), bending moment (M).

### 4.5 Internal Force Diagrams
SFD, BMD, AFD. Sample **intermediate points** along each member, not just end values, so curves are smooth and max/min values + locations can be found. *(Reserve torsion diagram for 3D.)*

### 4.6 Deflected Shape
Original vs. deformed geometry, adjustable scale factor, max deflection value + location, optional animation.

### 4.7 Learning Mode — structured step data (never a text log)
DOF numbering → element stiffness matrices → transformation matrices (Frame) → fixed-end actions → global stiffness assembly → load vector → boundary conditions → reduced matrix → displacement solution → reactions → member end forces → diagrams. Store each step as a structured object (matrices/vectors/explanations) so results view, export, and Learning Mode all reuse the same data.

### 4.8 Diagnostics
- **Warnings:** large displacement, high slenderness, near-singular matrix, unit mismatch, duplicate materials
- **Errors:** mechanism detected, zero-length member, duplicate nodes, missing material/section, disconnected member, unsupported model, solver failure

### 4.9 Reports
Ordered sections: project info → model summary → materials → sections → supports → loads → analysis results → joint results → reactions → member forces → SFD/BMD → deflection → Learning Mode (optional) → engineer notes.
Export formats: **PDF first** (highest value); Excel/JSON/CSV later.

### 4.10 Result Visualization (UI layer)
Displacement/axial color contours, node/element/support/load labels & symbols, zoom/pan/selection highlighting.

### 4.11 Result Query *(recommended addition)*
Answer directly without manual inspection: max bending moment member, max displacement node, max reaction, max axial force member, "show critical member." Doesn't touch the solver — pure usability layer over existing results.

---

## Step 5 — Data Model & Schema

### 5.1 Hierarchy
```
Project
├── Nodes
├── Elements
├── Materials
├── Sections
├── Supports
├── Loads
├── Load Cases
├── Load Combinations
├── Results
└── Settings
```

### 5.2 Object Ownership (avoid duplication)
- Node owns coordinates — not material.
- Element owns material ref + section ref — not coordinates.
- Support belongs to a node.
- Load belongs to a load case.
- Results belong to the project — never mixed into model objects.

### 5.3 Relationships
Project contains Nodes/Elements/Loads/Results/Settings. Element uses Material + Section. Support belongs to Node. Load belongs to Load Case.

### 5.4 User Model vs. Analysis Model — deliberate split
- **User Model** (persistent, user-edited): geometry, materials, sections, supports, loads.
- **Analysis Model** (temporary, discarded after solving): DOF numbers, matrices, vectors, transformation data, solver objects, results.
- **Open decision to resolve and document:** is `core/modeling/Element.js` the same concept as `core/analysis/elements/*.js`, or a deliberate split between user-facing model and analysis formulation? Pick one, write down why.

### 5.5 Validation Rules
No duplicate nodes/IDs, no zero-length elements, no missing material/section, no invalid/floating supports, minimum supports for stability, no mechanism. Keep UI-only state (`selected`, `hovered`) out of this model entirely.

### 5.6 Object IDs
Every object has a unique ID. Never identify objects by name.

### 5.7 Future Expandability
Reserve fields now (`Node.z`, `Material.yieldStrength`, `Material.thermalExpansion`, etc.) so later versions don't require redesigning the schema.

### 5.8 Object Lifecycle *(recommended addition)*
Example — Beam: created → material assigned → section assigned → loads assigned → analyzed → results generated → modified → reanalyzed → deleted. Defining this now simplifies undo/redo, autosave, and history tracking later.

### 5.9 Folder Mapping
```
Project   → core/modeling/Project.js
Node      → core/modeling/Node.js
Element   → core/modeling/Element.js
Material  → core/modeling/Material.js
Section   → core/modeling/Section.js
```

---

## Step 6 — File Format & Save/Load

- **Project file extension:** e.g. `.sas` (internally JSON).
- **Internal format:** JSON — human-readable, debuggable, native to JS, extensible.
- **Schema version:** a `schemaVersion` field (e.g. `1.0.0`) in every file, with a migration plan for future changes. **Freeze the v1 schema before writing solver code against it.**
- **Save system:** Save / Save As / Autosave / Backup Save / Recovery file.
- **Open system:** verify version → check integrity → check for missing data → attempt repair → warn if incompatible.
- **Import (V1):** only your own project file. *(Future: Excel, DXF, IFC, STAAD, SAP2000 — not V1.)*
- **Export (V1):** PDF report, JSON project, PNG diagrams, CSV result tables. *(Future: Excel, Word, DXF, IFC.)*
- **Autosave & recovery:** configurable interval, recovery file, remembers last-opened project.
- **Project metadata:** name, author, company, description, created/modified dates, software version, file schema version.
- **File security** *(design for later, not needed now)*: password protection, digital signature, read-only mode, checksum.
- **Future compatibility:** new fields (e.g. `Node.temperature`, `Node.mass`, custom properties) must be addable without breaking old project files.
- **Formalize your two existing examples** into the frozen v1 schema: `sample-simply-supported-beam.project.json`, `starter-cantilever-beam.template.json`.
- **Recommended addition — Project Templates:** new-project starting points such as Simply Supported Beam, Cantilever Beam, Continuous Beam, Plane Truss, Portal Frame, Empty Project. Templates only pre-populate the model; they never touch the solver.

---

## Step 7 — Software & Module Architecture

### 7.1 Layers (strict downward dependency only)
```
Frontend (UI)
     ↓
Application Layer
     ↓
Core Engine
     ↓
Math Library
```
- **UI:** never performs engineering calculations.
- **Application layer:** coordinates workflow (e.g., Analyze click → validate model → call solver → receive results → update UI).
- **Core engine:** model, solver, DOF manager, assembler, boundary conditions, result generator, validation — no UI code.
- **Math library:** matrix/vector/Gaussian elimination — knows nothing about beams or trusses.
- **Rule:** Core never imports from Frontend. Math never imports from Solver. Arrows never point upward.

### 7.2 Module Responsibilities (one line each)
- **Modeling** — stores structural objects.
- **Solver** — solves the stiffness equations.
- **Graphics** — draws structures.
- **Learning Mode** — displays calculation steps.
- **Report** — creates PDF reports.
- **File Manager** — save/open projects.
- **Settings** — stores user preferences.

### 7.3 Folder Mapping
```
frontend/          → UI
core/modeling/      → Nodes, Elements, Materials, Sections
core/analysis/      → Beam, Frame, Truss formulations
core/math/          → Matrix, Vector, Gaussian
```

### 7.4 Error Handling Flow
Solver returns an error → Application layer interprets it → UI shows a message. Keeps Core independent of UI.

### 7.5 Extensibility Check
The architecture should allow adding Plate/Shell elements, 3D, new solvers, and new report types without changing existing code.

### 7.6 Module Interfaces *(recommended addition)*
For every major module, define: **Inputs, Outputs, Responsibilities, "must never do."**
Example — **Solver:** Inputs = Model, Loads, Supports, Settings. Outputs = Displacements, Reactions, Member Forces. Responsibility = perform structural analysis. Must never = draw graphics, touch UI, save files.

---

## Step 8 — Solver & Calculation Engine Architecture

### 8.1 Pipeline (fixed order — never skipped or reordered)
```
Model Validation → DOF Numbering → Element Generation →
Local Stiffness Matrix → Transformation Matrix (if required) →
Global Matrix Assembly → Equivalent Load Vector → Boundary Conditions →
Linear Equation Solver → Joint Displacements → Support Reactions →
Member End Forces → Diagram Generation → Learning Mode Data
```

### 8.2 DOF Numbering Strategy
Beam: 2 DOF/node (vertical, rotation). Truss: 2 DOF/node (horizontal, vertical). Frame: 3 DOF/node (horizontal, vertical, rotation). Spring: depends on type. Store global DOF number, local DOF number, and free/restrained status per DOF.

### 8.3 Element Formulation Interface
Every element (Bar/Beam/Frame/Spring) exposes the **same interface** regardless of internal math: local stiffness matrix, transformation matrix (if needed), equivalent nodal loads, end forces. The solver treats every element uniformly.

### 8.4 Coordinate Transformation
Converts local ↔ global stiffness, loads, and displacements. Reduces to an identity transformation when local/global axes align (e.g., a horizontal beam).

### 8.5 Global Matrix Assembly
Assemble element contributions into global K and F. Handle shared nodes correctly; maintain symmetry; support any number of elements.

### 8.6 Boundary Condition Processing
Identify free vs. restrained DOFs → partition matrices → apply settlements/spring supports → output reduced K and reduced F.

### 8.7 Linear Equation Solver
**Never compute the matrix inverse.** Gaussian elimination with partial pivoting for V1 (`GaussianElimination.js` already anticipates this — use it in place of the demo's explicit inversion). LU/Cholesky/sparse solvers are future work. Return displacements + solver status + error codes.

### 8.8 Back-Calculation
From solved displacements: support reactions, member end actions, internal forces, local displacements.

### 8.9 Diagram Generation
Sample **intermediate points** along each member (not just end values) for SFD/BMD/AFD and deflected shape, so curves are smooth and extrema are located accurately.

### 8.10 Learning Mode Data
Emit every stage (DOF numbering, element stiffness matrix, transformation, assembly, boundary conditions, solution, reactions, member forces, diagrams) as **structured objects**, never a formatted text log.

### 8.11 Error & Stability Detection
- **Errors:** zero-length element, missing material/section, singular stiffness matrix, disconnected model.
- **Warnings:** large displacement, ill-conditioned matrix, duplicate definitions, unused nodes.

Return machine-readable error codes alongside user-friendly messages. *(The demo's singular-matrix check is a good starting point to formalize.)*

### 8.12 Benchmark Validation (mandatory before any UI work)
Build a suite of 10–20 textbook problems — simply supported beam, cantilever, overhanging beam, continuous beam, plane truss, portal frame, spring system, combined frame — each with input model, expected reactions/displacements/member forces, and a numeric tolerance (e.g., 0.1%). **Every solver change must pass this suite.**

### 8.13 Code Structure
Separate, independently testable files: `DOFManager`, `Assembler`, `BoundaryConditions`, `Solver`. Avoid one large function (don't repeat the demo's monolithic `runDynamicEngine()` pattern).

---

## Step 9 — UI/UX, Navigation & Workflow

### 9.1 Application Flow (happy path; non-linear editing still allowed — see 9.9)
```
New/Open Project → Model Geometry → Materials & Sections →
Supports → Loads → Validation → Analyze → Results → Reports/Save
```

### 9.2 Navigation Sections
Home, Projects, Model, Properties, Loads, Analysis, Results, Learning Mode, Reports, Settings.

### 9.3 Workspace Layout
Ribbon/toolbar (top) · Project Explorer + Graphics Canvas + Properties/Results panel (three-pane middle) · Output Console · Status bar (bottom).

### 9.4 Screen Definitions
- **Home** — recent projects, templates, new/open
- **Model** — draw/edit nodes and elements, delete objects
- **Materials / Sections** — library, add/edit/delete
- **Supports** — add/modify
- **Loads** — create load cases, apply/edit loads
- **Analysis** — validate model, run analysis, view progress
- **Results** — reactions, displacements, member forces, diagrams
- **Learning Mode** — calculation steps, matrices, equations, explanations
- **Reports** — generate, export PDF/CSV/JSON

### 9.5 Workflow Rules
Materials, sections, supports, and loads must exist and validation must pass before Analyze is enabled. Prevent actions that would create an invalid model.

### 9.6 Selection & Editing
Select, multi-select, move, copy, paste, delete, rename, lock, hide — for every object type.

### 9.7 Graphics Interaction
Zoom, pan, fit-to-screen, grid snap, object snap, selection box. *(Rotate view reserved for 3D.)*

### 9.8 Property Editing
Selecting an object shows only its relevant properties (e.g., Beam → id/material/section/length/releases/loads; Support → type/node/restrained DOFs/settlement).

### 9.9 Non-Linear Editing / Stale-Results Rule (adopt this — matches STAAD/SAP2000/ETABS)
Users may return to and edit any stage at any time. Any change affecting analysis (geometry, load, support) immediately marks existing results as **outdated** and requires reanalysis before showing updated results.

### 9.10 Status & Feedback
Always show state explicitly: *Saving…, Analysis Running…, Analysis Complete, Validation Failed, Project Saved, Report Generated.* Avoid silent failures.

### 9.11 Keyboard Shortcuts (plan now, implement later)
Ctrl+N New · Ctrl+O Open · Ctrl+S Save · Ctrl+Z/Y Undo/Redo · Delete · Esc Cancel Tool.

### 9.12 Accessibility & Usability
Light/dark theme, adjustable font size, high-contrast mode, colorblind-friendly diagram colors, keyboard navigation, tooltips for engineering terms.

### 9.13 Reserved for Future (don't design screens for these yet)
3D modeling, design-code checking, AI assistant, cloud projects, collaboration, plugin manager.

---

## Step 10 — Rendering & Graphics Engine

### 10.1 Separation of Concerns
The renderer receives only Model + Results + Display Settings as input. It never performs calculations.

### 10.2 Rendering Layers (draw order)
```
Background → Grid → Axes → Nodes → Elements → Supports →
Loads → Labels → Selection → Results → Temporary Tools
```

### 10.3 Camera
Pan, zoom, fit-to-screen, reset view, center-on-model. *(Rotate view reserved for 3D.)*

### 10.4 Grid
Infinite grid, adjustable spacing, major/minor lines, snap-to-grid, show/hide. *(Isometric grid reserved for later.)*

### 10.5 Axes
X/Y axes + origin, toggleable. *(Z reserved.)*

### 10.6 Object Rendering
Each object type (node, beam/bar/frame/spring, support symbol, load arrow) has its own dedicated renderer. Element/node numbers and local axis are toggleable; load arrows scale sensibly or use a fixed display-size option.

### 10.7 Selection System
Single/multi/window/crossing select, with distinct highlight states for selected/hovered/locked/hidden.

### 10.8 Editing Preview
Live preview while placing an element/load/support, before the final click commits it.

### 10.9 Result Rendering
Deformed shape (adjustable scale) overlaid on the original geometry; SFD/BMD/AFD with smooth curves, hover values, max/min markers; reaction arrows + values; member end forces + local axes.

### 10.10 Labels & Annotations
Toggle: node/element numbers, coordinates, dimensions, material/section names, load values.

### 10.11 Performance Rules
Redraw only affected objects on edit. Zoom/pan never triggers a solver run or recalculation. Label changes never trigger a solver run.

### 10.12 Graphics Settings *(display-only — never touches the solver)*
Theme, grid visibility/spacing, snap on/off, label visibility, diagram colors, line thickness, font size, anti-aliasing, animation speed.

### 10.13 Reserved for Future
3D/perspective camera, section cuts, animated construction sequence, VR/AR, high-resolution image export, WebGL acceleration.

### 10.14 Recommended Addition — Rendering Abstraction Layer
Define a renderer interface (`drawNode`, `drawElement`, `drawLoad`, `drawDiagram`, etc.) that the rest of the app talks to. V1 implements it with Canvas 2D; SVG/WebGL can replace the implementation later without touching modeling or solver code.

---

## Step 11 — Application Infrastructure

### 11.1 State Management
One source of truth: the current Project (model, materials, sections, loads, results, settings). No duplicated copies of the same data anywhere else.

### 11.2 Command System
Every user action (add node, move node, delete beam, assign material, apply load, run analysis) is a Command object with `execute` and `undo`/`redo`. Foundation for undo/redo.

### 11.3 Undo / Redo
Store the command + minimal reversal data, not full project snapshots each time.

### 11.4 History Management
Maintain a running log of operations (tied to `History.js`) for debugging and future collaboration.

### 11.5 Event System
Modules communicate via events, not direct calls — e.g., *Node Moved → Project Updated → Graphics Refresh → Results Marked Outdated.* Reduces coupling between modules.

### 11.6 Validation System
Runs continuously while editing (duplicate IDs, invalid coordinates, zero-length members) and again before analysis (missing material/section, mechanism, insufficient supports). Returns structured messages with severity: **Error / Warning / Information.**

### 11.7 Error Handling Categories (handled differently)
- **User errors** — invalid input, missing data, unsupported action
- **Solver errors** — singular matrix, mechanism detected, numerical instability
- **System errors** — file save failure, memory issue, unexpected exception

### 11.8 Logging
Levels: INFO / WARNING / ERROR / DEBUG. Debug logging can be disabled in release builds.

### 11.9 Configuration Management
Keep **Application Settings** (theme, language, default units, autosave interval, default grid) separate from **Project Settings** (unit system, gravity, coordinate system, analysis settings) so projects stay portable.

### 11.10 Plugin & Extension Readiness
V1 doesn't need plugins, but the architecture should allow future element types, design codes, custom reports, renderers, and AI assistants without modifying existing modules.

### 11.11 Background Tasks
Analysis, PDF generation, autosave, and import/export should never block the UI.

### 11.12 Security & Recovery
Autosave recovery, backup project, crash recovery, safe shutdown, corrupted-file detection.

### 11.13 Performance Monitoring
Track analysis time, render time, memory usage, project size, node/element counts.

### 11.14 Recommended Addition — Project Status
Track and expose one of: **Clean / Modified / Analysis Outdated / Analyzing / Analysis Failed.** Drives which UI actions are enabled and prevents users from trusting stale results.

---

## Step 12 — Testing & Validation

### 12.1 Testing Levels
```
Unit Tests → Integration Tests → System Tests →
Validation Against Textbooks → Regression Tests
```

### 12.2 Math Unit Tests
Matrix add/subtract/multiply/transpose/determinant/symmetry. Gaussian elimination (verify `A × x = b` within numeric tolerance). Geometry: distance, length, angle, direction cosines.

### 12.3 Element Formulation Tests (test each element type independently first)
Beam: local stiffness matrix, fixed-end actions, end forces. Truss: axial stiffness, transformation. Frame: local matrix, global matrix, transformation. Spring: stiffness.

### 12.4 Integration Tests
Model → DOF Manager → Assembler → Solver → Results — check that modules communicate correctly.

### 12.5 Benchmark Library (permanent "gold standard" — store input model + expected reactions/displacements/member forces/diagrams for each)
- **Beams:** simply supported, cantilever, fixed, overhanging, continuous
- **Trusses:** two-bar, three-bar, Warren, Pratt
- **Frames:** portal, fixed, multi-bay
- **Springs:** single, chain, mixed beam-spring

### 12.6 Validation Sources
Textbook examples, lab manuals, published solved problems, commercial software (STAAD.Pro, SAP2000), hand calculations.

### 12.7 Error & Edge-Case Tests
Duplicate nodes, zero-length member, missing material/section, floating structure, mechanism, negative stiffness, invalid support — software must fail gracefully with clear messages.

### 12.8 Regression Testing
Re-run the full benchmark suite after every feature or change; only merge if everything passes.

### 12.9 Performance Testing Targets

| Model Size | Expected Behavior |
|---|---|
| 10 nodes | Instant |
| 50 nodes | Very fast |
| 200 nodes | Smooth |
| 500 nodes | Acceptable |
| 1000+ nodes | Future optimization |

### 12.10 User Acceptance Testing (full workflow)
Create project → model structure → apply loads → analyze → review results → save → reopen → generate report. Must work end-to-end without surprises.

### 12.11 Test Documentation
Per test: ID, purpose, input, expected result, actual result, pass/fail, notes.

### 12.12 Release Readiness Checklist
- ✓ All unit tests pass
- ✓ All benchmarks pass
- ✓ No known critical bugs
- ✓ Reports generate correctly
- ✓ Save/open works
- ✓ Results match references
- ✓ Learning Mode is correct

### 12.13 Recommended Addition — Reference Verification Library
For every benchmark, store the original source (textbook/lab manual/standard example), diagrams, and assumptions (units, sign convention, material properties) alongside the expected numbers — a permanent, citable verification database.

---

## Step 13 — Performance Planning & Optimization

### 13.1 Performance Goals

| Model Size | Target |
|---|---|
| 20 nodes | < 0.1 s |
| 100 nodes | < 0.5 s |
| 500 nodes | < 2 s |
| 1000 nodes | < 5 s |
| 5000+ nodes | Future version |

Also define: maximum memory usage, maximum project size, maximum element count for V1.

### 13.2 Matrix Strategy
Dense matrices for V1; sparse/skyline/CSR-CSC formats reserved for later. Don't optimize prematurely, but keep the solver interface swappable.

### 13.3 Solver Optimization Rules
Never compute the matrix inverse. Reuse allocated memory where possible. Recompute only what actually changed.

### 13.4 Incremental Analysis
If only a load/support/section changed, update just that piece (e.g., the load vector) and reuse a still-valid stiffness matrix rather than rebuilding everything.

### 13.5 Rendering Performance
Redraw only changed objects; layer-based rendering; viewport/label culling when zoomed out. Camera movement must never trigger the solver.

### 13.6 Background Processing
Analysis, report generation, PDF export, and autosave should run without freezing the UI (Web Workers in-browser, worker threads on desktop — planned, not necessarily built in V1).

### 13.7 Memory Management
Avoid duplicate project data, unused matrices, stale results, memory leaks. Release temporary solver objects once analysis completes.

### 13.8 Caching Strategy
Cache section/material properties, transformation matrices, rendered symbols. Never cache anything that depends on geometry/loads unless invalidation is handled correctly.

### 13.9 Optimization Roadmap
- **V1:** dense matrices, Gaussian elimination, single-threaded
- **V2:** LU decomposition, incremental analysis, background workers
- **V3:** sparse matrices, parallel processing, GPU-assisted rendering

### 13.10 Recommended Addition — Dev-Only Performance Metrics Dashboard
Analysis/assembly/solver/render time, node/element counts, memory usage, FPS during interaction — for development builds only, so optimization is based on measurement, not guesswork.

---

## Step 14 — AI Integration
### *Skipped for V1*

AI is not part of the structural-analysis engine and doesn't contribute to the core objective — including it now adds risk without value. The structured Learning Mode data (Steps 4 & 8) already delivers most of the explanatory value AI would add, with none of the risk.

If revisited in a later version: scope it strictly to *explaining* results or steps to the user — never inside the calculation path itself.

---

## Step 15 — Documentation, Git & Project Management

### 15.1 Technical Reference (living document — update whenever the solver changes)
Coordinate system, sign convention, DOF definitions, element formulations, matrix equations, solver algorithm, unit system, validation rules, engineering assumptions, limitations.

### 15.2 Formula Reference
Every equation used (beam/frame/truss stiffness, transformation, shape functions, fixed-end actions), with variable meanings and source (textbook/standard) — prevents re-deriving things later.

### 15.3 Project Documentation
Folder structure, module descriptions, data flow, class relationships, file format/JSON schema, application architecture.

### 15.4 Git Workflow
Keep `main` stable. Feature branches (`feature/beam`, `feature/frame`, `feature/rendering`, `feature/report`) and `bugfix/*`, merged in once complete.

### 15.5 Commit Strategy
Small, meaningful commits ("Add beam stiffness matrix," "Implement Gaussian elimination," "Fix frame transformation bug"). Avoid vague messages ("Update," "Changes," "Fix").

### 15.6 Two Independent Version Numbers
- **Application version** (e.g., `v1.0.0`) — changes with features/bug fixes
- **Project file schema version** (e.g., `Schema 1.0`) — changes only when the file structure changes

Don't conflate them.

### 15.7 Changelog
Maintain per-version notes of what was added/fixed.

### 15.8 Development Roadmap (milestone-based)
```
Math Library → Beam Solver → Frame Solver → Rendering → Reports → Release
```
Each phase should end with a working application.

### 15.9 Coding Standards
Consistent naming, one class per file, small focused functions, no duplicated code, comments on engineering formulas, no hardcoded constants.

### 15.10 External References Bibliography
Track every textbook, FEM reference, IS code, Eurocode, AISC manual, paper, or lecture note that a formula came from.

### 15.11 Issue Tracking
Bugs / improvements / future features / known limitations, prioritized Critical → High → Medium → Low.

### 15.12 Release Checklist
- ✓ Tests pass
- ✓ Benchmarks verified
- ✓ Documentation updated
- ✓ Changelog updated
- ✓ Version numbers updated
- ✓ Project schema verified
- ✓ Sample projects tested

### 15.13 Recommended Addition — `DEVELOPER_GUIDE.md`
One document from day one combining architecture, folder structure, coding standards, engineering conventions, git workflow, build instructions, testing process, and key design decisions — the primary reference even as the sole developer.

---

## Step 16 — Pre-Coding Readiness & Development Plan

### 16.1 Design Review Gate (confirm before writing any production code)
✓ Scope fixed (1) · ✓ Engineering assumptions fixed (2) · ✓ Input schema final (3) · ✓ Output schema final (4) · ✓ Data model complete (5) · ✓ File format frozen (6) · ✓ Architecture validated (7) · ✓ Solver design + benchmark answers written (8) · ✓ One navigation/wireframe set (9).
*(Steps 10–15 can be refined alongside early coding — they're not blocking.)*

### 16.2 Development Order (never start with the UI)
```
Utilities → Math Library → Core Data Models → Validation Engine →
Element Formulations → Solver Engine → Benchmark Verification →
File System → Rendering Engine → UI → Reports → Final Testing
```

### 16.3 Module Dependency Check
```
Math → Core → Solver → Renderer → Frontend
```
Core must not depend on UI. Solver must not depend on the Renderer. UI communicates only through the application layer.

### 16.4 Initial Milestones
1. **Foundation** — Math, Matrix, Vector, JSON
2. **Model** — Nodes, Elements, Materials, Sections
3. **Beam Solver** — DOF, Assembly, Gaussian solver
4. **Frame & Truss**
5. **Rendering**
6. **Results**
7. **Reports**
8. **Release Candidate**

### 16.5 Definition of Done (every feature)
✓ Code implemented · ✓ Unit tests pass · ✓ Benchmark passes · ✓ Documentation updated · ✓ No known critical bugs · ✓ UI integrated (if applicable) · ✓ Reviewed against engineering assumptions.

### 16.6 Risk Register
- **Technical:** numerical instability, incorrect element formulation, matrix assembly errors
- **Project:** scope creep, overly complex UI, delayed testing
- **Performance:** large-model slowdown, memory growth

Write a mitigation plan for each.

### 16.7 Coding Principles
Correctness before optimization. Simplicity before cleverness. Test before expanding features. One responsibility per module. Reuse existing code where appropriate. No hardcoded engineering constants.

### 16.8 Version 1 Feature Lock
- **Included:** Beam, Plane Truss, Plane Frame, Spring, DSM solver, Learning Mode, SFD/BMD/AFD, deflected shape, PDF reports, JSON save/open.
- **Excluded until V1 ships:** 3D analysis, dynamic/nonlinear analysis, design-code checks, cloud features, AI features, plugin system.

No new features until Version 1 is complete.

### 16.9 Pre-Coding Checklist
☐ Folder structure ready · ☐ Architecture approved · ☐ Benchmark problems prepared · ☐ Formula references collected · ☐ Test cases written · ☐ Git repository created · ☐ Sample projects ready · ☐ Documentation started.

### 16.10 "Version 1 Complete" Success Criteria
Correct results on all benchmark problems. Stable desktop application. Professional modeling workflow. Reliable save/open. Accurate diagrams. Complete Learning Mode. No critical defects. Documentation complete.

### 16.11 Where to Actually Start Coding
`core/math` and `core/solver`, zero UI attached. Port `engine.html`'s existing beam logic into `Matrix` / `GaussianElimination` / `DOFManager` / `Assembler` / `Solver`, extend to Bar/Frame/Spring per Step 2, and validate every one against the Step 12 benchmark suite **before** touching rendering or UI.

---

*End of specification. Update this file whenever a design decision changes — code should always follow the document, not the other way around.*
