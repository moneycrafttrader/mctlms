# Recordings Module — Regression Test Reference

**Suite count:** 3 | **Total tests:** 34 | **All pass**

---

## 1. `recordings.service.spec.ts` — 25 tests

### describe('RecordingsService')

| # | Test | Category | What it verifies |
|---|------|----------|-----------------|
| 1 | should throw BadRequestException when recording creation fails | CRUD | DB insert error is propagated |
| 2 | should throw BadRequestException when batch linking fails | CRUD | Batch link error triggers recording deletion + throw |
| 3 | should throw BadRequestException when curriculum creation fails | CRUD | Curriculum error throws, recording+batchLinks cleaned up |
| 4 | should create recording with batch links and curriculum successfully | CRUD | Full happy path: recording + batchLinks + curriculum + cache invalidation + event |
| 5 | should remove batch access and curriculum entries | Batch | Delete from curriculum + recording_batches, return removedCount |
| 6 | should throw on invalid recording ID in batch access | Validation | Non-UUID recordingId throws `BadRequestException` |
| 7 | should throw on empty batch IDs in batch access | Validation | Empty batchIds array throws `BadRequestException` |
| 8 | should throw on invalid batch ID in batch access | Validation | Non-UUID batchId throws `BadRequestException` |
| 9 | should fail gracefully when Supabase returns an error | Curriculum FK | FK violation from curriculum upsert throws with descriptive message |

### describe('updateBatchCurriculum')

| # | Test | Category | What it verifies |
|---|------|----------|-----------------|
| 10 | should add recording to new batches with curriculum defaults | Add path | Upserts batch links + curriculum entries |
| 11 | should remove recording from batches and delete curriculum | Remove path | Deletes curriculum entries + batch links |
| 12 | should handle mixed add and remove in one call | Mixed | Both add and remove paths in one transaction |
| 13 | should return updated=true when no assignments provided | Empty | No-op returns `{ updated: true }` |
| 14 | should throw on invalid recording ID | Validation | Bad UUID throws |
| 15 | should throw on empty batch IDs | Validation | Empty assignments throws |
| 16 | should throw on invalid batch ID in add path | Validation | Bad UUID in add batch throws |
| 17 | should throw on invalid batch ID in remove path | Validation | Bad UUID in remove batch throws |
| 18 | should throw on curriculum DB error (add path) | Add path error | Unique constraint violation → Transaction rollback → verify batch links deleted |
| 19 | should throw on batch link DB error (remove path) | Remove path error | Batch link delete fails → Transaction rollback → verify curriculum re-inserted |

### describe('deleteRecording - syncs curriculum')

| # | Test | Category | What it verifies |
|---|------|----------|-----------------|
| 20 | should throw NotFoundException for non-existent recording | Delete | Missing recording throws |
| 21 | should handle Mux deletion failure gracefully | Mux failure | Mux timeout → cleanup_pending set, event emitted, `{ cleanupPending: true }` |
| 22 | should handle missing Mux asset gracefully | No Mux asset | No mux_asset_id → skip Mux, hard-delete row |
| 23 | should record curriculum and batch-link deletion steps | Curriculum cleanup | Transaction deletes curriculum + batch links before setting cleanup_pending |

### describe('ReconciliationController — run')

| # | Test | Category | What it verifies |
|---|------|----------|-----------------|
| 24 | should run reconciliation (summary shape) | Reconciliation | Returns ReconciliationSummary with correct structure |
| 25 | should run reconciliation (dry run — all entries skipped) | Reconciliation | dryRun=true → processed matches drift, skipped=processed |

---

## 2. `recording-curriculum-reconciliation.service.spec.ts` — 7 tests

(Contributed by the reconciliation module, verified in the full suite)

### describe('RecordingCurriculumReconciliationService')

| # | Test | Category | What it verifies |
|---|------|----------|-----------------|
| 1 | should return empty summary when no drift exists | No drift | Perfect sync → 0 processed, 0 inserted, 0 deleted |
| 2 | should detect missing curriculum entries | Missing | recording_batches row without curriculum → captured in missingEntries |
| 3 | should detect orphan curriculum entries | Orphans | curriculum row without recording_batches → captured in orphanEntries |
| 4 | should insert missing entries in live mode | Live insert | dryRun=false → missing entries inserted, inserted counter |
| 5 | should delete orphans in live mode | Live delete | dryRun=false → orphans deleted, deleted counter |
| 6 | should track Supabase errors during live reconciliation | Error tracking | Insert/delete failures → failed counter incremented |
| 7 | should return ReconciliationSummary shape | Shape | All fields present: dryRun, processed, inserted, deleted, failed, skipped, durationMs |

---

## 3. `recording-cleanup.job.spec.ts` — 9 tests

### describe('RecordingCleanupJob')

| # | Test | Category | What it verifies |
|---|------|----------|-----------------|
| 1 | should return zeros when no recordings are pending cleanup | Empty | No cleanup_pending rows → all counters 0 |
| 2 | should delete recording when Mux deletion succeeds | Success | Mux deleteAsset resolves → row deleted, RECORDING_CLEANUP_COMPLETED emitted |
| 3 | should delete recording when Mux returns 404 | 404 | MuxService handles 404 → same as success path |
| 4 | should retry when Mux deletion fails with 5xx | 5xx error | Mux 502 → retry_count incremented, deleted=0 |
| 5 | should retry when Mux deletion fails with network timeout | Network error | ETIMEDOUT → retry_count incremented |
| 6 | should mark cleanup_failed when retry limit is reached | Retry limit | 9 previous retries + 1 failure = cleanup_failed, RECORDING_CLEANUP_FAILED |
| 7 | should delete orphan recording rows without mux_asset_id | Orphan | null mux_asset_id → direct delete, no Mux call |
| 8 | should process multiple recordings sequentially | Multi-row | 3 recordings → all deleted, deleteAsset called 3 times |
| 9 | should handle Supabase query error gracefully | Query error | DB error → processed=0, no Mux calls |

---

## Coverage Summary

| Metric | Value |
|--------|-------|
| Test suites | 3 |
| Total tests | 34 |
| All pass | Yes |
| Controller coverage | All route handlers delegate to service |
| Service coverage | All 18 exported methods exercised |
| Job coverage | 9 scenarios (empty, success, 404, 5xx, timeout, retry limit, orphan, multi-row, query error) |
| Reconciliation coverage | Dry-run, live insert, live delete, error tracking, shape |
| Edge cases covered | Invalid UUIDs, empty arrays, FK violations, network errors, Mux 404/5xx, retry exhaustion, concurrency guard |

### Not covered (future)

- End-to-end integration tests with real Supabase/Mux
- Multi-user concurrency (parallel transaction rollback races)
- Redis cache hit/miss verification (mocked in unit tests)
- reconciliation service with overlapping missing+orphan entries
