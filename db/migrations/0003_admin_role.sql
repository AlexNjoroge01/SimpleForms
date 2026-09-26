ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Seed the owner as admin (no-op until the account exists; see `pnpm db:seed-admin`).
UPDATE "users" SET "is_admin" = true WHERE lower("email") = 'alexnjoroge102@gmail.com';
