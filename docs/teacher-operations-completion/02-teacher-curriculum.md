# Teacher curriculum

## Screens

- Batch detail → **Curriculum** tab → `TeacherCurriculumPanel`.

## APIs (no frontend business logic)

| Call | Purpose |
|------|---------|
| `GET /batches/:batchId/curriculum` | Published curriculum hierarchy |
| `GET /admin/batches/:batchId/progress` | Class aggregate progress (teacher read) |

## Behavior

- Read-only: no add/reorder/publish controls (admin-only mutations unchanged).
- Unauthorized batch → API `403` (BatchAccessService).
- Empty published curriculum shows empty state.

## UX

- Collapsible categories, content-type icons, optional class average progress when admin progress API succeeds.