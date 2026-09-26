import { expect, test } from "@playwright/test"
import Papa from "papaparse"

import { signup } from "./helpers"

// Phase 9 acceptance: the full core flow works end to end on mobile,
// plus settings.

const noHScroll = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

test("core flow on a phone: create → publish → submit → view → export", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile flow")
  test.setTimeout(300_000)

  await page.goto("/")
  expect(await noHScroll(page)).toBe(true)

  await signup(page, "p9")
  await page.getByRole("link", { name: "Create a form" }).click()
  await page.getByRole("button", { name: "Use the Contact form template" }).click()
  await expect(page).toHaveURL(/\/edit$/, { timeout: 60_000 })
  expect(await noHScroll(page)).toBe(true)

  await page.getByRole("button", { name: /Publish/ }).click()
  await expect(page).toHaveURL(/\/share$/, { timeout: 60_000 })
  expect(await noHScroll(page)).toBe(true)
  const path = new URL(await page.getByLabel("Public link").inputValue()).pathname
  const shareUrl = page.url()

  await page.goto(path)
  await page.getByLabel(/^Your name/).fill("Kamau Njoroge")
  await page.getByLabel(/^Email address/).fill("kamau@example.co.ke")
  await page.getByLabel(/^Phone number/).fill("0722 000 111")
  await page.getByLabel(/^Subject/).selectOption("Partnership")
  await page.getByLabel(/^Message/).fill("Tunaweza kushirikiana?")
  expect(await noHScroll(page)).toBe(true)
  await page.getByRole("button", { name: "Send message" }).click()
  await expect(page.getByText("Thanks for reaching out — we’ll reply within one working day.")).toBeVisible({ timeout: 60_000 })

  const responsesUrl = shareUrl.replace(/\/share$/, "/responses")
  await page.goto(responsesUrl)
  await expect(page.getByText("1 response", { exact: true })).toBeVisible({ timeout: 60_000 })
  expect(await noHScroll(page)).toBe(true)
  await page.getByRole("button", { name: /^Kamau Njoroge ?, view response$/ }).click()
  await expect(page.getByRole("dialog").getByText("+254 722 000 111")).toBeVisible()

  const csv = await (await page.request.get(responsesUrl.replace(/\/forms\/([^/]+)\/responses$/, "/api/export/$1"))).text()
  const rows = Papa.parse<string[]>(csv.replace(/^﻿/, "").trim()).data
  expect(rows).toHaveLength(2)
  expect(rows[0].slice(0, 3)).toEqual(["Submitted at", "Your name", "Email address"])
  expect(rows[1]).toContain("+254722000111")
})

test("settings: profile, notifications, delete account", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop")
  const email = await signup(page, "p9set")
  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Settings" }).click()
  await expect(page).toHaveURL(/\/settings$/, { timeout: 60_000 })

  await page.getByLabel("Name").fill("Renamed Tester")
  await page.getByText("Daily digest", { exact: true }).click()
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("Settings saved")).toBeVisible()
  await page.reload()
  await expect(page.getByLabel("Name")).toHaveValue("Renamed Tester")
  await expect(page.getByRole("radio", { name: /Daily digest/ })).toBeChecked()

  await page.getByRole("button", { name: "Delete my account" }).click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog.getByRole("button", { name: "Delete forever" })).toBeDisabled()
  await dialog.getByLabel("Your email address").fill(email)
  await dialog.getByRole("button", { name: "Delete forever" }).click()
  await expect(page).toHaveURL("/", { timeout: 60_000 })

  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("e2e-pass-123")
  await page.getByRole("button", { name: /log in/i }).click()
  await expect(page.getByRole("main").getByText("Incorrect email or password.")).toBeVisible()
})
