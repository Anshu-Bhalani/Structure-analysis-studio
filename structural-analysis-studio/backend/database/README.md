# backend/database (scaffold)

**Responsibility:** schema definitions, migrations, and the
data-access layer for users, projects, teams, and sharing metadata.

**Depends on:** `shared/config` (connection settings)

**Must not depend on:** `core/`, `frontend/`

**Planned contents:**
- `schema/` — table/collection definitions
- `migrations/` — versioned schema changes
- `repositories/` — query functions consumed by `backend/api`

**Note:** the *shape* of a saved project (nodes, elements, supports,
loads, materials, sections, `formatVersion`) is defined once by
`core/storage/JSONSerializer.js` on the client. When this module
starts persisting whole projects, mirror that schema from
`shared/example-projects/` rather than redefining it independently,
so client and server never drift out of sync.
