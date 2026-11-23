# 06 — Razorpay readiness

**No secrets printed.** Env names only.

## Current payment domain

| Entity | Schema | Service | Classification |
|--------|--------|---------|----------------|
| Payment plans | `payment_plans` `schema.sql` L189+ | `payments.service.ts` `createPaymentPlan` | VERIFIED WORKING |
| Installments | `payment_installments` | mark paid, overdue logic | VERIFIED WORKING |
| Payments ledger | `payments` table | linked to installments | VERIFIED WORKING |
| GST invoices | `invoices` | `invoices.service.ts` | VERIFIED WORKING |
| Receipts | `receipts` | invoices module | VERIFIED WORKING |

## Razorpay specifically

| Item | Evidence | Classification |
|------|----------|----------------|
| `razorpay` npm dependency | Absent from `apps/api/package.json` | NOT IMPLEMENTED |
| `RAZORPAY_*` in `apps/api/.env.example` | Absent | NOT IMPLEMENTED |
| Payment link fields on installments | Absent from `schema.sql` | NOT IMPLEMENTED |
| `payment_requests` table | Absent | NOT IMPLEMENTED |
| Webhook handler | No `payments/razorpay/webhook` | NOT IMPLEMENTED |
| Prior audit note | `docs/rccf-phase16a-render-free-runtime-audit-report.md` L169 — no Razorpay handler | VERIFIED WORKING (confirms gap) |

## Webhook infrastructure patterns to reuse

| Pattern | Evidence | Classification |
|---------|----------|----------------|
| Raw body for HMAC | `main.ts` `rawBody: true` L26 | VERIFIED WORKING |
| Public webhook bypass JWT | `@Public()` on `zoom.controller.ts` webhook | VERIFIED WORKING |
| Idempotent event storage | Zoom/Mux/Bunny webhook handlers (modules under `zoom/`, `video-provider/`) | IMPLEMENTED BUT UNVERIFIED |
| Outbox / observability | `outbox.service.ts`, `observability.service.ts` | VERIFIED WORKING — optional for payment events |

## Flexible integration (roadmap alignment)

Proposed attach points (not implemented):

1. `payment_installments` — per-EMI link
2. Ad-hoc `payment_requests` — pre-enrollment
3. Feature flag `RAZORPAY_ENABLED` in roadmap only

## Admin / student UX

| UX | Classification |
|----|----------------|
| `/admin/payments`, `/admin/finance` | VERIFIED WORKING for manual EMI |
| "Copy payment link" / webhook status | NOT IMPLEMENTED |
| Student self-checkout | NOT IMPLEMENTED |

## Readiness verdict

| Dimension | Verdict |
|-----------|---------|
| Business ledger for reconciling webhooks | **READY** (installments + payments tables) |
| Online collection | **NOT READY** |
| Credential setup | **BLOCKED BY MISSING ENVIRONMENT OR CREDENTIALS** until keys provisioned |

## Legacy reference (do not copy verbatim)

- `mct-lms/backend/src/services/razorpay.service.js` — `createPaymentLink`, `verifyWebhookSignature`
- `mct-lms/backend/src/controllers/invoice.controller.js` — payment webhook handler