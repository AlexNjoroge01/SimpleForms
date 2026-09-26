# SimpleForms

Kenyan-first form builder: create forms from scratch or from a template, publish, share by link / QR / WhatsApp, collect responses, export to CSV.

- **Spec:** [Blueprint.md](Blueprint.md) (product + phases) · [Design.md](Design.md) (visual system)
- **Deviations from the Blueprint** (agreed): Drizzle instead of Prisma · Design.md tokens instead of Blueprint §16 (zinc/indigo/Inter) · Remix Icon instead of Lucide · Neon Object Storage instead of Cloudinary.

## Status

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold, design tokens, DB schema + migrations | ✅ Done |
| 1 | Auth (Google + email/password), protected routes, dashboard, create / duplicate / close / delete | ✅ Done — e2e (desktop + mobile) |
| 2 | Field registry (11 types), Zod schema builder, builder UI with drag reorder, undo/redo, autosave | ✅ Done — unit + e2e |
| 3 | Public form, preview, publish snapshot, submission API (validation, rate limit, honeypot), thanks / closed / limit states, settings dialog | ✅ Done — unit + API integration + e2e |
| 4 | +254 phone input, KES formatting, counties, 10 templates, `/forms/new` chooser | ✅ Done — unit + e2e |
| 5 | Share page (copy, QR PNG/SVG, WhatsApp, open), OG meta + OG image | ✅ Done — QR decode unit test + e2e |
| 6 | Responses table (25/page, search, date + choice filters), drawer, delete / bulk delete, streaming CSV export, seed script | ✅ Done — 1,000-response e2e |
| 7 | File uploads (presigned POST to Neon Object Storage), `/api/files` owner links, orphan cleanup cron | ⚠️ Code done; **bucket not provisioned yet** (see below) — server-side rules tested |
| 8 | ~~AI generate / edit (OpenRouter)~~ | ❌ Removed — no paid AI during the free beta. Forms start blank or from a template |
| 9 | Emails (new submission, daily digest), cron jobs, full landing, settings page, loading/error/not-found states | ✅ Done — e2e incl. full mobile core flow |
| 10 | Admin dashboard (`/admin`): users, new sign-ups, active creators, forms, responses, 30-day sign-up chart, recent users | ✅ Done — admin flag seeded for alexnjoroge102@gmail.com |

### Before going live
- **Provision the storage bucket:** `neon link && neon deploy` (creates `simpleforms-uploads` from [neon.ts](neon.ts)). Browsers upload straight to the bucket, so it must allow CORS `POST` from `NEXT_PUBLIC_APP_URL`. Until then, file-upload questions show “Upload failed”.
- **Resend:** verify a sending domain; in sandbox mode only the account owner receives mail.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 · shadcn/ui (`radix-maia`) · Remix Icon · React Hook Form + Zod · Drizzle ORM + postgres-js · Neon Postgres · Neon Object Storage (`files-sdk`) · Auth.js v5 (NextAuth) · Zustand · TanStack Query · Sonner · Resend + React Email · `qrcode` · `papaparse` · `libphonenumber-js` · Vitest · Playwright

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in values (see below)
pnpm db:migrate             # apply migrations to DATABASE_URL
pnpm db:seed                # optional: demo user + 3 forms + 1,000 responses
pnpm dev                    # http://localhost:3000
```

Seeded login: `demo@simpleforms.test` / `demo-pass-123` (re-running the seed replaces that user).

### Environment variables

All keys are documented in [.env.example](.env.example) and validated at startup by [lib/env.ts](lib/env.ts). Values containing `mock_` count as **not configured**; the matching feature degrades gracefully instead of crashing:

| Service | Keys | When mocked |
|---|---|---|
| Postgres (Neon) | `DATABASE_URL` | required |
| Auth | `AUTH_SECRET` | required (`npx auth secret`); also signs upload tokens |
| Google OAuth | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | "Continue with Google" is disabled |
| Neon Object Storage | `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | uploads return 503 |
| Resend | `RESEND_API_KEY`, `EMAIL_FROM` | emails are logged to the console |
| Cron / privacy | `CRON_SECRET`, `IP_HASH_SALT` | required |

Notes:
- **Google OAuth** redirect URI: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/google`.
- **Cron** ([vercel.json](vercel.json)): `/api/cron/cleanup-uploads` 02:00 EAT, `/api/cron/daily-digest` 08:00 EAT. Both require `Authorization: Bearer $CRON_SECRET` (Vercel sends it automatically).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js dev server / production build / serve build |
| `pnpm typecheck` · `pnpm lint` · `pnpm format` | `next typegen` + tsc · ESLint · Prettier |
| `pnpm test` | Vitest unit tests (`tests/unit`) |
| `pnpm test:e2e` | Playwright (`tests/e2e`). With no downloaded browser, use an installed one: `PW_CHANNEL=msedge pnpm test:e2e` |
| `pnpm db:generate` · `db:migrate` · `db:studio` | Drizzle migrations / studio |
| `pnpm db:seed` | Demo user, 3 published forms, 1,000 responses |
| `pnpm db:seed-admin [email]` | Grant `/admin` to an existing account (default alexnjoroge102@gmail.com) |

E2E tests create throwaway users (`e2e-*@example.test`) in the configured database; a global teardown deletes them (and everything they own) after each run. API integration tests (`phase3-submit-api`, `phase7-uploads`) seed forms directly with SQL. Against `pnpm dev` the first run is slow while routes compile; `pnpm build && pnpm start -p 3000` is faster.

## Project layout

```
app/
  (marketing)/        Landing (§9.1)
  (auth)/             /login, /signup + server actions
  (app)/              Authed shell — layout calls requireUser()
    dashboard/        Forms grid with actions (+ loading skeleton)
    forms/new/        Chooser: blank · template
    forms/[id]/edit   Builder + actions: saveDraft, publishForm, saveSettings
    forms/[id]/preview  Draft rendered with the public component, mobile/desktop toggle
    forms/[id]/share    Link, QR, WhatsApp, open
    forms/[id]/responses  Table + drawer; actions: deleteResponses
    settings/         Profile, email preference, delete account
    admin/            Usage dashboard — admins only (404 for everyone else)
  (public)/f/[slug]   Public form, /thanks, not-found, opengraph-image
  api/
    submit/[slug]     Submission pipeline (§10)
    upload/sign · upload/complete   Public file uploads (§10)
    files/[uploadId]  Owner-only redirect to a short-lived download URL
    forms/[id]/responses[/rid]      Owner-only JSON for the table / drawer
    export/[formId]   Streaming CSV (§11)
    cron/cleanup-uploads · cron/daily-digest
components/
  builder/            Toolbar (preview/settings/publish), canvas, editor, settings & publish-issue dialogs
  public-form/        PublicForm, per-type controls, file upload, preview frame, state messages
  responses/          ResponsesView (TanStack Query), ResponseDrawer
  admin/              StatTile, SignupChart
  share/ new-form/ site/ app/ dashboard/ auth/ ui/
db/schema.ts · db/seed.ts · db/seed-admin.ts · db/migrations
emails/               Welcome, NewSubmission, DailyDigest
lib/
  fields/             registry, types, build-zod-schema, field-schema, publish (validation),
                      settings (accent presets, availability), display, files, assign-ids, canonical
  kenya/              counties, phone (normalize + as-you-type), currency (KES)
  templates/          10 templates
  responses/          filters (shared by table + export), query
  server/             ip hashing, rate limit, notify, upload tokens, cron auth
  csv.ts slug.ts qr.ts public-forms.ts forms.ts auth.ts storage.ts email.ts env.ts
stores/builder-store.ts
tests/unit · tests/e2e
```

## Architecture notes

- **Auth:** Auth.js v5 with JWT sessions and the Drizzle adapter. `proxy.ts` does a cookie-only redirect; pages and actions re-check with `requireUser()`; route handlers use `apiUser()` and answer 401. Forms you don't own return **404**. All forms use `method="post"` so a pre-hydration submit never puts passwords or answers in the URL.
- **Draft vs live:** the builder autosaves `fields`/`title`/`description`. Publishing validates (≥1 field, labels, ≥2 unique options, sane ranges) and snapshots them into `published_fields`/`published_title`/`published_description`. The public page only ever reads the snapshot; the toolbar shows **Publish changes** when the draft differs (compared key-order-insensitively, since jsonb reorders keys). A closed form stays closed when you publish changes.
- **Submission pipeline (§10):** availability (status, `closeAt`, limit) → honeypot (fake success) → rate limit 10 / 10 min per hashed IP + slug (Postgres fixed-window counter) → Zod from the published snapshot (normalizes phone → E.164, "KES 1,500" → 1500, strips unknown keys) → upload ownership → one transaction that increments `responseCount` *only if under the limit* (atomic under concurrency), inserts the response with its fields snapshot and claims uploads → owner email via `after()`.
- **Public form:** server-rendered with `connection()` (never cached), one client component using React Hook Form with the same Zod schema as the server; errors on blur and submit, focus + scroll to the first error, `aria-live` messages, 48px+ targets, 16px inputs. Theme (light/dark) and one of 8 accent presets are CSS variables on `.pf`; layout uses container queries so the preview's phone frame renders the real mobile layout.
- **Responses:** `/api/forms/[id]/responses` paginates server-side (25/page). Search is `answers::text ILIKE`; choice filters match a single value or array containment. The URL mirrors filters so reloads keep the view; CSV export takes the same query params.
- **CSV (§11):** UTF-8 BOM, `Submitted at` in Africa/Nairobi, current columns + columns that only exist in older snapshots, values via the field registry, formula-injection guard (validated phones and numbers exempt), keyset pagination in batches of 500 using a microsecond-exact cursor.
- **Uploads:** `sign` checks the field (type, size, rate limit) and returns a presigned POST (size enforced by storage) plus an HMAC token binding key ↔ form ↔ field; the browser uploads directly; `complete` verifies the token, `HEAD`s the object, re-checks size/type, and records an unclaimed `uploads` row whose id becomes the answer. Unclaimed rows older than 24h are deleted (object first) by the cleanup cron, which also closes forms past `closeAt`. Owner downloads go through `/api/files/[id]` → 10-minute presigned URL, forced `attachment` except raster-image previews.
- **Admin:** `users.is_admin` (migration `0003_admin_role` seeds the owner; `pnpm db:seed-admin` re-applies it). `requireAdmin()` reads the flag from the DB on every request, so revoking is immediate, and answers 404 to non-admins. Counts include every account, e2e/demo ones too. `lib/admin.ts` runs the aggregates in parallel; days are bucketed in Africa/Nairobi.
- **Field registry:** every question type is defined once in [lib/fields/registry.ts](lib/fields/registry.ts). Adding a type = one registry entry + a builder preview case + a public control case.
- **Email:** `lib/email.ts` never throws; failures are logged so they can't break a user flow.
- **Theme:** the site is always light (pale-green page, dark only inside `DarkSection` blocks and the public form's per-form dark theme, which is scoped to `.pf`). `ThemeProvider` sets `forcedTheme="light"` so a stale `theme=dark` in localStorage can't put `.dark` on `<html>` and flip every token site-wide.

### Design notes (derived values not in Design.md)
- Accent presets besides the brand emerald (teal, blue, violet, pink, red, orange, ink) — required by Blueprint §16, chosen for AA contrast with white text.
- Public form: `--pf-border` (a darker hairline so inputs meet 3:1), `--pf-error` (#B42318 / #FDA29B on dark), and a lightened accent for text/borders on the dark theme.
