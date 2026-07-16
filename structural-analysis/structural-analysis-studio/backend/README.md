# Backend (scaffold)

Empty on purpose — this folder exists now so its shape is settled
before any backend code is written, avoiding a restructure later.

The frontend (`frontend/desktop-ui`, `frontend/mobile-ui`) runs
fully client-side today: modeling, solving, and visualization all
happen in `core/` inside the browser, and projects persist to
`localStorage`/file export via `core/storage/ProjectStorage.js`. None
of that requires a backend to function.

This folder is where **server-side** concerns will live once needed:
accounts, a real database, a public API, cloud project sync, and any
server-hosted AI features.

## Modules

| Folder             | Responsibility                                                                 |
|---------------------|---------------------------------------------------------------------------------|
| `auth/`             | User accounts, sessions/tokens, login providers (email, OAuth, SSO)            |
| `database/`         | Schema, migrations, and data-access layer (users, projects, teams)             |
| `api/`              | The public HTTP/GraphQL surface the frontend will eventually call              |
| `cloud-storage/`    | Saving/loading projects to a server instead of only `localStorage`/file export |
| `ai-services/`      | Server-side AI Assistant endpoints (chat, model suggestions, error explaining) |
| `project-storage/`  | Server-side project persistence: versioning, sharing, autosave history         |

## Architecture rules

1. **Backend must be independent of Core Engine.** Nothing in
   `backend/` may `import` files from `core/`. The two run in
   different environments (Node/server vs. browser) and evolve on
   different schedules. If backend code needs the same *data shapes*
   or *constants* Core Engine uses (units, material presets, project
   file schema version), pull them from `shared/` — never from
   `core/` directly. See the root `ARCHITECTURE.md` for the reasoning
   and a suggested fix for the one indirect coupling that exists
   today (the project file format).
2. **Backend must never render UI.** No HTML/DOM/canvas code here.
3. **The frontend must keep working with the backend absent or
   offline** wherever reasonably possible — local autosave and file
   export/import should remain a fallback, not be removed once
   `cloud-storage/` exists.

## Suggested stack (not yet decided)

Left open deliberately. Node.js + a lightweight framework (Fastify/
Express) plus a managed Postgres database is a reasonable default fit
for this kind of app, but the folder boundaries above hold regardless
of the specific technology chosen.
