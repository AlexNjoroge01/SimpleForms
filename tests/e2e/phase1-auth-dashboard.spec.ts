import { expect, test, type Page } from "@playwright/test"

import { createBlankForm } from "./helpers"

// Phase 1 acceptance: sign up, log in, create + see a blank draft,
// and cannot access another user's form.
const run = Date.now()
const alice = { name: "Alice Wanjiku", email: `e2e-alice-${run}@example.test`, password: "correct-horse-1" }
const bob = { name: "Bob Otieno", email: `e2e-bob-${run}@example.test`, password: "battery-staple-2" }

async function signup(page: Page, u: typeof alice) {
  await page.goto("/signup")
  await page.getByLabel("Full name").fill(u.name)
  await page.getByLabel("Email").fill(u.email)
  await page.getByLabel("Password").fill(u.password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
  await expect(page).toHaveURL(/\/$/)
}

test.describe.configure({ mode: "serial" })

test("phase 1: auth, dashboard, ownership", async ({ page }) => {
  // Signed-out users are bounced from app routes.
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login/)

  // Sign up → empty dashboard.
  await signup(page, alice)
  await expect(page.getByRole("heading", { name: "Create your first form" })).toBeVisible()

  // Create a blank draft → builder → back on dashboard.
  await createBlankForm(page)
  await expect(page).toHaveURL(/\/forms\/[^/]+\/edit$/)
  const formUrl = page.url()
  await expect(page.getByLabel("Form title")).toHaveValue("Untitled form")
  await page.goto("/dashboard")
  await expect(page.getByRole("article")).toHaveCount(1)
  await expect(page.getByText("Draft")).toBeVisible()

  // Duplicate, then delete the copy.
  await page.getByRole("button", { name: "Actions for Untitled form" }).click()
  await page.getByRole("menuitem", { name: "Duplicate" }).click()
  await expect(page.getByRole("article")).toHaveCount(2)
  await page.getByRole("button", { name: "Actions for Untitled form (copy)" }).click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Delete form" }).click()
  await expect(page.getByRole("article")).toHaveCount(1)

  // Signed-in users skip the auth pages.
  await page.goto("/login")
  await expect(page).toHaveURL(/\/dashboard$/)

  // Another user cannot open Alice's form.
  await logout(page)
  await signup(page, bob)
  const res = await page.goto(formUrl)
  expect(res?.status()).toBe(404)
  await logout(page)

  // Log in: wrong password rejected, right password works.
  await page.goto("/login")
  await page.getByLabel("Email").fill(alice.email)
  await page.getByLabel("Password").fill("wrong-password")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText("Incorrect email or password.").first()).toBeVisible()
  await page.getByLabel("Password").fill(alice.password)
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("article")).toHaveCount(1)
})
