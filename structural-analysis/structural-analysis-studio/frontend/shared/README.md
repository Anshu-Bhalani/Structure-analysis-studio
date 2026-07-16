# Shared UI

Presentation-layer resources used by **both** `desktop-ui/` and
`mobile-ui/`. Nothing in here is UI-target-specific, and nothing in
here performs engineering calculations.

```
shared-ui/
├── theme/
│   ├── ThemeManager.js   # applies color tokens as CSS custom properties,
│   │                       and hands a flat color dict to <canvas>-based
│   │                       renderers in core/graphics + core/visualization
│   └── themes.css        # default (dark) --color-* / --font-* / --radius-*
│                           tokens, so the app renders correctly before JS runs
└── assets/
    ├── icons/            # shared iconography (svg/png)
    ├── fonts/            # any self-hosted webfonts
    └── images/           # logos, illustrations, empty-state art
```

## Why `ThemeManager.js` lives here, not in `core/`

It touches `document` / DOM `style` properties, which makes it a UI
concern — but it's identical for every UI target, so it belongs in
the shared UI layer rather than being duplicated per-target. Note it
does **not** import anything from `core/`, and nothing in `core/`
imports it: Core Engine renderers (e.g. `core/graphics/Canvas.js`)
receive a plain color object via `setColors(colors)` instead, keeping
Core Engine fully UI-agnostic.

## Adding a new icon/font/image

Drop the file in the matching subfolder and reference it with a
relative path from whichever UI target needs it
(e.g. `../../shared-ui/assets/icons/beam.svg` from `desktop-ui/`).
Don't copy assets into `desktop-ui/` or `mobile-ui/` individually —
that's exactly the duplication this folder exists to prevent.
