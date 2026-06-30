# Factories

Factories produce deterministic, uniquely-named DTOs for every test invocation. Uniqueness comes from a global sequential counter (`utils/counter.ts`), NOT from random UUIDs — this ensures traceable names in CI artifacts.

## Counter

```typescript
import { nextSeq, resetSeq } from './counter';

nextSeq()  // returns 1, 2, 3, ...
resetSeq() // resets to 0 (called per test via seed fixture)
```

## Available Factories

### `createRecordingDto(overrides?)`

Creates the POST body for `/admin/recordings`. Title auto-generates as `E2E-Recording-001`.

```typescript
createRecordingDto({ batchIds: [batchAId], categoryName: 'Swing Trading' })
// { title: 'E2E-Recording-003', description: 'Created by E2E test', batchIds: [...], ... }
```

### `updateCurriculumDto(assignments)`

Creates the PATCH body for `/admin/recordings/:id/batch-curriculum`.

```typescript
updateCurriculumDto([{ batchId, sectionName: 'Swing', sortOrder: 1, isVisible: true, assigned: true }])
// { assignments: [...] }
```

### `updateRecordingDto(overrides?)`

Creates the PATCH body for updating a recording. Title auto-generates as `E2E-Updated-001`.

### `updateProgressDto(watchedSeconds, completed?)`

Creates the POST body for `/recordings/:id/progress`.

```typescript
updateProgressDto(30, false)
// { watchedSeconds: 30, completed: false }
```

## Seed Data

The `seed.ts` module creates deterministic names for batches and topics:

```
E2E-Topic-001
E2E-Batch-A-002
E2E-Batch-B-003
```

The counter is shared across all factories and seed calls within a test, ensuring no collisions even in parallel execution (each worker gets its own counter via `resetSeq()` in the `seed` fixture).
