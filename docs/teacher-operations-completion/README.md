# Teacher operations completion (P0-3 + Phase 1b)

**Date:** 2026-11-24  
**Verdict:** **CONDITIONAL PASS**

## Executive summary

Administrators can assign and remove teachers on the batch detail **Teachers** tab. Teachers have an expanded portal: dashboard metrics, batch detail with roster/curriculum/live sessions, global live-session list, mobile bottom navigation, and existing review queue.

Authorization from P0-1 / P0-1B is unchanged in behavior; Phase A adds integration-style regression specs.

## Delivered

| Area | Status |
|------|--------|
| Admin teacher assignment UI | Done |
| `DELETE /batches/:id/teachers` | Added |
| Teacher curriculum (read-only, published) | Done |
| Teacher live sessions list + detail | Done |
| Mobile teacher nav | Done |
| Dashboard scoped metrics | Done |
| Security integration tests | Done |

## Not in scope

Document library, webinars, Razorpay, teacher host Zoom join, curriculum mutations for teachers.

See `06-known-gaps.md`.