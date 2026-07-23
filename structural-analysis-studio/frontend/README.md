# Frontend

UI only. No engineering calculations may ever live under
`frontend/` — every number that comes from structural analysis comes
from `core/`.

```
frontend/
├── desktop-ui/    # Full, feature-complete desktop experience (today's app)
├── mobile-ui/     # Touch-first experience (scaffold — see its own README)
└── shared-ui/     # Assets & theming shared by both targets above
```

## Why one implementation is "ahead" of the other

`desktop-ui/` is the existing, fully-built application. `mobile-ui/`
is currently a scaffold that proves the wiring (see
`mobile-ui/README.md`) but doesn't have real screens yet. This is
expected and fine: both targets depend on the same `core/` and
`shared-ui/`, so building `mobile-ui/` out is additive UI work, not a
rearchitecture.

## Rule for both UI targets

A UI component may:
- Read plain data/constants from `core/` (e.g. `ELEMENT_TYPES`,
  `SUPPORT_PRESETS`) to populate menus and forms.
- Call methods on `core/` objects (`model.addNode()`,
  `Solver.run(model)`) and render the results.

A UI component may **not**:
- Compute a stiffness matrix, assemble DOFs, solve a system, or
  perform any other structural math itself.
- Duplicate a `core/` class instead of importing it.

If similar-looking logic starts appearing in both `desktop-ui/` and
`mobile-ui/`, that's a signal it belongs in `core/` or `shared-ui/`
instead.
