import { expect, test } from "@playwright/test"

import type { Field } from "@/lib/fields/types"

import { responseCount, responsesFor, seedPublishedForm } from "./helpers"

// Integration tests for POST /api/submit/[slug] (Blueprint §10, §18):
// valid, invalid, closed, limit, honeypot, rate limit.

const FIELDS: Field[] = [
  { id: "name1", type: "short_text", label: "Full name", required: true },
  { id: "phone1", type: "phone", label: "Phone", required: true, config: { defaultCountry: "KE" } },
  { id: "amt1", type: "number", label: "Budget", required: false, config: { currency: "KES", min: 100 } },
  { id: "ch1", type: "single_choice", label: "Track", required: false, options: [{ id: "a", label: "AI" }, { id: "b", label: "Web" }] },
  { id: "cty1", type: "dropdown", label: "County", required: false, config: { preset: "kenya_counties" } },
  { id: "yn1", type: "yes_no", label: "Parking?", required: false },
]

const VALID = { name1: "  Wanjiku Kamau ", phone1: "0712 345 678", amt1: "KES 1,500", ch1: "AI", cty1: "Nairobi", yn1: "yes" }

// Each test gets its own "client IP" so rate-limit buckets don't collide.
const ip = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`

test.describe("submission API", () => {
  test.skip(({ isMobile }) => isMobile, "API tests run once (desktop project)")

  test("valid submission is normalized and stored", async ({ request }) => {
    const { slug, formId } = await seedPublishedForm({ fields: FIELDS })
    const clientIp = ip()
    const res = await request.post(`/api/submit/${slug}`, {
      data: { answers: { ...VALID, sneaky: "dropped" }, _hp: "" },
      headers: { "x-forwarded-for": clientIp },
    })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    const [row] = await responsesFor(formId)
    expect(row.answers).toEqual({ name1: "Wanjiku Kamau", phone1: "+254712345678", amt1: 1500, ch1: "AI", cty1: "Nairobi", yn1: "yes" })
    expect(row.metadata.ipHash).toMatch(/^[a-f0-9]{32}$/)
    expect(JSON.stringify(row.metadata)).not.toContain(clientIp)
    expect(await responseCount(formId)).toBe(1)
  })

  test("invalid data is rejected server-side with per-field errors", async ({ request }) => {
    const { slug, formId } = await seedPublishedForm({ fields: FIELDS })
    const res = await request.post(`/api/submit/${slug}`, {
      data: { answers: { name1: "", phone1: "0812345678", amt1: "50", ch1: "Blockchain", cty1: "Atlantis", yn1: "maybe" } },
      headers: { "x-forwarded-for": ip() },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    expect(body.fieldErrors).toEqual({
      name1: "This field is required",
      phone1: expect.stringMatching(/valid Kenyan mobile/),
      amt1: "Must be at least 100",
      ch1: "Choose one of the options",
      cty1: "Choose one of the options",
      yn1: "Choose yes or no",
    })
    expect(await responseCount(formId)).toBe(0)
  })

  test("honeypot gets a fake success and stores nothing", async ({ request }) => {
    const { slug, formId } = await seedPublishedForm({ fields: FIELDS })
    const res = await request.post(`/api/submit/${slug}`, {
      data: { answers: VALID, _hp: "http://spam.example" },
      headers: { "x-forwarded-for": ip() },
    })
    expect(res.status()).toBe(200)
    expect(await responsesFor(formId)).toHaveLength(0)
  })

  test("closed, expired, limited and draft forms reject submissions", async ({ request }) => {
    const headers = { "x-forwarded-for": ip() }
    const closed = await seedPublishedForm({ fields: FIELDS, status: "CLOSED" })
    const expired = await seedPublishedForm({ fields: FIELDS, settings: { closeAt: new Date(Date.now() - 60_000).toISOString() } })
    const limited = await seedPublishedForm({ fields: FIELDS, settings: { responseLimit: 1 }, responseCount: 1 })
    const draft = await seedPublishedForm({ fields: FIELDS, status: "DRAFT" })

    for (const f of [closed, expired]) {
      const res = await request.post(`/api/submit/${f.slug}`, { data: { answers: VALID }, headers })
      expect(res.status()).toBe(403)
      expect((await res.json()).state).toBe("closed")
    }
    const lim = await request.post(`/api/submit/${limited.slug}`, { data: { answers: VALID }, headers })
    expect(lim.status()).toBe(403)
    expect((await lim.json()).state).toBe("limit_reached")

    expect((await request.post(`/api/submit/${draft.slug}`, { data: { answers: VALID }, headers })).status()).toBe(404)
    expect((await request.post(`/api/submit/nope`, { data: { answers: VALID }, headers })).status()).toBe(404)
  })

  test("response limit is enforced atomically under concurrency", async ({ request }) => {
    const { slug, formId } = await seedPublishedForm({ fields: FIELDS, settings: { responseLimit: 3 } })
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        request.post(`/api/submit/${slug}`, { data: { answers: VALID }, headers: { "x-forwarded-for": ip() } })
      )
    )
    expect(results.filter((r) => r.status() === 200)).toHaveLength(3)
    expect(await responseCount(formId)).toBe(3)
    expect(await responsesFor(formId)).toHaveLength(3)
  })

  test("rate limit: 10 submissions per 10 minutes per IP + form", async ({ request }) => {
    const { slug } = await seedPublishedForm({ fields: FIELDS })
    const headers = { "x-forwarded-for": ip() }
    for (let i = 0; i < 10; i++) {
      expect((await request.post(`/api/submit/${slug}`, { data: { answers: VALID }, headers })).status()).toBe(200)
    }
    const blocked = await request.post(`/api/submit/${slug}`, { data: { answers: VALID }, headers })
    expect(blocked.status()).toBe(429)
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0)
    // A different client is unaffected.
    expect((await request.post(`/api/submit/${slug}`, { data: { answers: VALID }, headers: { "x-forwarded-for": ip() } })).status()).toBe(200)
  })

  test("malformed bodies are rejected", async ({ request }) => {
    const { slug } = await seedPublishedForm({ fields: FIELDS })
    const headers = { "content-type": "application/json" }
    for (const data of [Buffer.from("not json{"), Buffer.from("\"a string\""), Buffer.from("[1,2]")]) {
      expect((await request.post(`/api/submit/${slug}`, { data, headers })).status()).toBe(400)
    }
  })
})
