# Known gaps

## Authorization exceptions (unchanged)

- Global `GET /questions` list.
- Legacy global video topic metadata.
- Observability teacher metrics.
- Student-only `GET /recordings/batch/:batchId` (teachers use `/videos/batch/:batchId` or batch session APIs).

## Product gaps

- Teacher cannot edit curriculum or create live sessions (by design).
- No Zoom host join UI for teachers.
- Dashboard student count samples first 10 batches (not a full aggregate API).
- Teacher cannot run admin-only payment tab workflows.

## Follow-ups

1. Playwright: admin teacher assignment + teacher batch curriculum E2E.
2. Optional: dedicated dashboard endpoint for teacher KPIs.
3. Teacher host workflow when product defines it.