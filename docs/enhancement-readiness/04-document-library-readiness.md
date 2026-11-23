# 04 — Document library readiness

**Do not create migration 040 in this audit** — readiness only.

## Current state

| Capability | Evidence | Classification |
|------------|----------|----------------|
| Central `documents` table | Absent from `scripts/schema.sql` | NOT IMPLEMENTED |
| Document batch junction | Absent | NOT IMPLEMENTED |
| Admin/student document hub UI | No `/admin/documents` or `/student/resources` | NOT IMPLEMENTED |
| Curriculum PDF items | `batch_curriculum` / `pdf_url` in `batch-curriculum.service.ts` L112–167 | VERIFIED WORKING (syllabus PDFs, not library) |

## Supabase Storage

| Item | Evidence | Classification |
|------|----------|----------------|
| `uploads` bucket | `scripts/migrations/015-uploads-storage.sql` | VERIFIED WORKING |
| PDF MIME on bucket | `036-uploads-pdf-support.sql` | VERIFIED WORKING |
| User-isolated question paths | `038-uploads-user-isolation.sql` | VERIFIED WORKING |
| Dedicated `documents` bucket | Not present | NOT IMPLEMENTED |

## Upload utilities

| Utility | Path | Purpose | Classification |
|---------|------|---------|----------------|
| Question image/PDF upload | `uploads/uploads.controller.ts` `POST uploads/question-image` | Assessment assets; path `question-answers/{userId}/...` | VERIFIED WORKING |
| Max size / MIME allowlist | `ALLOWED_MIME_TYPES`, 10MB L6–16 | | VERIFIED WORKING |
| Signed URL (30d) | `createSignedUrl` L63–66 | Service-role server-side | VERIFIED WORKING |

## RLS and authorization model

| Item | Evidence | Classification |
|------|----------|----------------|
| Storage RLS policies | `015-uploads-storage.sql`, `038-uploads-user-isolation.sql` | VERIFIED WORKING |
| API DB access | Service role bypasses RLS | VERIFIED WORKING (`supabase.service.ts`) |
| Document download entitlement pattern (reference) | `playback-guard.service.ts`, recordings entitlement | IMPLEMENTED BUT UNVERIFIED — reusable pattern for library |

## Planned shape (from roadmap)

- Tables: `documents`, `document_batches` (`docs/legacy-porting-roadmap.md` Phase 2)
- Bucket: `documents` or prefixed paths under `uploads`
- API module: `documents/` with multipart upload + signed download after batch check

## Readiness verdict

| Dimension | Verdict |
|-----------|---------|
| Infrastructure to build on | **READY** — Storage bucket pattern + upload controller exist |
| Schema / API / UI | **NOT READY** — greenfield module |
| Security pattern | **PARTIALLY READY** — must replicate batch entitlement checks in Nest (RLS not sufficient for API path) |

## Risks for Phase 2

| Risk | Classification |
|------|----------------|
| Teacher upload without batch assert (same class of bug as curriculum) | DEFECT if copied from current TEACHER patterns without `assertTeacherBatchAccess` |
| Confusion with curriculum `pdf_url` | PARTIALLY IMPLEMENTED — document product rules needed |