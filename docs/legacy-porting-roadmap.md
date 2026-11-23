# Legacy mct-lms → mctlms porting roadmap

Source: `E:\Money Craft Trader\All Work\mct-lms`  
Target: `lms-platform` (NestJS + Next.js + Supabase)

**Confirmed priorities (in build order):**

1. Teacher / instructor portal (Next.js)
2. Document library (Supabase Storage)
3. Public webinar registration
4. Razorpay payment links + webhook (flexible, layered on current finance)

---

## Current gaps (as of this plan)

| Area | Backend | Frontend |
|------|---------|----------|
| Teacher | `UserRole.TEACHER` on evaluation, batches (partial), curriculum, recordings | Middleware expects `/teacher` but **no routes**; login sends teachers to **admin** |
| Documents | PDF in batch curriculum only; `uploads` bucket for question images | No admin/student document hub |
| Public webinars | `live_sessions` = batch Zoom webinars | No public landing/register/join |
| Razorpay | EMI + offline payments, GST invoices (Puppeteer) | No online payment links |

**Role naming:** old LMS = `instructor`; new LMS = `teacher` (same person).

---

## Phase 1 — Teacher portal

### Goal

Teachers manage **only their batches**: view roster, curriculum (read + limited edit), review-queue grading, joined live sessions — without admin finance, bulk upload, or global user CRUD.

### Backend (mostly exists)

| Capability | API today | Work needed |
|------------|-----------|-------------|
| Batches list/detail | `GET /batches` allows TEACHER but returns **all** batches | Scope list + `findById` to `batch_teachers` |
| Students in batch | `GET /batches/:id/students` | Enforce batch membership for TEACHER |
| Review queue | `GET /evaluation/review-queue` | None |
| Curriculum | `batch-curriculum` TEACHER roles | Teacher UI only |
| Recordings upload | TEACHER on recordings | Teacher UI (optional phase 1b) |
| Live sessions | Create = ADMIN only; join = STUDENT | TEACHER: list host sessions, join as host (reuse Zoom signature) |

**Reference (old UI):** `mct-lms/frontend/src/pages/instructor/*`, `layouts/InstructorLayout.tsx`

### Frontend

```
apps/web/src/app/teacher/
  layout.tsx          # GuardRoute + TeacherSidebar
  page.tsx            # Dashboard (assigned batches)
  batches/page.tsx
  batches/[id]/page.tsx   # Students + curriculum tab (reuse admin components read-only where possible)
  review-queue/page.tsx   # Shared ReviewQueueView
  live-sessions/page.tsx  # Phase 1b — sessions for teacher's batches
```

**Constants:** `ROUTES.TEACHER.*` in `lib/constants.ts`  
**Login:** `useSession` → `/teacher` when `role === 'teacher'`  
**Do not** grant `/admin` to teachers.

### Acceptance

- Teacher login lands on `/teacher`
- Teacher sees only batches in `batch_teachers`
- Teacher can assign self to review items and submit marks (existing evaluation API)
- Teacher cannot open another batch by UUID guessing (403)

---

## Phase 2 — Document library (Supabase Storage)

### Goal

Central **resources** (PDF, DOCX, images): upload, metadata, language, batch assignment, student download — beyond one-off curriculum `pdf_url` rows.

### Recommended storage: Supabase (not S3)

- Already used (`uploads` bucket, service-role uploads in `UploadsController`)
- Same auth/session model; no second cloud vendor
- Old S3 logic: `mct-lms/backend/src/controllers/document.controller.js`, `config/storage.config.js`

### Schema (new migration `040-document-library.sql`)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  language TEXT,
  visibility TEXT NOT NULL DEFAULT 'batch'
    CHECK (visibility IN ('batch', 'course', 'global')),
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_batches (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, batch_id)
);
```

### Storage bucket

- New bucket `documents` (or prefix `documents/{batchId}/` in `uploads`)
- Max size / MIME: PDF, DOCX, PNG, JPEG (match business policy)
- Download: **signed URL** via API after entitlement check (student ∈ batch)

### API module: `documents/`

| Method | Route | Roles |
|--------|-------|-------|
| POST | `/documents` (multipart) | ADMIN, TEACHER |
| GET | `/documents` | ADMIN, TEACHER; STUDENT (scoped) |
| GET | `/documents/:id/download` | ADMIN, TEACHER, STUDENT (entitled) |
| PATCH | `/documents/:id` | ADMIN, TEACHER |
| POST | `/documents/:id/batches` | ADMIN, TEACHER |
| DELETE | `/documents/:id` | ADMIN |

### Frontend

- Admin: `/admin/documents` (port patterns from old `DocumentsPage.tsx`)
- Teacher: `/teacher/documents` (upload to assigned batches only)
- Student: `/student/resources` or section under courses

### Relation to curriculum

Keep `batch_curriculum` PDF items for **structured syllabus**. Document library = **supplementary files** (old LMS parity). Optional later: link `document_id` on curriculum rows.

---

## Phase 3 — Public webinar registration

### Distinction (critical)

| | Batch live session (`live_sessions`) | Marketing webinar (old `webinars`) |
|---|--------------------------------------|-------------------------------------|
| Audience | Enrolled students in assigned batches | **Public** + optional lead capture |
| Zoom | Per-student registrants | Open registration / landing page |
| Auth | Required | Landing public; join may require email capture |

Do **not** overload `live_sessions` with public registration — separate tables avoid breaking batch entitlement logic.

### Schema (`041-public-webinars.sql`)

```sql
CREATE TABLE public_webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  zoom_webinar_id TEXT,
  zoom_join_url TEXT,
  zoom_start_url TEXT,
  host_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  max_registrations INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public_webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID NOT NULL REFERENCES public_webinars(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  zoom_registrant_id TEXT,
  join_url TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (webinar_id, email)
);
```

### API module: `public-webinars/`

- Admin/Teacher CRUD + publish
- `GET /public/webinars/:slugOrId` — `@Public()`
- `POST /public/webinars/:id/register` — `@Public()`, rate-limited
- Reuse `ZoomService.createWebinar` + registrant APIs (patterns in old `webinar.controller.js`)

### Frontend

```
apps/web/src/app/(public)/webinar/[id]/page.tsx      # Landing (old WebinarLanding)
apps/web/src/app/(public)/webinar/[id]/join/page.tsx # Join (old WebinarJoin)
```

Add to `PUBLIC_ROUTES` in `lib/guards/permissions.ts`: `/webinar`, `/webinar/` prefix.

**Reference:** `mct-lms/backend/src/controllers/webinar.controller.js`, `frontend/src/pages/public/*`

---

## Phase 4 — Razorpay (flexible layer)

### Goal

Optional **online collection** alongside existing payment plans, booking amounts, and manual installment marking — not a replacement for GST invoice PDFs.

### Design principles

1. **Feature flag:** `RAZORPAY_ENABLED=true` — when false, UI hides “Send payment link”.
2. **Attach to existing money objects** (prefer order of flexibility):
   - `payment_installments` (pay one EMI online)
   - `payment_plans` (custom partial / booking link)
   - Ad-hoc `payment_requests` row for pre-enrollment (old “request payment”)
3. **Webhook is source of truth** for `paid`; idempotent by `razorpay_payment_id`.
4. **Do not** auto-issue GST invoice on webhook unless business rule says so (hook into existing `invoices` module).

### Schema (`042-razorpay.sql`)

```sql
ALTER TABLE payment_installments
  ADD COLUMN IF NOT EXISTS razorpay_payment_link_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_link_url TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_paid_at TIMESTAMPTZ;

CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  amount NUMERIC(12,2) NOT NULL,
  purpose TEXT,
  razorpay_payment_link_id TEXT,
  razorpay_payment_link_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE razorpay_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### API

- `RazorpayService` — port from `mct-lms/backend/src/services/razorpay.service.js`
- `POST /payments/razorpay/webhook` — `@Public()`, raw body, signature verify (like Zoom webhook pattern)
- `POST /payments/installments/:id/payment-link` — ADMIN
- `POST /payments/requests` — ADMIN (ad-hoc amount)

### Env (`apps/api/.env.example`)

```env
RAZORPAY_ENABLED=false
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### Admin UX

Extend `/admin/finance` or `/admin/payments`: “Copy payment link”, “Resend link”, webhook status on installment.

**Reference:** `invoice.controller.js` (`handleWebhook`, `requestPayment`), `enrollment.service.js`

---

## Cross-cutting

### Migrations

Apply in order: 040 → 041 → 042 after Phase 1 API hardening (no schema required for teacher UI).

### Env recovery

Old `mct-lms/backend/.env.example` maps to new `apps/api/.env.example` (Zoom, Mux, Redis, JWT). Production values from Vercel/Render/Supabase dashboards — not from lost `.env` files.

### What not to port

- Express routes / Sequelize models verbatim
- MySQL data (unless one-off migration script needed)
- Socket.io invoice progress (use polling or existing notifications)
- Old MongoDB README inaccuracies

### Suggested timeline

| Phase | Effort (rough) | Depends on |
|-------|----------------|------------|
| 1 Teacher portal | 3–5 days | — |
| 2 Documents | 3–4 days | Phase 1 optional (teacher upload) |
| 3 Public webinars | 4–5 days | Zoom credentials |
| 4 Razorpay | 3–4 days | Business rules for which objects get links |

---

## Phase 1 implementation checklist (active)

- [x] Roadmap document
- [x] Teacher login → `/teacher`
- [x] `ROUTES.TEACHER` + layout + sidebar
- [x] Batch API scoped for teachers (`findAll`, `findById`, `getStudents`)
- [x] Teacher dashboard + batches + review queue (MVP)
- [ ] Teacher batch detail — curriculum tab, sessions (phase 1b)
- [ ] Teacher documents upload (after Phase 2)