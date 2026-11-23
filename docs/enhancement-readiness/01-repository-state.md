# 01 — Repository state

## Git

| Item | Evidence | Classification |
|------|----------|----------------|
| Git root | `lms-platform/` (`git status` succeeds); parent `mctlms/` is **not** a git repo | VERIFIED WORKING |
| Branch | `main` tracking `origin/main` | VERIFIED WORKING |
| Uncommitted work (2026-03-23) | Modified: `batches.controller.ts`, `batches.service.ts`, `useSession.ts`, `constants.ts`, `admin/review-queue/page.tsx`; Untracked: `apps/web/src/app/teacher/`, `TeacherSidebar.tsx`, `components/features/assessments/`, `docs/legacy-porting-roadmap.md` | VERIFIED WORKING |

## Architecture

| Layer | Technology | Evidence |
|-------|------------|----------|
| Monorepo | pnpm workspaces | `lms-platform/package.json`, `pnpm-workspace.yaml` |
| Frontend | Next.js 14 App Router, React 18, Tailwind, Zustand | `apps/web/package.json`, `apps/web/src/app/**` |
| Backend | NestJS 10, class-validator DTOs | `apps/api/package.json`, `apps/api/src/main.ts` |
| Database | Supabase PostgreSQL | `scripts/schema.sql`, `SupabaseService` (`apps/api/src/common/services/supabase.service.ts`) |
| Cache / sessions | Redis (ioredis) | `docker-compose.yml`, auth session validation |
| Video | Bunny (primary), Mux (rollback) | `apps/api/.env.example` VIDEO_UPLOAD_PROVIDER, `video-provider/` |
| Live video | Zoom Server-to-Server + SDK | `zoom.module.ts`, `live-sessions.service.ts` |
| Email | Resend | `apps/api/.env.example` RESEND_* |
| Deploy (documented) | Vercel (web), Render (API implied in docs) | `vercel.json` (framework: nextjs), `docs/deployment.md` |

## Documentation on disk

| Document | Path |
|----------|------|
| Architecture / API / deploy | `docs/architecture.md`, `docs/api-reference.md`, `docs/deployment.md` |
| Legacy porting roadmap | `docs/legacy-porting-roadmap.md` (uncommitted) |
| Many RCCF phase reports | `docs/rccf-*.md` |

**Note:** `docs/legacy-porting-roadmap.md` still states teacher routes were missing; code now has `/teacher` (uncommitted) — roadmap is **stale** relative to working tree.

## Scripts (lint, typecheck, test, build)

| Script | Location | Classification |
|--------|----------|----------------|
| `pnpm build` | Root → recursive build | IMPLEMENTED BUT UNVERIFIED (not run in this audit) |
| `pnpm lint` | Root → recursive | API: `eslint` in `apps/api/package.json`; **Web has no lint script** | PARTIALLY IMPLEMENTED |
| Typecheck | Via `next build` / `nest build` (no dedicated `typecheck` script) | PARTIALLY IMPLEMENTED |
| API unit tests | `pnpm --filter @lms/api test` → Jest | IMPLEMENTED BUT UNVERIFIED |
| E2E | `pnpm test:e2e` → Playwright `tests/e2e/playwright.config.ts` | IMPLEMENTED BUT UNVERIFIED |
| DB repair | `scripts/repair-batch-links.js` | VERIFIED WORKING (script exists) |

## Project layout (core)

```
lms-platform/
├── apps/api/          # NestJS API
├── apps/web/          # Next.js UI
├── packages/shared-types/
├── scripts/           # schema.sql, migrations 004–039
├── tests/e2e/         # Playwright
└── docs/
```

## Environment

| Item | Classification |
|------|----------------|
| API template | `apps/api/.env.example` — Supabase, Redis, Zoom, Mux, Bunny, Resend | VERIFIED WORKING |
| Web local env | `apps/web/.env` present (not inspected for secrets) | BLOCKED BY MISSING ENVIRONMENT OR CREDENTIALS for production parity |
| Razorpay vars | Absent from `.env.example` | NOT IMPLEMENTED |