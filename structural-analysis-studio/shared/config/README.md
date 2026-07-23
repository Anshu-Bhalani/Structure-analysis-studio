# shared/config

Environment-agnostic application configuration — the kind of thing
that's the same whether you're running the desktop UI, mobile UI, or
(later) a backend job: feature flags, default locale, supported unit
systems, API base paths.

This is **not** the same as `core/config/Config.js`, which holds
engine/graphics defaults specific to running the Core Engine in a
browser (grid spacing, default zoom, deflection scale). Keep those
separate: `core/config` is "how the engine behaves by default",
`shared/config` is "how the product is configured across
environments."

`app.config.json` is a starter — wire it up wherever a layer needs
one of these values instead of hardcoding it.
