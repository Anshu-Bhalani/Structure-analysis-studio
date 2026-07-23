# backend/ai-services (scaffold)

**Responsibility:** server-side AI Assistant features that shouldn't
run client-side — e.g. natural-language model generation
("model a 3-bay portal frame"), result explanation, or error
diagnosis, backed by a hosted LLM API.

**Depends on:** `shared/` (for the project-file schema and
engineering constants, so AI-generated models are valid)

**Must not depend on:** `core/` — this module should describe the
model it wants (nodes/elements/loads as data) using the same schema
as `shared/example-projects/`, and let the **client-side** Core
Engine (`core/modeling`, `core/solver`) actually construct and solve
it. The AI service proposes data; it never performs or duplicates the
structural math.

**Planned contents:**
- `assistant.js` — prompt orchestration
- `promptTemplates/` — reusable prompt scaffolding
