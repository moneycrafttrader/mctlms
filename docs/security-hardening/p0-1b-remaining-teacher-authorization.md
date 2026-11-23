# P0-1B — Remaining teacher authorization hardening

**Date:** 2026-11-24  
**Scope:** Backend API (extends P0-1 `BatchAccessService`).

## 1. Verified gaps (pre-fix)

| Module | Issue verified in tree |
|--------|------------------------|
| Recordings | Teacher `GET admin/recordings` listed all recordings; batch classroom paths lacked teacher batch gate |
| Tests | Teacher CRUD/list unscoped; multi-batch tests not enforced on write |
| Questions | Bank CRUD/view without parent-test or ownership checks |
| Attendance | Session/batch/student routes open to any teacher |
| Results | `GET results/test/:testId` analytics unscoped |
| Courses | Teacher could list/view any course and stats |
| Videos | `GET videos/batch/:batchId` lacked enrollment/assignment gate |
| Curriculum progress | Admin/self progress by `batchId` without `assertBatchReadAccess` |

P0-1 areas (batches, curriculum, live-sessions, evaluation, users) **re-verified** — still guarded.

## 2. Authorization strategy

Central **`BatchAccessService`** extended with:

- `assertTeacherBatchesAccess` — bulk batch validation (recordings/tests create paths)
- `getTeacherTestIds` / `assertTeacherTestReadAccess` / `assertTeacherTestWriteAccess` / `assertTeacherTestBatchAssignments`
- `getTeacherRecordingIds` / `assertTeacherRecordingAccess`
- `getTeacherCourseIds` / `assertTeacherCourseAccess`
- `assertTeacherCanViewQuestion` / `assertTeacherCanMutateQuestion` (via `test_question_bank` → test batch rules; unlinked questions: `created_by` only)
- `assertTeacherCanMarkAttendanceEntries` (session + enrolled students in teacher’s session batches)

**Multi-batch tests:** read if ≥1 shared batch; **write** only if teacher is assigned to **every** batch on the test.

## 3. Endpoints secured

| Module | Routes / methods |
|--------|------------------|
| **Recordings** | `admin/recordings`, `admin/topics/:id`, `videos/topics/:id`; `getBatchRecordings` (teacher/student/admin caller roles) |
| **Tests** | `POST/PATCH/DELETE tests/*`, `GET tests`, `GET admin/tests`, `GET tests/:id` |
| **Questions** | `GET/PATCH/DELETE/:id`, archive/unarchive |
| **Attendance** | `session/:sessionId`, `manual`, `student/:userId`, `batch/:batchId/report` |
| **Results** | `test/:testId`, `test/:testId/analytics` |
| **Courses** | `GET courses`, `GET :id`, `:id/batches`, `:id/stats` (teacher-scoped) |
| **Videos** | `GET videos/batch/:batchId` |
| **Curriculum progress** | `admin/batches/:batchId/progress`, `batches/:batchId/progress` |

Admin-only routes unchanged (e.g. `assignToBatches`, `results/student/:userId/analytics`, attendance CSV export).

## 4. Files changed

- `common/services/batch-access.service.ts` (+`.spec.ts`, `.mock.ts`)
- `common/services/p0-1b.authorization.spec.ts` **NEW**
- `modules/recordings/*`
- `modules/tests/*` (+ `admin-tests.controller.ts`)
- `modules/questions/*`
- `modules/attendance/*`
- `modules/results/*`
- `modules/courses/*`
- `modules/videos/*` (batch listing)
- `modules/curriculum-progress/*`
- Multiple `*.spec.ts` (BatchAccessService mock)

## 5. Tests and results

**Focused (2026-11-24):**

```text
pnpm test -- --testPathPatterns="p0-1b.authorization|batch-access.service.spec"
→ 2 suites, 10 tests, PASS
```

**Full API suite (2026-11-24):**

```text
pnpm test
→ Test Suites: 47 passed, 47 total | Tests: 531 passed, 531 total
```

Coverage includes: unassigned batch recordings, bulk batch reject, unauthorized test read, attendance batch report, test analytics, curriculum progress admin, bulk batch access unit test.

## 6. Remaining gaps & exceptions

| Item | Status |
|------|--------|
| `GET questions` list (global question bank) | **Documented exception** — shared authoring catalog; mutations gated per question |
| `GET videos/topics/:id` (legacy Mux library) | Global topic metadata; batch playback still gated at `getBatchVideos` / student play |
| `observability` metrics ingest | Low-sensitivity; not batch-scoped in this pass |
| `users` teacher list endpoints | Roster still via batch-scoped APIs (P0-1) |
| Teacher `GET recordings/batch/:batchId` | **Student-only route**; teachers use `GET videos/batch/:batchId` (now gated) |
| Student analytics `GET results/student/:userId/analytics` | **Admin-only** — teachers blocked by role, not IDOR |

## 7. Role behavior

- **Teacher:** Data plane limited to assigned batches (and derived tests/recordings/courses).
- **Student:** Enrollment checks unchanged; progress/curriculum reads use `assertBatchReadAccess`.
- **Admin:** Unchanged.

## 8. Integration / E2E recommendations

1. Teacher assigned to batch A only — confirm 403 on batch B curriculum, attendance, results, recordings list.
2. Test spanning batches A+B — teacher on A only can read but **cannot** PATCH (write requires both).
3. Manual attendance — student outside teacher session batches → 403.
4. Question linked only to foreign-batch test — PATCH question → 403.

---

**Verdict:** **CONDITIONAL PASS** — unit tests green; E2E/manual not run; documented global exceptions remain.