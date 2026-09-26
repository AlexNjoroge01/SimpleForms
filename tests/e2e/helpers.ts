import "dotenv/config"

import { randomUUID } from "node:crypto"
import { expect, type Page } from "@playwright/test"
import postgres from "postgres"

import type { Field, FormSettings } from "@/lib/fields/types"
import { DEFAULT_FORM_SETTINGS } from "@/lib/fields/types"
import { newSlug } from "@/lib/slug"

// Shared E2E helpers. Test users are always e2e-*@example.test so the global
// teardown removes them (and their forms/responses via cascade).

export const testEmail = (tag: string) =>
  `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`

let sqlClient: postgres.Sql | null = null
export function sql() {
  sqlClient ??= postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 })
  return sqlClient
}

export async function signup(page: Page, tag = "user") {
  const email = testEmail(tag)
  await page.goto("/signup")
  await page.getByLabel("Full name").fill("E2E Tester")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("e2e-pass-123")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 })
  return email
}

/** Inserts a user + published form directly (fast setup for API tests). */
export async function seedPublishedForm({
  fields,
  settings = {},
  status = "PUBLISHED",
  responseCount = 0,
}: {
  fields: Field[]
  settings?: Partial<FormSettings>
  status?: "DRAFT" | "PUBLISHED" | "CLOSED"
  responseCount?: number
}) {
  const db = sql()
  const userId = randomUUID()
  const formId = randomUUID()
  const slug = newSlug()
  await db`insert into users (id, email, name) values (${userId}, ${testEmail("api")}, 'API Tester')`
  await db`
    insert into forms (id, user_id, title, slug, status, fields, published_fields, published_title, settings, response_count, published_at)
    values (${formId}, ${userId}, 'API form', ${slug}, ${status}, ${db.json(fields as never)}, ${db.json(fields as never)},
            'API form', ${db.json({ ...DEFAULT_FORM_SETTINGS, ...settings } as never)}, ${responseCount}, now())`
  return { userId, formId, slug }
}

export async function responsesFor(formId: string) {
  return sql()<{ answers: Record<string, unknown>; metadata: Record<string, unknown> }[]>`
    select answers, metadata from responses where form_id = ${formId} order by created_at`
}

export async function responseCount(formId: string) {
  const [row] = await sql()<{ response_count: number }[]>`select response_count from forms where id = ${formId}`
  return row.response_count
}

/** Dashboard empty state → /forms/new → blank draft in the builder. */
export async function createBlankForm(page: Page) {
  await page.getByRole("link", { name: "Create a form" }).click()
  await expect(page).toHaveURL(/\/forms\/new$/, { timeout: 60_000 })
  await page.getByRole("button", { name: "Start blank" }).click()
  await expect(page).toHaveURL(/\/forms\/[^/]+\/edit$/, { timeout: 60_000 })
}
