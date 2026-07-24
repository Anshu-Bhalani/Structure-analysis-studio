# Structural Analysis Studio

> A free, educational, and professional structural analysis software built using HTML, CSS, and JavaScript.

---

# Project Overview

This project is developed using a strict engineering-first approach.

Instead of writing the solver first, the software is built layer by layer so that every component is independent, reusable, testable, and easy to maintain.

The project follows two important systems:

- **Level System** → Defines the dependency architecture.
- **Phase System** → Defines the development roadmap.

Following these systems prevents circular dependencies, reduces bugs, and keeps the project scalable.

---

# Level System (Dependency Architecture)

The project follows a one-way dependency chain.

```
Level 1
    ↓
Level 2
    ↓
Level 3
    ↓
Level 4
    ↓
Level 5
    ↓
Level 6
```

A higher level **may use** lower levels.

A lower level **must never depend** on higher levels.

---

# Level 1 — Utilities (Foundation)

**Folder**

```text
core/utilities/
├── Helpers.js
├── Logger.js
├── History.js
└── UnitConverter.js
```

## Purpose

General-purpose helper functions used throughout the project.

### Knows About

- JavaScript only

### Used By

- Level 2
- Level 3
- Level 4
- Level 5
- Level 6

---

# Level 2 — Math Library

**Folder**

```text
core/math/
├── Matrix.js
├── Vector.js
├── GaussianElimination.js
└── MathUtils.js
```

## Purpose

Contains all mathematical operations required by the software.

### May Use

- Utilities

### Must NOT Know

- Node
- Element
- Beam
- Model
- Solver

### Used By

- Level 3
- Level 4
- Level 5
- Level 6

---

# Level 3 — Core Data Models

**Folder**

```text
core/modeling/
├── Model.js
├── Node.js
├── Element.js
├── Material.js
├── Section.js
├── Support.js
└── Load.js
```

## Purpose

Stores every engineering object inside the project.

Examples include:

- Nodes
- Elements
- Materials
- Sections
- Supports
- Loads

### May Use

- Utilities
- Math (if required)

### Must NOT Know

- Validation
- Analysis Elements
- Solver

### Used By

- Level 4
- Level 5
- Level 6

---

# Level 4 — Validation Engine

**Folder**

```text
core/utilities/
└── Validation.js
```

## Purpose

Checks whether the structural model is valid before analysis.

### Uses

- Utilities
- Math
- Modeling

### Validation Checks

- Duplicate nodes
- Coincident nodes
- Zero-length elements
- Missing materials
- Missing sections
- Invalid supports
- Invalid loads
- Dangling references
- Invalid coordinates
- Invalid element types

### Must NOT Know

- Element stiffness
- Solver implementation

### Used By

- Level 5
- Level 6

---

# Level 5 — Element Formulations

**Folder**

```text
core/analysis/elements/
├── IAnalysisElement.js
├── BeamElement.js
├── BarElement.js
├── FrameElement.js
├── SpringElement.js
└── ElementFactory.js
```

## Purpose

Implements engineering mathematics for **one structural element only**.

### Uses

- Utilities
- Math
- Modeling
- Validation

### Calculates

- Local stiffness matrix
- Transformation matrix
- Element geometry
- Fixed-end forces
- Equivalent nodal loads
- Element result recovery

### Must NOT

- Assemble the global matrix
- Solve the entire structure

### Used By

- Level 6

---

# Level 6 — Solver Engine

**Folder**

```text
core/solver/
├── DOFManager.js
├── Assembler.js
├── BoundaryConditions.js
└── Solver.js
```

## Purpose

Solves the complete structural model.

### Uses

- Utilities
- Math
- Modeling
- Validation
- Element Formulations

### Solver Pipeline

```text
Model
    ↓
Validation
    ↓
DOF Numbering
    ↓
Element Stiffness
    ↓
Global Assembly
    ↓
Boundary Conditions
    ↓
Gaussian Elimination
    ↓
Displacements
    ↓
Reactions
    ↓
Member Forces
```

---

# Phase System (Development Roadmap)

The project must always be developed phase by phase.

Never skip a phase.

Never start a later phase before the previous phase is stable.

---

# Phase 1 — Foundation

## Goal

Build the mathematical and modeling foundation.

### Modules

```text
core/
├── math/
│   ├── Matrix.js
│   ├── Vector.js
│   ├── GaussianElimination.js
│   └── MathUtils.js
│
└── modeling/
    ├── Model.js
    ├── Node.js
    ├── Element.js
    ├── Material.js
    ├── Section.js
    ├── Support.js
    └── Load.js
```

### Status

✅ Completed

---

# Phase 2 — Project Model

## Goal

Create and manage structural objects.

### Features

- Create Node
- Edit Node
- Delete Node
- Save Node
- Create Beam
- Create Truss
- Create Frame
- Create Spring

### Status

✅ Completed

---

# Phase 3 — Validation

## Goal

Validate the complete model before analysis.

### Validation

- Zero-length elements
- Duplicate nodes
- Missing material
- Missing section
- Invalid support
- Invalid load
- Invalid coordinates
- Dangling references

The **Analyze** button must refuse to run if validation fails.

### Status

✅ Completed

---

# Phase 4 — Geometry Editor

## Goal

Transform the canvas into a professional drawing environment.

### Features

- Select
- Move
- Delete
- Snap
- Grid
- Zoom
- Pan
- Selection Box
- Object Highlighting

### Status

🟡 Current Phase

---

# Phase 5 — Beam Solver

## Goal

Implement the Direct Stiffness Method.

### Features

- DOF Numbering
- Local Stiffness Matrix
- Global Assembly
- Boundary Conditions
- Gaussian Elimination
- Nodal Displacements
- Reactions
- Member End Forces

Every result must be verified using benchmark problems before continuing.

### Status

⬜ Pending

---

# Phase 6 — Results

## Goal

Display engineering results.

### Features

- Shear Force Diagram (SFD)
- Bending Moment Diagram (BMD)
- Axial Force Diagram (AFD)
- Deflected Shape
- Reaction Display

### Status

⬜ Pending

---

# Phase 7 — Learning Mode

## Goal

Provide step-by-step educational visualization.

### Features

- DOF Numbering
- Local Stiffness Matrix
- Global Stiffness Matrix
- Assembly Process
- Boundary Conditions
- Solver Steps
- Reactions
- Member Forces

### Status

⬜ Pending

---

# Element Development Order

Never implement every element together.

Follow this order:

```text
Beam
    ↓
Truss (Bar)
    ↓
Frame
    ↓
Spring
```

Move to the next element only after the previous one is fully tested and verified.

---

# Development Rules

- Finish one phase before starting the next.
- Test every module independently.
- Never skip validation.
- Never write solver code before the modeling system is stable.
- Never introduce circular dependencies.
- Keep every level independent.
- Validate every structural model before analysis.
- Verify every solver result using benchmark problems.
- Maintain clean, modular, and scalable architecture.

---

# Current Progress

| Item | Status |
|------|--------|
| Master Specification | ✅ Complete |
| Folder Structure | ✅ Complete |
| Desktop UI | ✅ Complete |
| Mobile UI | ✅ Complete |
| Responsive Layout | ✅ Complete |
| Level System | ✅ Complete |
| Phase 1 | ✅ Complete |
| Phase 2 | ✅ Complete |
| Phase 3 | ✅ Complete |
| Phase 4 | 🟡 In Progress |
| Phase 5 | ⬜ Pending |
| Phase 6 | ⬜ Pending |
| Phase 7 | ⬜ Pending |

---

# Current Objective

The project is now ready to begin **Phase 4 – Geometry Editor**.

The primary goal is to build a professional structural drawing environment before implementing the structural solver.