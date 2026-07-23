# backend/auth (scaffold)

**Responsibility:** user identity — signup/login, session or JWT
issuance, password reset, and (later) OAuth/SSO providers.

**Depends on:** `backend/database` (to persist users/sessions),
`shared/config` (for token expiry, provider settings, etc.)

**Must not depend on:** `core/`, `frontend/`

**Planned contents:**
- `routes/` or `resolvers/` — the actual auth endpoints, exposed
  through `backend/api`
- `session.js` — token issuing/verification helpers
- `providers/` — OAuth provider adapters (Google, GitHub, etc.)
