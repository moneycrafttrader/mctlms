# Coverage Matrix

## Feature × API × DB × UI

| # | Feature | Test File | Test Name | API | DB | UI | Notes |
|---|---------|-----------|-----------|-----|-----|-----|-------|
| 1 | Upload | `upload.spec.ts` | Admin uploads recording | ✓ | ✓ | ✗ | Verifies recording row, batch links, curriculum, upload URL |
| 2 | Assign (multi-batch) | `assignment.spec.ts` | Assign recording to both batches | ✓ | ✓ | ✗ | Batch links, curriculum, student visibility per batch |
| 3 | Cross-batch remove | `assignment.spec.ts` | Remove from one batch | ✓ | ✓ | ✗ | Visibility changes after removal |
| 4 | Curriculum customize | `curriculum.spec.ts` | Per-batch section/sort/visibility | ✓ | ✓ | ✗ | Also calls student grouped API endpoint |
| 5a | Playback URL | `playback.spec.ts` | Authorized student gets URL | ✓ | ✗ | ✗ | No DB assertion — Mux state is non-deterministic |
| 5b | Auth edge cases | `authorization.spec.ts` | 403/401/404 | ✓ | ✗ | ✗ | Status-code checks only, no DB side effects |
| 6 | Progress | `progress.spec.ts` | Watch → persist → refresh | ✓ | ✓ | ✗ | DB upsert verified |
| 7 | Remove+reassign | `assignment.spec.ts` | Full cycle remove | ✓ | ✓ | ✗ | Batch links + curriculum cleanup |
| 8 | Delete recording | `cleanup.spec.ts` | Delete → invisible | ✓ | ✓ | ✗ | DB row removal + API invisibility |
| 9 | Concurrent assign | `cleanup.spec.ts` | No duplicate rows | ✓ | ✓ | ✗ | Race condition detection |
| 10 | Regression cycle | `cleanup.spec.ts` | Full upload→delete cycle | ✓ | ✓ | ✗ | End-to-end pipeline |

## Score

| Layer | Tests Verified | Coverage |
|-------|----------------|----------|
| API | 11 / 11 | 100% |
| DB | 9 / 11 | 82% |
| UI | 0 / 11 | 0% |

## Missing Scenarios

### Critical Gaps

| Scenario | Why Missing | Priority |
|----------|-------------|----------|
| **Mux webhook simulation** | No test simulates `video.asset.ready` → recording stays `processing` | Medium |
| **Cleanup job execution** | `RecordingCleanupJob` cron is never triggered in tests | Medium |
| **UI browser tests** | No `page.goto()` interactions — student portal not covered | Low (separate project) |
| **Long-running progress** | Progress at 99% → 100% completion trigger not tested | Low |

### Low-Risk Gaps

| Scenario | Why Low Risk |
|----------|-------------|
| **Playback URL DB assertion** | Mux token generation is tested at unit level; E2E verifies API contract |
| **Auth 403/401/404 DB assertion** | No DB mutation occurs on auth failures — API status proves the guard |
| **Invalid batch ID on assign** | Covered by `validateCurriculumPayload` unit tests |
| **Empty payload validation** | Covered by `BadRequestException` unit tests |
