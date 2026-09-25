# SimpleForms — Build Blueprint

> Instructions for Claude Code. Build this product end to end, phase by phase. Each phase ends with acceptance criteria — do not start the next phase until the current one passes them.

---

## 1. Product Summary

**SimpleForms** is a Kenyan-first form builder. Creators build forms (manually or by describing them to AI), publish them, share a link or QR code, collect submissions, and export responses to CSV.

**Differentiators**
1. AI form creation and AI edits ("Add a question asking whether they need parking").
2. Beautiful, fast, mobile-first public forms.
3. Kenyan defaults: +254 phone formatting, KES currency, 47-county dropdown, local templates.

**Core flow**
```
Landing → Sign up / Log in → Create form → (AI or manual) → Edit questions
→ Preview → Publish → Share link / QR → People submit → View responses → Export CSV
```


---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.3+ (App Router, full stack) |
| Language | TypeScript (strict mode) |
Nextauth
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| Animations | Framer Motion (subtle only — builder reordering, page transitions) |
| Forms & Validation | React Hook Form + Zod |
| ORM | Drizzle |
| Database | PostgreSQL |
| Client State | Zustand (form builder state) |
| Server State | TanStack React Query |
| Toasts | Sonner |
| Email | Resend + React Email |
| File Storage | Cloudinary |
| AI | OpenRouter (model set via env var) |
| Extra libs | `libphonenumber-js` (phone), `qrcode` (QR generation), `nanoid` (slugs), `papaparse` (CSV), `@dnd-kit` (drag reorder), `date-fns` |

Deployment target: Vercel. Database: managed Postgres (Neon ).

---

## 3. Architecture

```
┌──────────────────────── Next.js App (Vercel) ────────────────────────┐
│                                                                       │
│  (marketing)   /            Landing page                              │
                                     │
│  (app)         /dashboard  /forms/[id]/edit  /forms/[id]/responses    │
│  (public)      /f/[slug]    Public form (SSR, no auth)                │
│                                                                       │
│  Server Actions  → form CRUD, publish, delete responses               │
│  Route Handlers  → /api/ai/*, /api/submit/[slug], /api/export/[id],   │
│                    /api/upload/sign, /api/cron/*                      │
│                                                                       │
│  lib/ → field registry, zod schema builder, phone utils, ai client    │
└───────────────┬───────────────┬───────────────┬──────────────┬────────┘
                │               │               │              │
           PostgreSQL      OpenRouter       Cloudinary       Resend
            (Prisma)         (AI)         (file uploads)    (emails)
```

**Key principle: a single field registry.** Every question type is defined once in `lib/fields/registry.ts` (label, icon, default config, which properties it supports, how to render it in builder, how to render it publicly, how to validate it, how to serialize it for CSV). Builder, public renderer, submission validator, AI output validator, and CSV exporter all read from this registry. Adding a field type later = one registry entry.

---

## 4. Folder Structure

```
/app
  /(marketing)/page.tsx                 Landing
  /(auth)/login, /signup
  /(app)/layout.tsx                     Authed shell (sidebar/topbar)
  /(app)/dashboard/page.tsx             Forms list
  /(app)/forms/new/page.tsx             Choose: AI / Template / Blank
  /(app)/forms/[id]/edit/page.tsx       Builder
  /(app)/forms/[id]/preview/page.tsx    Preview (renders public view with banner)
  /(app)/forms/[id]/share/page.tsx      Link + QR
  /(app)/forms/[id]/responses/page.tsx  Responses table
  /(app)/forms/[id]/responses/[rid]     Single submission
  /(app)/settings/page.tsx
  /(public)/f/[slug]/page.tsx           Public form
  /(public)/f/[slug]/thanks/page.tsx    Confirmation
  /api/auth/[...nextauth]
  /api/ai/generate                      Prompt → form
  /api/ai/edit                          Instruction + current form → patched form
  /api/submit/[slug]                    Public submission
  /api/upload/sign                      Cloudinary signed upload params
  /api/export/[formId]                  CSV stream
  /api/cron/cleanup-uploads
  /api/cron/daily-digest
/components
  /builder      FieldCard, FieldEditorPanel, FieldTypePicker, AIPromptBar, BuilderToolbar
  /public-form  PublicForm, field renderers (one per type)
  /responses    ResponsesTable, SubmissionDrawer, Filters
  /share        QRCard, CopyLink
  /ui           shadcn components
/lib
  /fields       registry.ts, types.ts, build-zod-schema.ts
  /ai           client.ts, prompts.ts, form-output-schema.ts
  /kenya        counties.ts, phone.ts, currency.ts
  /templates    10 template definitions
  db.ts, auth.ts, slug.ts, rate-limit.ts, csv.ts
/stores         builder-store.ts (Zustand)
/emails         WelcomeEmail, NewSubmissionEmail, DailyDigestEmail
/prisma         schema.prisma, seed.ts
```

---

## 5. Data Model

Describe these in `prisma/schema.prisma`.

### User
| Field | Notes |
|---|---|
| id | cuid |
| name, email (unique), image | from auth |
| passwordHash | nullable (Google users) |
| emailNotifications | enum: `NONE`, `EACH_SUBMISSION`, `DAILY_DIGEST` (default `EACH_SUBMISSION`) |
| createdAt, updatedAt | |
+ NextAuth tables: Account, Session, VerificationToken

### Form
| Field | Notes |
|---|---|
| id | cuid |
| userId | FK → User, cascade delete |
| title | string |
| description | nullable text |
| slug | unique, 8-char nanoid (URL-safe, no ambiguous chars), generated on first publish |
| status | enum: `DRAFT`, `PUBLISHED`, `CLOSED` |
| fields | **JSON** array of Field objects (see §6) — the editable draft |
| publishedFields | **JSON** snapshot taken at publish time — what the public sees |
| settings | JSON: `{ theme, accentColor, submitButtonText, successMessage, closeAt?, responseLimit?, showBranding }` |
| responseCount | int, denormalized, incremented on submit |
| publishedAt, createdAt, updatedAt | |

Why draft vs published snapshot: creators can edit a live form without breaking it; changes go live only when they press "Publish changes".

### Response
| Field | Notes |
|---|---|
| id | cuid |
| formId | FK → Form, cascade delete |
| answers | JSON: `{ [fieldId]: value }` |
| fieldsSnapshot | JSON: the `publishedFields` at time of submission (so old responses still render labels after the form changes) |
| metadata | JSON: `{ userAgent, referrer }` — no raw IP stored; store hashed IP for rate limiting only |
| createdAt | indexed with formId |

### Upload
| Field | Notes |
|---|---|
| id, formId, responseId (nullable until submit completes) | |
| publicId, url, bytes, format, originalName | from Cloudinary |
| createdAt | orphaned uploads (responseId null > 24h) deleted by cron |

Indexes: `Form(userId, updatedAt)`, `Form(slug)`, `Response(formId, createdAt)`.

---

## 6. Field Specification

### Common shape (every field)
| Property | Type | Notes |
|---|---|---|
| id | string | stable nanoid, never changes once created (answers are keyed by it) |
| type | enum | one of the 11 types below |
| label | string | required, max 200 |
| description | string? | helper text, max 500 |
| placeholder | string? | not used by choice/yes-no/date/file |
| required | boolean | default false |
| options | `{ id, label }[]`? | only for single choice, multiple choice, dropdown |
| config | object? | type-specific extras (below) |

### Types
| Type | Public input | Validation | Config |
|---|---|---|---|
| `short_text` | text input | max 255 chars | `maxLength?` |
| `long_text` | auto-growing textarea | max 5000 chars | `maxLength?` |
| `email` | email input | valid email | — |
| `phone` | phone input, +254 prefix | Kenyan mobile rules (§8) | `defaultCountry: "KE"` |
| `number` | numeric input | min/max | `min?`, `max?`, `currency?: "KES"` (shows "KES" prefix, formats with commas) |
| `single_choice` | radio cards | value ∈ options | `allowOther?` |
| `multiple_choice` | checkbox cards | all values ∈ options | `minSelect?`, `maxSelect?`, `allowOther?` |
| `dropdown` | select (searchable if >10 options) | value ∈ options | `preset?: "kenya_counties"` |
| `date` | date picker (native on mobile) | valid ISO date, min/max | `minDate?`, `maxDate?` |
| `yes_no` | two large toggle buttons | "yes" / "no" | — |
| `file_upload` | dropzone / tap-to-upload | size + type | `maxSizeMB` (default 5, cap 10), `accept: "image" | "pdf" | "any"` |

**County dropdown:** a dropdown with `preset: "kenya_counties"` loads all 47 counties from `lib/kenya/counties.ts`. Exposed in the field picker as a shortcut "Kenyan county".

**Zod schema builder:** `lib/fields/build-zod-schema.ts` takes a Field array and returns a Zod object schema. Used on the client (React Hook Form resolver) AND the server (submission route). The server is the source of truth — always re-validate.

---

## 7. AI Form Creation

### 7.1 Generate (`POST /api/ai/generate`)
- Input: `{ prompt: string }` (max 1000 chars). Authenticated only.
- Send to OpenRouter with a system prompt that:
  - Describes the 11 field types and their properties exactly as in §6.
  - Demands **JSON only** matching the output schema: `{ title, description, fields: Field[] }` (without ids — server assigns them).
  - Encodes Kenyan defaults: use `phone` type for phone numbers, `kenya_counties` preset for location/county questions, KES for money, sensible Kenyan examples in placeholders (e.g. "John Kamau", "+254 712 345 678").
  - Keeps forms concise (default 5–12 fields), marks name/email/phone required when appropriate.
- Use JSON mode / structured output where the model supports it.
- Validate the response against a Zod schema (`lib/ai/form-output-schema.ts`). On failure: retry once with the validation error appended; if it still fails, return a friendly error.
- Server assigns field ids and option ids, then creates a DRAFT form and returns its id → client redirects to builder.

Example output for *"Create a registration form for a Nairobi tech meetup"*:
```
Tech Meetup Registration
  Full name*            short_text
  Email address*        email
  Phone number*         phone
  Company/organization  short_text
  Role                  short_text
  Are you a developer?  yes_no
  Topics of interest    multiple_choice: AI, Web development, Cloud, Cybersecurity
  Dietary requirements  long_text
```

### 7.2 Edit (`POST /api/ai/edit`)
- Input: `{ formId, instruction }` e.g. "Add a question asking whether they need parking", "Make phone optional", "Translate to Swahili".
- Send the current `fields` (with ids) + instruction. Model returns the **full updated field array**, preserving existing ids for unchanged/modified fields and omitting ids for new ones.
- Validate with Zod, assign ids to new fields, then return it to the client **without saving**. Client shows a diff preview (added = green, changed = amber, removed = red) with **Apply / Discard**. Apply pushes to the builder store (undoable).

### 7.3 Guardrails
- Rate limit AI routes: 20 requests/user/hour (in-DB counter or Upstash if available).
- Timeout 30s. Show a skeleton builder with a "Designing your form…" state while waiting.
- Never let AI output reach the DB without Zod validation.
- Model name from `OPENROUTER_MODEL` env var so it can be swapped.

---

## 8. Kenyan-First Details

### Phone (`lib/kenya/phone.ts`)
- Accept any of: `0712345678`, `712345678`, `+254712345678`, `254712345678`, `0112345678`, with spaces/dashes.
- Normalize and **store in E.164**: `+254712345678`.
- Valid if the national number is 9 digits starting with `7` or `1` (use `libphonenumber-js` with country KE, then enforce the 7/1 rule).
- Display format: `+254 712 345 678`.
- Input UI: fixed "🇰🇪 +254" prefix chip; user types the rest; strip leading 0 automatically; format as they type.

### Currency
- `number` fields with `currency: "KES"` show a "KES" prefix, format with thousands separators, and export raw numbers in CSV.

### Counties
- Static list of all 47 counties, alphabetical, in `lib/kenya/counties.ts`.

### Templates (`lib/templates`)
Ten templates, each a static title + description + fields definition, shown as cards on `/forms/new`:
1. Event registration
2. Customer feedback
3. Job application (includes CV file upload)
4. Order form (includes KES number fields, county, delivery notes)
5. Contact form
6. School registration (student name, class, parent phone, county)
7. Service booking (date, service choice, phone)
8. Employee information
9. Product survey
10. Lead generation

Using a template clones it into a new DRAFT form owned by the user.

---

## 9. Screens

### 9.1 Landing (`/`)
- Hero: headline, subhead, a prompt box ("Describe the form you need…") — submitting it sends the user to signup, then straight into AI generation with that prompt preserved.
- Live example of a public form on a phone mockup.
- Three feature blocks: AI creation, beautiful mobile forms, share by link + QR.
- Use-case strip: events, churches, schools, shops, businesses.
- Template gallery preview. Footer.
- Static, fast, fully server-rendered.

### 9.2 Dashboard (`/dashboard`)
- Grid/list of forms: title, status badge, response count, last updated.
- Actions per form: Edit, Responses, Share, Duplicate, Close/Reopen, Delete (with confirm).
- "New form" button. Empty state points to AI + templates.

### 9.3 New form (`/forms/new`)
Three choices: **Describe it (AI)** · **Start from template** · **Blank form**.

### 9.4 Builder (`/forms/[id]/edit`)
Layout (desktop): left = field type picker, center = form canvas, right = selected field's editor panel. Mobile: canvas only; picker and editor open as bottom sheets.

- Inline-editable form title and description.
- Field cards: drag handle (dnd-kit), type icon, label, required asterisk, duplicate, delete.
- Editor panel: label, description, placeholder, required toggle, options editor (add/remove/reorder, paste multiple lines to bulk-add), type-specific config.
- Change field type where compatible (e.g. single choice ↔ dropdown ↔ multiple choice keeps options).
- AI bar pinned at the bottom of the canvas: "Ask AI to change this form…" → §7.2 diff flow.
- State lives in the Zustand builder store with undo/redo (keep last 50 states).
- **Autosave** draft `fields` every 1.5s after changes (debounced) via server action; show "Saved / Saving…" indicator.
- Toolbar: Preview, Settings (theme, accent colour, submit text, success message, close date, response limit), Publish / Publish changes.

### 9.5 Preview (`/forms/[id]/preview`)
Renders the exact public component with the draft fields, a "Preview — submissions disabled" banner, and a mobile/desktop width toggle.

### 9.6 Publish & Share (`/forms/[id]/share`)
- Publish: validates the draft (≥1 field, every choice field has ≥2 options, no empty labels), copies `fields` → `publishedFields`, sets status PUBLISHED, generates slug if missing.
- Share page shows: public URL `{APP_URL}/f/{slug}`, Copy button (Sonner toast), QR code rendered client-side, download QR as PNG and SVG, WhatsApp share link (`wa.me/?text=`), "Open form" button.

### 9.7 Public form (`/f/[slug]`)
- Server-rendered, no auth, minimal JS. Target: Lighthouse mobile performance ≥ 90.
- Single-column card, max-width ~640px, generous spacing, large tap targets (≥44px), readable 16px+ inputs (prevents iOS zoom).
- Shows title, description, fields in order, required asterisks, inline validation errors on blur and on submit, scroll to first error.
- Submit button with loading state; disable double-submits.
- States: not found (404), closed ("This form is no longer accepting responses"), response limit reached.
- Honeypot hidden field for bots.
- Open Graph meta (title, description) so WhatsApp link previews look good.
- Small "Made with SimpleForms" footer (toggle in settings).
- Redirect to `/f/[slug]/thanks` showing the custom success message.

### 9.8 Responses (`/forms/[id]/responses`)
- Header: total responses count, Export CSV button.
- Table (TanStack Query, server-side pagination 25/page): first 3–4 fields as columns + Submitted date.
- Search: full-text-ish across answers (Postgres `ILIKE` on answers cast to text is fine for MVP).
- Filters: date range; filter by a choice field's value.
- Row click → drawer with the full submission (labels from `fieldsSnapshot`, files as download links/thumbnails, phone formatted).
- Delete single response and bulk delete (checkboxes), with confirm; decrement `responseCount`.

### 9.9 Settings (`/settings`)
Name, email notification preference, delete account.

---

## 10. Submission Pipeline (`POST /api/submit/[slug]`)

1. Load form by slug; reject if not PUBLISHED, past `closeAt`, or at `responseLimit`.
2. Reject if honeypot filled (return fake success).
3. Rate limit by hashed IP + slug: 10 submissions / 10 minutes.
4. Build Zod schema from `publishedFields`; validate. Strip unknown keys.
5. Normalize values (phone → E.164, numbers → numbers, dates → ISO).
6. Verify each file-upload answer references an Upload row belonging to this form.
7. In one transaction: create Response (with `fieldsSnapshot`), link Uploads, increment `responseCount`.
8. If creator's preference is `EACH_SUBMISSION`, send `NewSubmissionEmail` via Resend (non-blocking; failures logged, never fail the submission).
9. Return success.

### File uploads
- Client requests signed params from `/api/upload/sign` (passes slug + fieldId; server checks the field exists, is a file field, and returns folder `simpleforms/{formId}`, allowed formats, max bytes).
- Client uploads directly to Cloudinary, then creates an Upload row via the same route family and holds its id as the field's answer.
- Cron deletes Uploads with no response after 24h (from Cloudinary and DB).

---

## 11. CSV Export (`GET /api/export/[formId]`)

- Owner-only.
- Columns: `Submitted at`, then one column per field in the current `publishedFields` order, plus columns for fields that only exist in older snapshots (appended at the end).
- Serialization per type comes from the field registry: multiple choice joined with `; `, yes/no as `Yes`/`No`, phone as `+254…`, files as URL(s), dates as `YYYY-MM-DD`, timestamps in Africa/Nairobi.
- Include UTF-8 BOM so Excel opens it correctly. Stream rows in batches of 500.
- Respect current search/filters if passed as query params.
- Filename: `{form-title-slug}-responses-{YYYY-MM-DD}.csv`.

---

## 12. Auth

- NextAuth v5: Google OAuth + email/password (credentials, bcrypt).
- Middleware protects `/(app)` routes and owner-only API routes.
- Every server action and route handler that touches a form checks `form.userId === session.user.id`.
- Welcome email via Resend on signup.

---

## 13. Emails (React Email + Resend)
- `WelcomeEmail`
- `NewSubmissionEmail` — form title, first few answers, "View response" button.
- `DailyDigestEmail` — per form: new response count in last 24h.

## 14. Cron (Vercel Cron, `vercel.json`)
| Route | Schedule | Job |
|---|---|---|
| `/api/cron/cleanup-uploads` | daily 02:00 EAT | delete orphaned uploads > 24h |
| `/api/cron/daily-digest` | daily 08:00 EAT | send digests to users with `DAILY_DIGEST` |
| (inside cleanup) | | set forms past `closeAt` to CLOSED |

All cron routes require `Authorization: Bearer ${CRON_SECRET}`.

---

## 15. Environment Variables
```
DATABASE_URL
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
NEXT_PUBLIC_APP_URL
OPENROUTER_API_KEY
OPENROUTER_MODEL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY
EMAIL_FROM
CRON_SECRET
IP_HASH_SALT
```
Provide `.env.example` with all keys and comments.

---

## 16. Design System
- Neutral base (zinc), one accent colour (default indigo; creator can pick from 8 presets per form).
- Font: Inter (or Geist) via `next/font`.
- Rounded-xl cards, soft borders, no heavy shadows. Light mode default; dark mode for the app shell only.
- Choice options render as full-width tappable cards, not tiny radios.
- Every async action: loading state + Sonner toast on success/failure.
- Empty states with a clear next action on every list screen.
- Accessibility: labels linked to inputs, visible focus rings, errors announced via `aria-live`, AA contrast.

---

## 17. Build Phases

### Phase 0 — Scaffold
Next.js + TS strict, Tailwind, shadcn init, Prisma + Postgres, ESLint/Prettier, folder structure, `.env.example`, base layouts.
**Done when:** app runs, DB migrates, shadcn components render.

### Phase 1 — Auth & Dashboard
NextAuth (Google + credentials), protected routes, dashboard listing, create blank form, delete, duplicate.
**Done when:** a user can sign up, log in, create and see a blank draft form, and cannot access another user's form.

### Phase 2 — Field Registry & Builder
Registry for all 11 types, Zod schema builder, Zustand store with undo/redo, builder UI (picker, canvas, editor panel, drag reorder), autosave.
**Done when:** every field type can be added, configured, reordered, deleted; refresh preserves state; unit tests for schema builder pass.

### Phase 3 — Public Form, Preview, Publish, Submit
Public renderers per type, preview page, publish flow with snapshot, slug generation, submission route with validation, rate limiting, honeypot, thanks page, closed/limit states.
**Done when:** a published form can be filled on a phone and submitted; invalid data is rejected server-side; editing the draft doesn't change the live form until "Publish changes".

### Phase 4 — Kenyan Features & Templates
Phone normalization + input, KES number formatting, counties preset, 10 templates, template picker.
**Done when:** all phone formats in §8 normalize to E.164; invalid KE numbers are rejected; each template creates a valid draft.

### Phase 5 — Share
Share page, copy link, QR (PNG/SVG download), WhatsApp share, OG meta on public forms.
**Done when:** QR scanned by a phone opens the form; WhatsApp preview shows title/description.

### Phase 6 — Responses & Export
Responses table, pagination, search, filters, submission drawer, delete/bulk delete, CSV export.
**Done when:** 1,000 seeded responses page/search/filter smoothly; CSV opens correctly in Excel and Google Sheets with correct columns.

### Phase 7 — File Uploads
Signed Cloudinary uploads, Upload model, display in drawer and CSV, orphan cleanup cron.
**Done when:** files upload from mobile, respect size/type limits, and appear in the response.

### Phase 8 — AI
Generate + edit routes, prompts, output validation + retry, landing prompt handoff, diff preview UI, rate limiting.
**Done when:** the meetup prompt produces a sensible valid form; "Add a question asking whether they need parking" adds a yes/no field without touching other field ids; malformed AI output never reaches the DB.

### Phase 9 — Emails, Cron, Landing, Polish
Resend emails, digests, cron jobs, landing page, empty/loading/error states, Lighthouse pass, accessibility pass.
**Done when:** full core flow works end to end on mobile; public form Lighthouse mobile ≥ 90.

---

## 18. Testing
- **Unit (Vitest):** phone normalization, Zod schema builder for every field type, CSV serialization, AI output validator, slug generator.
- **Integration:** submission route (valid, invalid, closed, limit, honeypot, rate limit), owner checks on every protected route.
- **E2E (Playwright):** sign up → AI generate → edit → publish → submit on mobile viewport → view response → export CSV.
- Seed script: demo user, 3 forms, 1,000 responses.

---

## 19. Security Checklist
- Server-side re-validation of every submission.
- Ownership checks on every form/response/export route.
- Rate limits on submit, AI, and upload-sign routes.
- Signed Cloudinary uploads only; restrict formats and size.
- Escape all user content (never `dangerouslySetInnerHTML`).
- Hash IPs with salt; don't store raw IPs.
- Cron routes protected by secret.
- CSV injection guard: prefix cells starting with `=`, `+`, `-`, `@` with a single quote (except normalized phone numbers, which should be exported as text).

---
