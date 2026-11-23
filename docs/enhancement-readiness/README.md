# MCT LMS — Enhancement Readiness Audit (R1)

**Audit date:** 2026-03-23  
**Scope:** Read-only review of `lms-platform` (implementation target). Legacy `mct-lms` is reference-only.  
**Roadmap reference:** `docs/legacy-porting-roadmap.md`

## Executive summary

The new MCT LMS is a **mature monorepo** with strong coverage of admin and student flows (auth, batches, curriculum, recordings/Bunny, assessments, live Zoom sessions, finance/EMI, invoices, E2E tests). The platform is **production-shaped** but **not enhancement-complete** for the four priority initiatives.

**Overall readiness verdict:** **CONDITIONALLY READY** — safe to continue enhancement work after closing **authorization gaps** for the teacher role and committing the in-progress teacher portal.

| Priority | Readiness | Summary |
|----------|-----------|---------|
| 1. Teacher portal | **PARTIALLY IMPLEMENTED** | UI shell exists (uncommitted); backend RBAC is broad; batch list/detail scoped; many TEACHER APIs lack resource ownership |
| 2. Document library | **NOT IMPLEMENTED** | Supabase `uploads` bucket + question/PDF upload only; no document entity or hub |
| 3. Public webinars | **NOT IMPLEMENTED** | Batch `live_sessions` only; no public routes or registration tables |
| 4. Razorpay | **NOT IMPLEMENTED** | Offline/EMI finance exists; no Razorpay code or env in API |

## What is already working (high confidence)

- **Admin + student** Next.js App Router portals with middleware RBAC (`apps/web/src/lib/guards/middleware-guard.ts`, `permissions.ts`)
- **NestJS global** JWT + roles guards, DTO validation (`apps/api/src/main.ts` ValidationPipe)
- **Assessments** (tests, attempts, review queue API, admin UI)
- **Recordings** (Bunny/Mux providers, curriculum, playback guard, extensive E2E under `tests/e2e/recordings/`)
- **Live sessions** for batch students (join tokens, Zoom integration)
- **Payments** (payment plans, installments, manual mark-paid) — `payments.service.ts`, schema §2.7
- **43 API unit spec files**; **24 Playwright E2E** specs (recordings + assessments heavy)

## Critical before expanding teacher / public features

1. **DEFECT:** Teachers can call many `@Roles(TEACHER)` endpoints without `batch_teachers` checks (curriculum mutate, global live-session list, review queue globally, `GET /users/:id` for any profile).
2. **DEFECT:** `GET /live-sessions` and `findById` for teachers return **all** sessions, not teacher-scoped (`live-sessions.service.ts` L410–423).
3. **PARTIALLY IMPLEMENTED:** Admin UI shows `teacherCount` but **no web API helpers** to assign teachers to batches (`grep` teachers in `apps/web/src/lib/api` → no matches).
4. **DEFECT:** `/verify-certificate` is not in `PUBLIC_ROUTES` (`permissions.ts` L11–18) — unauthenticated users may be redirected to login.

## Recommended implementation order

1. **Complete Phase 1b + authorization hardening** (teacher portal + backend ownership checks + tests)
2. Document library (migration 040 + module)
3. Public webinars (migration 041 + public routes)
4. Razorpay (migration 042 + webhook pattern like Zoom)

## Next implementation task

See **`08-prioritized-backlog.md`** — item **P0-1**: Teacher resource authorization pass + admin assign-teachers UI.

## Document index

| File | Topic |
|------|--------|
| `01-repository-state.md` | Git, architecture, scripts |
| `02-teacher-portal-audit.md` | Teacher UI + API scoping |
| `03-admin-student-workflows.md` | Workflow coverage matrix |
| `04-document-library-readiness.md` | Storage + schema readiness |
| `05-public-webinar-readiness.md` | live_sessions vs public webinars |
| `06-razorpay-readiness.md` | Payments + webhook patterns |
| `07-security-and-quality.md` | RBAC, RLS, tests, TS |
| `08-prioritized-backlog.md` | Ordered backlog with acceptance criteria |