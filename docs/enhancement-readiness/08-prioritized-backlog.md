# 08 — Prioritized backlog

Ordered for **reliable** completion of the four enhancement themes. Each item has acceptance criteria.

## P0 — Stabilize teacher foundation (before Phases 2–4)

### P0-1 Teacher resource authorization pass

**Classification addressed:** DEFECT (multiple modules)

**Work:**

- Introduce shared helper e.g. `TeacherBatchAccessService.assert(batchId, userId)` used by:
  - `BatchCurriculumController` / service (all mutating routes + student published read)
  - `live-sessions.service.ts` `findAll` / `findById` for role `teacher`
  - `batches.controller.ts` `getTeachers`, `getSessions`
  - `evaluation.service.ts` `getReviewQueue` — filter to tests/batches linked to teacher (design: via batch_tests or attempt batch intersection)
- Optional: restrict `GET /users/:id` for teachers to students in their batches only

**Acceptance criteria:**

1. Teacher JWT cannot `GET /batches/:foreignId` → **403**
2. Teacher cannot `POST admin/batch-curriculum/:foreignBatchId` → **403**
3. Teacher `GET /live-sessions` returns only sessions linked to at least one assigned batch
4. Student `GET /batches/:foreignId/curriculum` → **403** or empty/not found
5. Unit tests in `batches.service.spec.ts` + at least one curriculum or live-session spec cover teacher deny path

**Evidence baseline:** `02-teacher-portal-audit.md`, `07-security-and-quality.md` SEC-1/SEC-2

---

### P0-2 Commit and verify teacher portal MVP

**Classification:** PARTIALLY IMPLEMENTED (uncommitted)

**Work:** Commit current `apps/web/src/app/teacher/*`, `TeacherSidebar`, `ReviewQueueView`, batch scoping changes; run `pnpm build` + smoke login as teacher.

**Acceptance criteria:**

1. Teacher login lands on `/teacher` (`useSession.ts`)
2. Dashboard lists only assigned batches (API scoped)
3. Review queue renders and assign/submit works against API
4. No regressions on admin review queue page

---

### P0-3 Admin assign teachers UI

**Classification:** NOT IMPLEMENTED (API exists, UI missing)

**Evidence:** `POST /batches/:id/teachers` in `batches.controller.ts` L90; no web API client.

**Acceptance criteria:**

1. Admin batch detail can search users with `role=teacher` and assign
2. `teacherCount` updates after assign
3. Assigned teacher sees batch in `/teacher/batches`

---

### P0-4 Teacher Phase 1b UI

**Acceptance criteria:**

1. `/teacher/batches/[id]` includes read-only curriculum (reuse admin curriculum component)
2. `/teacher/live-sessions` lists scoped sessions; host can open session detail (no student join token required for host — may need new API)
3. Mobile: bottom nav or responsive sidebar for teacher layout

---

### P0-5 Public certificate verify route

**Acceptance criteria:**

1. Add `/verify-certificate` to `PUBLIC_ROUTES` in `permissions.ts`
2. Unauthenticated user can open page and call verify API (if API is public or uses `@Public()`)

---

## P1 — Document library

### P1-1 Migration 040 + `documents` module + admin UI

See `04-document-library-readiness.md`.

**Acceptance criteria:**

1. Upload PDF to Supabase Storage with metadata
2. Assign to batches; student in batch can download via signed URL; other students 403
3. Teacher can upload only to assigned batches (uses P0-1 helper)

---

## P2 — Public webinars

### P2-1 Migration 041 + `public-webinars` module

See `05-public-webinar-readiness.md`.

**Acceptance criteria:**

1. `PUBLIC_ROUTES` includes `/webinar`
2. Published webinar landing + register without login
3. Rate-limited registration; data in `public_webinar_registrations`
4. Does not alter batch `live_sessions` entitlement logic

---

## P3 — Razorpay

### P3-1 Feature-flagged Razorpay layer

See `06-razorpay-readiness.md`.

**Acceptance criteria:**

1. `RAZORPAY_ENABLED=false` hides all link UI
2. Webhook verifies signature with raw body; idempotent event table
3. Installment marked paid only after verified webhook
4. No secrets logged; env documented in `.env.example`

---

## Recommended implementation order (summary)

1. **P0-1** Teacher authorization pass  
2. **P0-2** Commit + verify teacher MVP  
3. **P0-3** Admin assign teachers  
4. **P0-5** Certificate public route  
5. **P0-4** Teacher 1b UI  
6. **P1-1** Document library  
7. **P2-1** Public webinars  
8. **P3-1** Razorpay  

---

## Exact next task (start here)

**Task:** **P0-1 Teacher resource authorization pass** (backend-first, with unit tests)

**Why:** Teacher role is already granted on many controllers; frontend portal expansion without backend fixes increases IDOR and data-leak risk.

**Done when:** All five acceptance criteria under P0-1 pass in local dev with a teacher user assigned to one batch only.