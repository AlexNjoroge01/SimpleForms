import { devices, expect, test, type Page } from "@playwright/test"

import { createBlankForm, signup } from "./helpers"

// Phase 3 acceptance: a published form can be filled on a phone and submitted;
// invalid data is rejected; editing the draft doesn't change the live form
// until "Publish changes".

const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: /^Saved$/ })).toBeAttached()

test("publish → fill on a phone → draft stays separate → close", async ({ page, browser, baseURL, isMobile }) => {
  test.skip(isMobile, "builds on desktop, fills in a separate phone context")
  test.setTimeout(240_000)

  await signup(page, "p3")
  await createBlankForm(page)
  await expect(page).toHaveURL(/\/forms\/[^/]+\/edit$/)
  const editUrl = page.url()

  await page.getByLabel("Form title").fill("Harambee Registration")
  const picker = page.getByRole("complementary", { name: "Question types" })
  const editor = page.getByRole("complementary", { name: "Question settings" })
  const label = editor.getByLabel("Question", { exact: true })

  await picker.getByRole("button", { name: /^Short text/ }).click()
  await label.fill("Full name")
  await editor.getByLabel("Required").click()
  await picker.getByRole("button", { name: /^Phone/ }).click()
  await editor.getByLabel("Required").click()
  await picker.getByRole("button", { name: /^Number/ }).click()
  await label.fill("Contribution")
  await editor.getByLabel("Amount in KES").click()
  await picker.getByRole("button", { name: /^Single choice/ }).click()
  await label.fill("Session")
  await editor.getByLabel("Option 1", { exact: true }).fill("Morning")
  await editor.getByLabel("Option 2", { exact: true }).fill("Afternoon")
  await picker.getByRole("button", { name: /^Yes \/ No/ }).click()
  await label.fill("Need parking?")
  await picker.getByRole("button", { name: /^Kenyan county/ }).click()
  await saved(page)

  // Publish → share page with link, QR and WhatsApp
  await page.getByRole("button", { name: "Publish", exact: true }).click()
  await expect(page).toHaveURL(/\/share$/, { timeout: 60_000 }) // first dev compile is slow
  const publicUrl = await page.getByLabel("Public link").inputValue()
  const path = new URL(publicUrl).pathname
  expect(path).toMatch(/^\/f\/[A-Za-z2-9]{8}$/)
  await expect(page.getByTestId("qr-image")).toBeVisible()
  await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=Harambee/)

  // OG tags for WhatsApp previews
  const html = await (await page.request.get(path)).text()
  expect(html).toContain('<meta property="og:title" content="Harambee Registration"')
  expect(html).toMatch(/<meta property="og:image" content="[^"]+opengraph-image/)

  // --- Fill on a phone -----------------------------------------------------------
  const phoneCtx = await browser.newContext({ ...devices["Pixel 7"], baseURL })
  const m = await phoneCtx.newPage()
  await m.goto(path)
  await expect(m.getByRole("heading", { name: "Harambee Registration" })).toBeVisible()

  // Empty submit: inline errors, focus moves to the first problem
  await m.getByRole("button", { name: "Submit" }).click()
  await expect(m.getByText("This field is required")).toHaveCount(2)
  await expect(m.getByLabel(/^Full name/)).toBeFocused()

  await m.getByLabel(/^Full name/).fill("Achieng Otieno")
  const phone = m.getByLabel(/^Phone number/)
  await phone.fill("0712345678")
  await expect(phone).toHaveValue("712 345 678")
  const amount = m.getByLabel(/^Contribution/)
  await amount.fill("2500")
  await expect(amount).toHaveValue("2,500")
  await m.getByText("Afternoon", { exact: true }).click()
  await m.getByText("Yes", { exact: true }).click()
  await m.getByRole("combobox", { name: /^County/ }).click()
  await m.getByPlaceholder("Search…").fill("Kisu")
  await m.getByRole("option", { name: "Kisumu" }).click()
  await expect(m.getByRole("combobox", { name: /^County/ })).toHaveText(/Kisumu/)

  const noHScroll = () => m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(await noHScroll()).toBe(true)

  await m.getByRole("button", { name: "Submit" }).click()
  await expect(m).toHaveURL(new RegExp(`${path}/thanks$`))
  await expect(m.getByText("Thank you! Your response has been recorded.")).toBeVisible()

  // --- Draft edits don't leak until "Publish changes" --------------------------
  await page.goto(editUrl)
  await page.getByRole("button", { name: /^Edit question 1:/ }).click()
  await label.fill("Your full name")
  await saved(page)
  await m.goto(path)
  await expect(m.getByLabel(/^Full name/)).toBeVisible()
  await expect(m.getByText("Your full name")).toHaveCount(0)

  await page.getByRole("button", { name: "Publish changes" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeDisabled()
  await m.reload()
  await expect(m.getByLabel(/^Your full name/)).toBeVisible()

  // --- Dashboard count + close ---------------------------------------------------
  await page.goto("/dashboard")
  await expect(page.getByText(/1 response ·/)).toBeVisible()
  await page.getByRole("button", { name: "Actions for Harambee Registration" }).click()
  await page.getByRole("menuitem", { name: "Close" }).click()
  await expect(page.getByText("Form closed")).toBeVisible()
  await m.reload()
  await expect(m.getByText("This form is no longer accepting responses.")).toBeVisible()
  await expect(m.getByRole("button", { name: "Submit" })).toHaveCount(0)

  await phoneCtx.close()
})

test("preview renders the draft with submissions disabled", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop builder")
  await signup(page, "p3prev")
  await createBlankForm(page)
  await page.getByLabel("Form title").fill("Preview me")
  await page.getByRole("complementary", { name: "Question types" }).getByRole("button", { name: /^Email/ }).click()
  await page.getByRole("button", { name: "Preview" }).click()
  await expect(page).toHaveURL(/\/preview$/, { timeout: 60_000 })
  await expect(page.getByText("Preview — submissions disabled")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Preview me" })).toBeVisible()

  await page.getByLabel(/^Email address/).fill("not-an-email")
  await page.getByLabel(/^Email address/).blur()
  await expect(page.getByText("Enter a valid email address")).toBeVisible()
  await page.getByLabel(/^Email address/).fill("wanjiru@example.co.ke")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByText("Submissions are disabled in preview.")).toBeVisible()

  await page.getByRole("radio", { name: "Desktop" }).click()
  await expect(page.getByRole("radio", { name: "Desktop" })).toHaveAttribute("aria-checked", "true")
})

test("publishing is blocked until the form is valid", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop builder")
  await signup(page, "p3val")
  await createBlankForm(page)
  await page.getByRole("button", { name: "Publish", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "A few things to fix first" })).toBeVisible()
  await expect(page.getByText("Add at least one question.")).toBeVisible()
})
