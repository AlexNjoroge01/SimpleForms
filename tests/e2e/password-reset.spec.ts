import { createHash } from "node:crypto"
import { expect, test } from "@playwright/test"

import { signup, sql, testEmail } from "./helpers"

// Forgot password → email link → new password → signed in. The real token only
// exists in the email, so the test swaps in a known one (stored hashed, like the app).

const hash = (t: string) => createHash("sha256").update(t).digest("hex")

test("forgot password resets and signs in; the link works once", async ({ page, context, isMobile }) => {
  test.skip(isMobile, "Flow is viewport-independent; desktop run covers it")
  test.slow() // several logins + first compiles of the auth pages under `pnpm dev`
  const email = await signup(page, "reset")
  const identifier = `password-reset:${email}`
  await context.clearCookies()

  await page.goto("/login")
  await page.getByRole("link", { name: "Forgot password?" }).click()
  await expect(page).toHaveURL(/\/forgot-password$/)
  await page.getByLabel("Email").fill(email)
  await page.getByRole("button", { name: "Send reset link" }).click()
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible()

  const [row] = await sql()<{ token: string }[]>`select token from verification_tokens where identifier = ${identifier}`
  expect(row.token).toMatch(/^[0-9a-f]{64}$/) // only the hash is stored

  const token = "known-test-token"
  await sql()`update verification_tokens set token = ${hash(token)} where identifier = ${identifier}`
  const link = `/reset-password?${new URLSearchParams({ email, token })}`

  await page.goto(link, { waitUntil: "networkidle" })
  await page.getByLabel("New password", { exact: true }).fill("brand-new-pass-1")
  await page.getByLabel("Confirm new password").fill("something-else")
  await page.getByRole("button", { name: "Save and log in" }).click()
  await expect(page.getByText("Passwords don’t match")).toBeVisible()

  await page.getByLabel("Confirm new password").fill("brand-new-pass-1")
  await page.getByRole("button", { name: "Save and log in" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 })

  // Old password no longer works; the new one does.
  await context.clearCookies()
  await page.goto("/login", { waitUntil: "networkidle" }) // hydrated, so the submit goes through React
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("e2e-pass-123")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText("Incorrect email or password.").first()).toBeVisible()
  await page.getByLabel("Password").fill("brand-new-pass-1")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 })

  // Single use.
  await context.clearCookies()
  await page.goto(link, { waitUntil: "networkidle" })
  await page.getByLabel("New password", { exact: true }).fill("another-pass-22")
  await page.getByLabel("Confirm new password").fill("another-pass-22")
  await page.getByRole("button", { name: "Save and log in" }).click()
  await expect(page.getByText("This reset link is invalid or has expired.").first()).toBeVisible()
})

test("unknown emails get the same answer and no token", async ({ page, isMobile }) => {
  test.skip(isMobile, "Viewport-independent")
  const email = testEmail("nobody")
  await page.goto("/forgot-password")
  await page.getByLabel("Email").fill(email)
  await page.getByRole("button", { name: "Send reset link" }).click()
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible()
  const rows = await sql()`select 1 from verification_tokens where identifier = ${`password-reset:${email}`}`
  expect(rows).toHaveLength(0)
})
