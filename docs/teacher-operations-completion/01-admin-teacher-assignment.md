# Admin teacher assignment

## UI

- **Location:** Admin batch detail → **Teachers** tab (`BatchTeachersTab`).
- **Actions:** List assigned teachers, search eligible teachers, multi-select assign, remove with confirmation.

## API

| Method | Path | Role |
|--------|------|------|
| `GET` | `/batches/:id/teachers` | Admin, Teacher (batch-scoped) |
| `POST` | `/batches/:id/teachers` | Admin — body `{ teacherIds: uuid[] }` |
| `DELETE` | `/batches/:id/teachers` | Admin — body `{ teacherIds: uuid[] }` |

`POST` uses `upsert` on `batch_teachers(batch_id,user_id)` — duplicates are idempotent.

`DELETE` removes links only; profiles and historical data remain.

## Validation

- Teachers must exist in `profiles` with `role = teacher` and active profile rules from existing `assignTeachers`.
- Empty `teacherIds` on remove → `400`.

## Client

`assignTeachersToBatch`, `removeTeachersFromBatch`, `getBatchTeachers` in `lib/api/courses.ts`.