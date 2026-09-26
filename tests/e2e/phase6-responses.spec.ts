import { expect, test, type Page } from "@playwright/test"
import Papa from "papaparse"

import type { Field } from "@/lib/fields/types"

import { signup, sql } from "./helpers"

// Phase 6 acceptance: 1,000 responses page/search/filter smoothly; CSV opens
// correctly (BOM, columns, formats, injection guard); delete + bulk delete.

const FIELDS: Field[] = [
  { id: "nm", type: "short_text", label: "Full name", required: true },
  { id: "ph", type: "phone", label: "Phone", required: true },
  { id: "tk", type: "single_choice", label: "Ticket", required: true, options: [{ id: "r", label: "Regular" }, { id: "v", label: "VIP" }] },
  { id: "tp", type: "multiple_choice", label: "Topics", required: false, options: [{ id: "a", label: "AI" }, { id: "w", label: "Web" }] },
  { id: "am", type: "number", label: "Amount", required: false, config: { currency: "KES" } },
  { id: "pk", type: "yes_no", label: "Parking", required: false },
]

/** Signs up via the UI, then gives that user a published form with 1,000 responses. */
async function seedThousand(page: Page) {
  const email = await signup(page, "p6")
  const db = sql()
  const [{ id: userId }] = await db<{ id: string }[]>`select id from users where email = ${email}`
  const formId = `e2e${Date.now()}${Math.random().toString(36).slice(2, 6)}`
  // An older snapshot had an extra "Legacy" question — CSV must append it.
  const legacy: Field[] = [...FIELDS, { id: "lg", type: "short_text", label: "Legacy question", required: false }]
  await db`
    insert into forms (id, user_id, title, slug, status, fields, published_fields, published_title, settings, response_count)
    values (${formId}, ${userId}, 'Meetup 1k', null, 'PUBLISHED', ${db.json(FIELDS as never)}, ${db.json(FIELDS as never)},
            'Meetup 1k', ${db.json({ theme: "light", accentColor: "#067353", submitButtonText: "Submit", successMessage: "Thanks", showBranding: true } as never)}, 1000)`
  // 1,000 rows: #1 is a named "Needle" with a formula-looking answer; #2 uses the legacy snapshot.
  await db`
    insert into responses (id, form_id, answers, fields_snapshot, created_at)
    select ${formId} || '-' || g, ${formId},
      jsonb_build_object(
        'nm', case when g = 1 then '=Needle Kamau' else 'Person ' || g end,
        'ph', '+2547' || lpad((10000000 + g)::text, 8, '0'),
        'tk', case when g % 4 = 0 then 'VIP' else 'Regular' end,
        'tp', case when g % 2 = 0 then '["AI","Web"]'::jsonb else '["Web"]'::jsonb end,
        'am', g * 10,
        'pk', case when g % 3 = 0 then 'yes' else 'no' end,
        'lg', case when g = 2 then 'old answer' else null end
      ) - (case when g = 2 then '' else 'lg' end),
      case when g = 2 then ${db.json(legacy as never)} else ${db.json(FIELDS as never)} end,
      now() - (g || ' minutes')::interval
    from generate_series(1, 1000) g`
  return formId
}

test("1,000 responses: paginate, search, filter, drawer, delete, CSV", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop table; mobile layout covered below")
  test.setTimeout(240_000)
  const formId = await seedThousand(page)

  await page.goto(`/forms/${formId}/responses`)
  await expect(page.getByText("1,000 responses")).toBeVisible({ timeout: 60_000 })
  const rows = page.getByRole("table").locator("tbody tr")
  await expect(rows).toHaveCount(25)
  await expect(page.getByText("Page 1 of 40")).toBeVisible()

  // Pagination
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await expect(page.getByText("Page 2 of 40")).toBeVisible()
  await expect(rows.first()).toContainText("Person 26")

  // Search (ILIKE over answers)
  await page.getByLabel("Search responses").fill("needle")
  await expect(page.getByText("1 match")).toBeVisible()
  await expect(rows).toHaveCount(1)
  await page.getByLabel("Search responses").fill("")
  await expect(page.getByText("1,000 responses")).toBeVisible()

  // Choice filters: single value and multi-select contains
  await page.getByLabel("Filter by question").click()
  await page.getByRole("option", { name: "Ticket" }).click()
  await page.getByLabel("Answer").click()
  await page.getByRole("option", { name: "VIP" }).click()
  await expect(page.getByText("250 matches")).toBeVisible()
  await page.getByLabel("Filter by question").click()
  await page.getByRole("option", { name: "Topics" }).click()
  await page.getByLabel("Answer").click()
  await page.getByRole("option", { name: "AI" }).click()
  await expect(page.getByText("500 matches")).toBeVisible()

  // CSV respects filters: header + 500 rows, BOM, formats
  const filtered = await page.request.get(`/api/export/${formId}?field=tp&value=AI`)
  expect(filtered.headers()["content-type"]).toContain("text/csv")
  expect(filtered.headers()["content-disposition"]).toMatch(/attachment; filename="meetup-1k-responses-\d{4}-\d{2}-\d{2}\.csv"/)
  const filteredText = await filtered.text()
  expect(filteredText.charCodeAt(0)).toBe(0xfeff)
  expect(Papa.parse(filteredText.slice(1).trim()).data).toHaveLength(501)
  await page.getByRole("button", { name: "Clear" }).click()
  await expect(page.getByText("1,000 responses")).toBeVisible()

  // Full CSV: all rows across batches of 500, columns in order + legacy appended
  const full = await (await page.request.get(`/api/export/${formId}`)).text()
  const parsed = Papa.parse<string[]>(full.slice(1).trim()).data
  expect(parsed[0]).toEqual(["Submitted at", "Full name", "Phone", "Ticket", "Topics", "Amount", "Parking", "Legacy question"])
  expect(parsed).toHaveLength(1001)
  expect(new Set(parsed.slice(1).map((r) => r[1])).size).toBe(1000) // no dupes/skips across batches
  const needle = parsed.find((r) => r[1].includes("Needle"))!
  expect(needle[1]).toBe("'=Needle Kamau") // injection guard
  expect(needle[2]).toBe("+254710000001") // phone stays text, unguarded
  expect(needle[0]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  const two = parsed.find((r) => r[1] === "Person 2")!
  expect(two[4]).toBe("AI; Web")
  expect(two[5]).toBe("20")
  expect(two[7]).toBe("old answer")

  // Drawer shows formatted answers
  await page.getByLabel("Search responses").fill("Person 3")
  await page.getByRole("button", { name: /^Person 3 ?, view response$/ }).click()
  const drawer = page.getByRole("dialog")
  await expect(drawer.getByText("+254 710 000 003")).toBeVisible()
  await expect(drawer.getByText("KES 30")).toBeVisible()
  await drawer.getByRole("button", { name: "Delete response" }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
  await expect(page.getByText("1 response deleted")).toBeVisible()

  // Bulk delete from the table
  await page.getByLabel("Search responses").fill("")
  await expect(page.getByText("999 responses")).toBeVisible()
  await page.getByRole("checkbox", { name: "Select all on this page" }).click()
  await expect(page.getByText("25 responses selected")).toBeVisible()
  await page.getByRole("region", { name: "Selection" }).getByRole("button", { name: "Delete" }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
  await expect(page.getByText("974 responses")).toBeVisible()
  const [{ response_count }] = await sql()<{ response_count: number }[]>`select response_count from forms where id = ${formId}`
  expect(response_count).toBe(974)
})

test("responses are owner-only", async ({ page, request, isMobile }) => {
  test.skip(isMobile, "API check runs once")
  const formId = await seedThousand(page)
  // Unauthenticated API context
  expect((await request.get(`/api/forms/${formId}/responses`)).status()).toBe(401)
  expect((await request.get(`/api/export/${formId}`)).status()).toBe(401)
  // A different signed-in user gets 404
  await page.context().clearCookies()
  await signup(page, "p6other")
  expect((await page.request.get(`/api/forms/${formId}/responses`)).status()).toBe(404)
  expect((await page.request.get(`/api/export/${formId}`)).status()).toBe(404)
  const res = await page.goto(`/forms/${formId}/responses`)
  expect(res?.status()).toBe(404)
})

test("responses page works on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only")
  const formId = await seedThousand(page)
  await page.goto(`/forms/${formId}/responses`)
  await expect(page.getByText("1,000 responses")).toBeVisible({ timeout: 60_000 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole("button", { name: /^Person 2 ?, view response$/ }).click()
  await expect(page.getByRole("dialog").getByText("Full name")).toBeVisible({ timeout: 60_000 })
})
