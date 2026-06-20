# Architecture

## Overview

LMS Platform is a modern learning management system built with:
- **NestJS** backend (apps/api)
- **Next.js 14** frontend (apps/web)
- **Supabase** for database and auth
- **Mux** for video processing
- **Zoom** for live sessions

## Key Decisions

- Monorepo with pnpm workspaces
- API-first design; Next.js API routes act as thin proxies
- Supabase handles auth; JWT tokens passed to NestJS for validation
- Mux handles video ingest, transcoding, and playback
- Zoom webhooks drive recording-to-video pipeline
