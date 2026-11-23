# Test evidence

## Backend

```text
pnpm test -- --testPathPatterns="security-integration-p0-3|p0-1b|batches.authorization|batches.teacher-assignment"
# (run as part of full suite)

pnpm test
→ Test Suites: 49 passed, 49 total | Tests: 537 passed, 537 total
```

Phase A file: `apps/api/src/common/services/security-integration-p0-3.spec.ts`

P0-3 assignment: `apps/api/src/modules/batches/batches.teacher-assignment.spec.ts`

## Frontend

```text
cd apps/web && pnpm exec tsc --noEmit
→ pass (after Batch type + Modal prop fixes)

cd apps/web && pnpm build
→ pass (Next.js 14.2.35)
```

## E2E

Playwright not executed — no automated browser evidence in this environment. Manual smoke recommended: admin assign/remove teacher, teacher batch tabs, mobile nav.

## Skipped

- Live Supabase RLS integration.
- Playwright teacher flows.