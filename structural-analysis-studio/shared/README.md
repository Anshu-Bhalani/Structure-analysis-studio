# Shared Resources

Cross-cutting, non-code(ish) resources reusable by **every** layer —
`frontend/desktop-ui`, `frontend/mobile-ui`, `core/`, and eventually
`backend/`. Nothing here performs UI rendering or engineering
calculation; it's data, config, and content that multiple layers need
to agree on.

Not to be confused with `frontend/shared-ui/`, which is presentation-
only (icons, fonts, theme CSS) and used exclusively by the two UI
targets. This folder is broader: `core/` and `backend/` can depend on
it too.

| Folder              | Contents                                                              |
|----------------------|--------------------------------------------------------------------|
| `assets/`            | Non-UI business assets: export/report branding, letterheads, example-project thumbnails |
| `config/`            | Environment-agnostic app configuration (feature flags, defaults)     |
| `constants/`         | Engineering & app-wide constants reused by `core/` (and later `backend/`) |
| `templates/`         | Starter-model templates users can create a new project from         |
| `example-projects/`  | Full sample `.json` project files matching the real save format, for onboarding/docs/tests |
| `units/`             | Unit-conversion factor tables (data), backing `core/utilities/UnitConverter.js` |
| `localization/`      | UI translation strings, keyed by locale                              |
| `common-data/`       | Reusable engineering preset libraries (materials, sections, etc.)    |

## Dependency rule

`Shared resources must be reusable by every layer` — including
`core/`. The architecture diagram in the root `ARCHITECTURE.md` shows
Desktop UI and Mobile UI depending on Shared directly; in practice
`core/` is also expected to read from here (e.g. `core/utilities`
reading `units/unit-tables.json`, or `core/modeling` seeding from
`common-data/materials.json`) rather than hardcoding the same values
twice. See `ARCHITECTURE.md` → "Suggested improvements" for the two
concrete places this repo could adopt that today.

## What does NOT belong here

Anything that calculates, renders, or has a request handler. Those
belong in `core/`, `frontend/*`, or `backend/*` respectively.
