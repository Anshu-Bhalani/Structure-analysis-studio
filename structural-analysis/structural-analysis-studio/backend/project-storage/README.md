# backend/project-storage (scaffold)

**Responsibility:** server-side project persistence *behavior* on top
of `backend/database` + `backend/cloud-storage`: versioning,
autosave history, sharing/collaboration links, and conflict
resolution when a project is edited from multiple devices.

**Depends on:** `backend/database`, `backend/cloud-storage`,
`shared/` (project-file schema)

**Must not depend on:** `core/`, `frontend/`

**Relationship to the client:** this is the server-side counterpart
to `core/storage/ProjectStorage.js` (which handles local
autosave/import/export in the browser). Keep the two speaking the
same project-file schema — defined once, referenced from `shared/` —
rather than each inventing its own.
