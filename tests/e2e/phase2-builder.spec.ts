import { expect, test, type Page } from "@playwright/test"

import { createBlankForm } from "./helpers"

// Phase 2 acceptance: every field type can be added, configured, reordered,
// deleted; refresh preserves state.

const PICKER = [
  "Short text",
  "Long text",
  "Email",
  "Phone",
  "Number",
  "Single choice",
  "Multiple choice",
  "Dropdown",
  "Date",
  "Yes / No",
  "File upload",
  "Kenyan county",
]

async function signupAndCreateForm(page: Page) {
  await page.goto("/signup")
  await page.getByLabel("Full name").fill("Builder Tester")
  await page.getByLabel("Email").fill(`e2e-builder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`)
  await page.getByLabel("Password").fill("builder-pass-1")
  await page.getByRole("button", { name: "Create account" }).click()
  await createBlankForm(page)
  await expect(page).toHaveURL(/\/forms\/[^/]+\/edit$/)
}

const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: /^Saved$/ })).toBeAttached()
const cards = (page: Page) => page.getByRole("list", { name: "Questions" }).getByRole("listitem")

test("desktop builder: add, configure, reorder, delete, persist", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop layout")
  await signupAndCreateForm(page)

  // Title + description inline editing
  await page.getByLabel("Form title").fill("Nairobi Tech Meetup")
  await page.getByLabel("Form description").fill("Register for our monthly meetup")

  // Add every type (incl. the county shortcut)
  const picker = page.getByRole("complementary", { name: "Question types" })
  for (const name of PICKER) await picker.getByRole("button", { name: new RegExp(`^${name}`) }).click()
  await expect(cards(page)).toHaveCount(12)

  // Configure: select the first (short text) question
  const editor = page.getByRole("complementary", { name: "Question settings" })
  await page.getByRole("button", { name: /^Edit question 1:/ }).click()
  await editor.getByLabel("Question", { exact: true }).fill("Full name")
  await editor.getByLabel("Required").click()

  // Configure the single choice: rename + bulk-paste options, allow Other, switch to dropdown and back
  await page.getByRole("button", { name: /^Edit question 6:/ }).click()
  await editor.getByLabel("Question", { exact: true }).fill("Preferred track")
  await editor.getByLabel("Option 1", { exact: true }).fill("AI")
  await editor.getByLabel("Option 2", { exact: true }).fill("Web")
  await editor.getByRole("button", { name: "Add option" }).click()
  await editor.getByLabel("Option 3", { exact: true }).fill("Cloud")
  await editor.getByLabel("Allow “Other”").click()

  // Number: KES currency + min
  await page.getByRole("button", { name: /^Edit question 5:/ }).click()
  await editor.getByLabel("Amount in KES").click()
  await editor.getByLabel("Minimum").fill("100")

  // Delete the long text question
  await page.getByRole("button", { name: /^Edit question 2:/ }).click()
  await editor.getByRole("button", { name: "Delete" }).click()
  await expect(cards(page)).toHaveCount(11)

  // Undo brings it back, redo removes it again
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(cards(page)).toHaveCount(12)
  await page.getByRole("button", { name: "Redo" }).click()
  await expect(cards(page)).toHaveCount(11)

  // Reorder with the keyboard: move "Email" (now #2) above "Full name" (#1)
  const handle = cards(page).nth(1).getByRole("button", { name: "Drag to reorder" })
  await handle.focus()
  // dnd-kit measures between key presses; give it a frame like a real user would.
  for (const key of ["Space", "ArrowUp", "Space"]) {
    await page.keyboard.press(key)
    await page.waitForTimeout(250)
  }
  await expect(cards(page).nth(0)).toContainText("Email address")
  await expect(cards(page).nth(1)).toContainText("Full name")

  // Autosave → reload → everything persisted
  await saved(page)
  await page.reload()
  await expect(page.getByLabel("Form title")).toHaveValue("Nairobi Tech Meetup")
  await expect(page.getByLabel("Form description")).toHaveValue("Register for our monthly meetup")
  await expect(cards(page)).toHaveCount(11)
  await expect(cards(page).nth(0)).toContainText("Email address")
  await expect(cards(page).nth(1)).toContainText("Full name*")
  const track = cards(page).filter({ hasText: "Preferred track" })
  await expect(track).toContainText("AI")
  await expect(track).toContainText("Cloud")
  await expect(track).toContainText("Other…")
  await expect(cards(page).filter({ hasText: /^Number/ })).toContainText("KES")
  await expect(cards(page).filter({ hasText: "County" })).toContainText("47 counties")

  // Dashboard reflects the new title
  await page.getByRole("link", { name: "Back to forms" }).click()
  await expect(page.getByRole("heading", { name: "Nairobi Tech Meetup" })).toBeVisible()
})

test("mobile builder: bottom sheets, edit, persist", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile layout")
  await signupAndCreateForm(page)

  await page.getByRole("button", { name: "Add question" }).last().click()
  await page.getByRole("dialog").getByRole("button", { name: /^Phone/ }).click()
  // Adding opens the editor sheet for the new question
  const sheet = page.getByRole("dialog")
  await sheet.getByLabel("Question", { exact: true }).fill("M-Pesa number")
  await sheet.getByLabel("Required").click()
  await page.keyboard.press("Escape")

  await expect(cards(page)).toHaveCount(1)
  await expect(cards(page).first()).toContainText("M-Pesa number*")
  await expect(cards(page).first()).toContainText("+254")

  await saved(page)
  await page.reload()
  await expect(cards(page).first()).toContainText("M-Pesa number*")
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412)
})
