import { expect, test } from "@playwright/test"

import { signup } from "./helpers"

// Phase 4 acceptance: templates create valid drafts; Kenyan phone/KES inputs
// behave on the public form (normalization itself is unit-tested).

test("template picker creates a draft and the Kenyan inputs work", async ({ page, isMobile }) => {
  test.setTimeout(180_000)
  await signup(page, "p4")
  await page.getByRole("link", { name: "Create a form" }).click()
  await expect(page).toHaveURL(/\/forms\/new$/, { timeout: 60_000 })

  await expect(page.getByRole("heading", { name: "Blank form" })).toBeVisible()
  await expect(page.getByRole("button", { name: /^Use the .* template$/ })).toHaveCount(10)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole("button", { name: "Use the Order form template" }).click()
  await expect(page).toHaveURL(/\/forms\/[^/]+\/edit$/, { timeout: 60_000 })
  await expect(page.getByRole("list", { name: "Questions" }).getByRole("listitem")).toHaveCount(10)
  await expect(page.getByLabel("Form title")).toHaveValue("Order form")

  // Templates are publishable as-is.
  await page.getByRole("button", { name: /^Publish$/ }).click()
  await expect(page).toHaveURL(/\/share$/, { timeout: 60_000 })
  const path = new URL(await page.getByLabel("Public link").inputValue()).pathname

  await page.goto(path)
  await expect(page.getByRole("button", { name: "Place order" })).toBeVisible()

  const phone = page.getByLabel(/^Phone number/)
  await phone.fill("+254 0812 345 678")
  await phone.blur()
  await expect(page.getByText("Enter a valid Kenyan mobile number, e.g. 0712 345 678")).toBeVisible()
  await phone.fill("0112345678")
  await expect(phone).toHaveValue("112 345 678")
  await expect(page.getByText("Enter a valid Kenyan mobile number, e.g. 0712 345 678")).toHaveCount(0)

  const amount = page.getByLabel(/^Amount paid/)
  await amount.fill("1234567")
  await expect(amount).toHaveValue("1,234,567")

  if (isMobile) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
