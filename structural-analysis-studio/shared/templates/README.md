# shared/templates

Starter-model templates a user can create a new project from (e.g. a
"New Project" dialog offering "Blank", "Cantilever Beam",
"Simple Truss", "Portal Frame"...). Each template is plain data in
the same shape `core/modeling/Model.js` already produces via
`toJSON()` — no engineering logic lives here, just node/element/
support/load starting points.

`starter-cantilever-beam.template.json` captures the exact example
model that `frontend/desktop-ui/app/App.js`'s `_seedInitialModel()`
currently builds in code. As a suggested follow-up (see root
`ARCHITECTURE.md`), that method could load this file instead of
constructing the model imperatively — one fewer thing to keep in
sync as more templates are added.
