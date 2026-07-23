# shared/example-projects

Full, realistic `.json` project files in the **exact** format
`core/storage/JSONSerializer.js` reads and writes (including the
`formatVersion`/`appName`/`savedAt`/`meta` envelope, not just the bare
model). Useful for:

- A "Load an example" menu in the UI
- Documentation / tutorials
- Regression tests for `ProjectStorage.importFromFile()` and
  `JSONSerializer.deserialize()` without hand-writing fixtures

Contrast with `shared/templates/`, which holds *bare* starting-point
models (no save envelope) meant for "New Project" flows rather than
"Open Project" flows.

`sample-simply-supported-beam.project.json` is a first example: a
simply supported beam (pin + roller) with a midspan point load.
