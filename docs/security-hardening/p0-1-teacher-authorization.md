# P0-1 — Teacher resource authorization hardening

**Date:** 2026-11-24  
**Scope:** Backend API only (no schema changes).

## Vulnerabilities addressed

| Finding | Resolution |
|---------|------------|
| SEC-1 Batch curriculum lacks teacher/student batch checks | `BatchAccessService.assertBatchReadAccess` / `assertBatchWriteAccess` on all curriculum routes via `@CurrentUser()` |
| SEC-2 Student curriculum IDOR | Student path uses `assertStudentBatchAccess` → **404** (`NotFoundException`) when not enrolled |
| SEC-3 Teacher live session list/detail leak | `findAll` filters by `getSessionIdsForTeacherBatches`; `findById` uses `assertTeacherSessionAccess` + scoped `batchIds` |
| SEC-4 Global review queue for teachers | `getReviewQueue` filters `attempt_id` to `getTeacherReviewableAttemptIds`; mutations call `assertTeacherCanAccessReviewQueueItem` / `assertTeacherCanAccessAttempt` |
| SEC-5 Teacher `GET /users/:id` arbitrary profiles | `assertTeacherCanViewUserProfile` (shared-batch student or co-teacher) |
| Batch gaps (teachers/sessions sub-routes) | `getTeachers`, `getSessionsForBatch` assert teacher batch access |

## Authorization approach

- New global **`BatchAccessService`** (`apps/api/src/common/services/batch-access.service.ts`) registered in `app.module.ts`.
- NestJS **service-role Supabase** — all checks in application layer; no RLS reliance.
- **Admin:** unchanged full access where previously allowed.
- **Student:** live-session join/token flows unchanged; curriculum read gated by enrollment.
- **Teacher:** batch membership via `batch_teachers`; review access via **test_batches ∩ batch_students ∩ batch_teachers** triple alignment.

## Files changed

| File | Change |
|------|--------|
| `common/services/batch-access.service.ts` | **NEW** — central asserts |
| `common/services/batch-access.service.spec.ts` | **NEW** — unit tests |
| `common/services/batch-access.service.mock.ts` | **NEW** — test mock |
| `app.module.ts` | Register/export `BatchAccessService` |
| `modules/batches/batches.service.ts` | Delegate to `BatchAccessService`; scope `getTeachers`/`getSessions` |
| `modules/batches/batches.controller.ts` | Pass `CurrentUser` to teachers/sessions |
| `modules/batches/batches.authorization.spec.ts` | **NEW** |
| `modules/batch-curriculum/batch-curriculum.service.ts` | Caller checks on all mutations/reads |
| `modules/batch-curriculum/batch-curriculum.controller.ts` | Pass `@CurrentUser()` |
| `modules/batch-curriculum/batch-curriculum.authorization.spec.ts` | **NEW** |
| `modules/live-sessions/live-sessions.service.ts` | Teacher scoping on `findAll`/`findById` |
| `modules/live-sessions/live-sessions.controller.ts` | Pass requester to `findAll` |
| `modules/evaluation/evaluation.service.ts` | Queue filter + mutation guards |
| `modules/evaluation/evaluation.controller.ts` | Pass `CurrentUser` |
| `modules/users/users.service.ts` | Teacher profile gate on `findById` |
| `modules/users/users.controller.ts` | Pass `CurrentUser` |
| Multiple `*.spec.ts` | Provide `BatchAccessService` mock |

## Before / after behavior

| Action | Before | After |
|--------|--------|-------|
| Teacher `GET /batches/:foreignId` | 200 (if only list scoped) | **403** |
| Teacher `GET admin/batch-curriculum/:foreignBatchId` | 200 | **403** |
| Student `GET /batches/:foreignId/curriculum` | 200 | **404** |
| Teacher `GET /live-sessions` | All sessions | Only sessions linked to assigned batches |
| Teacher `GET /live-sessions/:foreignId` | Full session | **403** if no batch overlap |
| Teacher `GET /evaluation/review-queue` | Global queue | Filtered by batch/test/student alignment |
| Teacher `GET /users/:strangerId` | Full profile | **403** unless shared batch |
| Admin | Full access | **Unchanged** |
| Student join live session | Token + enrollment | **Unchanged** |

## Tests added / run

**P0-1 targeted (executed 2026-11-24, `apps/api`):**

```text
pnpm test -- --testPathPatterns="batch-access|batches.authorization|batch-curriculum.authorization"
→ Test Suites: 3 passed, 3 total | Tests: 8 passed, 8 total
```

**Regression subset (executed 2026-11-24):**

```text
pnpm test -- --testPathPatterns="batch-access|batches\\.|batch-curriculum|evaluation|live-sessions|users\\.service" --testPathIgnorePatterns="supabase-rls"
→ Test Suites: 9 passed, 9 total | Tests: 76 passed, 76 total
```

**Full API unit suite (executed 2026-11-24):**

```text
pnpm test
→ Test Suites: 46 passed, 46 total | Tests: 525 passed, 525 total
```

**Not used as production security proof:**

- E2E / Playwright — not run.
- Manual penetration testing — not run.
- RLS policy verification against live Supabase — separate from app-layer checks.

## Task G — Regression scan (teacher-facing ID parameters)

Searched `@Roles(.*TEACHER` controllers and routes accepting `batchId`, `sessionId`, `userId`, etc.

**Hardened in P0-1:** `batches`, `batch-curriculum`, `live-sessions` (list/detail for teachers), `evaluation` (review queue + mutations), `users.findById`.

**Out of scope — still `@Roles(TEACHER)` without `BatchAccessService`:**

| Module | Example routes / params | Parent resource to enforce |
|--------|---------------------------|----------------------------|
| `courses.controller` | Teacher list/read course | Course ↔ batch linkage if teacher-only |
| `recordings.controller` | `GET recordings/batch/:batchId`, assign/remove `batchIds` | `assertTeacherBatchAccess` per batch |
| `tests.controller` / `admin-tests` | CRUD + `?batchId=` | `test_batches` ∩ `batch_teachers` |
| `questions.controller` | Test-question CRUD | Via owning test → batch |
| `attendance.controller` | `GET session/:sessionId`, `GET student/:userId`, `?batchId=` | Session → batch; student → shared batch |
| `results.controller` | `?batchId=`, `GET student/:userId/analytics` | Batch teacher assignment |
| `curriculum-progress.controller` | Batch progress reads | `assertBatchReadAccess` |
| `videos.controller` | Teacher playback/admin paths | Recording batch links |
| `observability.controller` | Metrics ingest (TEACHER) | Low sensitivity; audit if PII |

**Note:** `PATCH admin/batch-curriculum/:batchId/reorder-categories` is **ADMIN-only** (not teacher).

**Frontend:** public certificate verify — P0-5 backlog per audit.

## Role behavior changes

- **Teacher:** Narrower data plane; attempts to use foreign UUIDs receive **403** (or **404** for student-style curriculum hide).
- **Student:** Curriculum only for enrolled batches; live join unchanged.
- **Admin:** No intentional restriction.

## Recommended next task

**P0-3** — Admin UI to assign teachers (`POST /batches/:id/teachers`) so authorization can be exercised in production.

---

**Implementation verdict:** **CONDITIONAL PASS** — acceptance unit tests pass; full-suite and E2E not complete; out-of-scope teacher endpoints remain.