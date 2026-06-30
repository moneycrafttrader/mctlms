# E2E Testing — Recordings Module

## Quick Start

```bash
# Prerequisites: test users exist in DB, env vars set
cd tests/e2e
npx playwright install --with-deps chromium
npx playwright test --project=recordings-api
```

## Documentation

| Document | Description |
|----------|-------------|
| [e2e-testing.md](./e2e-testing.md) | Architecture overview, fixture hierarchy, key design decisions |
| [fixtures.md](./fixtures.md) | Fixture patterns, worker vs test scope, adding new fixtures |
| [factories.md](./factories.md) | DTO factories, counter, seed data naming |
| [debugging.md](./debugging.md) | Artifacts, environment variables, pre-requisites |
| [ci.md](./ci.md) | GitHub Actions workflow, secrets, configuration |

## Coverage Matrix

| Feature | Test File | Test | API | DB | Notes |
|---------|-----------|------|-----|----|-------|
| Upload | `upload.spec.ts` | 1 | ✓ | ✓ | Verifies recording row, batch links, curriculum, upload URL |
| Assignment | `assignment.spec.ts` | 2 | ✓ | ✓ | Batch links, curriculum, student visibility via DB |
| Cross-batch | `assignment.spec.ts` | 3 | ✓ | ✓ | Remove batch, verify visibility change |
| Curriculum | `curriculum.spec.ts` | 4 | ✓ | ✓ | Per-batch section/sort/visibility + student API grouped response |
| Playback | `playback.spec.ts` | 5a | ✓ | ✗ | Authorize + play endpoint (Mux behavior varies) |
| Authorization | `authorization.spec.ts` | 5b | ✓ | ✗ | 403 for wrong batch, 401 unauthenticated, 404 invalid ID |
| Progress | `progress.spec.ts` | 6 | ✓ | ✓ | Upsert progress, read back, unassigned student can write |
| Remove+Reassign | `assignment.spec.ts` | 7 | ✓ | ✓ | Full remove + verify batch/curriculum cleanup |
| Delete | `cleanup.spec.ts` | 8 | ✓ | ✓ | Delete recording, verify DB + API invisibility |
| Concurrency | `cleanup.spec.ts` | 9 | ✓ | ✓ | Parallel batch assignment, no duplicates |
| Regression | `cleanup.spec.ts` | 10 | ✓ | ✓ | Upload → assign → customize → remove → reassign → delete |

### Gaps

- **Playback (Test 5a)**: No DB assertion — Mux playback URL cannot be verified without an actual Mux asset
- **Authorization (Test 5b)**: No DB assertion — 403/401/404 are API-level checks only
- **No browser tests**: All tests use `APIRequestContext`. UI playwright tests (e.g., checking the student video player renders the correct recording) would require a separate `page` fixture
- **No Mux webhook simulation**: Tests don't simulate `video.asset.ready` — recordings stay in `processing` state
