# 07 — Security and quality

## TypeScript

| App | Config | Strictness | Classification |
|-----|--------|------------|----------------|
| Web | `apps/web/tsconfig.json` `strict: true` | Full strict | VERIFIED WORKING |
| API | `apps/api/tsconfig.json` | `strictNullChecks`, `noImplicitAny`; not full `strict` | PARTIALLY IMPLEMENTED |
| Web lint | No `lint` script in `apps/web/package.json` | — | NOT IMPLEMENTED |

## API validation

| Item | Evidence | Classification |
|------|----------|----------------|
| Global ValidationPipe | `main.ts` whitelist + forbidNonWhitelisted + transform | VERIFIED WORKING |
| DTOs per module | `dto/*.ts` with class-validator | VERIFIED WORKING |

## RBAC

| Layer | Mechanism | Classification |
|-------|-----------|----------------|
| API | `JwtAuthGuard`, `RolesGuard`, `@Roles()` | VERIFIED WORKING |
| API ownership | Inconsistent for `TEACHER` — see `02-teacher-portal-audit.md` | DEFECT |
| Web | Cookie JWT decode in middleware (`middleware-guard.ts`) | VERIFIED WORKING |
| Web | Not cryptographic verification in middleware (relies on API) | IMPLEMENTED BUT UNVERIFIED — standard pattern if API validates all mutations |

## Database RLS

| Item | Evidence | Classification |
|------|----------|----------------|
| RLS on app tables | Migrations e.g. `013-assessment-engine.sql` §13 | VERIFIED WORKING |
| API bypass | Service role key | VERIFIED WORKING |
| Implication | **Every** sensitive query must enforce authorization in Nest | VERIFIED WORKING (documented in `supabase.service.ts`) |
| `supabase-rls.spec.ts` | Documents RLS disabled behavior | IMPLEMENTED BUT UNVERIFIED |

## Error handling

| Item | Evidence | Classification |
|------|----------|----------------|
| HttpExceptionFilter global | `PROJECT_CONTEXT` / app.module pattern | VERIFIED WORKING |
| Student session hide existence | `live-sessions.service.ts` NotFound on failed student access L392–394 | VERIFIED WORKING |

## Input sanitization

| Item | Evidence | Classification |
|------|----------|----------------|
| DTO whitelist | ValidationPipe | VERIFIED WORKING |
| Search `like-escape.util` | Unit spec exists | VERIFIED WORKING |

## File access security

| Item | Evidence | Classification |
|------|----------|----------------|
| Recording playback | `playback-guard.service.ts` | U |
| Upload path isolation | `uploads.controller.ts` user-scoped paths | VERIFIED WORKING |
| Curriculum student access | `GET batches/:batchId/curriculum` — **no** enrollment check in `BatchCurriculumService` | DEFECT (IDOR risk) |

## Logging and secrets

| Item | Evidence | Classification |
|------|----------|----------------|
| Nest Logger usage | widespread | VERIFIED WORKING |
| Env secrets | `.env.example` placeholders only in audit | VERIFIED WORKING |
| No secrets in audit output | — | VERIFIED WORKING |

## Test coverage

| Type | Count / scope | Classification |
|------|---------------|----------------|
| API Jest specs | 43 files under `apps/api/src/**/*.spec.ts` | U |
| E2E Playwright | 24 specs; heavy on recordings + assessments | U |
| Teacher portal E2E | None | NOT IMPLEMENTED |
| Teacher batch scoping unit tests | None after service change | NOT IMPLEMENTED |
| Auth E2E | `tests/e2e/auth/logout-pending.spec.ts` | U |

## Security defects summary (priority)

| ID | Finding | Severity |
|----|---------|----------|
| SEC-1 | Teacher/global API access without `batch_teachers` | High |
| SEC-2 | Curriculum published endpoint lacks student batch check | High |
| SEC-3 | `GET /users/:id` for any user as teacher | Medium |
| SEC-4 | Review queue shows all pending items to any teacher | Medium |
| SEC-5 | `/verify-certificate` not public in middleware | Low–Medium |