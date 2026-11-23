# 03 — Admin and student workflows

Workflow audit against existing routes (`apps/web/src/app/admin/**`, `student/**`) and Nest modules (`apps/api/src/modules/**`).

Legend: **V** = VERIFIED WORKING, **U** = IMPLEMENTED BUT UNVERIFIED, **P** = PARTIALLY IMPLEMENTED, **N** = NOT IMPLEMENTED, **D** = DEFECT

| Workflow | Admin UI | Student UI | API module(s) | Classification | Evidence / notes |
|----------|----------|------------|---------------|----------------|----------------|
| Authentication / login / logout / device | Login, change-password, reset-password | Same | `auth/` | **U** | `auth.controller.ts`, `useSession.ts`, device in login body |
| Role management (create teacher) | Students admin; role in `CreateUserDto` | — | `users/` | **P** | Admin create user; **no dedicated teacher management UI** |
| Admin dashboard | `/admin` | — | `analytics/` | **U** | `admin/page.tsx`, `analytics.service.ts` |
| Teacher management (assign to batch) | Shows `teacherCount` only | — | `batches` `POST :id/teachers` | **N** / **D** | `batch-detail-view.tsx` L182; **no** `lib/api` teacher assign helpers |
| Student management | `/admin/students`, `[id]` | Profile | `users/` | **U** | CRUD admin-only for write |
| Batch management | `/admin/batches`, `[id]` | Courses list | `batches/`, `courses/` | **U** | Curriculum tab in batch detail |
| Enrollment | add-student, bulk-upload | — | `bulk-upload/`, batches | **U** | `bulk-upload.service.ts` |
| Course management | `/admin/courses` | `/student/courses` | `courses/` | **U** | |
| Curriculum (recordings, tests, PDF in syllabus) | batch curriculum admin | student course/[id] | `batch-curriculum/` | **U** | PDF via `pdf_url` in curriculum service |
| Recordings / videos | `/admin/recordings` | `/student/videos` | `recordings/`, `video-provider/` | **U** | E2E: `tests/e2e/recordings/*` |
| Assessments | tests, questions, new, edit | tests attempt/result | `tests/`, `attempts/`, `questions/` | **U** | E2E: `tests/e2e/assessments/*` |
| Manual review / results | `/admin/review-queue` | `/student/results` | `evaluation/`, `results/` | **U** | |
| Payments / EMI | `/admin/payments`, finance | — (admin-recorded) | `payments/` | **U** | No student self-pay UI |
| GST invoices / receipts | finance, invoices module | — | `invoices/`, `pdf/` | **U** | Puppeteer per stack docs |
| Live sessions | `/admin/sessions` | live-sessions + join | `live-sessions/`, `zoom/` | **U** | Teacher cannot create in UI (admin only) |
| Attendance | sessions-related | — | `attendance/` | **P** | API exists; UI coverage not fully audited |
| Notifications | student bell | `/student/notifications` | `notifications/` | **U** | |
| Announcements | `/admin/announcements` | — | (module present) | **U** | |
| Audit / monitoring / email logs | audit-logs, monitoring, email-logs | — | `audit/`, `observability/`, `email-logs/` | **U** | |
| Certificates | — | achievements path | `achievements/` | **P** | `verify-certificate/page.tsx` exists |
| Certificate verify (public) | — | public page | certificates API | **D** | Not in `PUBLIC_ROUTES` (`permissions.ts`) |
| Reports / exports | CSV in attendance, bulk template | — | various | **P** | Not unified reporting portal |
| Trading sessions (legacy naming) | admin sessions copy | — | `trading-sessions/` stub | **P** | Module exists; product naming "Live Trading Sessions" |

## Teacher portal (cross-cutting)

| Workflow | Status |
|----------|--------|
| Teacher daily use (batches, grade, host class) | **P** — portal MVP uncommitted; no curriculum/live UI |
| Teacher isolation from admin data | **D** — API gaps (see `02-teacher-portal-audit.md`) |

## Student experience completeness

**Strengths (evidence):** Premium dashboard patterns (`student/dashboard-client.tsx`), playback progress, live join flow, assessment attempt/result pages, mobile bottom nav (`StudentBottomNav` in `student/layout.tsx`).

**Gaps:**

| Gap | Classification |
|-----|----------------|
| Dedicated document/resource hub (non-curriculum) | **N** |
| Self-serve online payment | **N** |
| Public webinar entry | **N** |