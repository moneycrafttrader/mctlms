# Fixtures

## Pattern

Playwright fixtures are split into **worker-scoped** (shared across all tests in a worker) and **test-scoped** (created fresh per test).

### Worker-Scoped

| Fixture | Scope | Description |
|---------|-------|-------------|
| `workerDb` | worker | Singleton Supabase client with service-role key. Created once per worker. |
| `workerAuth` | worker | Logs in 3 users (admin, studentA, studentB) once per worker. Caches tokens and user IDs. |

### Test-Scoped

| Fixture | Scope | Description |
|---------|-------|-------------|
| `db` | test | Alias for `workerDb`. |
| `seed` | test | Calls `seedTestData()` to create 2 batches + 1 topic + enrollments. Calls `teardownTestData()` in cleanup. |
| `adminToken`/`adminUserId` | test | Delegates to `workerAuth.admin`. |
| `studentAToken`/`studentAUserId` | test | Delegates to `workerAuth.studentA`. |
| `studentBToken`/`studentBUserId` | test | Delegates to `workerAuth.studentB`. |

## Usage in Tests

```typescript
import { test, expect } from '../fixtures/recordings-fixture';

test('my test', async ({ request, adminToken, seed, db }) => {
  // request  — Playwright built-in APIRequestContext
  // adminToken — Bearer token for admin user
  // seed      — { batchAId, batchBId, topicId }
  // db        — Supabase client for direct DB assertions
});
```

## Adding New Fixtures

1. Add the type to `TestFixtures` interface
2. Implement the fixture in `base.extend<>()`
3. Use `{ scope: 'worker' }` for expensive setup (auth, DB connections)
4. Default scope is `'test'` — use for data that must be isolated per test

## Important

- Never store tokens or user IDs in test variables shared across `describe` blocks within a file. Use fixture delegation instead.
- The `workerAuth` fixture logs in via `POST /auth/login`. If tokens expire during a long test run, they'll fail. Token lifetime must exceed the total worker duration.
