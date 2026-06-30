# CI — GitHub Actions

## Workflow

`.github/workflows/e2e-recordings.yml` triggers on:

- Push to `main` or `develop` (when `apps/api/`, `tests/e2e/`, or the workflow itself changes)
- Pull requests targeting `main`
- Manual trigger via `workflow_dispatch`

## Steps

1. Checkout repo
2. Install pnpm + Node.js 20
3. `pnpm install --frozen-lockfile`
4. `pnpm --filter @lms/api build`
5. Start Postgres 16 service container
6. Run DB migrations
7. Seed E2E test users
8. Install Playwright Chromium browser
9. Run tests: `pnpm exec playwright test --project=recordings-api`
10. Upload artifacts (traces, screenshots, HTML report)

## Environment Secrets

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for DB assertions |
| `E2E_ADMIN_EMAIL` | Admin test user email |
| `E2E_ADMIN_PASSWORD` | Admin test user password |
| `E2E_STUDENT_A_EMAIL` | Student A test user email |
| `E2E_STUDENT_A_PASSWORD` | Student A test user password |
| `E2E_STUDENT_B_EMAIL` | Student B test user email |
| `E2E_STUDENT_B_PASSWORD` | Student B test user password |

## CI Configuration

| Setting | Value |
|---------|-------|
| Runner | `ubuntu-22.04` |
| Timeout | 15 minutes |
| Retries | 2 |
| Workers | 2 |
| `fullyParallel` | `true` |
| Max failures | 5 (aborts early to save CI minutes) |

## Local CI Simulation

```bash
$env:CI='true'
pnpm exec playwright test --project=recordings-api
```

## Artifact Retention

- Test results (`test-results/`, `playwright-report/`): 7 days
- Playwright traces (only on failure): 14 days
