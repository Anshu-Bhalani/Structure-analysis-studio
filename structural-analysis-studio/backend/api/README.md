# backend/api (scaffold)

**Responsibility:** the public HTTP/GraphQL surface the frontend will
eventually call — request validation, auth checks, routing to
`auth/`, `database/`, `cloud-storage/`, `ai-services/`, and
`project-storage/`, and shaping responses.

**Depends on:** the other `backend/*` modules, `shared/` (for shared
constants/config/schemas)

**Must not depend on:** `core/`, `frontend/`

**Planned contents:**
- `routes/` (REST) or `schema/` + `resolvers/` (GraphQL)
- `middleware/` — auth guards, rate limiting, request validation
- `dto/` — request/response payload shapes

**Note on the frontend calling this:** when this exists, the frontend
should treat it as just another data source behind
`core/storage/ProjectStorage.js` (e.g. a `CloudProjectStorage`
counterpart), so `frontend/desktop-ui` and `frontend/mobile-ui` never
need to know whether a project came from `localStorage` or the API.
