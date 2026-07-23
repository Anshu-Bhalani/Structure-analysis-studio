# shared/common-data

Reusable engineering preset libraries — reference data that isn't
tied to any single project, e.g. standard material grades and
standard section sizes a user can pick from instead of typing raw
`E`, `A`, `I` values by hand.

`materials.json` and `sections.json` are small starter libraries.
Today, `core/modeling/Material.js` / `Section.js` only know how to
build a single hardcoded default (`Material.defaultSteel()`,
`Section.defaultSection()`, mirroring `core/config/Config.js`'s
`defaults.materialE` etc.). A "material/section picker" UI feature
would read from these files instead of only offering the one default.
