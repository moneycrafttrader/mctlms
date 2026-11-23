# 05 — Public webinar readiness

**Do not create migration 041 in this audit.**

## Existing batch live sessions (not public marketing webinars)

| Item | Evidence | Classification |
|------|----------|----------------|
| Table | `live_sessions` in `scripts/schema.sql` §2.9 | VERIFIED WORKING |
| Zoom fields | `zoom_webinar_id`, `zoom_webinar_join_url` | VERIFIED WORKING |
| Batch linkage | `session_batches`, `session_registrants` | VERIFIED WORKING |
| Creation | Admin-only `POST /live-sessions` | VERIFIED WORKING (`live-sessions.controller.ts` L38–41) |
| Student join | `request-join`, `join` with tokens | VERIFIED WORKING |
| Attendance | `webinar_attendance` in schema | VERIFIED WORKING |

## Public route conventions

| Item | Evidence | Classification |
|------|----------|----------------|
| `PUBLIC_ROUTES` | `apps/web/src/lib/guards/permissions.ts` L11–18 — login, password, static, `/api` only | VERIFIED WORKING |
| Public webinar paths | No `/webinar` in PUBLIC_ROUTES | NOT IMPLEMENTED |
| Legacy reference UI | Old repo: `WebinarLanding`, `WebinarJoin` (not in new repo) | NOT IMPLEMENTED |

## Registration / attendee workflows

| Flow | New LMS | Classification |
|------|---------|----------------|
| Batch student Zoom registrants on session create | `live-sessions.service.ts` registration loop | VERIFIED WORKING |
| Public email capture + `public_webinar_registrations` | No table | NOT IMPLEMENTED |
| Unauthenticated landing page | No Next route | NOT IMPLEMENTED |

## Video meeting integrations

| Integration | Evidence | Classification |
|-------------|----------|----------------|
| Zoom webinar create | `ZoomService.createWebinar` via `live-sessions.service.ts` | VERIFIED WORKING |
| Zoom webhook | `zoom.controller.ts` `@Public()` webhook | VERIFIED WORKING |
| Zoom SDK signature | `POST /zoom/signature` with batch access check | VERIFIED WORKING |
| Separate Zoom app for marketing webinars | Not distinguished in schema | NOT IMPLEMENTED |

## Teacher vs public confusion risk

`live-sessions.service.ts` L410–423: **teachers** receive full session detail like admins (no batch_teacher filter). Public webinar work must use **separate** tables/routes to avoid breaking batch entitlement logic (roadmap agrees).

## Readiness verdict

| Dimension | Verdict |
|-----------|---------|
| Zoom technical foundation | **READY** |
| Public UX + data model | **NOT READY** |
| Rate limiting on public register | **NOT IMPLEMENTED** (reference: old Express rate limit only on auth) |

## Reference (legacy only)

- `mct-lms/backend/src/models/webinars.model.js`
- `mct-lms/backend/src/controllers/webinar.controller.js`
- `mct-lms/frontend/src/pages/public/WebinarLanding.tsx`