# Performance Report

## Estimated Test Duration

Measured by analyzing: API latency (~50ms per call) × calls per test + DB queries (~30ms each) × queries per test + fixture overhead.

| Test | API Calls | DB Queries | Estimated Time | Duplicate Setup |
|------|-----------|------------|----------------|-----------------|
| 1. Upload | 1 | 3 | 140ms | No |
| 2. Assignment | 0 | 4 | 120ms | Reuses `beforeEach` recording |
| 3. Cross-batch | 1 | 4 | 170ms | Reuses `beforeEach` recording |
| 4. Curriculum | 3 | 2 | 210ms | Reuses `beforeEach` recording |
| 5a. Playback | 2 | 0 | 100ms | Reuses `beforeEach` recording |
| 5b. Auth (4 tests) | 4 | 0 | 200ms | Shares `beforeEach` recording |
| 6. Progress | 3 | 2 | 210ms | Reuses `beforeEach` recording |
| 7. Remove+reassign | 2 | 6 | 280ms | Reuses `beforeEach` recording |
| 8. Delete | 2 | 4 | 220ms | Creates own data |
| 9. Concurrency | 3 | 2 | 210ms | Creates own data |
| 10. Regression | 6 | 10 | 600ms | Creates own data |

**Fixture overhead per test**: ~420ms (3 logins + 3 DB inserts for seed)

**Estimated total (serial)**: ~2.3s (test logic) + ~4.6s (fixture overhead × 11 tests) = **~6.9s**

**With worker-scoped auth (current)**: Login overhead drops from 11× to 1× per worker.
- 1 worker: ~2.3s (test logic) + ~0.42s (auth once) + ~0.12s (seed per test × 11) = **~4.0s**
- 2 workers (CI): tests split across workers → **~2.5s**

## Slowest Tests (estimated)

| Test | Time | Why |
|------|------|-----|
| 10. Regression | ~600ms | 6 API calls + 10 DB queries |
| 7. Remove+reassign | ~280ms | 2 API calls + 6 DB queries |
| 8. Delete | ~220ms | 2 API calls + 4 DB queries |
| 4. Curriculum | ~210ms | 3 API calls + 2 DB queries |

## Duplicate Setup

| File | Pattern | Waste |
|------|---------|-------|
| `assignment.spec.ts` | `beforeEach` creates recording for all 3 tests | Test 2 doesn't need the modification steps, but gets them — minor |
| `authorization.spec.ts` | `beforeEach` creates recording for 4 tests | Efficient — all 4 auth tests need the same base state |
| `playback.spec.ts` | `beforeEach` creates recording for 1 test | Could be inlined |
| `progress.spec.ts` | `beforeEach` creates recording for 1 test | Could be inlined |

**Recommendation**: Inline `beforeEach` for files with only 1 test (playback, progress). This eliminates ~120ms of dead setup and makes the test self-contained.

## Fixed Waits

The suite uses ZERO fixed waits (`await page.waitForTimeout()`). All assertions are immediate (API response) or polling-based (DB queries). This pattern is already optimal.

## Recommendations

1. **Inline single-test fixtures**: playback.spec.ts and progress.spec.ts have `beforeEach` for their single test — move setup inline (~240ms saved)
2. **Worker-scoped seed**: Currently each test creates 2 batches + 1 topic. For tests that only need batches, the seed could be worker-scoped. However, this would reduce isolation — trade-off not worth it for current test count.
3. **Parallelize within files**: The `describe`-level `recordingId` prevents in-file parallelization. Restructure to avoid shared state (e.g., return recording ID from setup function instead of assigning to shared variable).
