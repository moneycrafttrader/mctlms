# E2E Testing — Recordings Module

## Overview

The E2E suite tests the Recordings module via its HTTP API, verifying every endpoint against a live database. There are **11 test cases** across **7 spec files**, covering the full user journey: upload, assign, curriculum, playback, progress, authorization, cleanup, and regression.

## Architecture

```
tests/e2e/
├── playwright.config.ts        # Playwright configuration
├── fixtures/
│   └── recordings-fixture.ts    # Extended test fixtures (auth, db, seed)
├── recordings/
│   ├── upload.spec.ts           # Test 1: Recording upload
│   ├── assignment.spec.ts      # Tests 2, 3, 7: Batch assignment
│   ├── curriculum.spec.ts      # Test 4: Curriculum customization
│   ├── playback.spec.ts        # Test 5a: Playback URL
│   ├── authorization.spec.ts   # Test 5b: Authorization edge cases
│   ├── progress.spec.ts        # Test 6: Playback progress
│   └── cleanup.spec.ts         # Tests 8, 9, 10: Deletion & concurrency
└── utils/
    ├── assertions.ts            # Response assertion helpers
    ├── counter.ts               # Deterministic unique counter
    ├── db-helpers.ts            # Supabase query helpers
    ├── factories.ts             # DTO factories with unique names
    ├── login-helpers.ts         # Authentication helpers
    └── seed.ts                  # Test data seeding & cleanup
```

## Fixture Hierarchy

```
Worker scope (once per worker):
  workerDb     — Supabase service-role client (singleton)
  workerAuth   — 3 login tokens (admin, studentA, studentB)

Test scope (once per test):
  db           — alias to workerDb
  seed         — creates batches + topic + enrollments, cleans up
  adminToken   — → workerAuth.admin.token
  studentAToken— → workerAuth.studentA.token
  studentBToken— → workerAuth.studentB.token
  adminUserId  — → workerAuth.admin.userId
  studentAUserId— → workerAuth.studentA.userId
  studentBUserId— → workerAuth.studentB.userId
```

## Key Design Decisions

- **No browser/page interactions.** This is an API-only E2E suite using `APIRequestContext`. UI-layer tests belong in a separate Playwright project.
- **Pre-existing test users.** User profiles are NOT created by the test suite. They must exist in the database (Supabase Auth + `profiles` table) before tests run. Credentials come from environment variables.
- **Each test owns its data.** Every spec file creates its recording via `beforeEach` or inline, and cleans up in `afterEach`. No test depends on data created by another test.
- **Deterministic unique names.** Factories use a global sequential counter to produce names like `E2E-Recording-001`, `E2E-Batch-A-003`. This ensures traceability in CI artifacts.
- **Assert all three layers.** Every test verifies API response status + `{ success: true }` wrapper + database state.
