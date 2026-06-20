# API Reference

## Auth
- `POST /auth/login` — Login with email & password

## Users
- `GET /users` — List all users
- `GET /users/:id` — Get user by ID
- `POST /users` — Create a user
- `PATCH /users/:id` — Update a user

## Batches
- `GET /batches` — List all batches
- `GET /batches/:id` — Get batch by ID
- `POST /batches` — Create a batch
- `PATCH /batches/:id/assign-students` — Assign students to batch

## Live Sessions
- `GET /live-sessions` — List all sessions
- `GET /live-sessions/:id` — Get session by ID
- `POST /live-sessions` — Create a session
- `PATCH /live-sessions/:id/cancel` — Cancel a session

## Attendance
- `GET /attendance/session/:sessionId` — Get attendance for a session
- `POST /attendance/manual` — Mark manual attendance

## Videos
- `GET /videos` — List all videos
- `GET /videos/:id` — Get video by ID
- `POST /videos` — Create a video

## Tests
- `GET /tests` — List all tests
- `GET /tests/:id` — Get test by ID
- `POST /tests` — Create a test
- `POST /tests/:id/attempt` — Submit an attempt

## Webhooks
- `POST /zoom/webhook` — Zoom recording webhook
- `POST /mux/webhook` — Mux video webhook
