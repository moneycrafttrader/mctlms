# Deployment

## Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

## Local Development
```bash
pnpm install
docker-compose up -d   # Redis & dev services
pnpm --filter @lms/api start:dev
pnpm --filter @lms/web dev
```

## Environment Variables
Copy `.env.example` to `.env` and fill in Supabase, Zoom, and Mux credentials.

## Production Build
```bash
pnpm --filter @lms/api build
pnpm --filter @lms/web build
```
