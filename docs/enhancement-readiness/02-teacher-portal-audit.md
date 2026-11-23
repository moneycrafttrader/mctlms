# 02 — Teacher portal audit

## Frontend routes and layout

| Item | Evidence | Classification |
|------|----------|----------------|
| `/teacher` routes exist | `apps/web/src/app/teacher/page.tsx`, `layout.tsx`, `batches/`, `review-queue/` | PARTIALLY IMPLEMENTED (uncommitted) |
| Layout + sidebar | `teacher/layout.tsx`, `TeacherSidebar.tsx` | PARTIALLY IMPLEMENTED |
| Desktop sidebar only | No `StudentBottomNav` equivalent in teacher layout | NOT IMPLEMENTED (mobile nav) |
| Dashboard | Lists batches via `getAllBatches()` | IMPLEMENTED BUT UNVERIFIED |
| Batch list | `teacher/batches/page.tsx` | IMPLEMENTED BUT UNVERIFIED |
| Batch roster | `teacher/batches/[id]/page.tsx` → `getBatch`, `getBatchStudents` | PARTIALLY IMPLEMENTED |
| Curriculum UI | No teacher curriculum pages | NOT IMPLEMENTED |
| Live sessions UI | No `teacher/live-sessions` | NOT IMPLEMENTED |
| Review queue | `teacher/review-queue/page.tsx` → shared `ReviewQueueView` | IMPLEMENTED BUT UNVERIFIED |
| Admin review queue refactor | `components/features/assessments/review-queue-view.tsx` | IMPLEMENTED BUT UNVERIFIED |

## Login, redirects, role handling

| Item | Evidence | Classification |
|------|----------|----------------|
| Middleware teacher home | `middleware-guard.ts` L70–71 → `/teacher` | VERIFIED WORKING |
| `ROLE_ROUTES` includes teacher | `permissions.ts` L8 | VERIFIED WORKING |
| Client guard cross-role redirect | `client-guard.tsx` L32–33 | VERIFIED WORKING |
| Post-login redirect | `useSession.ts` — `user.role === 'teacher'` → `ROUTES.TEACHER.HOME` (modified, uncommitted) | IMPLEMENTED BUT UNVERIFIED |
| `ROUTES.TEACHER` | `constants.ts` HOME, BATCHES, REVIEW_QUEUE | PARTIALLY IMPLEMENTED |

## Backend: `batch_teachers` scoping

Schema: `scripts/schema.sql` L135–143 `batch_teachers(batch_id, user_id)`.

| Endpoint / behavior | Teacher scoping | Evidence | Classification |
|--------------------|-----------------|----------|----------------|
| `GET /batches` | Filters via `batch_teachers` when role teacher | `batches.service.ts` `findAll(..., teacherId)`, `batches.controller.ts` L33 | IMPLEMENTED BUT UNVERIFIED (no spec updates in `batches.service.spec.ts`) |
| `GET /batches/:id` | `assertTeacherBatchAccess` | `batches.service.ts` L89–108 | IMPLEMENTED BUT UNVERIFIED |
| `GET /batches/:id/students` | Same assert | `batches.service.ts` L373–374 | IMPLEMENTED BUT UNVERIFIED |
| `GET /batches/:id/teachers` | **No** assert | `batches.controller.ts` L116 | DEFECT |
| `GET /batches/:id/sessions` | **No** assert | `batches.controller.ts` L117–119 | DEFECT |
| `POST /batches/:id/teachers` | Admin only | `batches.controller.ts` L90–93 | VERIFIED WORKING |

## Backend: TEACHER role without batch ownership (authorization relies on role only)

| Module | Evidence | Classification |
|--------|----------|----------------|
| Batch curriculum read/write | `batch-curriculum.controller.ts` — all TEACHER routes; **no** `assertTeacherBatchAccess` in `BatchCurriculumService` | DEFECT |
| Review queue | `evaluation.service.ts` `getReviewQueue()` — no batch/teacher filter L290–318 | DEFECT |
| Live sessions list | `live-sessions.controller.ts` L44–57 `findAll` for ADMIN+TEACHER; service returns all sessions L279+ | DEFECT |
| Live sessions detail | `live-sessions.service.ts` L410–423 — teacher same as admin (all batches) | DEFECT |
| Live session create | Admin only L38–41 | VERIFIED WORKING (teacher cannot create via API) |
| Live session join | Student only (`request-join`, `join`) | NOT IMPLEMENTED for teacher host join |
| Courses CRUD/list | `courses.controller.ts` TEACHER on several routes; `courses.service.ts` `findAll` — no teacher filter | DEFECT (data leakage) |
| Users `GET /users/:id` | Any user by ID for teacher L77–80 | DEFECT (privacy) |
| Recordings / tests / questions | `@Roles(TEACHER)` widespread; no unified batch ownership helper in recordings module (grep: no `assertTeacher`) | PARTIALLY IMPLEMENTED / DEFECT |
| Tests publish / analytics | Analytics admin-only in `evaluation.controller.ts` L61–64 | VERIFIED WORKING |

## Unauthorized access handling

| Layer | Behavior | Classification |
|-------|----------|----------------|
| API | `ForbiddenException` on batch IDOR for findById/students (new code) | IMPLEMENTED BUT UNVERIFIED |
| API | Nest `RolesGuard` + JWT globally | VERIFIED WORKING (`app.module.ts` pattern) |
| Frontend | Hiding admin nav is **not** security; teacher could still call admin API routes if permitted | DEFECT where API allows TEACHER globally |
| RLS | Backend uses **service role** (bypasses RLS) — **all** authorization must be in Nest services | VERIFIED WORKING (`supabase.service.ts` L7–8) |

## Comparison to roadmap Phase 1 / 1b

| Roadmap item | Status |
|--------------|--------|
| Teacher login → `/teacher` | IMPLEMENTED BUT UNVERIFIED (uncommitted) |
| Scoped batch list | IMPLEMENTED BUT UNVERIFIED |
| Review queue shared UI | IMPLEMENTED BUT UNVERIFIED |
| Curriculum tab for teacher | NOT IMPLEMENTED |
| Teacher live sessions | NOT IMPLEMENTED |
| Mobile navigation | NOT IMPLEMENTED |

## Tests

| Area | Evidence | Classification |
|------|----------|----------------|
| Teacher batch scoping unit tests | No matches for `teacher`/`assertTeacher` in `batches.service.spec.ts` | NOT IMPLEMENTED |
| Teacher E2E | No `tests/e2e/**/teacher*` | NOT IMPLEMENTED |