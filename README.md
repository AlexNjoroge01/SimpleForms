# SimpleForms

Kenyan-first form builder: create forms manually or by describing them to AI, publish, share by link or QR, collect responses, export to CSV.

- **Spec:** [Blueprint.md](Blueprint.md) (product + phases) · [Design.md](Design.md) (visual system)
- **Deviations from the Blueprint** (agreed): Drizzle instead of Prisma · Design.md tokens instead of Blueprint §16 (zinc/indigo/Inter) · Remix Icon instead of Lucide · Neon Object Storage instead of Cloudinary.

## Status

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold, design tokens, DB schema + migrations | ✅ Done |
| 1 | Auth (Google + email/password), protected routes, dashboard, create / duplicate / close / delete | ✅ Done — e2e passing (desktop + mobile) |
| 2 | Field registry (11 types), Zod schema builder, builder UI with drag reorder, undo/redo, autosave | ✅ Done — unit + e2e passing |
| 3 | Public form, preview, publish, submit | ⏳ Next |
| 4 | Kenyan features & templates | — |
| 5 | Share (link, QR, WhatsApp, OG) | — |
| 6 | Responses & CSV export | — |
| 7 | File uploads (Neon Object Storage) | — |
| 8 | AI generate / edit | — |
| 9 | Emails, cron, landing, polish | — |

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 · shadcn/ui (`radix-maia`) · Remix Icon · Framer Motion · React Hook Form + Zod · Drizzle ORM + postgres-js · Neon Postgres · Neon Object Storage (`files-sdk`) · Auth.js v5 (NextAuth) · Zustand · TanStack Query · Sonner · Resend + React Email · Vitest · Playwright

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in values (see below)
pnpm db:migrate             # apply migrations to DATABASE_URL
pnpm dev                    # http://localhost:3000
```

### Environment variables

All keys are documented in [.env.example](.env.example) and validated at startup by [lib/env.ts](lib/env.ts). Values containing `mock_` count as **not configured**; the matching feature degrades gracefully instead of crashing:

| Service | Keys | When mocked |
|---|---|---|
| Postgres (Neon) | `DATABASE_URL` | required |
| Auth | `AUTH_SECRET` | required (`npx auth secret`) |
| Google OAuth | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | "Continue with Google" is disabled |
| Neon Object Storage | `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | uploads unavailable |
| OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | AI unavailable |
| Resend | `RESEND_API_KEY`, `EMAIL_FROM` | emails are logged to the console |
| Cron / privacy | `CRON_SECRET`, `IP_HASH_SALT` | required |

Notes:
- **Google OAuth** redirect URI: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/google`.
- **Resend** in sandbox mode (no verified domain) only delivers to the account owner's address; other sends fail and are logged without breaking signup.
- **Neon Object Storage**: the bucket is declared in [neon.ts](neon.ts). `neon link && neon deploy` provisions it and writes the `AWS_*` keys to `.env.local`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js dev server / production build / serve build |
| `pnpm typecheck` · `pnpm lint` · `pnpm format` | tsc · ESLint · Prettier |
| `pnpm test` | Vitest unit tests (`tests/unit`) |
| `pnpm test:e2e` | Playwright (`tests/e2e`). With no downloaded browser, use an installed one: `PW_CHANNEL=msedge pnpm test:e2e` |
| `pnpm db:generate` | Generate a migration from `db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Drizzle Studio |

E2E tests sign up throwaway users (`e2e-*@example.test`) in the configured database; a global teardown deletes them (and their forms) after each run. Against `pnpm dev` the first run is slow while routes compile; `pnpm build && pnpm start -p 3000` is faster.

## Project layout

```
app/
  (marketing)/        Landing (Navbar + Footer)
  (auth)/             /login, /signup + server actions (credentials, Google)
  (app)/              Authed shell — layout calls requireUser()
    dashboard/        Forms grid with actions
    forms/actions.ts  create / duplicate / close-reopen / delete (owner-checked)
    forms/[id]/edit   Builder page + saveDraft action (autosave)
  (public)/           Public forms /f/[slug] (Phase 3)
  api/auth/[...nextauth]
auth.config.ts        Shared auth config (route rules, JWT callbacks) — used by proxy.ts
proxy.ts              Next 16 proxy (ex-middleware): optimistic auth redirects
neon.ts               Neon Object Storage bucket definition
components/
  site/               Design.md components: Navbar, Footer, Section, DarkSection, cards, CTA, Stepper, dark form
  builder/            Builder: toolbar, type picker, canvas, field cards, editor panel, options editor, autosave hook
  auth/ dashboard/ app/
  ui/                 shadcn components (radii/button variants adapted to Design.md)
db/schema.ts          Drizzle schema (Blueprint §5); migrations in db/migrations
emails/               React Email templates
lib/
  auth.ts             NextAuth (Drizzle adapter, JWT sessions, Google + credentials), requireUser()
  forms.ts            Owner-scoped form queries (getMyFormOr404)
  db.ts env.ts email.ts storage.ts
  fields/
    types.ts          Field / settings types (Blueprint §6)
    registry.ts       THE field registry: metadata, icons, defaults, answer validation, CSV serialization, type switching
    build-zod-schema.ts  Field[] → Zod answers schema (client resolver + server re-validation)
    field-schema.ts   Structural Field validation (draft autosave; AI output in Phase 8)
  kenya/              counties.ts (47), phone.ts (+254 normalization → E.164)
  ids.ts              Stable field/option ids
stores/builder-store.ts  Zustand builder state with undo/redo (50 states)
  validation/         Shared Zod schemas (client + server)
tests/unit tests/e2e
```

## Architecture notes

- **Auth:** Auth.js v5 with JWT sessions (required for the credentials provider) and the Drizzle adapter for users/accounts. Passwords are hashed with bcrypt (cost 12). `proxy.ts` does a cookie-only redirect; `(app)/layout.tsx` and every server action re-check with `requireUser()`.
- **Ownership:** all form reads/writes filter on `userId`. A form you don't own returns **404** (not 403), so its existence isn't leaked.
- **Design system:** tokens from Design.md live in [app/globals.css](app/globals.css) as CSS variables, mapped into Tailwind (`bg-brand`, `text-ink-muted`, `rounded-card`, `shadow-card`, …). shadcn's semantic variables point at the same tokens.
- **Files:** never stored in Postgres. The `uploads` table stores the object `key`, `contentType`, `bytes`, `originalName`. Browsers upload with presigned POSTs (size enforced by the storage server) and download via short-lived presigned URLs forced to `attachment`. Deleting a form removes its objects.
- **Email:** `lib/email.ts` never throws; failures are logged so they can't break a user flow.
- **Field registry:** every question type is defined once in [lib/fields/registry.ts](lib/fields/registry.ts). Adding a type = one registry entry + a preview/renderer case. Types switch freely within a group (text ↔ email ↔ phone ↔ number; single ↔ multiple ↔ dropdown keep their options).
- **Answers:** choice answers store option **labels** (not ids) so responses stay readable, searchable (`ILIKE`) and exportable even after options change; each response also snapshots the fields. Phone answers are stored as E.164, numbers as numbers, dates as `YYYY-MM-DD`.
- **Builder state:** Zustand store with undo/redo (last 50 states). Rapid edits to the same input (typing a label) merge into one undo step. Autosave debounces 1.5s after the last change, saves in order, and validates the draft with Zod on the server before writing. Drafts may have empty labels; publishing (Phase 3) enforces them.
- **Builder layout:** picker | canvas | editor on ≥1024px; canvas + bottom sheets (add question / edit question) on smaller screens. Drag reorder works with mouse, touch (long-press) and keyboard (Space → arrows → Space).
