# Teacher live sessions

## Screens

- **Global:** `/teacher/live-sessions` — upcoming + history from `GET /live-sessions` (teacher-scoped server-side).
- **Per batch:** Batch detail → **Live sessions** tab via `GET /batches/:id/sessions`.
- **Detail:** `/teacher/live-sessions/[sessionId]` — `GET /live-sessions/:id` with teacher session access check.

## Security

- Listing and detail use P0-1 `BatchAccessService` session/batch scoping.
- No join-token or Zoom host credentials in teacher UI copy.
- Student join flow unchanged.

## Limitations

- Teachers cannot create sessions (admin-only `POST /live-sessions`).
- No in-app host launch in this phase.