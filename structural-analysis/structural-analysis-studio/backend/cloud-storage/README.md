# backend/cloud-storage (scaffold)

**Responsibility:** storing/retrieving raw project files and any
binary assets (exported images/PDFs) in object storage (e.g. S3-
compatible buckets), separate from the relational metadata in
`backend/database`.

**Depends on:** `shared/config` (bucket/region/credentials config)

**Must not depend on:** `core/`, `frontend/`

**Planned contents:**
- `client.js` — thin wrapper around the chosen storage SDK
- `upload.js` / `download.js` — signed URL helpers for direct
  browser-to-bucket transfer where possible
