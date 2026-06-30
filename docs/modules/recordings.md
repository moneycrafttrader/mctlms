# Recordings Module — Production Reference

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    HTTP Layer                             │
│  RecordingsController  / ReconciliationController         │
│  Routes: admin/recordings/*, recordings/*, admin/videos/* │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                  Service Layer                             │
│  RecordingsService (injectable)                            │
│    ┌──────────────────────────────────────────────────┐   │
│    │  Topic CRUD  │  Recording CRUD  │  Batch Ops     │   │
│    │  Playback    │  Progress        │  Curriculum     │   │
│    └──────────────────────────────────────────────────┘   │
│                                                            │
│  RecordingCurriculumReconciliationService (injectable)      │
│    - Dry-run / live curriculum drift repair               │
│    - N+1 scan of recording_batches vs curriculum           │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                Background Jobs                             │
│  RecordingCleanupJob (@Cron '0 */15 * * * *')              │
│    - Retries failed Mux asset deletion                    │
│    - Marks cleanup_failed after 10 retries                 │
│                                                            │
│  RecordingUploadJob (@Cron '*/2 * * * *')                  │
│    - Processes Zoom → Mux upload queue                     │
│    (owned by AppModule, not recordings module)             │
└───────────────────────────────────────────────────────────┘
```

### Dependencies

| Dependency | Imported By | Purpose |
|------------|-------------|---------|
| `MuxModule` | `RecordingsModule` | Video upload, playback, asset deletion |
| `PlaybackModule` | `RecordingsModule` | Playback authorization, signed URLs |
| `ObservabilityModule` | `RecordingsModule` | Event logging, error tracking |
| `SupabaseService` | All services | Database access |
| `RedisCacheService` | `RecordingsService` | Student recording list caching |
| `@nestjs/schedule` | `AppModule` | Cron job scheduling |

---

## Authorization Model

**Single source of truth:** `recording_batches` table.

The `batch_recording_curriculum` table is for display and progress calculation only — never for access control.

### Access check flow (`validateAccess`)

```
Student requests playback
  → Check recording.status = 'ready'
  → Query batch_students for user's batch IDs
  → Query recording_batches for recording's batch IDs
  → Intersect: student must share at least one batch with recording
  → ForbiddenException if no overlap
```

### Route-level guards

- All routes apply `Roles()` decorator (ADMIN / TEACHER / STUDENT).
- `@Public()` is never used in recordings routes.
- `JwtAuthGuard` (global) enforces JWT on every request before `RolesGuard`.

---

## Transaction Model

The `Transaction` utility (`common/utils/transaction.util.ts`) runs steps sequentially. If a step throws, it calls `rollback()` on all completed steps in reverse order, then re-throws. Rollback failures are logged but not thrown.

### Methods using Transaction

| Method | Steps | External API inside? |
|--------|-------|---------------------|
| `createRecordingWithUpload()` | 1. insert batch links, 2. insert curriculum | **No** — Mux URL created before transaction |
| `updateBatchCurriculum()` (ADD) | 1. upsert batch links, 2. upsert curriculum | **No** |
| `updateBatchCurriculum()` (REMOVE) | 1. delete curriculum, 2. delete batch links | **No** |
| `deleteRecording()` | 1. delete curriculum, 2. delete batch links, 3. set cleanup_pending=true | **Mux deleteAsset AFTER commit** |

### Rule: Mux API calls are NEVER inside a transaction

In `deleteRecording()`, the DB transaction commits first (setting `cleanup_pending=true`), then Mux `deleteAsset` is attempted. If Mux fails:
- `cleanup_pending` remains `true`
- `RECORDING_CLEANUP_PENDING` event is emitted
- The cleanup job retries later
- DB is never rolled back due to an external API failure

---

## Cleanup Workflow

```
deleteRecording() called by admin
  │
  ├─ Transaction commits:
  │   • delete from batch_recording_curriculum
  │   • delete from recording_batches
  │   • set cleanup_pending = true
  │
  ├─ Mux deleteAsset (outside transaction)
  │   ├─ Success → hard-delete recording row
  │   └─ Failure → emit RECORDING_CLEANUP_PENDING event
  │                return { deleted: true, cleanupPending: true }
  │
  └─ RecordingCleanupJob (every 15 min)
      │
      ├─ Query WHERE cleanup_pending=true AND cleanup_failed=false
      ├─ For each recording:
      │   ├─ mux deleteAsset
      │   │   ├─ Success/404 → delete recording row
      │   │   │                emit RECORDING_CLEANUP_COMPLETED
      │   │   └─ Error → increment retry_count
      │   │              if retries >= 10:
      │   │                set cleanup_failed=true
      │   │                emit RECORDING_CLEANUP_FAILED
      │   └─ No mux_asset_id → delete orphan row directly
      └─ Return CleanupSummary metrics
```

### retry_count column
- Default: `0`
- Incremented on every non-404 Mux error
- Max: `10` (hardcoded in `RecordingCleanupJob.MAX_RETRIES`)
- At 10: `cleanup_failed` set to `true`; never retried again

### cleanup_failed column
- Default: `false`
- Set to `true` when retries exhausted
- Recording stays in DB for manual inspection
- Filtered index: `WHERE cleanup_failed = true`

---

## Reconciliation Workflow

```
POST /admin/reconciliation/curriculum?dryRun=true
  │
  ├─ findMissingCurriculumEntries()
  │   Scan recording_batches → for each, check curriculum exists
  │   Returns entries in recording_batches but NOT in curriculum
  │
  ├─ findOrphanCurriculumEntries()
  │   Scan batch_recording_curriculum → for each, check recording_batches exists
  │   Returns entries in curriculum but NOT in recording_batches
  │
  ├─ dryRun=true  → report only, no mutations
  ├─ dryRun=false → insert missing, delete orphans
  │
  └─ Return ReconciliationSummary
```

### Limitations
- **N+1 queries**: Both scans issue one SELECT per row. A `FULL OUTER JOIN` would be more efficient for large datasets.

---

## Caching

### Redis cache keys

| Key Pattern | TTL | Populated By | Description |
|-------------|-----|-------------|-------------|
| `recordings:flat:{userId}:{topicId}` | 300s | `getRecordingsForStudent()` | Student's accessible recordings |
| `recordings:grouped:{userId}` | 300s | `getMyRecordingsGrouped()` | Student's recordings grouped by batch → section |

### Cache invalidation

Called at the end of every mutation method:
- `create()`, `assignToBatches()`, `removeBatchAccess()`
- `updateBatchCurriculum()`, `deleteRecording()`

Invalidation is fire-and-forget via `redisCache.invalidateRecordingsCache()`.

---

## Events

| Event | Emitted By | When |
|-------|-----------|------|
| `RECORDING_CREATED` | `create()` | After recording + batch links + curriculum created |
| `RECORDING_DELETED` | `deleteRecording()` | After recording row hard-deleted |
| `RECORDING_CLEANUP_PENDING` | `deleteRecording()` | Mux deleteAsset failed, cleanup_pending set |
| `RECORDING_CLEANUP_COMPLETED` | `RecordingCleanupJob` | After retry successfully cleans up Mux asset |
| `RECORDING_CLEANUP_FAILED` | `RecordingCleanupJob` | After 10 retries exhausted |

Events are persisted to `system_events` table via `ObservabilityService.logEvent()`.

---

## Cron Jobs

| Job | Schedule | File | Ownership |
|-----|----------|------|-----------|
| `RecordingCleanupJob` | `0 */15 * * * *` (every 15 min) | `jobs/recording-cleanup.job.ts` | Recordings module |
| `RecordingUploadJob` | `*/2 * * * *` (every 2 min) | `jobs/recording-upload.job.ts` | AppModule |

---

## Error Handling

### Structured curriculum sync logging

Every curriculum UPSERT/DELETE emits three structured log lines:
1. `[Curriculum UPSERT/DELETE] BEGIN` — recordingId, batchIds, entries, table
2. `[Curriculum UPSERT/DELETE] SUCCEEDED` — status, count
3. `[Curriculum UPSERT/DELETE] FAILED` — full JSON.stringify(error) with code, message, details, hint

### Error propagation

All DB errors in mutation methods throw `BadRequestException` with descriptive messages including:
- Supabase error code
- Error message
- Details
- Hint

### Silent-failure elimination

| Method | Historical Behavior | Current Behavior |
|--------|-------------------|-----------------|
| `autoCreateCurriculumEntries()` | Logged warn, didn't throw | Throws `BadRequestException` |
| `assignToBatches()` curriculum step | Logged warn, didn't throw | Throws `BadRequestException` |
| `removeBatchAccess()` curriculum step | Logged warn, didn't throw | Throws `BadRequestException` |
| `updateBatchCurriculum()` curriculum step | Logged warn, didn't throw | Throws `BadRequestException` |

---

## Known Limitations

1. **N+1 in reconciliation**: `findMissingCurriculumEntries()` and `findOrphanCurriculumEntries()` issue one SELECT per row. A `FULL OUTER JOIN` between `recording_batches` and `batch_recording_curriculum` would be more efficient.

2. **No FK on curriculum.content_id**: The `batch_recording_curriculum.content_id` column is UUID but has no foreign key constraint. Application-layer validation (`validateCurriculumPayload`) is the only guard.

3. **Duplicate curriculum defaults**: Default values (`category_name: 'General'`, `sort_order: 0`, `is_published: true`) are hardcoded in three places: `assignToBatches()`, `autoCreateCurriculumEntries()`, and `reconciliation.insertMissingEntries()`. If defaults change, all three must be updated.

4. **No manual retry for cleanup_failed**: Once a recording reaches `cleanup_failed=true`, it is never retried. There is no admin endpoint to reset `cleanup_failed` and retry.

5. **Application-level rollback**: The `Transaction` class implements rollback via inverse application operations, not database savepoints. Under high concurrency, race conditions could occur if two transactions interleave. A true DB-level transaction (Supabase RPC) would be more robust.

6. **Cache invalidation scope**: `invalidateRecordingsCache()` clears ALL recording cache keys using a Redis pattern match. This is correct but could flush more than needed.
