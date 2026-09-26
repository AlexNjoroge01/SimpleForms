import { expect, test } from "@playwright/test"

import type { Field } from "@/lib/fields/types"

import { seedPublishedForm, sql } from "./helpers"

// Phase 7 acceptance: files upload from mobile, respect size/type limits, and
// appear in the response. Uses the real Neon Object Storage bucket.

const FIELDS: Field[] = [
  { id: "nm", type: "short_text", label: "Full name", required: true },
  { id: "cv", type: "file_upload", label: "Photo", required: true, config: { accept: "image", maxSizeMB: 1 } },
]

// 1×1 transparent PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64")

test("upload from a phone, submit, file is linked to the response", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile upload flow")
  test.setTimeout(180_000)
  const { slug, formId } = await seedPublishedForm({ fields: FIELDS })

  await page.goto(`/f/${slug}`)
  await page.getByLabel(/^Full name/).fill("Mary Atieno")

  // Wrong type and too big are rejected in the browser before uploading.
  const input = page.locator('input[type="file"]')
  await input.setInputFiles({ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") })
  await expect(page.getByText("Please choose images only.")).toBeVisible()
  await input.setInputFiles({ name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(1024 * 1024 + 1, 1) })
  await expect(page.getByText(/The limit is 1 MB/)).toBeVisible()

  await input.setInputFiles({ name: "selfie.png", mimeType: "image/png", buffer: PNG })
  await expect(page.getByText("selfie.png")).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/uploaded/)).toBeVisible()

  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page).toHaveURL(/\/thanks$/, { timeout: 60_000 })

  const rows = await sql()<{ id: string; response_id: string | null; bytes: number; content_type: string; answers: Record<string, string> }[]>`
    select u.id, u.response_id, u.bytes, u.content_type, r.answers
    from uploads u join responses r on r.id = u.response_id
    where u.form_id = ${formId}`
  expect(rows).toHaveLength(1)
  expect(rows[0].bytes).toBe(PNG.length)
  expect(rows[0].content_type).toBe("image/png")
  expect(rows[0].answers.cv).toBe(rows[0].id)
})

test("upload API enforces field rules server-side", async ({ request, isMobile }) => {
  test.skip(isMobile, "API checks run once")
  const { slug } = await seedPublishedForm({ fields: FIELDS })
  const sign = (data: object) => request.post("/api/upload/sign", { data: { slug, fieldId: "cv", name: "a.png", type: "image/png", size: 100, ...data } })

  expect((await sign({ type: "application/pdf" })).status()).toBe(415)
  expect((await sign({ type: "image/svg+xml" })).status()).toBe(415)
  expect((await sign({ size: 2 * 1024 * 1024 })).status()).toBe(413)
  expect((await sign({ fieldId: "nm" })).status()).toBe(400)
  const ok = await sign({})
  expect(ok.status()).toBe(200)
  const { key, token } = await ok.json()

  // Tampered token / other form's key are refused; nothing uploaded yet → 404.
  const complete = (data: object) => request.post("/api/upload/complete", { data: { slug, fieldId: "cv", key, token, name: "a.png", ...data } })
  expect((await complete({ token: "123.abc" })).status()).toBe(403)
  expect((await complete({ key: "forms/other/x/a.png" })).status()).toBe(403)
  expect((await complete({})).status()).toBe(404)

  // A submission can't reference an upload id that doesn't belong to it.
  const res = await request.post(`/api/submit/${slug}`, { data: { answers: { nm: "X", cv: "notarealupload" } }, headers: { "x-forwarded-for": "10.9.9.9" } })
  expect(res.status()).toBe(422)
  expect((await res.json()).fieldErrors.cv).toMatch(/upload/i)
})

test("cron routes require the secret", async ({ request, isMobile }) => {
  test.skip(isMobile, "API checks run once")
  expect((await request.get("/api/cron/cleanup-uploads")).status()).toBe(401)
  expect((await request.get("/api/cron/daily-digest", { headers: { authorization: "Bearer nope" } })).status()).toBe(401)
  const ok = await request.get("/api/cron/cleanup-uploads", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })
  expect(ok.status()).toBe(200)
  expect(await ok.json()).toMatchObject({ ok: true })
})
